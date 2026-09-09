package com.riva.controllers;

import com.riva.dto.request.IncentiveTargetRequest;
import com.riva.dto.response.ApiResponse;
import com.riva.services.IncentiveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/incentives")
@RequiredArgsConstructor
public class IncentiveController {

    private final IncentiveService incentiveService;

    /** POST /api/incentives — Admin saves/updates a target */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveTarget(
            @Valid @RequestBody IncentiveTargetRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(incentiveService.saveTarget(req)));
    }

    /** GET /api/incentives/report?month=6&year=2026 */
    @GetMapping("/report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> report(
            @RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.ok(incentiveService.monthlyReport(month, year)));
    }
}
