package com.datahook.oms.controller;

import com.datahook.oms.services.OrderService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/webhook")
@CrossOrigin("*")
public class WebhookController {

    private final Counter webhookCalls;
    private final Counter webhookErrors;
    private final Timer webhookTimer;

    @Autowired
    private OrderService orderService;

    public WebhookController(MeterRegistry registry) {
        this.webhookCalls = registry.counter("webhook.calls");
        this.webhookErrors = registry.counter("webhook.errors");
        this.webhookTimer = registry.timer("webhook.duration");
    }

    @PostMapping("/payment")
    public ResponseEntity<String> paymentWebhook(@RequestBody Map<String, Object> payload) {
        return webhookTimer.record(() -> {
            try {
                String orderId = payload.get("orderId").toString();
                String status = payload.get("status").toString();

                // Publishes to RabbitMQ — returns immediately
                orderService.updateStatus(orderId, status);
                webhookCalls.increment();

                return ResponseEntity.status(HttpStatus.ACCEPTED).body("Webhook queued");
            } catch (Exception e) {
                webhookErrors.increment();
                throw e;
            }
        });
    }
}
