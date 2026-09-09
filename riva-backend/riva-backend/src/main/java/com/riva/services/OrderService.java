package com.riva.services;

import com.riva.dto.request.UpdateOrderRequest;
import com.riva.dto.response.OrderResponse;
import com.riva.enums.OrderStatus;
import com.riva.exception.*;
import com.riva.models.Order;
import com.riva.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long id) {
        return mapToResponse(orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id)));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getByStatus(OrderStatus status) {
        return orderRepository.findByStatusOrderByDeliveryDateAsc(status)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Order department updates the order pipeline stages.
     * Immutable fields (customer name, phone, product name, sales exec) cannot be changed.
     */
    @Transactional
    public OrderResponse updateOrder(Long id, UpdateOrderRequest req) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        // Karigar allotted → IN PROCESS
        if (req.getKarigarName() != null) order.setKarigarName(req.getKarigarName());
        if (req.getKarigarAllottedDate() != null) {
            order.setKarigarAllottedDate(LocalDate.parse(req.getKarigarAllottedDate()));
        }

        // Product received → READY
        if (req.getProductReceivedDate() != null) {
            order.setProductReceivedDate(LocalDate.parse(req.getProductReceivedDate()));
        }

        // Delivered (requires bill number)
        if (req.getDeliveredDate() != null) {
            if (req.getBillNumber() == null || req.getBillNumber().isBlank()) {
                throw new BusinessException("Bill number is required to mark order as DELIVERED.");
            }
            order.setDeliveredDate(LocalDate.parse(req.getDeliveredDate()));
            order.setBillNumber(req.getBillNumber());
        }

        if (req.getBillNumber() != null) order.setBillNumber(req.getBillNumber());
        if (req.getGramage() != null) order.setGramage(req.getGramage());

        // Derive status from filled fields
        order.setStatus(deriveStatus(order));

        return mapToResponse(orderRepository.save(order));
    }

    // ── Order Summary Report ──────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderSummary() {
        List<Object[]> rows = orderRepository.orderSummaryByStatus();
        double totalGrams = 0;
        Map<String, Object> result = new java.util.LinkedHashMap<>();

        for (Object[] row : rows) {
            String status = row[0].toString();
            long count = ((Number) row[1]).longValue();
            double grams = row[2] != null ? ((Number) row[2]).doubleValue() : 0;
            totalGrams += grams;
            result.put(status, Map.of("count", count, "grams", grams));
        }
        result.put("TOTAL_GMS", totalGrams);
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────

    private OrderStatus deriveStatus(Order o) {
        if (o.getDeliveredDate() != null && o.getBillNumber() != null) return OrderStatus.DELIVERED;
        if (o.getProductReceivedDate() != null) return OrderStatus.READY;
        if (o.getKarigarAllottedDate() != null) return OrderStatus.IN_PROCESS;
        return OrderStatus.RECEIVED;
    }

    private OrderResponse mapToResponse(Order o) {
        return OrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .customerName(o.getCustomerName())
                .customerPhone(o.getCustomerPhone())
                .productName(o.getProductName())
                .productDetail(o.getProductDetail())
                .productPhotoUrl(o.getProductPhotoUrl())
                .deliveryDate(o.getDeliveryDate() != null ? o.getDeliveryDate().toString() : null)
                .salesExecutiveName(o.getSalesExecutive().getFullName())
                .billNumber(o.getBillNumber())
                .status(o.getStatus())
                .karigarName(o.getKarigarName())
                .karigarAllottedDate(o.getKarigarAllottedDate() != null ? o.getKarigarAllottedDate().toString() : null)
                .productReceivedDate(o.getProductReceivedDate() != null ? o.getProductReceivedDate().toString() : null)
                .deliveredDate(o.getDeliveredDate() != null ? o.getDeliveredDate().toString() : null)
                .gramage(o.getGramage())
                .build();
    }
}
