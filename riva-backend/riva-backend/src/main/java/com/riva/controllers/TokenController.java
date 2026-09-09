package com.riva.controllers;

import com.riva.dto.request.*;
import com.riva.dto.response.*;
import com.riva.services.TokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tokens")
@RequiredArgsConstructor
public class TokenController {

    private final TokenService tokenService;

    /** POST /api/tokens/raise — Floor incharge raises a token */
    @PostMapping("/raise")
    public ResponseEntity<ApiResponse<TokenResponse>> raiseToken(
            @Valid @RequestBody RaiseTokenRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(tokenService.raiseToken(req)));
    }

    /** GET /api/tokens/counter/{counterId} — Active tokens for a counter */
    @GetMapping("/counter/{counterId}")
    public ResponseEntity<ApiResponse<List<TokenResponse>>> getByCounter(
            @PathVariable Long counterId) {
        return ResponseEntity.ok(ApiResponse.ok(tokenService.getActiveTokensByCounter(counterId)));
    }

    /** GET /api/tokens/number/{tokenNumber} — Look up by token number */
    @GetMapping("/number/{tokenNumber}")
    public ResponseEntity<ApiResponse<TokenResponse>> getByTokenNumber(
            @PathVariable String tokenNumber) {
        return ResponseEntity.ok(ApiResponse.ok(tokenService.getByTokenNumber(tokenNumber)));
    }

    /** PUT /api/tokens/{id}/start-deal — Sales exec starts the deal */
    @PutMapping("/{id}/start-deal")
    public ResponseEntity<ApiResponse<TokenResponse>> startDeal(
            @PathVariable Long id,
            @Valid @RequestBody StartDealRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(tokenService.startDeal(id, req)));
    }

    /** PUT /api/tokens/{id}/close-deal — Sales exec closes the deal */
    @PutMapping("/{id}/close-deal")
    public ResponseEntity<ApiResponse<TokenResponse>> closeDeal(
            @PathVariable Long id,
            @RequestBody CloseDealRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(tokenService.closeDeal(id, req)));
    }

    /** PUT /api/tokens/{id}/bill — Cashier enters bill number */
    @PutMapping("/{id}/bill")
    public ResponseEntity<ApiResponse<TokenResponse>> enterBill(
            @PathVariable Long id,
            @Valid @RequestBody BillNumberRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(tokenService.enterBillNumber(id, req)));
    }
}
