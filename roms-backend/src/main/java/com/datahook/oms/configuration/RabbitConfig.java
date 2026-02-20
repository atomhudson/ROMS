package com.datahook.oms.configuration;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String ORDER_EXCHANGE = "order.exchange";
    public static final String ORDER_CREATE_QUEUE = "order.create";
    public static final String ORDER_STATUS_QUEUE = "order.status.update";
    public static final String ORDER_NOTIFY_QUEUE = "order.notifications";
    public static final String ORDER_CREATE_KEY = "order.create";
    public static final String ORDER_STATUS_KEY = "order.status";
    public static final String ORDER_NOTIFY_KEY = "order.notify";

    @Bean
    public DirectExchange orderExchange() {
        return new DirectExchange(ORDER_EXCHANGE);
    }

    @Bean
    public Queue orderCreateQueue() {
        return QueueBuilder.durable(ORDER_CREATE_QUEUE).build();
    }

    @Bean
    public Queue orderStatusQueue() {
        return QueueBuilder.durable(ORDER_STATUS_QUEUE).build();
    }

    @Bean
    public Binding createBinding(Queue orderCreateQueue, DirectExchange orderExchange) {
        return BindingBuilder.bind(orderCreateQueue).to(orderExchange).with(ORDER_CREATE_KEY);
    }

    @Bean
    public Binding statusBinding(Queue orderStatusQueue, DirectExchange orderExchange) {
        return BindingBuilder.bind(orderStatusQueue).to(orderExchange).with(ORDER_STATUS_KEY);
    }

    @Bean
    public Queue orderNotifyQueue() {
        return QueueBuilder.durable(ORDER_NOTIFY_QUEUE).build();
    }

    @Bean
    public Binding notifyBinding(Queue orderNotifyQueue, DirectExchange orderExchange) {
        return BindingBuilder.bind(orderNotifyQueue).to(orderExchange).with(ORDER_NOTIFY_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
