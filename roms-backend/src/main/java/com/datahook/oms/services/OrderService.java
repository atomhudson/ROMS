package com.datahook.oms.services;

import com.datahook.oms.models.Order;
import com.datahook.oms.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

import java.nio.file.AccessDeniedException;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final Counter ordersCreated;
    private final Counter messagesSent;
    private final MeterRegistry registry;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public OrderService(MeterRegistry registry) {
        this.registry = registry;
        this.ordersCreated = registry.counter("orders.created");
        this.messagesSent = registry.counter("ws.messages.sent");
    }

    private String orderIDCreation() {
        return "ORD" +
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 8)
                        .toUpperCase();
    }

    /**
     * Dual notification: admin broadcast + user-specific.
     */
    private void notifyClients(Order order) {
        // Admin broadcast — admin sees ALL orders
        messagingTemplate.convertAndSend("/topic/orders", order);

        // User-specific — only the order's owner gets this
        if (order.getUserId() != null && !order.getUserId().isEmpty()) {
            messagingTemplate.convertAndSend(
                    "/topic/orders." + order.getUserId(), order
            );
        }
        messagesSent.increment();
    }

    /**
     * Create an order, linked to the authenticated user.
     */
    public Order createOrder(Order order, String userId) {
        order.setId(orderIDCreation());
        order.setStatus("CREATED");
        order.setCreatedTime(new Date());
        order.setUserId(userId);
        Order saved = orderRepository.save(order);
        ordersCreated.increment();
        notifyClients(saved);
        return saved;
    }

    /**
     * Get orders — ADMIN sees all, CLIENT sees only their own.
     */
    public List<Order> getOrders(String userId, boolean isAdmin) {
        if (isAdmin) {
            return orderRepository.findAll();
        }
        return orderRepository.findByUserId(userId);
    }

    /**
     * Get all orders (for admin/webhook use).
     */
    public List<Order> getOrders() {
        return orderRepository.findAll();
    }

    /**
     * Update order status with ownership enforcement.
     * - ADMIN can update any order
     * - CLIENT can only update their own orders
     */
    public Order updateStatus(String id, String status, String userId, boolean isAdmin)
            throws AccessDeniedException {
        Order order = orderRepository.findById(id).orElseThrow();

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new AccessDeniedException("Not authorized to update this order");
        }

        order.setStatus(status);
        Order updated = orderRepository.save(order);
        registry.counter(
                "orders.status.updates",
                "status", status
        ).increment();
        notifyClients(updated);
        return updated;
    }

    /**
     * Update status without auth check (for webhook/system use).
     */
    public Order updateStatus(String id, String status) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setStatus(status);
        Order updated = orderRepository.save(order);
        registry.counter(
                "orders.status.updates",
                "status", status
        ).increment();
        notifyClients(updated);
        return updated;
    }
}
