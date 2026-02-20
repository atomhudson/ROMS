package com.datahook.oms.repository;

import com.datahook.oms.models.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    List<Order> findByUserId(String userId);

    Page<Order> findByUserId(String userId, Pageable pageable);

    long count();

    long countByStatus(String status);

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countGroupByStatus();
}

