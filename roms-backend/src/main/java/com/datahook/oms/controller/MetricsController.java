package com.datahook.oms.controller;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin("*")
public class MetricsController {

    private final MeterRegistry registry;

    public MetricsController(MeterRegistry registry) {
        this.registry = registry;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> response = new HashMap<>();

        // Active WebSocket connections
        Gauge wsGauge = registry.find("ws.connections.active").gauge();
        int activeWs = wsGauge != null ? (int) wsGauge.value() : 0;

        // Total webhook calls
        Counter whCounter = registry.find("webhook.calls").counter();
        int totalWebhooks = whCounter != null ? (int) whCounter.count() : 0;

        // Webhook errors
        Counter whErrors = registry.find("webhook.errors").counter();
        int totalWebhookErrors = whErrors != null ? (int) whErrors.count() : 0;

        // Total WS connections established
        Counter wsTotal = registry.find("ws.connections.established").counter();
        int totalWsConnections = wsTotal != null ? (int) wsTotal.count() : 0;

        // Total orders created
        Counter ordersCreated = registry.find("orders.created").counter();
        int totalOrdersCreated = ordersCreated != null ? (int) ordersCreated.count() : 0;

        // Orders by status breakdown
        Map<String, Double> ordersByStatus = new HashMap<>();
        registry.find("orders.status.updates")
                .counters()
                .forEach(counter -> {
                    String status = counter.getId().getTag("status");
                    ordersByStatus.put(status, counter.count());
                });

        response.put("activeWebSocketConnections", activeWs);
        response.put("totalWebSocketConnections", totalWsConnections);
        response.put("totalWebhookCalls", totalWebhooks);
        response.put("totalWebhookErrors", totalWebhookErrors);
        response.put("totalOrdersCreated", totalOrdersCreated);
        response.put("ordersByStatus", ordersByStatus);

        return response;
    }
}
