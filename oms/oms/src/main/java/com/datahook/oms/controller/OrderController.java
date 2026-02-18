package com.datahook.oms.controller;

import com.datahook.oms.constants.OrderStatus;
import com.datahook.oms.models.Order;
import com.datahook.oms.services.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@CrossOrigin("*")
public class OrderController {

    @Autowired
    private OrderService service;

    @PostMapping
    public Order create(@RequestBody Order order){
        return service.createOrder(order);
    }

    @GetMapping
    public List<Order> getAll(){
        return service.getOrders();
    }

    @PutMapping("/{id}/status")
    public Order updateStatus(@PathVariable String id, @RequestParam OrderStatus status){
        return service.updateStatus(id,status);
    }
}
