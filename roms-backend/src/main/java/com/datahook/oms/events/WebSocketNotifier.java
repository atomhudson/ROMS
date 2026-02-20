package com.datahook.oms.events;

import com.datahook.oms.configuration.RabbitConfig;
import com.datahook.oms.models.Order;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs ONLY on the API service (which has WebSocket infrastructure).
 * Listens for notification messages from the consumer and broadcasts
 * them to WebSocket clients.
 */
@Component
@ConditionalOnProperty(name = "oms.notifier.enabled", havingValue = "true", matchIfMissing = true)
public class WebSocketNotifier {

    private static final Logger log = LoggerFactory.getLogger(WebSocketNotifier.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final Counter messagesSent;

    public WebSocketNotifier(MeterRegistry registry) {
        this.messagesSent = registry.counter("ws.messages.sent");
    }

    @RabbitListener(queues = RabbitConfig.ORDER_NOTIFY_QUEUE)
    public void onOrderNotification(Order order) {
        // Admin broadcast
        messagingTemplate.convertAndSend("/topic/orders", order);

        // User-specific
        if (order.getUserId() != null && !order.getUserId().isEmpty()) {
            messagingTemplate.convertAndSend("/topic/orders." + order.getUserId(), order);
        }

        messagesSent.increment();
        log.debug("WS broadcast: {}", order.getId());
    }
}
