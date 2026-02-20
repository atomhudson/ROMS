package com.datahook.oms.controller;

import com.datahook.oms.models.Order;
import com.datahook.oms.security.AuthenticatedUser;
import com.datahook.oms.services.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/orders")
@CrossOrigin("*")
public class OrderController {

    @Autowired
    private OrderService service;

    @PostMapping
    public Order create(@RequestBody Order order, HttpServletRequest request) {
        AuthenticatedUser user = getUser(request);
        return service.createOrder(order, user.userId());
    }

    @GetMapping
    public List<Order> getAll(HttpServletRequest request) {
        AuthenticatedUser user = getUser(request);
        return service.getOrders(user.userId(), user.isAdmin());
    }

    @PutMapping("/{id}/status")
    public Order updateStatus(@PathVariable String id,
                              @RequestParam String status,
                              HttpServletRequest request) {
        AuthenticatedUser user = getUser(request);
        try {
            return service.updateStatus(id, status, user.userId(), user.isAdmin());
        } catch (AccessDeniedException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    private AuthenticatedUser getUser(HttpServletRequest request) {
        AuthenticatedUser user = (AuthenticatedUser) request.getAttribute("authenticatedUser");
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user;
    }
}
