'use client';

import React from 'react';

export const Input = ({
  type = 'text',
  className = '',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  style,
  ...props
}) => {
  return (
    <input
      type={type}
      className={`form-input ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      style={style}
      {...props}
    />
  );
};

export default Input;
