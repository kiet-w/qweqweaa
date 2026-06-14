'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const RoleGate = ({ children, roles, fallback = null }) => {
  const { hasRole } = useAuth();
  return hasRole(roles) ? children : fallback;
};

export default RoleGate;
