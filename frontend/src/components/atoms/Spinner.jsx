'use client';

import React from 'react';

export const Spinner = ({ className = '', style, ...props }) => {
  return (
    <div
      className={`loader ${className}`}
      style={style}
      {...props}
    />
  );
};

export default Spinner;
