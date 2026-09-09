package com.riva.controllers;

import com.riva.dto.request.UserCreateRequest;
import com.riva.dto.response.ApiResponse;
import com.riva.enums.MetalType;
import com.riva.exception.*;
import com.riva.models.*;
import com.riva.repositories.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final CounterRepository counterRepository;
    private final TicketSizeConfigRepository ticketSizeRepo;
    private final PasswordEncoder passwordEncoder;

    // ── Users ─────────────────────────────────────────────────

    /** GET /api/admin/users */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findByActiveTrueOrderByFullNameAsc()
                .stream().map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("fullName", u.getFullName());
                    m.put("role", u.getRole());
                    m.put("counter", u.getCounter() != null ? u.getCounter().getName() : null);
                    m.put("phone", u.getPhone());
                    return m;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    /** POST /api/admin/users */
    @PostMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createUser(
            @Valid @RequestBody UserCreateRequest req) {

        if (userRepository.existsByUsername(req.getUsername())) {
            throw new BusinessException("Username '" + req.getUsername() + "' already exists.");
        }

        User.UserBuilder builder = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(req.getRole())
                .active(true);

        if (req.getCounterId() != null) {
            Counter counter = counterRepository.findById(req.getCounterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Counter", req.getCounterId()));
            builder.counter(counter);
        }

        User saved = userRepository.save(builder.build());
        return ResponseEntity.ok(ApiResponse.ok("User created",
                Map.of("id", saved.getId(), "username", saved.getUsername())));
    }

    /** DELETE /api/admin/users/{id} — Soft delete */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setActive(false);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("User deactivated", null));
    }

    // ── Counters ──────────────────────────────────────────────

    /** GET /api/admin/counters */
    @GetMapping("/counters")
    public ResponseEntity<ApiResponse<List<Counter>>> getCounters() {
        return ResponseEntity.ok(ApiResponse.ok(counterRepository.findByActiveTrue()));
    }

    /** POST /api/admin/counters */
    @PostMapping("/counters")
    public ResponseEntity<ApiResponse<Counter>> createCounter(@RequestParam String name,
                                                               @RequestParam(required = false) String description) {
        if (counterRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("Counter '" + name + "' already exists.");
        }
        Counter c = counterRepository.save(Counter.builder().name(name).description(description).active(true).build());
        return ResponseEntity.ok(ApiResponse.ok("Counter created", c));
    }

    /** DELETE /api/admin/counters/{id} */
    @DeleteMapping("/counters/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCounter(@PathVariable Long id) {
        Counter c = counterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Counter", id));
        c.setActive(false);
        counterRepository.save(c);
        return ResponseEntity.ok(ApiResponse.ok("Counter removed", null));
    }

    // ── Ticket Size Config ────────────────────────────────────

    /** GET /api/admin/ticket-sizes */
    @GetMapping("/ticket-sizes")
    public ResponseEntity<ApiResponse<List<TicketSizeConfig>>> getTicketSizes() {
        return ResponseEntity.ok(ApiResponse.ok(ticketSizeRepo.findAll()));
    }

    /** PUT /api/admin/ticket-sizes/{metalType}?amount=25000 */
    @PutMapping("/ticket-sizes/{metalType}")
    public ResponseEntity<ApiResponse<TicketSizeConfig>> updateTicketSize(
            @PathVariable MetalType metalType,
            @RequestParam BigDecimal amount) {

        TicketSizeConfig config = ticketSizeRepo.findByMetalType(metalType)
                .orElse(TicketSizeConfig.builder().metalType(metalType).build());
        config.setTicketSize(amount);
        TicketSizeConfig saved = ticketSizeRepo.save(config);
        return ResponseEntity.ok(ApiResponse.ok("Ticket size updated", saved));
    }
}
