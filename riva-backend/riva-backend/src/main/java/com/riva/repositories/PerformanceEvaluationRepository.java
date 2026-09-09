package com.riva.repositories;

import com.riva.models.PerformanceEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceEvaluationRepository extends JpaRepository<PerformanceEvaluation, Long> {

    Optional<PerformanceEvaluation> findByUserIdAndEvalDate(Long userId, LocalDate evalDate);

    List<PerformanceEvaluation> findByEvalDateBetweenOrderByEvalDateAsc(LocalDate from, LocalDate to);

    // Monthly average % per user
    @Query("SELECT u.id, u.fullName, AVG(pe.percentage) " +
           "FROM PerformanceEvaluation pe JOIN pe.user u " +
           "WHERE MONTH(pe.evalDate) = :month AND YEAR(pe.evalDate) = :year " +
           "GROUP BY u.id, u.fullName ORDER BY AVG(pe.percentage) DESC")
    List<Object[]> monthlyAverageByUser(@Param("month") int month, @Param("year") int year);

    // Annual average % per user
    @Query("SELECT u.id, u.fullName, AVG(pe.percentage) " +
           "FROM PerformanceEvaluation pe JOIN pe.user u WHERE YEAR(pe.evalDate) = :year " +
           "GROUP BY u.id, u.fullName ORDER BY AVG(pe.percentage) DESC")
    List<Object[]> annualAverageByUser(@Param("year") int year);

    // Category best performers (annual)
    @Query("SELECT u.fullName, AVG(pe.grooming) FROM PerformanceEvaluation pe JOIN pe.user u " +
           "WHERE YEAR(pe.evalDate) = :year " +
           "GROUP BY u.fullName ORDER BY AVG(pe.grooming) DESC")
    List<Object[]> bestGrooming(@Param("year") int year);

    @Query("SELECT u.fullName, AVG(pe.punctuality) FROM PerformanceEvaluation pe JOIN pe.user u " +
           "WHERE YEAR(pe.evalDate) = :year " +
           "GROUP BY u.fullName ORDER BY AVG(pe.punctuality) DESC")
    List<Object[]> bestPunctuality(@Param("year") int year);

    @Query("SELECT u.fullName, AVG(pe.discipline) FROM PerformanceEvaluation pe JOIN pe.user u " +
           "WHERE YEAR(pe.evalDate) = :year " +
           "GROUP BY u.fullName ORDER BY AVG(pe.discipline) DESC")
    List<Object[]> bestDiscipline(@Param("year") int year);

    @Query("SELECT u.fullName, AVG(pe.presentation) FROM PerformanceEvaluation pe JOIN pe.user u " +
           "WHERE YEAR(pe.evalDate) = :year " +
           "GROUP BY u.fullName ORDER BY AVG(pe.presentation) DESC")
    List<Object[]> bestPresentation(@Param("year") int year);
}
