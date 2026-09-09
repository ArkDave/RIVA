package com.riva.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BillNumberRequest {
    @NotBlank(message = "Bill number is mandatory")
    private String billNumber;
}
