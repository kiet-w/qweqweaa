'use client';

import React from 'react';

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendType = 'success',
  interactive = false,
  onClick,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`card ${interactive ? 'card-interactive' : ''} ${className}`}
      onClick={interactive ? onClick : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: interactive ? 'pointer' : 'default',
        ...style
      }}
      {...props}
    >
      <div className="flex align-center justify-between mb-sm">
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          {title}
        </span>
        {icon && (
          <span style={{ fontSize: 'var(--text-xl)', color: 'var(--accent-primary)' }}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex align-end justify-between">
        <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-${trendType}`}
            style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
