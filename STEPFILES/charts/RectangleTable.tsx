// components/tables/RectangleTable.tsx
import React from 'react';
import { Seat } from './Seat';

interface RectangleTableProps {
  tableId: number;
  seats: 6 | 8;
  x: number;
  y: number;
  onSeatClick: (tableId: number, seatNumber: number) => void;
  soldSeats: number[];
  selectedSeats: number[];
  isDesignerMode: boolean;
  onDelete?: () => void;
}

export const RectangleTable: React.FC<RectangleTableProps> = ({
  tableId,
  seats,
  x,
  y,
  onSeatClick,
  soldSeats,
  selectedSeats,
  isDesignerMode,
  onDelete
}) => {
  const width = seats === 6 ? 250 : 300;
  const height = 100;
  const seatRadius = 12;
  const totalWidth = width + 60;
  const totalHeight = height + 60;
  const tableX = 30;
  const tableY = 30;

  const getSeatStatus = (seatNum: number): 'available' | 'selected' | 'sold' => {
    if (soldSeats.includes(seatNum)) return 'sold';
    if (selectedSeats.includes(seatNum)) return 'selected';
    return 'available';
  };

  const renderSeats = () => {
    const seatElements = [];
    
    if (seats === 6) {
      // 3 seats on top, 3 on bottom
      const spacing = width / 4;
      
      // Top seats
      for (let i = 0; i < 3; i++) {
        const seatX = tableX + spacing * (i + 1);
        const seatY = tableY - 20;
        const seatNum = i + 1;
        
        seatElements.push(
          <Seat
            key={`${tableId}-${seatNum}`}
            cx={seatX}
            cy={seatY}
            radius={seatRadius}
            number={seatNum}
            status={getSeatStatus(seatNum)}
            type="regular"
            onClick={() => onSeatClick(tableId, seatNum)}
            isInteractive={!isDesignerMode}
          />
        );
      }
      
      // Bottom seats
      for (let i = 0; i < 3; i++) {
        const seatX = tableX + spacing * (i + 1);
        const seatY = tableY + height + 20;
        const seatNum = i + 4;
        
        seatElements.push(
          <Seat
            key={`${tableId}-${seatNum}`}
            cx={seatX}
            cy={seatY}
            radius={seatRadius}
            number={seatNum}
            status={getSeatStatus(seatNum)}
            type="regular"
            onClick={() => onSeatClick(tableId, seatNum)}
            isInteractive={!isDesignerMode}
          />
        );
      }
    } else if (seats === 8) {
      // 3 top, 3 bottom, 1 left, 1 right
      const spacing = width / 4;
      
      // Top 3
      for (let i = 0; i < 3; i++) {
        const seatX = tableX + spacing * (i + 1);
        const seatY = tableY - 20;
        
        seatElements.push(
          <Seat
            key={`${tableId}-${i + 1}`}
            cx={seatX}
            cy={seatY}
            radius={seatRadius}
            number={i + 1}
            status={getSeatStatus(i + 1)}
            type="regular"
            onClick={() => onSeatClick(tableId, i + 1)}
            isInteractive={!isDesignerMode}
          />
        );
      }
      
      // Right side
      seatElements.push(
        <Seat
          key={`${tableId}-4`}
          cx={tableX + width + 20}
          cy={tableY + height / 2}
          radius={seatRadius}
          number={4}
          status={getSeatStatus(4)}
          type="regular"
          onClick={() => onSeatClick(tableId, 4)}
          isInteractive={!isDesignerMode}
        />
      );
      
      // Bottom 3
      for (let i = 0; i < 3; i++) {
        const seatX = tableX + spacing * (i + 1);
        const seatY = tableY + height + 20;
        
        seatElements.push(
          <Seat
            key={`${tableId}-${i + 5}`}
            cx={seatX}
            cy={seatY}
            radius={seatRadius}
            number={i + 5}
            status={getSeatStatus(i + 5)}
            type="regular"
            onClick={() => onSeatClick(tableId, i + 5)}
            isInteractive={!isDesignerMode}
          />
        );
      }
      
      // Left side
      seatElements.push(
        <Seat
          key={`${tableId}-8`}
          cx={tableX - 20}
          cy={tableY + height / 2}
          radius={seatRadius}
          number={8}
          status={getSeatStatus(8)}
          type="regular"
          onClick={() => onSeatClick(tableId, 8)}
          isInteractive={!isDesignerMode}
        />
      );
    }
    
    return seatElements;
  };

  return (
    <div
      className="absolute cursor-move group"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <svg width={totalWidth} height={totalHeight} xmlns="http://www.w3.org/2000/svg">
        {/* Table outline */}
        <rect
          x={tableX}
          y={tableY}
          width={width}
          height={height}
          rx="10"
          fill="none"
          stroke="#2c3e50"
          strokeWidth="3"
        />

        {/* Table center */}
        <rect
          x={tableX + 5}
          y={tableY + 5}
          width={width - 10}
          height={height - 10}
          rx="8"
          fill="#f8f9fa"
          stroke="#2c3e50"
          strokeWidth="2"
        />

        {/* Label */}
        <text
          x={tableX + width / 2}
          y={tableY + height / 2 + 5}
          textAnchor="middle"
          fill="#2c3e50"
          fontSize="16"
          fontWeight="700"
        >
          Table {tableId}
        </text>

        <text
          x={tableX + width / 2}
          y={tableY + height / 2 + 22}
          textAnchor="middle"
          fill="#666"
          fontSize="11"
          fontWeight="600"
        >
          {seats} Seats
        </text>

        {/* Seats */}
        {!isDesignerMode && renderSeats()}
      </svg>

      {/* Delete Button */}
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
