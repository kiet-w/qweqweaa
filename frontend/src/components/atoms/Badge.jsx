'use client';

import React from 'react';

export const Badge = ({
  children,
  variant = 'pending',
  className = '',
  style,
  ...props
}) => {
  return (
    <span
      className={`badge badge-${variant.toLowerCase()} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
