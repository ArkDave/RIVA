package com.riva.repositories;

import com.riva.models.Counter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CounterRepository extends JpaRepository<Counter, Long> {
    List<Counter> findByActiveTrue();
    Optional<Counter> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
