import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// In Docker: nginx proxies /ws to backend
// Locally: connect to backend directly at :8080
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

let stompClient = null;

export const connectWebSocket = (onOrderUpdate, onConnected, onDisconnected) => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('WebSocket Connected');
      if (onConnected) onConnected();

      stompClient.subscribe('/topic/orders', (message) => {
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
