package com.riva.services;

import com.riva.enums.MetalType;
import com.riva.models.TicketSizeConfig;
import com.riva.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TokenRepository tokenRepository;
    private final TicketSizeConfigRepository ticketSizeRepo;
    private final IncentiveService incentiveService;
    private final PerformanceService performanceService;

    // ── Daily NPC Report ──────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> dailyNpcReport(LocalDate date) {
        List<Map<String, Object>> rows = new ArrayList<>();

        for (MetalType metal : MetalType.values()) {
            long walkin  = tokenRepository.countWalkinByDateAndMetal(date, metal);
            long walkout = tokenRepository.countWalkoutByDateAndMetal(date, metal);
            double ratio = walkin > 0 ? (walkout * 100.0 / walkin) : 0.0;

            rows.add(Map.of(
                "metalType", metal.name(),
                "walkin",    walkin,
                "walkout",   walkout,
                "walkoutRatio", String.format("%.0f%%", ratio)
            ));
        }

        return Map.of("date", date.toString(), "rows", rows);
    }

    // ── Consolidated NPC Report ───────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> consolidatedNpcReport(int month, int year) {
        // Counter rows
        List<Object[]> counterData = tokenRepository.consolidatedNpcByCounter(month, year);
        List<Map<String, Object>> counterRows = counterData.stream().map(r -> {
            long walkin  = ((Number) r[1]).longValue();
            long walkout = ((Number) r[2]).longValue();
            double ratio = walkin > 0 ? (walkout * 100.0 / walkin) : 0.0;

            // Ticket size lookup (all metals combined; use GOLD as default)
            BigDecimal ticketSize = ticketSizeRepo.findByMetalType(MetalType.GOLD)
                    .map(TicketSizeConfig::getTicketSize).orElse(BigDecimal.ZERO);
            BigDecimal amount = ticketSize.multiply(BigDecimal.valueOf(walkout));

            return Map.<String, Object>of(
                "counterName", r[0],
                "walkin", walkin,
                "walkout", walkout,
                "ratio", String.format("%.0f%%", ratio),
                "ticketSize", ticketSize,
                "amount", amount
            );
        }).collect(Collectors.toList());

        // Top 3 reasons
        List<Object[]> reasonData = tokenRepository.topNonSaleReasons(month, year);
        long totalWalkout = reasonData.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        List<Map<String, Object>> topReasons = reasonData.stream().limit(3).map(r -> {
            long cnt = ((Number) r[1]).longValue();
            return Map.<String, Object>of(
                "reason", r[0],
                "count", cnt,
                "percentage", totalWalkout > 0 ? String.format("%.0f%%", cnt * 100.0 / totalWalkout) : "0%"
            );
        }).collect(Collectors.toList());

        // Top 3 salesmen by NPC
        List<Object[]> salesmanData = tokenRepository.topSalesmenByNpc(month, year);
        long totalNpc = salesmanData.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        List<Map<String, Object>> topSalesmen = salesmanData.stream().limit(3).map(r -> {
            long cnt = ((Number) r[1]).longValue();
            return Map.<String, Object>of(
                "name", r[0],
                "count", cnt,
                "percentage", totalNpc > 0 ? String.format("%.0f%%", cnt * 100.0 / totalNpc) : "0%"
            );
        }).collect(Collectors.toList());

        // Approximate financial loss
        BigDecimal totalLoss = counterRows.stream()
                .map(r -> (BigDecimal) r.get("amount"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "month", Month.of(month).name(),
            "year", year,
            "counters", counterRows,
            "topReasons", topReasons,
            "topSalesmen", topSalesmen,
            "approximateFinancialLoss", totalLoss
        );
    }

    // ── Staff Monthly NPC Report ──────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> staffNpcReport(int month, int year) {
        List<Object[]> rows = tokenRepository.staffNpcReport(month, year);
        List<Map<String, Object>> staffRows = rows.stream().map(r -> {
            long sales  = ((Number) r[1]).longValue();
            long noSale = ((Number) r[2]).longValue();
            long total  = ((Number) r[3]).longValue();
            double npcRatio = total > 0 ? (noSale * 100.0 / total) : 0.0;
            return Map.<String, Object>of(
                "staffName", r[0],
                "sales", sales,
                "noSale", noSale,
                "total", total,
                "npcRatio", String.format("%.2f%%", npcRatio)
            );
        }).collect(Collectors.toList());

        return Map.of("month", Month.of(month).name(), "year", year, "rows", staffRows);
    }

    // ── Customer Visit Report ─────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> customerVisitReport(int year) {
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to   = LocalDate.of(year, 12, 31);

        List<Object[]> raw = tokenRepository.customerVisitCounts(from, to);

        Map<String, List<Map<String, Object>>> buckets = new LinkedHashMap<>();
        buckets.put("visitedOnce",   new ArrayList<>());
        buckets.put("visitedTwice",  new ArrayList<>());
        buckets.put("visitedThrice", new ArrayList<>());
        buckets.put("visitedFour",   new ArrayList<>());
        buckets.put("aboveFour",     new ArrayList<>());

        long total = raw.size();

        for (Object[] r : raw) {
            String phone = (String) r[0];
            String name  = (String) r[1];
            long visits  = ((Number) r[2]).longValue();

            Map<String, Object> entry = Map.of("name", name, "phone", phone, "visits", visits);
            String bucket = visits == 1 ? "visitedOnce"
                          : visits == 2 ? "visitedTwice"
                          : visits == 3 ? "visitedThrice"
                          : visits == 4 ? "visitedFour" : "aboveFour";
            buckets.get(bucket).add(entry);
        }

        // Counts and percentages
        Map<String, Object> summary = new LinkedHashMap<>();
        buckets.forEach((bucket, list) -> {
            long cnt = list.size();
            summary.put(bucket, Map.of(
                "count", cnt,
                "percentage", total > 0 ? String.format("%.2f%%", cnt * 100.0 / total) : "0%",
                "customers", list
            ));
        });
        summary.put("totalCustomers", total);

        return Map.of("year", year, "from", from.toString(), "to", to.toString(), "data", summary);
    }

    // ── Increment Report ──────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> incrementReport(Long userId, int year) {
        // Sales achieved: >= 6 months target hit
        Set<Long> salesAchievers = incentiveService.userIdsWithSalesAchievedInYear(year);
        boolean salesAchieved = salesAchievers.contains(userId);

        // Performance > 75% annually
        Map<Long, Double> perfMap = performanceService.annualAveragePercentageMap(year);
        boolean perfAbove75 = perfMap.getOrDefault(userId, 0.0) > 75.0;

        // NPC ratio below 30% — fetch from staff NPC report for all months
        // Simplified: calculate average NPC ratio for the year
        double totalNpcRatio = 0;
        int monthsWithData = 0;
        for (int m = 1; m <= 12; m++) {
            List<Object[]> staffRows = tokenRepository.staffNpcReport(m, year);
            for (Object[] r : staffRows) {
                // staffNpcReport groups by name, not by userId — approximate match
                long noSale = ((Number) r[2]).longValue();
                long total  = ((Number) r[3]).longValue();
                if (total > 0) {
                    totalNpcRatio += (noSale * 100.0 / total);
                    monthsWithData++;
                }
            }
        }
        double avgNpcRatio = monthsWithData > 0 ? totalNpcRatio / monthsWithData : 100.0;
        boolean npcBelow30 = avgNpcRatio < 30.0;

        int totalIncrement = (salesAchieved ? 3 : 0)
                           + (npcBelow30    ? 2 : 0)
                           + (perfAbove75   ? 2 : 0);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("userId", userId);
        report.put("year", year);
        report.put("salesAchieved", salesAchieved);
        report.put("salesIncrement", salesAchieved ? 3 : 0);
        report.put("schemeAchieved", false); // manual — admin sets
        report.put("schemeIncrement", 0);
        report.put("npcBelow30", npcBelow30);
        report.put("npcIncrement", npcBelow30 ? 2 : 0);
        report.put("perfAbove75", perfAbove75);
        report.put("perfIncrement", perfAbove75 ? 2 : 0);
        report.put("totalIncrement", totalIncrement);

        return report;
    }
}
