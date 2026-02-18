package com.datahook.oms.configuration;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;
import org.springframework.web.socket.handler.WebSocketHandlerDecoratorFactory;

import java.util.concurrent.atomic.AtomicInteger;

@Configuration
public class WebSocketMetrics implements WebSocketHandlerDecoratorFactory {

    private final AtomicInteger activeConnections = new AtomicInteger(0);
    private final Counter totalConnections;
    private final Counter messagesReceived;

    public WebSocketMetrics(MeterRegistry registry) {
        this.totalConnections = registry.counter("ws.connections.established");
        this.messagesReceived = registry.counter("ws.messages.received");
        Gauge.builder("ws.connections.active", activeConnections, AtomicInteger::get)
                .register(registry);
    }

    @Override
    public WebSocketHandler decorate(WebSocketHandler handler) {
        return new WebSocketHandlerDecorator(handler) {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                activeConnections.incrementAndGet();
                totalConnections.increment();
                super.afterConnectionEstablished(session);
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
                activeConnections.decrementAndGet();
                super.afterConnectionClosed(session, closeStatus);
            }

            @Override
            public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
                messagesReceived.increment();
                super.handleMessage(session, message);
            }
        };
    }
}
