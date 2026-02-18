package com.datahook.oms.services;

import com.datahook.oms.constants.OrderStatus;
import com.datahook.oms.models.Order;
import com.datahook.oms.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

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

    private void notifyClients(Order order) {
        messagingTemplate.convertAndSend("/topic/orders", order);
        messagesSent.increment();
    }

    public Order createOrder(Order order){
        order.setId(orderIDCreation());
        order.setStatus(OrderStatus.CREATED);
        order.setCreatedTime(new Date());
        Order saved = orderRepository.save(order);
        ordersCreated.increment();
        notifyClients(saved);
        return saved;
    }

    public List<Order> getOrders() {
        return orderRepository.findAll();
    }

    public Order updateStatus(String id, OrderStatus status) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setStatus(status);
        Order updated = orderRepository.save(order);
        registry.counter(
                "orders.status.updates",
                "status", status.toString()
        ).increment();
        notifyClients(updated);
        return updated;
    }
}
