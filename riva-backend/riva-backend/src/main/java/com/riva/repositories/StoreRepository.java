package com.riva.repositories;

import com.riva.models.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    Optional<Store> findByCode(String code);
    Optional<Store> findBySchemaName(String schemaName);
    boolean existsByCode(String code);
    boolean existsBySchemaName(String schemaName);
}
