import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import WarehousesPage from './pages/WarehousesPage';
import WarehouseStockPage from './pages/WarehouseStockPage';
import TransactionLogPage from './pages/TransactionLogPage';
import ShippersPage from './pages/ShippersPage';
import DeliveryOrdersPage from './pages/DeliveryOrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import DeliveryBatchesPage from './pages/DeliveryBatchesPage';
import BatchDetailPage from './pages/BatchDetailPage';
import InventoryReportPage from './pages/InventoryReportPage';
import ShipperPerformancePage from './pages/ShipperPerformancePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Main Layout routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                
                {/* Admin/Warehouse Manager routes */}
                <Route
                  path="products"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <ProductsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="warehouses"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <WarehousesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="warehouses/:id/stock"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <WarehouseStockPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="inventory/transactions"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <TransactionLogPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="shippers"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <ShippersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Common routes (Any authenticated role) */}
                <Route path="delivery-orders" element={<DeliveryOrdersPage />} />
                <Route
                  path="delivery-orders/new"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <CreateOrderPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="delivery-orders/:id" element={<OrderDetailPage />} />

                <Route path="delivery-batches" element={<DeliveryBatchesPage />} />
                <Route path="delivery-batches/:id" element={<BatchDetailPage />} />

                {/* Admin/Manager Reports */}
                <Route
                  path="reports/inventory"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <InventoryReportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports/shippers"
                  element={
                    <ProtectedRoute roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <ShipperPerformancePage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
