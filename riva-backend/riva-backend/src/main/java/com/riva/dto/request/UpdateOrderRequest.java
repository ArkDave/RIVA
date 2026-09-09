package com.riva.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpdateOrderRequest {
    private String karigarName;
    private String karigarAllottedDate;   // yyyy-MM-dd
    private String productReceivedDate;   // yyyy-MM-dd
    private String deliveredDate;         // yyyy-MM-dd
    private String billNumber;
    private BigDecimal gramage;
}
