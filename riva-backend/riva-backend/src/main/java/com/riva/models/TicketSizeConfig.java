package com.riva.models;

import com.riva.enums.MetalType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "ticket_size_config")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketSizeConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private MetalType metalType;

    @Builder.Default
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal ticketSize = BigDecimal.ZERO;
}
