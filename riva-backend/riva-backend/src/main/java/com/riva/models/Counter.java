package com.riva.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "counters")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Counter extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 200)
    private String description;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
