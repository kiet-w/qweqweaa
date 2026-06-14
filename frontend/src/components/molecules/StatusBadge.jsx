'use client';

import React from 'react';
import { Badge } from '../atoms';

export const StatusBadge = ({
  status,
  type = 'delivery-order', // 'delivery-order' | 'delivery-batch' | 'transaction'
  className = '',
  ...props
}) => {
  const getLabel = () => {
    switch (status) {
      // Delivery Order
      case 'PENDING': return 'Chờ xử lý';
      case 'ASSIGNED': return 'Đã gán';
      case 'PICKED_UP': return 'Đã lấy hàng';
      case 'IN_TRANSIT': return 'Đang giao';
      case 'DELIVERED': return 'Đã giao';
      case 'FAILED': return 'Thất bại';
      case 'CANCELLED': return 'Đã hủy';

      // Delivery Batch
      case 'PLANNING': return 'Đang gom';
      case 'OPTIMIZED': return 'Đã tối ưu';
      case 'IN_PROGRESS': return 'Đang đi giao';
      case 'COMPLETED': return 'Hoàn thành';

      // Transaction
      case 'IMPORT': return 'Nhập kho';
      case 'EXPORT': return 'Xuất kho';
      case 'ADJUSTMENT': return 'Cân đối';
      case 'RETURN': return 'Trả hàng';

      default: return status;
    }
  };

  const getVariant = () => {
    switch (status) {
      // Order
      case 'PENDING': return 'pending';
      case 'ASSIGNED': return 'assigned';
      case 'PICKED_UP':
      case 'IN_TRANSIT': return 'transit';
      case 'DELIVERED': return 'delivered';
      case 'FAILED': return 'failed';
      case 'CANCELLED': return 'cancelled';

      // Batch
      case 'PLANNING': return 'planning';
      case 'OPTIMIZED': return 'optimized';
      case 'IN_PROGRESS': return 'progress';
      case 'COMPLETED': return 'completed';

      // Transaction
      case 'IMPORT': return 'import';
      case 'EXPORT': return 'export';
      case 'ADJUSTMENT': return 'adjustment';
      case 'RETURN': return 'return';

      default: return 'pending';
    }
  };

  return (
    <Badge
      variant={getVariant()}
      className={className}
      {...props}
    >
      {getLabel()}
    </Badge>
  );
};

export default StatusBadge;
