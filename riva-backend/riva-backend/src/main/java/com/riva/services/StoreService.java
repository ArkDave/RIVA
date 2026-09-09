package com.riva.services;

import com.riva.dto.request.StoreCreateRequest;
import com.riva.dto.response.StoreResponse;
import com.riva.exception.BusinessException;
import com.riva.exception.ResourceNotFoundException;
import com.riva.models.Store;
import com.riva.repositories.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final DataSource dataSource;

    @Transactional
    public StoreResponse createStore(StoreCreateRequest request) {
        String storeCode = request.getCode().trim().toUpperCase();
        String schemaName = "store_" + storeCode.toLowerCase().replaceAll("[^a-z0-9]", "_");

        if (storeRepository.existsByCode(storeCode)) {
            throw new BusinessException("Store code already exists: " + storeCode);
        }
        if (storeRepository.existsBySchemaName(schemaName)) {
            throw new BusinessException("Schema name already exists: " + schemaName);
        }

        // Provision schema in PostgreSQL
        provisionSchema(schemaName);

        Store store = Store.builder()
                .code(storeCode)
                .name(request.getName().trim())
                .schemaName(schemaName)
                .address(request.getAddress())
                .phone(request.getPhone())
                .active(true)
                .build();

        store = storeRepository.save(store);
        log.info("Successfully created and provisioned store: {} with schema {}", storeCode, schemaName);

        return mapToResponse(store);
    }

    public List<StoreResponse> getAllStores() {
        return storeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public StoreResponse getStoreByCode(String code) {
        Store store = storeRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with code: " + code));
        return mapToResponse(store);
    }

    @Transactional
    public StoreResponse toggleStoreStatus(Long id, boolean active) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + id));
        store.setActive(active);
        store = storeRepository.save(store);
        return mapToResponse(store);
    }

    private void provisionSchema(String schemaName) {
        try (Connection connection = dataSource.getConnection()) {
            // 1. Create Schema
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);
                statement.execute("SET search_path TO " + schemaName + ", public");
            }

            // 2. Run Store Schema DDL script inside the new schema
            ClassPathResource scriptResource = new ClassPathResource("db/store-schema.sql");
            ScriptUtils.executeSqlScript(connection, scriptResource);

            // 3. Reset search path back to public
            try (Statement statement = connection.createStatement()) {
                statement.execute("SET search_path TO public");
            }
        } catch (SQLException e) {
            log.error("Failed to provision database schema: {}", schemaName, e);
            throw new BusinessException("Failed to provision store database schema: " + e.getMessage());
        }
    }

    private StoreResponse mapToResponse(Store store) {
        return StoreResponse.builder()
                .id(store.getId())
                .code(store.getCode())
                .name(store.getName())
                .schemaName(store.getSchemaName())
                .address(store.getAddress())
                .phone(store.getPhone())
                .active(store.isActive())
                .createdAt(store.getCreatedAt())
                .build();
    }
}
