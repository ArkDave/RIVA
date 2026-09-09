package com.riva.controllers;

import com.riva.dto.request.PerformanceEvalRequest;
import com.riva.dto.response.ApiResponse;
import com.riva.services.PerformanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;

    /** POST /api/performance — Admin saves daily evaluation */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> save(
            @Valid @RequestBody PerformanceEvalRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(performanceService.saveEvaluation(req)));
    }

    /** GET /api/performance/monthly?month=6&year=2026 */
    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> monthly(
            @RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.ok(performanceService.monthlyReport(month, year)));
    }

    /** GET /api/performance/top-bottom?month=6&year=2026 */
    @GetMapping("/top-bottom")
    public ResponseEntity<ApiResponse<Map<String, Object>>> topBottom(
            @RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.ok(performanceService.topAndBottomFive(month, year)));
    }

    /** GET /api/performance/winners?year=2026 — Annual category winners */
    @GetMapping("/winners")
    public ResponseEntity<ApiResponse<Map<String, String>>> winners(@RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.ok(performanceService.annualCategoryWinners(year)));
    }
}
