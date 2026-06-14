import api from '../api';

export const getDashboardSummary = async () => {
  const response = await api.get('/admin/dashboard/summary');
  return response.data;
};

export const getTodayDashboardSummary = async () => {
  const response = await api.get('/admin/dashboard/today');
  return response.data;
};

export const getInventoryReport = async (warehouseId) => {
  const response = await api.get(`/admin/reports/inventory/${warehouseId}`);
  return response.data;
};

export const getShipperPerformanceReport = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await api.get(`/admin/reports/shippers?${params.toString()}`);
  return response.data;
};
