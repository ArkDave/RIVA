package com.riva.services;

import com.riva.dto.request.PerformanceEvalRequest;
import com.riva.exception.*;
import com.riva.models.*;
import com.riva.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerformanceService {

    private final PerformanceEvaluationRepository perfRepository;
    private final UserRepository userRepository;

    private static final int MAX_SCORE = 25; // 5 categories × 5 points

    // ── Save / Update Daily Evaluation ───────────────────────

    @Transactional
    public Map<String, Object> saveEvaluation(PerformanceEvalRequest req) {
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", req.getUserId()));

        LocalDate evalDate = LocalDate.parse(req.getEvalDate());

        // Upsert — one row per user per day
        PerformanceEvaluation eval = perfRepository
                .findByUserIdAndEvalDate(req.getUserId(), evalDate)
                .orElse(PerformanceEvaluation.builder().user(user).evalDate(evalDate).build());

        eval.setGrooming(req.getGrooming());
        eval.setPunctuality(req.getPunctuality());
        eval.setDiscipline(req.getDiscipline());
        eval.setUpSaleCrossSale(req.getUpSaleCrossSale());
        eval.setPresentation(req.getPresentation());

        int total = req.getGrooming() + req.getPunctuality() + req.getDiscipline()
                  + req.getUpSaleCrossSale() + req.getPresentation();
        eval.setTotalScore(total);
        eval.setPercentage((total * 100.0) / MAX_SCORE);

        perfRepository.save(eval);
        return Map.of("message", "Evaluation saved", "total", total,
                      "percentage", eval.getPercentage());
    }

    // ── Monthly Report ────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> monthlyReport(int month, int year) {
        List<Object[]> rows = perfRepository.monthlyAverageByUser(month, year);
        return rows.stream().map(r -> {
            double avg = r[2] != null ? ((Number) r[2]).doubleValue() : 0.0;
            return Map.<String, Object>of(
                "userId", r[0],
                "staffName", r[1],
                "avgPercentage", Math.round(avg * 10.0) / 10.0,
                "status", avg >= 75 ? "GREEN" : avg < 50 ? "RED" : "NORMAL"
            );
        }).collect(Collectors.toList());
    }

    // ── Top 5 / Bottom 5 ─────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> topAndBottomFive(int month, int year) {
        List<Map<String, Object>> all = monthlyReport(month, year);
        List<Map<String, Object>> top5 = all.stream().limit(5).collect(Collectors.toList());
        List<Map<String, Object>> bottom5 = new ArrayList<>(all);
        Collections.reverse(bottom5);
        bottom5 = bottom5.stream().limit(5).collect(Collectors.toList());
        return Map.of("top5", top5, "bottom5", bottom5);
    }

    // ── Annual Category Winners (for Achievement Report Card) ─

    @Transactional(readOnly = true)
    public Map<String, String> annualCategoryWinners(int year) {
        Map<String, String> winners = new LinkedHashMap<>();
        winners.put("bestGrooming",    firstOf(perfRepository.bestGrooming(year)));
        winners.put("bestPunctuality", firstOf(perfRepository.bestPunctuality(year)));
        winners.put("bestDiscipline",  firstOf(perfRepository.bestDiscipline(year)));
        winners.put("bestPresentation",firstOf(perfRepository.bestPresentation(year)));
        // Employee of the year — highest annual average overall
        List<Object[]> annual = perfRepository.annualAverageByUser(year);
        winners.put("employeeOfYear", annual.isEmpty() ? "N/A" : (String) annual.get(0)[1]);
        return winners;
    }

    // ── Staff Annual % (for Increment calc) ──────────────────

    @Transactional(readOnly = true)
    public Map<Long, Double> annualAveragePercentageMap(int year) {
        return perfRepository.annualAverageByUser(year).stream()
                .collect(Collectors.toMap(
                        r -> ((Number) r[0]).longValue(),
                        r -> r[2] != null ? ((Number) r[2]).doubleValue() : 0.0
                ));
    }

    private String firstOf(List<Object[]> rows) {
        return rows.isEmpty() ? "N/A" : (String) rows.get(0)[0];
    }
}
