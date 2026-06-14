'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from './atoms';

export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login
        router.push(`/login?from=${encodeURIComponent(pathname)}`);
      } else if (roles && !roles.includes(user.role)) {
        // Redirect to home if user doesn't have required role
        router.push('/');
      }
    }
  }, [user, loading, roles, router, pathname]);

  if (loading || !user || (roles && !roles.includes(user.role))) {
    return (
      <div className="flex h-full w-full align-center justify-center p-lg" style={{ minHeight: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
