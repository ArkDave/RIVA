package com.riva.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponse {
    private Long id;
    private String code;
    private String name;
    private String schemaName;
    private String address;
    private String phone;
    private boolean active;
    private LocalDateTime createdAt;
}
