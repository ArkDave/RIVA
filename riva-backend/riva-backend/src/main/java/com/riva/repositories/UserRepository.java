package com.riva.repositories;

import com.riva.enums.UserRole;
import com.riva.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.active = true ORDER BY u.fullName ASC")
    List<User> findByActiveTrueOrderByFullNameAsc();

    List<User> findByRoleAndActiveTrue(UserRole role);

    List<User> findByCounterIdAndActiveTrue(Long counterId);

    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.active = true AND u.role IN " +
           "('SALES_EXECUTIVE', 'FLOOR_INCHARGE') ORDER BY u.fullName")
    List<User> findAllSalesStaff();
}
