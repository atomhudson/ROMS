import axios from 'axios';

// In Docker: nginx proxies /orders, /webhook, /api to backend
// Locally: hit backend directly at :8080
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const createOrder = async (order) => {
  const response = await api.post('/orders', order);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.put(`/orders/${id}/status?status=${status}`);
  return response.data;
};

export const simulateWebhook = async (orderId, status) => {
  const response = await api.post('/webhook/payment', { orderId, status });
  return response.data;
};

export const fetchMetricsSummary = async () => {
  const response = await api.get('/api/metrics/summary');
  return response.data;
};

export default api;
