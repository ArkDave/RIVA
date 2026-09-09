package com.riva.services;

import com.riva.dto.request.IncentiveTargetRequest;
import com.riva.exception.*;
import com.riva.models.*;
import com.riva.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncentiveService {

    private final IncentiveTargetRepository incentiveRepository;
    private final UserRepository userRepository;

    // ── Upsert Target ─────────────────────────────────────────

    @Transactional
    public Map<String, Object> saveTarget(IncentiveTargetRequest req) {
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", req.getUserId()));

        IncentiveTarget target = incentiveRepository
                .findByUserIdAndMonthAndYear(req.getUserId(), req.getMonth(), req.getYear())
                .orElse(IncentiveTarget.builder().user(user).month(req.getMonth()).year(req.getYear()).build());

        target.setTargetGiven(req.getTargetGiven());
        target.setTargetAchieved(req.getTargetAchieved());
        target.setIncentiveAmount(req.getIncentiveAmount());

        // Earn incentive only if target achieved >= target given
        BigDecimal earned = (req.getTargetGiven() > 0 && req.getTargetAchieved() >= req.getTargetGiven())
                ? req.getIncentiveAmount() : BigDecimal.ZERO;
        target.setEarnedIncentive(earned);

        incentiveRepository.save(target);
        return Map.of("message", "Target saved", "earnedIncentive", earned);
    }

    // ── Monthly Report ────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> monthlyReport(int month, int year) {
        List<IncentiveTarget> targets = incentiveRepository
                .findByMonthAndYearOrderByUserFullNameAsc(month, year);

        List<Map<String, Object>> rows = targets.stream().map(t -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", t.getUser().getId());
            row.put("staffName", t.getUser().getFullName());
            row.put("targetGiven", t.getTargetGiven());
            row.put("targetAchieved", t.getTargetAchieved());
            row.put("incentives", t.getEarnedIncentive());
            return row;
        }).collect(Collectors.toList());

        BigDecimal total = incentiveRepository.totalIncentivesByMonthYear(month, year);

        return Map.of(
            "month", month, "year", year,
            "rows", rows,
            "totalIncentives", total != null ? total : BigDecimal.ZERO
        );
    }

    // ── Sales Achievement Map (for Increment Report) ──────────

    @Transactional(readOnly = true)
    public Set<Long> userIdsWithSalesAchievedInYear(int year) {
        // Count how many months each user hit their target; if >= 6 months treat as achieved
        List<Object[]> rows = incentiveRepository.salesAchievedCountByYear(year);
        return rows.stream()
                .filter(r -> ((Number) r[1]).longValue() >= 6)
                .map(r -> ((Number) r[0]).longValue())
                .collect(Collectors.toSet());
    }
}
