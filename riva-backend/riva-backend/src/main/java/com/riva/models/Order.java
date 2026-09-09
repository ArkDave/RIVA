package com.riva.models;

import com.riva.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String orderNumber;

    // Immutable fields — set from token/cashier, never editable by order dept
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "token_id", nullable = false)
    private Token token;

    @Column(nullable = false, length = 150)
    private String customerName;

    @Column(nullable = false, length = 15)
    private String customerPhone;

    @Column(nullable = false, length = 100)
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String productDetail;

    @Column(length = 255)
    private String productPhotoUrl;

    @Column(nullable = false)
    private LocalDate deliveryDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_executive_id", nullable = false)
    private User salesExecutive;

    @Column(length = 50)
    private String billNumber;

    // Editable by order department
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.RECEIVED;

    @Column(length = 150)
    private String karigarName;

    @Column
    private LocalDate karigarAllottedDate;

    @Column
    private LocalDate productReceivedDate;

    @Column
    private LocalDate deliveredDate;

    // Gramage
    @Column(precision = 10, scale = 3)
    private BigDecimal gramage;
}
