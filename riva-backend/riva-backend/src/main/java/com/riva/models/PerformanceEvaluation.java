package com.riva.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "performance_evaluations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "eval_date"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PerformanceEvaluation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "eval_date", nullable = false)
    private LocalDate evalDate;

    // Scores 1–5 each
    @Builder.Default
    @Column(nullable = false)
    private Integer grooming = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer punctuality = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer discipline = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer upSaleCrossSale = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer presentation = 0;

    // Computed: sum of all 5 scores (max = 25)
    @Builder.Default
    @Column(nullable = false)
    private Integer totalScore = 0;

    // Computed: (totalScore / 25) * 100
    @Builder.Default
    @Column(nullable = false)
    private Double percentage = 0.0;
}
