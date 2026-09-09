package com.riva.repositories;

import com.riva.enums.MetalType;
import com.riva.models.TicketSizeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TicketSizeConfigRepository extends JpaRepository<TicketSizeConfig, Long> {
    Optional<TicketSizeConfig> findByMetalType(MetalType metalType);
}
