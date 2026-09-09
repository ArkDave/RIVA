package com.riva.repositories;

import com.riva.models.IncentiveTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncentiveTargetRepository extends JpaRepository<IncentiveTarget, Long> {

    @Query("SELECT it FROM IncentiveTarget it JOIN it.user u WHERE it.month = :month AND it.year = :year ORDER BY u.fullName ASC")
    List<IncentiveTarget> findByMonthAndYearOrderByUserFullNameAsc(@Param("month") int month, @Param("year") int year);

    Optional<IncentiveTarget> findByUserIdAndMonthAndYear(Long userId, int month, int year);

    @Query("SELECT SUM(it.earnedIncentive) FROM IncentiveTarget it " +
           "WHERE it.month = :month AND it.year = :year")
    java.math.BigDecimal totalIncentivesByMonthYear(@Param("month") int month, @Param("year") int year);

    // Annual: count months where target was achieved per user
    @Query("SELECT it.user.id, COUNT(it) FROM IncentiveTarget it " +
           "WHERE it.year = :year AND it.targetAchieved >= it.targetGiven AND it.targetGiven > 0 " +
           "GROUP BY it.user.id")
    List<Object[]> salesAchievedCountByYear(@Param("year") int year);
}
