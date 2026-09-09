package com.riva.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "telecalling_contacts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TelecallingContact extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "telecaller_id", nullable = false)
    private User telecaller;

    @Column(nullable = false, length = 150)
    private String customerName;

    @Column(nullable = false, length = 15)
    private String customerPhone;

    @Column(length = 100)
    private String callStatus;

    // true = call is still active (Busy / Did not Pick)
    // false = call has ended
    @Builder.Default
    @Column(nullable = false)
    private boolean callActive = true;

    @Column(nullable = false)
    private LocalDate dataProvidedDate;

    // Day-end snapshot date — set when telecaller triggers day-end
    @Column
    private LocalDate reportDate;
}
