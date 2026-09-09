package com.riva.dto.response;

import com.riva.enums.MetalType;
import com.riva.enums.SaleType;
import com.riva.enums.TokenStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TokenResponse {
    private Long id;
    private String tokenNumber;
    private MetalType metalType;
    private String counterName;
    private String salesExecutiveName;
    private String productName;
    private TokenStatus status;
    private String customerName;
    private String customerPhone;
    private LocalDateTime dealStartTime;
    private LocalDateTime dealEndTime;
    private SaleType saleType;
    private String nonSaleReason;
    private String billNumber;
    private String tokenDate;
    private Long elapsedSeconds;  // computed for in-deal tokens
}
