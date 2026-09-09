package com.riva.controllers;

import com.riva.dto.request.TelecallingImportRequest;
import com.riva.dto.response.ApiResponse;
import com.riva.services.TelecallingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/telecalling")
@RequiredArgsConstructor
public class TelecallingController {

    private final TelecallingService telecallingService;

    /** POST /api/telecalling/{telecallerId}/import */
    @PostMapping("/{telecallerId}/import")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importContacts(
            @PathVariable Long telecallerId,
            @Valid @RequestBody TelecallingImportRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                telecallingService.importContacts(telecallerId, req)));
    }

    /** GET /api/telecalling/{telecallerId}/contacts */
    @GetMapping("/{telecallerId}/contacts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getContacts(
            @PathVariable Long telecallerId) {
        return ResponseEntity.ok(ApiResponse.ok(
                telecallingService.getContacts(telecallerId)));
    }

    /** PUT /api/telecalling/contacts/{contactId}/status?status=Call+Busy */
    @PutMapping("/contacts/{contactId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateStatus(
            @PathVariable Long contactId,
            @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.ok(
                telecallingService.updateStatus(contactId, status)));
    }

    /** POST /api/telecalling/{telecallerId}/day-end */
    @PostMapping("/{telecallerId}/day-end")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dayEnd(
            @PathVariable Long telecallerId) {
        return ResponseEntity.ok(ApiResponse.ok(
                telecallingService.dayEnd(telecallerId)));
    }

    /** GET /api/telecalling/{telecallerId}/report?date=2026-06-08 */
    @GetMapping("/{telecallerId}/report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> report(
            @PathVariable Long telecallerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(
                telecallingService.getReport(telecallerId, date)));
    }
}
