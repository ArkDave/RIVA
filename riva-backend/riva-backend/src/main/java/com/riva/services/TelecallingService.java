package com.riva.services;

import com.riva.dto.request.TelecallingImportRequest;
import com.riva.exception.ResourceNotFoundException;
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
public class TelecallingService {

    private final TelecallingContactRepository contactRepository;
    private final UserRepository userRepository;

    // Statuses that keep the call ACTIVE (not ended)
    private static final Set<String> ACTIVE_STATUSES = Set.of("Call Busy", "Did not Pick");

    // ── Import Contacts ───────────────────────────────────────

    @Transactional
    public Map<String, Object> importContacts(Long telecallerId, TelecallingImportRequest req) {
        User telecaller = userRepository.findById(telecallerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", telecallerId));

        List<TelecallingContact> contacts = req.getContacts().stream().map(c ->
            TelecallingContact.builder()
                .telecaller(telecaller)
                .customerName(c.getCustomerName())
                .customerPhone(c.getCustomerPhone())
                .callActive(true)
                .dataProvidedDate(LocalDate.now())
                .build()
        ).collect(Collectors.toList());

        contactRepository.saveAll(contacts);
        return Map.of("message", "Imported " + contacts.size() + " contacts",
                      "count", contacts.size());
    }

    // ── Update Call Status ────────────────────────────────────

    @Transactional
    public Map<String, Object> updateStatus(Long contactId, String status) {
        TelecallingContact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", contactId));

        contact.setCallStatus(status);
        contact.setCallActive(ACTIVE_STATUSES.contains(status));
        contactRepository.save(contact);

        return Map.of("message", "Status updated",
                      "callActive", contact.isCallActive());
    }

    // ── Get All Contacts for Telecaller ───────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getContacts(Long telecallerId) {
        return contactRepository.findByTelecallerIdOrderByCreatedAtDesc(telecallerId)
                .stream().map(this::mapContact).collect(Collectors.toList());
    }

    // ── Day-End: Snapshot and Build Report ───────────────────

    @Transactional
    public Map<String, Object> dayEnd(Long telecallerId) {
        LocalDate today = LocalDate.now();

        // Mark all contacts with today's report date
        List<TelecallingContact> contacts =
                contactRepository.findByTelecallerIdOrderByCreatedAtDesc(telecallerId);
        contacts.forEach(c -> c.setReportDate(today));
        contactRepository.saveAll(contacts);

        return buildReport(telecallerId, today);
    }

    // ── Report for a Given Date ───────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getReport(Long telecallerId, LocalDate reportDate) {
        return buildReport(telecallerId, reportDate);
    }

    // ── Helpers ───────────────────────────────────────────────

    private Map<String, Object> buildReport(Long telecallerId, LocalDate date) {
        List<Object[]> rows = contactRepository.statusSummaryByDate(telecallerId, date);
        List<Map<String, Object>> statusRows = rows.stream().map(r ->
            Map.<String, Object>of(
                "reason", r[0] != null ? r[0] : "No Status",
                "totalResponses", ((Number) r[1]).longValue()
            )
        ).collect(Collectors.toList());

        long total = statusRows.stream()
                .mapToLong(r -> (long) r.get("totalResponses")).sum();

        return Map.of(
            "reportDate", date.toString(),
            "telecallerId", telecallerId,
            "statusSummary", statusRows,
            "totalCalls", total
        );
    }

    private Map<String, Object> mapContact(TelecallingContact c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("customerName", c.getCustomerName());
        m.put("customerPhone", c.getCustomerPhone());
        m.put("callStatus", c.getCallStatus());
        m.put("callActive", c.isCallActive());
        m.put("dataProvidedDate", c.getDataProvidedDate());
        return m;
    }
}
