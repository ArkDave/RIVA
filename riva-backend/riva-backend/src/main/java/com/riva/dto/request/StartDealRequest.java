package com.riva.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StartDealRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;
}
