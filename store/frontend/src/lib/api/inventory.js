import api from '../api';

export const importStock = async (dto) => {
  const response = await api.post('/inventory/import', dto);
  return response.data;
};

export const adjustStock = async (dto) => {
  const response = await api.post('/inventory/adjust', dto);
  return response.data;
};

export const getStockByWarehouse = async (warehouseId) => {
  const response = await api.get(`/inventory/warehouse/${warehouseId}`);
  return response.data;
};

export const getStockByProduct = async (productId) => {
  const response = await api.get(`/inventory/product/${productId}`);
  return response.data;
};

export const getTransactions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);
  if (filters.productId) params.append('productId', filters.productId);
  if (filters.type) params.append('type', filters.type);
  if (filters.take) params.append('take', filters.take);
  if (filters.skip) params.append('skip', filters.skip);

  const response = await api.get(`/inventory/transactions?${params.toString()}`);
  return response.data;
};
