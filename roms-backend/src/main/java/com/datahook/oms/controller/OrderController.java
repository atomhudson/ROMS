package com.datahook.oms.controller;

import com.datahook.oms.models.Order;
import com.datahook.oms.security.AuthenticatedUser;
import com.datahook.oms.services.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@CrossOrigin("*")
public class OrderController {

    @Autowired
    private OrderService service;

    /**
     * Create order → publishes to RabbitMQ → returns 202 Accepted immediately.
     */
    @PostMapping
    public ResponseEntity<Order> create(@RequestBody Order order, HttpServletRequest request) {
        AuthenticatedUser user = getUser(request);
        Order queued = service.createOrder(order, user.userId());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(queued);
    }

    /**
     * Get paginated orders (synchronous DB read — fast with indexes).
     */
    @GetMapping
    public Map<String, Object> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdTime,desc") String sort,
            HttpServletRequest request) {

        AuthenticatedUser user = getUser(request);

        String[] sortParts = sort.split(",");
        Sort sortObj = sortParts.length > 1
                ? Sort.by(Sort.Direction.fromString(sortParts[1]), sortParts[0])
                : Sort.by(Sort.Direction.DESC, sortParts[0]);

        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<Order> orderPage = service.getOrders(user.userId(), user.isAdmin(), pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", orderPage.getContent());
        response.put("page", orderPage.getNumber());
        response.put("size", orderPage.getSize());
        response.put("totalElements", orderPage.getTotalElements());
        response.put("totalPages", orderPage.getTotalPages());
        return response;
    }

    /**
     * Get order count stats (synchronous read).
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats(HttpServletRequest request) {
        getUser(request);
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", service.countAll());
        stats.put("statusCounts", service.countByStatusGroup());
        return stats;
    }

    /**
     * Update order status → publishes to RabbitMQ → returns 202 Accepted.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> updateStatus(
            @PathVariable String id,
            @RequestParam String status,
            HttpServletRequest request) {
        AuthenticatedUser user = getUser(request);
        service.updateStatus(id, status, user.userId(), user.isAdmin());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Status update queued");
        response.put("orderId", id);
        response.put("status", status);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    private AuthenticatedUser getUser(HttpServletRequest request) {
        AuthenticatedUser user = (AuthenticatedUser) request.getAttribute("authenticatedUser");
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user;
    }
}
