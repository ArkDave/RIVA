package com.riva.services;

import com.riva.dto.request.LoginRequest;
import com.riva.dto.response.AuthResponse;
import com.riva.exception.ResourceNotFoundException;
import com.riva.models.Store;
import com.riva.models.User;
import com.riva.repositories.StoreRepository;
import com.riva.repositories.UserRepository;
import com.riva.security.JwtUtils;
import com.riva.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    public AuthResponse login(LoginRequest request) {
        String storeCode = request.getStoreCode();
        String tenantSchema = TenantContext.DEFAULT_TENANT;

        if (StringUtils.hasText(storeCode)) {
            Store store = storeRepository.findByCode(storeCode.trim().toUpperCase())
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found with code: " + request.getStoreCode()));
            tenantSchema = store.getSchemaName();
            storeCode = store.getCode();
        } else {
            storeCode = "DEFAULT";
        }

        try {
            // Set TenantContext before authenticating against store schema
            TenantContext.setCurrentTenant(tenantSchema);

            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            String token = jwtUtils.generateToken(auth, tenantSchema, storeCode);

            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUsername()));

            return AuthResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .userId(user.getId())
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .role(user.getRole())
                    .counterName(user.getCounter() != null ? user.getCounter().getName() : null)
                    .storeCode(storeCode)
                    .tenantSchema(tenantSchema)
                    .build();
        } finally {
            TenantContext.clear();
        }
    }
}
