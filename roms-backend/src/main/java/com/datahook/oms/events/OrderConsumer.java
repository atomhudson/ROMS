package com.datahook.oms.events;

import com.datahook.oms.configuration.RabbitConfig;
import com.datahook.oms.models.Order;
import com.datahook.oms.repository.OrderRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;

/**
 * Async consumer: picks messages from RabbitMQ queues,
 * persists to DB, then publishes a notification to the NOTIFY queue
 * (which the API service picks up to broadcast via WebSocket).
 */
@Component
@ConditionalOnProperty(name = "oms.consumer.enabled", havingValue = "true", matchIfMissing = true)
public class OrderConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderConsumer.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    private final Counter ordersCreated;
    private final MeterRegistry registry;

    public OrderConsumer(MeterRegistry registry) {
        this.registry = registry;
        this.ordersCreated = registry.counter("orders.created");
    }

    @RabbitListener(queues = RabbitConfig.ORDER_CREATE_QUEUE)
    @Transactional
    public void handleCreateOrder(OrderMessage message) {
        try {
            Order order = message.getOrder();
            if (order.getId() == null || order.getId().isEmpty()) {
                order.setId(generateOrderId());
            }
            if (order.getCreatedTime() == null) {
                order.setCreatedTime(new Date());
            }
            if (order.getStatus() == null || order.getStatus().isEmpty()) {
                order.setStatus("CREATED");
            }

            Order saved = orderRepository.save(order);
            ordersCreated.increment();

            // Publish notification so API broadcasts via WebSocket
            rabbitTemplate.convertAndSend(
                    RabbitConfig.ORDER_EXCHANGE,
                    RabbitConfig.ORDER_NOTIFY_KEY,
                    saved
            );

            log.debug("Order created: {}", saved.getId());
        } catch (Exception e) {
            log.error("Failed to process order creation: {}", e.getMessage(), e);
            throw e;
        }
    }

    @RabbitListener(queues = RabbitConfig.ORDER_STATUS_QUEUE)
    @Transactional
    public void handleStatusUpdate(OrderMessage message) {
        try {
            Order order = orderRepository.findById(message.getOrderId()).orElse(null);
            if (order == null) {
                log.warn("Order not found: {}", message.getOrderId());
                return;
            }

            if (!message.isAdmin() && !order.getUserId().equals(message.getUserId())) {
                log.warn("Unauthorized update: {} by {}", message.getOrderId(), message.getUserId());
                return;
            }

            order.setStatus(message.getNewStatus());
            Order updated = orderRepository.save(order);
            registry.counter("orders.status.updates", "status", message.getNewStatus()).increment();

            // Publish notification so API broadcasts via WebSocket
            rabbitTemplate.convertAndSend(
                    RabbitConfig.ORDER_EXCHANGE,
                    RabbitConfig.ORDER_NOTIFY_KEY,
                    updated
            );

            log.debug("Order {} → {}", updated.getId(), message.getNewStatus());
        } catch (Exception e) {
            log.error("Failed to process status update: {}", e.getMessage(), e);
            throw e;
        }
    }

    private String generateOrderId() {
        return "ORD" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}
