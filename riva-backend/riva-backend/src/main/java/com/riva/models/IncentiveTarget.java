package com.riva.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "incentive_targets",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "month", "year"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IncentiveTarget extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "month")
    private Integer month;
    
    @Column(name = "year")
    private Integer year;

    @Builder.Default
    @Column(nullable = false)
    private Integer targetGiven = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer targetAchieved = 0;

    // Incentive amount per unit / slab — set by admin
    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal incentiveAmount = BigDecimal.ZERO;

    // Auto-calculated: incentiveAmount if targetAchieved >= targetGiven, else 0
    @Builder.Default
    @Column(precision = 10, scale = 2)
    private BigDecimal earnedIncentive = BigDecimal.ZERO;
}
