import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 15000,
});

// Orders
export const ordersAPI = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  getTAT: (id) => api.get(`/orders/${id}/tat-prediction`),
};

// Dashboard
export const dashboardAPI = {
  summary: () => api.get('/dashboard/summary'),
  activeOrders: (params) => api.get('/dashboard/active-orders', { params }),
  byStatus: () => api.get('/dashboard/orders-by-status'),
  byLensType: () => api.get('/dashboard/orders-by-lens-type'),
  byStore: () => api.get('/dashboard/orders-by-store'),
  slaPerformance: (days) => api.get('/dashboard/sla-performance', { params: { days } }),
};

// Inventory
export const inventoryAPI = {
  list: (params) => api.get('/inventory', { params }),
  check: (data) => api.post('/inventory/check', data),
  updateStock: (sku, quantity) => api.patch(`/inventory/${sku}/stock`, { quantity }),
  recommendations: () => api.get('/inventory/recommendations'),
};

// Alerts
export const alertsAPI = {
  list: (params) => api.get('/alerts', { params }),
  acknowledge: (id, acknowledgedBy) => api.patch(`/alerts/${id}/acknowledge`, { acknowledged_by: acknowledgedBy }),
  explainRisk: (orderId) => api.get(`/alerts/explain/${orderId}`),
};

export default api;
