package com.datahook.oms.models;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_user_id", columnList = "userId"),
    @Index(name = "idx_orders_status", columnList = "status"),
    @Index(name = "idx_orders_created_time", columnList = "createdTime")
})
public class Order {
    @Id
    String id;

    String productName;
    String status;
    double price;
    Date createdTime;

    @Column(nullable = false)
    String userId;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public Date getCreatedTime() {
        return createdTime;
    }

    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
