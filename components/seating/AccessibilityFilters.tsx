"use client";

import React from "react";
import { Accessibility, Crown, User, Filter } from "lucide-react";

interface AccessibilityFiltersProps {
  onFilterChange: (filters: SeatFilters) => void;
  filters: SeatFilters;
}

export interface SeatFilters {
  showWheelchair: boolean;
  showVIP: boolean;
  showStandard: boolean;
  wheelchairOnly: boolean;
}

export default function AccessibilityFilters({
  onFilterChange,
  filters,
}: AccessibilityFiltersProps) {
  const toggleFilter = (key: keyof SeatFilters) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Seat Filters</h3>
      </div>

      <div className="space-y-2">
        {/* Wheelchair Only Toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.wheelchairOnly}
            onChange={() => toggleFilter("wheelchairOnly")}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-purple-500"
          />
          <Accessibility className="w-4 h-4 text-primary" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            Wheelchair Accessible Only
          </span>
        </label>

        {/* Show/Hide Filters */}
        <div className="pl-6 space-y-2 border-l-2 border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showWheelchair}
              onChange={() => toggleFilter("showWheelchair")}
              disabled={filters.wheelchairOnly}
              className="w-3.5 h-3.5 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
            />
            <Accessibility className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-gray-600 group-hover:text-gray-800">
              Show Wheelchair Seats
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showVIP}
              onChange={() => toggleFilter("showVIP")}
              disabled={filters.wheelchairOnly}
              className="w-3.5 h-3.5 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
            />
            <Crown className="w-3.5 h-3.5 text-yellow-600" />
            <span className="text-xs text-gray-600 group-hover:text-gray-800">Show VIP Seats</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showStandard}
              onChange={() => toggleFilter("showStandard")}
              disabled={filters.wheelchairOnly}
              className="w-3.5 h-3.5 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
            />
            <User className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-xs text-gray-600 group-hover:text-gray-800">
              Show Standard Seats
            </span>
          </label>
        </div>
      </div>

      {filters.wheelchairOnly && (
        <div className="mt-3 p-2 bg-accent border border-purple-200 rounded text-xs text-purple-800">
          Only showing wheelchair accessible seats
        </div>
      )}
    </div>
  );
}
