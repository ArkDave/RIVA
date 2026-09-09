package com.riva.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class TelecallingImportRequest {

    @NotEmpty
    private List<ContactRow> contacts;

    @Data
    public static class ContactRow {
        private String customerName;
        private String customerPhone;
    }
}
