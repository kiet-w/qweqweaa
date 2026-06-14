import api from '../api';

export const createOrder = async (orderData) => {
  const response = await api.post('/delivery-orders', orderData);
  return response.data;
};

export const getOrders = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.shipperId) params.append('shipperId', filters.shipperId);
  if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);

  const response = await api.get(`/delivery-orders?${params.toString()}`);
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/delivery-orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/delivery-orders/${id}/status`, { status });
  return response.data;
};

export const assignShipper = async (id, shipperId) => {
  const response = await api.patch(`/delivery-orders/${id}/assign/${shipperId}`);
  return response.data;
};
