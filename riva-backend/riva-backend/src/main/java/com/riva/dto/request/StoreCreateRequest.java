package com.riva.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StoreCreateRequest {

    @NotBlank(message = "Store code is required")
    @Size(min = 2, max = 50, message = "Store code must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Store code must contain only letters, numbers, hyphens, and underscores")
    private String code;

    @NotBlank(message = "Store name is required")
    @Size(min = 2, max = 100, message = "Store name must be between 2 and 100 characters")
    private String name;

    private String address;

    private String phone;
}
