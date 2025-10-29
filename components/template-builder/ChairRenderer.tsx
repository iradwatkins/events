"use client";

import React from "react";
import { ChairPosition } from "./chairUtils";

interface ChairRendererProps {
  chair: ChairPosition;
  isSelected?: boolean;
  showSeatNumber?: boolean;
  chairColor?: string;
}

/**
 * Renders a single chair at the specified position
 * Chair is a small rectangle that represents a seat
 */
export default function ChairRenderer({
  chair,
  isSelected = false,
  showSeatNumber = false,
  chairColor = "#E5E7EB", // gray-200
}: ChairRendererProps) {
  return (
    <div
      className="absolute transition-all"
      style={{
        left: chair.x,
        top: chair.y,
        width: 20,
        height: 14,
        transform: `rotate(${chair.rotation}deg)`,
        transformOrigin: "center",
      }}
    >
      {/* Chair seat */}
      <div
        className={`w-full h-full rounded border-2 transition-all ${
          isSelected ? "ring-2 ring-yellow-400" : ""
        }`}
        style={{
          backgroundColor: chairColor,
          borderColor: isSelected ? "#FCD34D" : "#9CA3AF", // gray-400
          boxShadow: isSelected
            ? "0 3px 6px rgba(252, 211, 77, 0.4)"
            : "0 2px 3px rgba(0, 0, 0, 0.15)",
        }}
      />

      {/* Seat number (shown on hover or selection) */}
      {showSeatNumber && (
        <div
          className="absolute top-1/2 left-1/2 text-[8px] font-bold text-gray-700 pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) rotate(-${chair.rotation}deg)`,
          }}
        >
          {chair.seatNumber}
        </div>
      )}
    </div>
  );
}
