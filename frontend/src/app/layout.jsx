'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import '../index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <title>Logistics Hub - Dashboard</title>
        <meta name="description" content="Hệ thống Quản lý và Điều phối Giao hàng" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
