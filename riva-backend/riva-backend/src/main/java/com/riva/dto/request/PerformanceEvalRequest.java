package com.riva.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class PerformanceEvalRequest {

    @NotNull
    private Long userId;

    @NotBlank
    private String evalDate; // yyyy-MM-dd

    @Min(0) @Max(5)
    private int grooming;

    @Min(0) @Max(5)
    private int punctuality;

    @Min(0) @Max(5)
    private int discipline;

    @Min(0) @Max(5)
    private int upSaleCrossSale;

    @Min(0) @Max(5)
    private int presentation;
}
