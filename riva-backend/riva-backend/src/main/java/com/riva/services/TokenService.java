package com.riva.services;

import com.riva.dto.request.*;
import com.riva.dto.response.TokenResponse;
import com.riva.enums.*;
import com.riva.exception.*;
import com.riva.models.*;
import com.riva.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final TokenRepository tokenRepository;
    private final CounterRepository counterRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    // ── Raise Token ───────────────────────────────────────────

    @Transactional
    public TokenResponse raiseToken(RaiseTokenRequest req) {
        Counter counter = counterRepository.findById(req.getCounterId())
                .orElseThrow(() -> new ResourceNotFoundException("Counter", req.getCounterId()));

        User salesExec = userRepository.findById(req.getSalesExecutiveId())
                .orElseThrow(() -> new ResourceNotFoundException("Sales Executive", req.getSalesExecutiveId()));

        // Enforce 5-token limit per counter
        long activeCount = tokenRepository.countActiveByCounter(counter.getId());
        if (activeCount >= 5) {
            throw new BusinessException("Counter " + counter.getName() +
                    " already has 5 active tokens. Please close a deal first.");
        }

        Token token = Token.builder()
                .tokenNumber(generateTokenNumber())
                .metalType(req.getMetalType())
                .counter(counter)
                .salesExecutive(salesExec)
                .productName(req.getProductName())
                .status(TokenStatus.RAISED)
                .tokenDate(LocalDate.now())
                .raisedAt(LocalDateTime.now())
                .build();

        token = tokenRepository.save(token);
        return mapToResponse(token);
    }

    // ── Start Deal ────────────────────────────────────────────

    @Transactional
    public TokenResponse startDeal(Long tokenId, StartDealRequest req) {
        Token token = getToken(tokenId);

        if (token.getStatus() != TokenStatus.RAISED) {
            throw new BusinessException("Token is not in RAISED state.");
        }

        token.setCustomerName(req.getCustomerName());
        token.setCustomerPhone(req.getCustomerPhone());
        token.setStatus(TokenStatus.IN_DEAL);
        token.setDealStartTime(LocalDateTime.now());

        return mapToResponse(tokenRepository.save(token));
    }

    // ── Close Deal ────────────────────────────────────────────

    @Transactional
    public TokenResponse closeDeal(Long tokenId, CloseDealRequest req) {
        Token token = getToken(tokenId);

        if (token.getStatus() != TokenStatus.IN_DEAL) {
            throw new BusinessException("Token is not in IN_DEAL state.");
        }

        token.setDealEndTime(LocalDateTime.now());

        if (!req.isSale()) {
            // Non-sale: reason is mandatory
            if (req.getNonSaleReason() == null || req.getNonSaleReason().isBlank()) {
                throw new BusinessException("Non-sale reason is mandatory.");
            }
            token.setNonSaleReason(req.getNonSaleReason());
            token.setStatus(TokenStatus.CLOSED_NON_SALE);

        } else {
            // Sale
            if (req.getSaleType() == null) {
                throw new BusinessException("Sale type (DIRECT_SALE or ORDER) is required.");
            }
            token.setSaleType(req.getSaleType());

            if (req.getSaleType() == SaleType.ORDER) {
                // Create order record
                if (req.getProductDetail() == null || req.getProductDetail().isBlank() ||
                        req.getDeliveryDate() == null || req.getDeliveryDate().isBlank()) {
                    throw new BusinessException("Product detail and delivery date required for ORDER.");
                }
                Order order = Order.builder()
                        .orderNumber(generateOrderNumber())
                        .token(token)
                        .customerName(token.getCustomerName())
                        .customerPhone(token.getCustomerPhone())
                        .productName(token.getProductName())
                        .productDetail(req.getProductDetail())
                        .deliveryDate(LocalDate.parse(req.getDeliveryDate()))
                        .salesExecutive(token.getSalesExecutive())
                        .status(OrderStatus.RECEIVED)
                        .build();
                orderRepository.save(order);
            }

            token.setStatus(TokenStatus.AWAITING_BILL);
        }

        return mapToResponse(tokenRepository.save(token));
    }

    // ── Enter Bill Number (Cashier) ───────────────────────────

    @Transactional
    public TokenResponse enterBillNumber(Long tokenId, BillNumberRequest req) {
        Token token = getToken(tokenId);

        if (token.getStatus() != TokenStatus.AWAITING_BILL) {
            throw new BusinessException("Token is not awaiting billing.");
        }

        token.setBillNumber(req.getBillNumber());
        token.setStatus(TokenStatus.CLOSED_SALE);

        // If this token had an ORDER, update the order's bill number too
        if (token.getSaleType() == SaleType.ORDER && token.getOrder() != null) {
            Order order = token.getOrder();
            order.setBillNumber(req.getBillNumber());
            orderRepository.save(order);
        }

        return mapToResponse(tokenRepository.save(token));
    }

    // ── Queries ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TokenResponse> getActiveTokensByCounter(Long counterId) {
        List<TokenStatus> closed = List.of(TokenStatus.CLOSED_SALE, TokenStatus.CLOSED_NON_SALE);
        return tokenRepository.findByCounterIdAndStatusNotIn(counterId, closed)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TokenResponse getByTokenNumber(String tokenNumber) {
        Token token = tokenRepository.findByTokenNumber(tokenNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Token not found: " + tokenNumber));
        return mapToResponse(token);
    }

    // ── Helpers ───────────────────────────────────────────────

    private Token getToken(Long id) {
        return tokenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Token", id));
    }

    private String generateTokenNumber() {
        String num;
        do {
            num = "SJ" + (1000 + new Random().nextInt(9000));
        } while (tokenRepository.findByTokenNumber(num).isPresent());
        return num;
    }

    private String generateOrderNumber() {
        return "ORD" + (1000 + new Random().nextInt(9000));
    }

    private TokenResponse mapToResponse(Token t) {
        Long elapsed = null;
        if (t.getStatus() == TokenStatus.IN_DEAL && t.getDealStartTime() != null) {
            elapsed = ChronoUnit.SECONDS.between(t.getDealStartTime(), LocalDateTime.now());
        }
        return TokenResponse.builder()
                .id(t.getId())
                .tokenNumber(t.getTokenNumber())
                .metalType(t.getMetalType())
                .counterName(t.getCounter().getName())
                .salesExecutiveName(t.getSalesExecutive().getFullName())
                .productName(t.getProductName())
                .status(t.getStatus())
                .customerName(t.getCustomerName())
                .customerPhone(t.getCustomerPhone())
                .dealStartTime(t.getDealStartTime())
                .dealEndTime(t.getDealEndTime())
                .saleType(t.getSaleType())
                .nonSaleReason(t.getNonSaleReason())
                .billNumber(t.getBillNumber())
                .tokenDate(t.getTokenDate() != null ? t.getTokenDate().toString() : null)
                .elapsedSeconds(elapsed)
                .build();
    }
}
