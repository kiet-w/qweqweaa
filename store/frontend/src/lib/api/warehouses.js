import api from '../api';

export const getWarehouses = async () => {
  const response = await api.get('/warehouses');
  return response.data;
};

export const getWarehouseById = async (id) => {
  const response = await api.get(`/warehouses/${id}`);
  return response.data;
};

export const createWarehouse = async (warehouseData) => {
  const response = await api.post('/warehouses', warehouseData);
  return response.data;
};

export const updateWarehouse = async (id, warehouseData) => {
  const response = await api.patch(`/warehouses/${id}`, warehouseData);
  return response.data;
};

export const deleteWarehouse = async (id) => {
  const response = await api.delete(`/warehouses/${id}`);
  return response.data;
};
