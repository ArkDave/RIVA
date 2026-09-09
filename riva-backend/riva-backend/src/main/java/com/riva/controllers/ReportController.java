package com.riva.controllers;

import com.riva.dto.response.ApiResponse;
import com.riva.services.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** GET /api/reports/npc/daily?date=2026-06-09 */
    @GetMapping("/npc/daily")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dailyNpc(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.dailyNpcReport(date != null ? date : LocalDate.now())));
    }

    /** GET /api/reports/npc/consolidated?month=6&year=2026 */
    @GetMapping("/npc/consolidated")
    public ResponseEntity<ApiResponse<Map<String, Object>>> consolidatedNpc(
            @RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.consolidatedNpcReport(month, year)));
    }

    /** GET /api/reports/npc/staff?month=6&year=2026 */
    @GetMapping("/npc/staff")
    public ResponseEntity<ApiResponse<Map<String, Object>>> staffNpc(
            @RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.staffNpcReport(month, year)));
    }

    /** GET /api/reports/customer-visits?year=2026 */
    @GetMapping("/customer-visits")
    public ResponseEntity<ApiResponse<Map<String, Object>>> customerVisits(
            @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.customerVisitReport(year)));
    }

    /** GET /api/reports/increment/{userId}?year=2026 */
    @GetMapping("/increment/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> increment(
            @PathVariable Long userId, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.incrementReport(userId, year)));
    }
}
