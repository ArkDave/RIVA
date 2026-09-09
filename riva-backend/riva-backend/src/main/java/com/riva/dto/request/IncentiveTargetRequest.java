package com.riva.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class IncentiveTargetRequest {

    @NotNull
    private Long userId;

    @Min(1) @Max(12)
    private int month;

    @Min(2020)
    private int year;

    @Min(0)
    private int targetGiven;

    @Min(0)
    private int targetAchieved;

    @NotNull
    private BigDecimal incentiveAmount;
}
