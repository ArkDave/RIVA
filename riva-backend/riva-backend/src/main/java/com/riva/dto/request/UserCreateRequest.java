package com.riva.dto.request;

import com.riva.enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserCreateRequest {

    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotBlank
    private String fullName;

    private String phone;

    @NotNull
    private UserRole role;

    private Long counterId;
}
