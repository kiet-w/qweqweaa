'use client';

import React from 'react';
import { Input } from '../atoms';

export const SearchBar = ({
  placeholder = 'Tìm kiếm...',
  value,
  onChange,
  disabled = false,
  className = '',
  style,
  ...props
}) => {
  return (
    <div className={`flex align-center w-full ${className}`} style={{ position: 'relative', ...style }}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{ paddingLeft: 'var(--space-md)' }}
        {...props}
      />
    </div>
  );
};

export default SearchBar;
