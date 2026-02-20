import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// In Docker: nginx proxies /ws to backend
// Locally: connect to backend directly at :8080
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

let stompClient = null;

/**
 * Connect to WebSocket with optional user-specific topic.
 * 
 * @param onOrderUpdate - callback for order updates
 * @param onConnected - callback on connection established
 * @param onDisconnected - callback on disconnection
 * @param userId - if provided, subscribes to /topic/orders.{userId} (client mode)
 *                 if null, subscribes to /topic/orders (admin mode — sees all)
 */
export const connectWebSocket = (onOrderUpdate, onConnected, onDisconnected, userId) => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('WebSocket Connected');
      if (onConnected) onConnected();

      // Subscribe to the appropriate topic
      const topic = userId ? `/topic/orders.${userId}` : '/topic/orders';
      console.log(`Subscribing to: ${topic}`);

      stompClient.subscribe(topic, (message) => {
        const order = JSON.parse(message.body);
        if (onOrderUpdate) onOrderUpdate(order);
      });
    },
    onDisconnect: () => {
      console.log('WebSocket Disconnected');
      if (onDisconnected) onDisconnected();
    },
    onStompError: (frame) => {
      console.error('STOMP Error:', frame.headers['message']);
      if (onDisconnected) onDisconnected();
    },
    onWebSocketClose: () => {
      console.log('WebSocket Closed');
      if (onDisconnected) onDisconnected();
    },
  });

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};
