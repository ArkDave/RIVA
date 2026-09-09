package com.riva.controllers;

import com.riva.dto.request.StoreCreateRequest;
import com.riva.dto.response.ApiResponse;
import com.riva.dto.response.StoreResponse;
import com.riva.services.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StoreResponse>> createStore(@Valid @RequestBody StoreCreateRequest request) {
        StoreResponse response = storeService.createStore(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Store created and schema provisioned successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StoreResponse>>> getAllStores() {
        List<StoreResponse> stores = storeService.getAllStores();
        return ResponseEntity.ok(ApiResponse.ok("Stores retrieved successfully", stores));
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StoreResponse>> getStoreByCode(@PathVariable String code) {
        StoreResponse store = storeService.getStoreByCode(code);
        return ResponseEntity.ok(ApiResponse.ok("Store retrieved successfully", store));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StoreResponse>> toggleStoreStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {
        StoreResponse store = storeService.toggleStoreStatus(id, active);
        return ResponseEntity.ok(ApiResponse.ok("Store status updated successfully", store));
    }
}
