package com.riva.models;

import com.riva.enums.MetalType;
import com.riva.enums.SaleType;
import com.riva.enums.TokenStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Token extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Auto-generated alpha-numeric ID e.g. SJ1011
    @Column(nullable = false, unique = true, length = 20)
    private String tokenNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MetalType metalType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counter_id", nullable = false)
    private Counter counter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_executive_id", nullable = false)
    private User salesExecutive;

    @Column(nullable = false, length = 100)
    private String productName;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TokenStatus status = TokenStatus.RAISED;

    // Customer info — filled when deal starts
    @Column(length = 150)
    private String customerName;

    @Column(length = 15)
    private String customerPhone;

    // Deal timing
    @Column
    private LocalDateTime dealStartTime;

    @Column
    private LocalDateTime dealEndTime;

    // Result
    @Enumerated(EnumType.STRING)
    private SaleType saleType;

    @Column(length = 300)
    private String nonSaleReason;

    // Billing
    @Column(length = 50)
    private String billNumber;

    // Date tracking
    @Column(nullable = false)
    private LocalDate tokenDate;

    @Column
    private LocalDateTime raisedAt;

    // Link to order if saleType = ORDER
    @OneToOne(mappedBy = "token", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Order order;
}
