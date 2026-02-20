package com.datahook.oms.events;

import com.datahook.oms.models.Order;
import java.io.Serializable;

/**
 * Message DTO sent through RabbitMQ.
 * Carries either a new order (CREATE) or a status update.
 */
public class OrderMessage implements Serializable {

    public enum Type { CREATE, STATUS_UPDATE }

    private Type type;
    private Order order;          // full order object (for CREATE)
    private String orderId;       // for STATUS_UPDATE
    private String newStatus;     // for STATUS_UPDATE
    private String userId;        // who triggered it
    private boolean isAdmin;      // auth context

    public OrderMessage() {}

    /** Factory: create-order message */
    public static OrderMessage createOrder(Order order) {
        OrderMessage msg = new OrderMessage();
        msg.type = Type.CREATE;
        msg.order = order;
        return msg;
    }

    /** Factory: status-update message */
    public static OrderMessage statusUpdate(String orderId, String newStatus, String userId, boolean isAdmin) {
        OrderMessage msg = new OrderMessage();
        msg.type = Type.STATUS_UPDATE;
        msg.orderId = orderId;
        msg.newStatus = newStatus;
        msg.userId = userId;
        msg.isAdmin = isAdmin;
        return msg;
    }

    /** Factory: webhook status-update (no auth check) */
    public static OrderMessage webhookUpdate(String orderId, String newStatus) {
        OrderMessage msg = new OrderMessage();
        msg.type = Type.STATUS_UPDATE;
        msg.orderId = orderId;
        msg.newStatus = newStatus;
        msg.isAdmin = true; // webhook bypasses ownership
        return msg;
    }

    // ──── Getters & Setters ────

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public boolean isAdmin() { return isAdmin; }
    public void setAdmin(boolean admin) { isAdmin = admin; }
}
