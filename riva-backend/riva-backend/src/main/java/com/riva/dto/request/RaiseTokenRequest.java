package com.riva.dto.request;

import com.riva.enums.MetalType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RaiseTokenRequest {

    @NotNull(message = "Metal type is required")
    private MetalType metalType;

    @NotNull(message = "Counter ID is required")
    private Long counterId;

    @NotNull(message = "Sales executive ID is required")
    private Long salesExecutiveId;

    @NotBlank(message = "Product name is required")
    private String productName;

    // Populated if returning customer uses token number
    private String existingTokenNumber;
}
