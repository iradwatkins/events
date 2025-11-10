// components/tables/Seat.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SeatProps {
  cx: number;
  cy: number;
  radius: number;
  number: number;
  status: 'available' | 'selected' | 'sold';
  type: 'regular' | 'vip';
  onClick: () => void;
  isInteractive: boolean;
}

export const Seat: React.FC<SeatProps> = ({
  cx,
  cy,
  radius,
  number,
  status,
  type,
  onClick,
  isInteractive
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Color mapping
  const getColors = () => {
    switch (status) {
      case 'available':
        return {
          fill: isHovered ? '#66BB6A' : '#4CAF50',
          stroke: isHovered ? '#667eea' : '#2c3e50',
          strokeWidth: isHovered ? 3 : 2,
          cursor: 'pointer'
        };
      case 'selected':
        return {
          fill: '#FFC107',
          stroke: '#2c3e50',
          strokeWidth: 3,
          cursor: 'pointer'
        };
      case 'sold':
        return {
          fill: '#999',
          stroke: '#666',
          strokeWidth: 2,
          cursor: 'not-allowed',
          opacity: 0.5
        };
      default:
        return {
          fill: '#4CAF50',
          stroke: '#2c3e50',
          strokeWidth: 2,
          cursor: 'pointer'
        };
    }
  };

  const colors = getColors();
  
  // VIP seats get gold outline
  const strokeColor = type === 'vip' && status === 'available' ? '#B8860B' : colors.stroke;

  return (
    <g
      onMouseEnter={() => isInteractive && status !== 'sold' && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{ cursor: isInteractive ? colors.cursor : 'default' }}
    >
      {/* VIP glow effect */}
      {type === 'vip' && status === 'available' && (
        <circle
          cx={cx}
          cy={cy}
          r={radius + 2}
          fill="#FFD700"
          opacity="0.3"
        />
      )}

      {/* Seat circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={colors.fill}
        stroke={strokeColor}
        strokeWidth={colors.strokeWidth}
        opacity={colors.opacity || 1}
        style={{
          transition: 'all 0.3s ease',
          filter: status === 'selected' ? 'drop-shadow(0 2px 4px rgba(255, 193, 7, 0.6))' : 'none'
        }}
      />

      {/* Seat number */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill="white"
        fontSize={type === 'vip' ? '10' : '9'}
        fontWeight="bold"
        pointerEvents="none"
      >
        {number}
      </text>
    </g>
  );
};
