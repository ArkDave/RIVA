package com.riva.controllers;

import com.riva.dto.request.UpdateOrderRequest;
import com.riva.dto.response.*;
import com.riva.enums.OrderStatus;
import com.riva.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** GET /api/orders — All orders */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAll() {
        System.out.println("Hello----");
        return ResponseEntity.ok(ApiResponse.ok(orderService.getAllOrders()));
    }

    /** GET /api/orders/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrder(id)));
    }

    /** GET /api/orders/status/{status} — Filter by status */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getByStatus(
            @PathVariable OrderStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getByStatus(status)));
    }

    /** PUT /api/orders/{id} — Order dept updates pipeline */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> update(
            @PathVariable Long id,
            @RequestBody UpdateOrderRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.updateOrder(id, req)));
    }

    /** GET /api/orders/summary — Status count + grams report */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary() {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderSummary()));
    }
}
