package com.riva.repositories;

import com.riva.enums.OrderStatus;
import com.riva.models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByStatusOrderByDeliveryDateAsc(OrderStatus status);

    List<Order> findByStatusIn(List<OrderStatus> statuses);

    // Orders due soon (delivery overdue or within N days)
    @Query("SELECT o FROM Order o WHERE o.status NOT IN ('DELIVERED') " +
           "AND o.deliveryDate <= :dueDate ORDER BY o.deliveryDate ASC")
    List<Order> findOverdueOrDueSoon(@Param("dueDate") LocalDate dueDate);

    // Report summary by status with grams
    @Query("SELECT o.status, COUNT(o), COALESCE(SUM(o.gramage), 0) " +
           "FROM Order o GROUP BY o.status")
    List<Object[]> orderSummaryByStatus();

    // Orders by sales executive
    List<Order> findBySalesExecutiveIdOrderByCreatedAtDesc(Long salesExecId);
}
