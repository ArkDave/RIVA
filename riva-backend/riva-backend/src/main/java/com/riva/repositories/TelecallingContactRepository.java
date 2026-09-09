package com.riva.repositories;

import com.riva.models.TelecallingContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TelecallingContactRepository extends JpaRepository<TelecallingContact, Long> {

    List<TelecallingContact> findByTelecallerIdOrderByCreatedAtDesc(Long telecallerId);

    List<TelecallingContact> findByTelecallerIdAndReportDate(Long telecallerId, LocalDate reportDate);

    // Contacts still active (not ended) for a telecaller
    List<TelecallingContact> findByTelecallerIdAndCallActiveTrue(Long telecallerId);

    // Report: group by call_status for a given date
    @Query("SELECT tc.callStatus, COUNT(tc) FROM TelecallingContact tc " +
           "WHERE tc.telecaller.id = :telecallerId AND tc.reportDate = :reportDate " +
           "GROUP BY tc.callStatus")
    List<Object[]> statusSummaryByDate(@Param("telecallerId") Long telecallerId,
                                        @Param("reportDate") LocalDate reportDate);

    // All contacts for a report date across all telecallers (admin view)
    @Query("SELECT tc.callStatus, COUNT(tc) FROM TelecallingContact tc " +
           "WHERE tc.reportDate = :reportDate GROUP BY tc.callStatus")
    List<Object[]> allStatusSummaryByDate(@Param("reportDate") LocalDate reportDate);
}
