"use client";

import { Circle, Square, RectangleHorizontal, Pentagon } from "lucide-react";
import { getSeatTypeIcon, getSeatTypeBgColor } from "./SeatTypePalette";
import { TABLE_COLORS, SEAT_COLORS, STROKE_WIDTH } from "@/styles/seating-colors";

export interface TableRenderProps {
  table: {
    id: string;
    number: string | number;
    shape: "ROUND" | "RECTANGULAR" | "SQUARE" | "CUSTOM";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    capacity: number;
    reservationStatus?: "AVAILABLE" | "RESERVED" | "UNAVAILABLE";
    reservationType?: "VIP" | "SPONSOR" | "STAFF" | "CUSTOM";
    reservationNotes?: string;
    seats: Array<{
      id: string;
      number: string;
      type: string;
      status: string;
      position?: {
        angle?: number;
        side?: string;
        offset?: number;
        x?: number;
        y?: number;
      };
    }>;
  };
  isSelected?: boolean;
  onClick?: () => void;
  showSeats?: boolean;
  showLabel?: boolean;
  scale?: number;
  onResizeStart?: (corner: string, e: React.MouseEvent) => void;
}

export default function TableRenderer({
  table,
  isSelected = false,
  onClick,
  showSeats = true,
  showLabel = true,
  scale = 1,
  onResizeStart,
}: TableRenderProps) {
  // Check if this is a special area (no seats)
  const isSpecialArea = table.capacity === 0;

  // Get colors based on reservation status
  const getReservationColors = () => {
    if (table.reservationStatus === "RESERVED") {
      switch (table.reservationType) {
        case "VIP":
          return { fill: "#FDF4FF", stroke: "#9333EA", label: "VIP" }; // Purple
        case "SPONSOR":
          return { fill: "#EFF6FF", stroke: "#2563EB", label: "SPONSOR" }; // Blue
        case "STAFF":
          return { fill: "#F0FDF4", stroke: "#16A34A", label: "STAFF" }; // Green
        case "CUSTOM":
          return { fill: "#FEFCE8", stroke: "#CA8A04", label: "RESERVED" }; // Yellow
        default:
          return { fill: "#F3F4F6", stroke: "#6B7280", label: "RESERVED" }; // Gray
      }
    } else if (table.reservationStatus === "UNAVAILABLE") {
      return { fill: "#FEE2E2", stroke: "#DC2626", label: "UNAVAILABLE" }; // Red
    }
    return { fill: TABLE_COLORS.FILL_NONE, stroke: TABLE_COLORS.STROKE, label: null };
  };

  const reservationColors = getReservationColors();

  const renderTableShape = () => {
    const commonProps = {
      className: `transition-all`,
      fill: reservationColors.fill,
      stroke: isSelected ? TABLE_COLORS.SELECTED : reservationColors.stroke,
      strokeWidth: isSelected ? STROKE_WIDTH.SELECTED : STROKE_WIDTH.TABLE,
    };

    switch (table.shape) {
      case "ROUND":
        const radius = table.width / 2;
        return (
          <circle
            cx={table.width / 2}
            cy={table.height / 2}
            r={radius}
            {...commonProps}
          />
        );

      case "RECTANGULAR":
        return (
          <rect
            x={0}
            y={0}
            width={table.width}
            height={table.height}
            rx={8}
            {...commonProps}
          />
        );

      case "SQUARE":
        return (
          <rect
            x={0}
            y={0}
            width={table.width}
            height={table.width}
            rx={8}
            {...commonProps}
          />
        );

      case "CUSTOM":
        // Pentagon/polygon shape
        const customCenterX = table.width / 2;
        const customCenterY = table.height / 2;
        const customRadius = Math.min(table.width, table.height) / 2;

        // Generate pentagon points (5-sided polygon)
        const pentagonPoints = Array.from({ length: 5 }, (_, i) => {
          const angle = (i * 2 * Math.PI / 5) - Math.PI / 2; // Start from top
          const x = customCenterX + customRadius * Math.cos(angle);
          const y = customCenterY + customRadius * Math.sin(angle);
          return `${x},${y}`;
        }).join(' ');

        return (
          <polygon
            points={pentagonPoints}
            {...commonProps}
          />
        );

      default:
        return null;
    }
  };

  const renderSeats = () => {
    if (!showSeats) return null;

    return table.seats.map((seat, index) => {
      // Calculate seat position
      let seatX = 0;
      let seatY = 0;
      const seatRadius = 12 * scale;

      if (seat.position) {
        // Use stored position if available
        if (seat.position.x !== undefined && seat.position.y !== undefined) {
          seatX = seat.position.x;
          seatY = seat.position.y;
        } else if (seat.position.angle !== undefined) {
          // Calculate from angle (for round/custom tables)
          const angle = seat.position.angle;
          const radians = (angle * Math.PI) / 180;
          const radius = table.width / 2;
          const offset = seat.position.offset || 15;
          seatX = table.width / 2 + (radius + offset) * Math.cos(radians);
          seatY = table.height / 2 + (radius + offset) * Math.sin(radians);
        } else if (seat.position.side) {
          // Calculate from side (for rectangular tables)
          const offset = seat.position.offset || 15;
          const spacing = 40;
          const sideSeats = table.seats.filter(s => s.position?.side === seat.position!.side).length;
          const seatIndex = table.seats.filter(s => s.position?.side === seat.position!.side).indexOf(seat);

          switch (seat.position.side) {
            case "top":
              seatX = (table.width / (sideSeats + 1)) * (seatIndex + 1);
              seatY = -offset;
              break;
            case "bottom":
              seatX = (table.width / (sideSeats + 1)) * (seatIndex + 1);
              seatY = table.height + offset;
              break;
            case "left":
              seatX = -offset;
              seatY = (table.height / (sideSeats + 1)) * (seatIndex + 1);
              break;
            case "right":
              seatX = table.width + offset;
              seatY = (table.height / (sideSeats + 1)) * (seatIndex + 1);
              break;
          }
        }
      } else {
        // Auto-calculate position based on table shape (fallback)
        if (table.shape === "RECTANGULAR") {
          // Rectangular tables: chairs tight to edges, not in circle
          const offset = 8; // Much closer to table edge

          if (index === 0) {
            // First chair on left end
            seatX = -offset;
            seatY = table.height / 2;
          } else if (index === 1) {
            // Second chair on right end
            seatX = table.width + offset;
            seatY = table.height / 2;
          } else {
            // Remaining chairs split between top and bottom
            const remaining = table.capacity - 2;
            const topChairs = Math.ceil(remaining / 2);
            const bottomChairs = remaining - topChairs;
            const chairIndex = index - 2;

            if (chairIndex < topChairs) {
              // Top side - evenly spaced
              seatX = (table.width / (topChairs + 1)) * (chairIndex + 1);
              seatY = -offset;
            } else {
              // Bottom side - evenly spaced
              const bottomIndex = chairIndex - topChairs;
              seatX = (table.width / (bottomChairs + 1)) * (bottomIndex + 1);
              seatY = table.height + offset;
            }
          }
        } else {
          // Round and square tables: chairs in circle (current logic is correct)
          const angle = (360 / table.capacity) * index - 90;
          const radians = (angle * Math.PI) / 180;
          const radius = Math.min(table.width, table.height) / 2;
          const offset = 12; // Closer to table
          seatX = table.width / 2 + (radius + offset) * Math.cos(radians);
          seatY = table.height / 2 + (radius + offset) * Math.sin(radians);
        }
      }

      const isAvailable = seat.status === "AVAILABLE";
      const isReserved = seat.status === "RESERVED";
      const isSold = seat.status === "SOLD";
      const isSelected = seat.status === "SELECTED";
      const isSpecialType = ["WHEELCHAIR", "VIP", "BLOCKED"].includes(seat.type);

      // Determine seat color based on status
      let seatFill = SEAT_COLORS.AVAILABLE;
      let seatStroke = SEAT_COLORS.AVAILABLE;

      if (isSold) {
        seatFill = SEAT_COLORS.SOLD;
        seatStroke = SEAT_COLORS.SOLD;
      } else if (isSelected) {
        seatFill = SEAT_COLORS.SELECTED;
        seatStroke = SEAT_COLORS.SELECTED;
      } else if (isReserved) {
        seatFill = SEAT_COLORS.RESERVED;
        seatStroke = SEAT_COLORS.RESERVED;
      }

      return (
        <g key={seat.id}>
          {/* Seat circle */}
          <circle
            cx={seatX}
            cy={seatY}
            r={seatRadius}
            fill={seatFill}
            stroke={seatStroke}
            strokeWidth={STROKE_WIDTH.SEAT}
            className={`transition-all ${isAvailable ? "cursor-pointer hover:opacity-80" : ""}`}
          />

          {/* Seat number or icon */}
          <text
            x={seatX}
            y={seatY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-bold pointer-events-none select-none"
            fill={isSold ? "#fff" : "#1f2937"}
          >
            {isSpecialType ? "" : seat.number}
          </text>
        </g>
      );
    });
  };

  return (
    <g
      onClick={onClick}
      className="cursor-pointer"
      style={{
        transform: `translate(${table.x}px, ${table.y}px) rotate(${table.rotation || 0}deg)`,
        transformOrigin: `${table.width / 2}px ${table.height / 2}px`,
      }}
    >
      {/* Invisible larger hit zone for easier dragging */}
      <rect
        x={-40}
        y={-40}
        width={table.width + 80}
        height={table.height + 80}
        fill="transparent"
        stroke="none"
        className="cursor-move"
        style={{ pointerEvents: "all" }}
      />

      {/* Table shape */}
      {renderTableShape()}

      {/* Table label */}
      {showLabel && (
        <g>
          <rect
            x={table.width / 2 - 30}
            y={table.height / 2 - 12}
            width={60}
            height={24}
            rx={4}
            fill="white"
            fillOpacity={0.95}
            stroke="#000000"
            strokeWidth={isSelected ? 2 : 1}
          />
          <text
            x={table.width / 2}
            y={table.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-bold pointer-events-none select-none fill-gray-900"
          >
            {table.number}
          </text>
        </g>
      )}

      {/* Reservation badge */}
      {showLabel && reservationColors.label && (
        <g>
          <rect
            x={table.width / 2 - 35}
            y={table.height / 2 + 18}
            width={70}
            height={18}
            rx={3}
            fill={reservationColors.stroke}
            fillOpacity={0.9}
          />
          <text
            x={table.width / 2}
            y={table.height / 2 + 27}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold pointer-events-none select-none fill-white"
          >
            {reservationColors.label}
          </text>
        </g>
      )}

      {/* Seats */}
      {renderSeats()}

      {/* Selection indicator */}
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={table.width + 8}
          height={table.height + 8}
          rx={12}
          fill="none"
          stroke="#000000"
          strokeWidth={2}
          strokeDasharray="6 3"
        />
      )}

      {/* Resize handles - only for special areas when selected */}
      {isSpecialArea && isSelected && onResizeStart && (
        <>
          {/* Corner resize handles */}
          {/* Top-left */}
          <circle
            cx={0}
            cy={0}
            r={8}
            fill="white"
            stroke="#000000"
            strokeWidth={2}
            className="cursor-nwse-resize"
            style={{ pointerEvents: "auto" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart("nw", e);
            }}
          />
          {/* Top-right */}
          <circle
            cx={table.width}
            cy={0}
            r={8}
            fill="white"
            stroke="#000000"
            strokeWidth={2}
            className="cursor-nesw-resize"
            style={{ pointerEvents: "auto" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart("ne", e);
            }}
          />
          {/* Bottom-left */}
          <circle
            cx={0}
            cy={table.height}
            r={8}
            fill="white"
            stroke="#000000"
            strokeWidth={2}
            className="cursor-nesw-resize"
            style={{ pointerEvents: "auto" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart("sw", e);
            }}
          />
          {/* Bottom-right */}
          <circle
            cx={table.width}
            cy={table.height}
            r={8}
            fill="white"
            stroke="#000000"
            strokeWidth={2}
            className="cursor-nwse-resize"
            style={{ pointerEvents: "auto" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart("se", e);
            }}
          />
        </>
      )}
    </g>
  );
}
