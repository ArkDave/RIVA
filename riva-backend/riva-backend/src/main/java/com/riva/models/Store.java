package com.riva.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "stores", schema = "public")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Store extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "schema_name", nullable = false, unique = true, length = 63)
    private String schemaName;

    @Column(length = 255)
    private String address;

    @Column(length = 15)
    private String phone;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
