package com.riva.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.riva.enums.SaleType;
import lombok.Data;

@Data
public class CloseDealRequest {

    // true = sale, false = non-sale
    @JsonProperty("isSale")
    private boolean isSale;

    // Required if isSale = false
    private String nonSaleReason;

    // Required if isSale = true
    private SaleType saleType;

    // Required if saleType = ORDER
    private String productDetail;
    private String deliveryDate; // ISO date string yyyy-MM-dd
}
