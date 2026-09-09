package com.riva.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class ReportResponses {

    // ── Daily NPC Report ─────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class NpcMetalRow {
        private String metalType;
        private long walkin;
        private long walkout;
        private String walkoutRatio;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DailyNpcReport {
        private String date;
        private String branch;
        private List<NpcMetalRow> rows;
    }

    // ── Consolidated NPC Report ───────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ConsolidatedCounterRow {
        private String counterName;
        private long walkin;
        private long walkout;
        private String ratio;
        private BigDecimal ticketSize;
        private BigDecimal amount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopReasonRow {
        private String reason;
        private long count;
        private String percentage;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopSalesmanRow {
        private String name;
        private long count;
        private String percentage;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ConsolidatedNpcReport {
        private String month;
        private int year;
        private List<ConsolidatedCounterRow> counters;
        private List<TopReasonRow> topReasons;
        private List<TopSalesmanRow> topSalesmen;
        private BigDecimal approximateFinancialLoss;
    }

    // ── Staff Monthly NPC Report ──────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StaffNpcRow {
        private String staffName;
        private long sales;
        private long noSale;
        private long total;
        private String npcRatio;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StaffNpcReport {
        private String month;
        private int year;
        private List<StaffNpcRow> rows;
    }

    // ── Increment Report ─────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class IncrementReport {
        private String staffName;
        private boolean salesAchieved;
        private boolean schemeAchieved;
        private boolean npcBelow30;
        private boolean perfAbove75;
        private int totalIncrementPercent;
    }
}

