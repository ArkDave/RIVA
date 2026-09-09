package com.riva.dto.response;

import com.riva.enums.OrderStatus;
import lombok.*;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private String productName;
    private String productDetail;
    private String productPhotoUrl;
    private String deliveryDate;
    private String salesExecutiveName;
    private String billNumber;
    private OrderStatus status;
    private String karigarName;
    private String karigarAllottedDate;
    private String productReceivedDate;
    private String deliveredDate;
    private BigDecimal gramage;
}
