import api from '../api';

export const createBatch = async (batchData) => {
  const response = await api.post('/delivery-batches', batchData);
  return response.data;
};

export const getBatches = async (shipperId) => {
  const path = shipperId ? `/delivery-batches?shipperId=${shipperId}` : '/delivery-batches';
  const response = await api.get(path);
  return response.data;
};

export const getBatchById = async (id) => {
  const response = await api.get(`/delivery-batches/${id}`);
  return response.data;
};

export const optimizeBatch = async (id) => {
  const response = await api.patch(`/delivery-batches/${id}/optimize`);
  return response.data;
};

export const startBatch = async (id) => {
  const response = await api.patch(`/delivery-batches/${id}/start`);
  return response.data;
};

export const completeBatch = async (id) => {
  const response = await api.patch(`/delivery-batches/${id}/complete`);
  return response.data;
};
