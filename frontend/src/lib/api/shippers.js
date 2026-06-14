import api from '../api';

export const getShippers = async () => {
  const response = await api.get('/shippers');
  return response.data;
};

export const getAvailableShippers = async () => {
  const response = await api.get('/shippers/available');
  return response.data;
};

export const getShipperById = async (id) => {
  const response = await api.get(`/shippers/${id}`);
  return response.data;
};

export const createShipper = async (shipperData) => {
  const response = await api.post('/shippers', shipperData);
  return response.data;
};

export const updateShipper = async (id, shipperData) => {
  const response = await api.patch(`/shippers/${id}`, shipperData);
  return response.data;
};
