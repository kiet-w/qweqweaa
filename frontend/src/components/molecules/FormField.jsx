'use client';

import React from 'react';
import { Input } from '../atoms';

export const FormField = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  className = '',
  style,
  ...props
}) => {
  return (
    <div className={`form-group ${className}`} style={style}>
      {label && <label className="form-label">{label}</label>}
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        {...props}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export default FormField;
