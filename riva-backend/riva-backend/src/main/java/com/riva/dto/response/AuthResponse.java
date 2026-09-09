package com.riva.dto.response;

import com.riva.enums.UserRole;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String fullName;
    private UserRole role;
    private String counterName;
    private String storeCode;
    private String tenantSchema;
}
