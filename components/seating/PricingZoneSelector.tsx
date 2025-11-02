"use client";

import React from "react";
import { DollarSign, MapPin, Sparkles } from "lucide-react";

export interface PricingZone {
  id: string;
  name: string;
  multiplier: number; // Price multiplier (1.0 = base, 1.5 = 50% increase, 0.8 = 20% decrease)
  color: string; // Hex color for visual distinction
  description: string;
}

export const DEFAULT_PRICING_ZONES: PricingZone[] = [
  {
    id: "front",
    name: "Front Premium",
    multiplier: 1.5,
    color: "#EF4444", // Red
    description: "Front tables near stage",
  },
  {
    id: "vip",
    name: "VIP Section",
    multiplier: 1.8,
    color: "#8B5CF6", // Purple
    description: "Premium VIP seating",
  },
  {
    id: "standard",
    name: "Standard",
    multiplier: 1.0,
    color: "#10B981", // Green
    description: "Regular seating",
  },
  {
    id: "back",
    name: "Value",
    multiplier: 0.8,
    color: "#6B7280", // Gray
    description: "Back section value pricing",
  },
];

interface PricingZoneSelectorProps {
  selectedZone: string | null;
  onZoneSelect: (zoneId: string) => void;
  zones?: PricingZone[];
  basePrice?: number;
}

export default function PricingZoneSelector({
  selectedZone,
  onZoneSelect,
  zones = DEFAULT_PRICING_ZONES,
  basePrice = 50,
}: PricingZoneSelectorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Dynamic Pricing Zones</h3>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Assign pricing zones to tables for location-based pricing
      </p>

      <div className="space-y-2">
        {zones.map((zone) => {
          const adjustedPrice = basePrice * zone.multiplier;
          const isSelected = selectedZone === zone.id;

          return (
            <button
              key={zone.id}
              onClick={() => onZoneSelect(zone.id)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  {/* Color indicator */}
                  <div
                    className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: zone.color }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {zone.name}
                      </span>
                      {zone.id === "vip" && (
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      )}
                      {zone.id === "front" && (
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {zone.description}
                    </p>
                  </div>
                </div>

                <div className="text-right ml-2 flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">
                    ${adjustedPrice.toFixed(0)}
                  </div>
                  <div
                    className={`text-xs ${
                      zone.multiplier > 1.0
                        ? "text-green-600"
                        : zone.multiplier < 1.0
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {zone.multiplier > 1.0 && "+"}
                    {((zone.multiplier - 1.0) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    ✓ Click tables to apply this pricing zone
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Pricing Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600 mb-2">
          <strong>Base Price:</strong> ${basePrice}
        </div>
        <div className="text-xs text-gray-500">
          Tip: Assign zones to create dynamic pricing based on table location
        </div>
      </div>

      {/* Zone Legend */}
      <div className="mt-3 text-xs text-gray-500">
        <strong>How it works:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Select a pricing zone above</li>
          <li>Click tables on the canvas to assign the zone</li>
          <li>Tables will show color-coded pricing</li>
          <li>Customers see adjusted prices automatically</li>
        </ul>
      </div>
    </div>
  );
}
