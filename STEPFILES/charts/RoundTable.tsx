// components/tables/RoundTable.tsx
import React from 'react';
import { Seat } from './Seat';

interface RoundTableProps {
  tableId: number;
  seats: 8 | 10 | 12;
  type: 'regular' | 'vip';
  x: number;
  y: number;
  onSeatClick: (tableId: number, seatNumber: number) => void;
  soldSeats: number[];
  selectedSeats: number[];
  isDesignerMode: boolean;
  onDelete?: () => void;
}

export const RoundTable: React.FC<RoundTableProps> = ({
  tableId,
  seats,
  type,
  x,
  y,
  onSeatClick,
  soldSeats,
  selectedSeats,
  isDesignerMode,
  onDelete
}) => {
  // Calculate dimensions based on seat count
  const getRadius = () => {
    switch (seats) {
      case 8: return 80;
      case 10: return 90;
      case 12: return 100;
      default: return 80;
    }
  };

  const radius = getRadius();
  const seatRadius = type === 'vip' ? 14 : 12;
  const angleStep = (2 * Math.PI) / seats;
  const size = radius * 2 + 60;
  const center = size / 2;

  const getSeatStatus = (seatNum: number): 'available' | 'selected' | 'sold' => {
    if (soldSeats.includes(seatNum)) return 'sold';
    if (selectedSeats.includes(seatNum)) return 'selected';
    return 'available';
  };

  const renderSeats = () => {
    const seatElements = [];
    for (let i = 0; i < seats; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const seatX = center + (radius + 18) * Math.cos(angle);
      const seatY = center + (radius + 18) * Math.sin(angle);
      const seatNum = i + 1;
      const status = getSeatStatus(seatNum);

      seatElements.push(
        <Seat
          key={`${tableId}-${seatNum}`}
          cx={seatX}
          cy={seatY}
          radius={seatRadius}
          number={seatNum}
          status={status}
          type={type}
          onClick={() => !isDesignerMode && status !== 'sold' && onSeatClick(tableId, seatNum)}
          isInteractive={!isDesignerMode}
        />
      );
    }
    return seatElements;
  };

  // VIP styling
  const isVIP = type === 'vip';
  const outlineColor = isVIP ? '#B8860B' : '#2c3e50';
  const centerFill = isVIP ? '#FFFEF7' : '#f8f9fa';
  const labelColor = isVIP ? '#B8860B' : '#2c3e50';

  return (
    <div
      className="absolute cursor-move group"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        {/* VIP glow effect */}
        {isVIP && (
          <circle
            cx={center}
            cy={center}
            r={radius + 5}
            fill="none"
            stroke="#FFD700"
            strokeWidth="2"
            opacity="0.3"
          />
        )}

        {/* Table outline */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={outlineColor}
          strokeWidth={isVIP ? 4 : 3}
        />

        {/* Inner glow for VIP */}
        {isVIP && (
          <circle
            cx={center}
            cy={center}
            r={radius - 5}
            fill="none"
            stroke="#FFD700"
            strokeWidth="2"
            opacity="0.5"
          />
        )}

        {/* Table center */}
        <circle
          cx={center}
          cy={center}
          r={radius - 15}
          fill={centerFill}
          stroke={isVIP ? '#DAA520' : '#2c3e50'}
          strokeWidth="2"
        />

        {/* VIP Crown Icon */}
        {isVIP && (
          <text
            x={center}
            y={center - 20}
            textAnchor="middle"
            fontSize="24"
          >
            👑
          </text>
        )}

        {/* Table Label */}
        <text
          x={center}
          y={isVIP ? center + 5 : center - 5}
          textAnchor="middle"
          fill={labelColor}
          fontSize="16"
          fontWeight="700"
        >
          {isVIP ? 'VIP ' : ''}Table {tableId}
        </text>

        {/* Seat Count */}
        <text
          x={center}
          y={isVIP ? center + 20 : center + 15}
          textAnchor="middle"
          fill="#666"
          fontSize={isVIP ? '11' : '12'}
          fontWeight="600"
        >
          {seats} {isVIP ? 'Premium ' : ''}Seats
        </text>

        {/* Individual Seats */}
        {!isDesignerMode && renderSeats()}
      </svg>

      {/* Delete Button (Designer Mode) */}
      {isDesignerMode && onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full 
                     font-bold opacity-0 group-hover:opacity-100 transition-opacity
                     hover:bg-red-600 z-20"
        >
          ×
        </button>
      )}
    </div>
  );
};
