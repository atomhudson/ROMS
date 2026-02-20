package com.datahook.oms.services;

import com.datahook.oms.configuration.RabbitConfig;
import com.datahook.oms.events.OrderMessage;
import com.datahook.oms.models.Order;
import com.datahook.oms.repository.OrderRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    // ──── Write operations: publish to RabbitMQ (async) ────

    /**
     * Publish order creation to RabbitMQ. Returns immediately with the order
     * (ID + status pre-assigned). Actual DB write happens in OrderConsumer.
     */
    public Order createOrder(Order order, String userId) {
        order.setId(generateOrderId());
        order.setStatus("CREATED");
        order.setCreatedTime(new Date());
        order.setUserId(userId);

        OrderMessage msg = OrderMessage.createOrder(order);
        rabbitTemplate.convertAndSend(
                RabbitConfig.ORDER_EXCHANGE,
                RabbitConfig.ORDER_CREATE_KEY,
                msg
        );
        return order; // return immediately with pre-assigned ID
    }

    /**
     * Publish status update to RabbitMQ (with auth context).
     */
    public void updateStatus(String orderId, String status, String userId, boolean isAdmin) {
        OrderMessage msg = OrderMessage.statusUpdate(orderId, status, userId, isAdmin);
        rabbitTemplate.convertAndSend(
                RabbitConfig.ORDER_EXCHANGE,
                RabbitConfig.ORDER_STATUS_KEY,
                msg
        );
    }

    /**
     * Publish status update from webhook (no auth check).
     */
    public void updateStatus(String orderId, String status) {
        OrderMessage msg = OrderMessage.webhookUpdate(orderId, status);
        rabbitTemplate.convertAndSend(
                RabbitConfig.ORDER_EXCHANGE,
                RabbitConfig.ORDER_STATUS_KEY,
                msg
        );
    }

    // ──── Read operations: direct DB (synchronous, read-only) ────

    @Transactional(readOnly = true)
    public List<Order> getOrders(String userId, boolean isAdmin) {
        if (isAdmin) {
            return orderRepository.findAll();
        }
        return orderRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Page<Order> getOrders(String userId, boolean isAdmin, Pageable pageable) {
        if (isAdmin) {
            return orderRepository.findAll(pageable);
        }
        return orderRepository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public long countAll() {
        return orderRepository.count();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByStatusGroup() {
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : orderRepository.countGroupByStatus()) {
            result.put((String) row[0], (Long) row[1]);
        }
        return result;
    }

    // ──── Utility ────

    private String generateOrderId() {
        return "ORD" +
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 8)
                        .toUpperCase();
    }
}
