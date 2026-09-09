package com.riva.repositories;

import com.riva.enums.MetalType;
import com.riva.enums.TokenStatus;
import com.riva.models.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {

    Optional<Token> findByTokenNumber(String tokenNumber);

    // Active tokens per counter (for 5-token limit check)
    @Query("SELECT COUNT(t) FROM Token t WHERE t.counter.id = :counterId " +
           "AND t.status NOT IN ('CLOSED_SALE', 'CLOSED_NON_SALE')")
    long countActiveByCounter(@Param("counterId") Long counterId);

    List<Token> findByCounterIdAndStatusNotIn(Long counterId, List<TokenStatus> excludedStatuses);

    // NPC daily report
    @Query("SELECT COUNT(t) FROM Token t WHERE t.tokenDate = :date AND t.metalType = :metal")
    long countWalkinByDateAndMetal(@Param("date") LocalDate date, @Param("metal") MetalType metal);

    @Query("SELECT COUNT(t) FROM Token t WHERE t.tokenDate = :date " +
           "AND t.metalType = :metal AND t.status = 'CLOSED_NON_SALE'")
    long countWalkoutByDateAndMetal(@Param("date") LocalDate date, @Param("metal") MetalType metal);

    // Consolidated NPC report (monthly, by counter)
    @Query("SELECT t.counter.name, COUNT(t), " +
           "SUM(CASE WHEN t.status = 'CLOSED_NON_SALE' THEN 1 ELSE 0 END) " +
           "FROM Token t WHERE MONTH(t.tokenDate) = :month AND YEAR(t.tokenDate) = :year " +
           "GROUP BY t.counter.name")
    List<Object[]> consolidatedNpcByCounter(@Param("month") int month, @Param("year") int year);

    // Top non-sale reasons
    @Query("SELECT t.nonSaleReason, COUNT(t) as cnt FROM Token t " +
           "WHERE t.status = 'CLOSED_NON_SALE' " +
           "AND MONTH(t.tokenDate) = :month AND YEAR(t.tokenDate) = :year " +
           "AND t.nonSaleReason IS NOT NULL " +
           "GROUP BY t.nonSaleReason ORDER BY cnt DESC")
    List<Object[]> topNonSaleReasons(@Param("month") int month, @Param("year") int year);

    // Top sales executives by NPC (most non-sales)
    @Query("SELECT u.fullName, COUNT(t) as cnt FROM Token t JOIN t.salesExecutive u " +
           "WHERE t.status = 'CLOSED_NON_SALE' " +
           "AND MONTH(t.tokenDate) = :month AND YEAR(t.tokenDate) = :year " +
           "GROUP BY u.fullName ORDER BY cnt DESC")
    List<Object[]> topSalesmenByNpc(@Param("month") int month, @Param("year") int year);

    // Staff monthly NPC report
    @Query("SELECT u.fullName, " +
           "SUM(CASE WHEN t.status = 'CLOSED_SALE' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN t.status = 'CLOSED_NON_SALE' THEN 1 ELSE 0 END), " +
           "COUNT(t) " +
           "FROM Token t JOIN t.salesExecutive u WHERE MONTH(t.tokenDate) = :month AND YEAR(t.tokenDate) = :year " +
           "GROUP BY u.fullName ORDER BY u.fullName")
    List<Object[]> staffNpcReport(@Param("month") int month, @Param("year") int year);

    // Customer visit counts (unique by phone number)
    @Query("SELECT t.customerPhone, MAX(t.customerName), COUNT(t) as visitCount " +
           "FROM Token t WHERE t.status = 'CLOSED_SALE' " +
           "AND t.customerPhone IS NOT NULL " +
           "AND t.tokenDate BETWEEN :from AND :to " +
           "GROUP BY t.customerPhone")
    List<Object[]> customerVisitCounts(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
