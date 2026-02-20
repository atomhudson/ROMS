import axios from 'axios';

// In Docker: REACT_APP_API_BASE="" (empty) → relative URLs → nginx proxies to backend
// Locally: REACT_APP_API_BASE is undefined → falls back to localhost:8080
const API_BASE = process.env.REACT_APP_API_BASE ?? 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('oms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('oms_token');
      localStorage.removeItem('oms_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const fetchOrders = async ({ page = 0, size = 20, sort = 'createdTime,desc' } = {}) => {
  const response = await api.get('/orders', { params: { page, size, sort } });
  return response.data; // { content, page, size, totalElements, totalPages }
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

export const fetchOrderStats = async () => {
  const response = await api.get('/orders/stats');
  return response.data; // { total, statusCounts: { CREATED: N, PROCESSING: N, ... } }
};

export const fetchMetricsSummary = async () => {
  const response = await api.get('/api/metrics/summary');
  return response.data;
};

export const fetchPipeline = async () => {
  const response = await api.get('/api/config/pipeline');
  return response.data;
};

export default api;
