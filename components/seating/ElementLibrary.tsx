"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { type TableShape } from "./TableShapePalette";

export interface TableConfig {
  id: string;
  label: string;
  capacity: number;
  icon: string;
  shape: TableShape;
  description?: string;
  isRow?: boolean; // Flag for theatre-style chair rows
}

interface ElementLibraryProps {
  onTableSelect: (config: TableConfig) => void;
  className?: string;
  totalGuests?: number;
  totalTables?: number;
  totalElements?: number;
}

const ROUND_TABLES: TableConfig[] = [
  { id: "round-2", label: "Round Table", capacity: 2, icon: "⭕", shape: "ROUND", description: "2 Guests" },
  { id: "round-4", label: "Round Table", capacity: 4, icon: "⭕", shape: "ROUND", description: "4 Guests" },
  { id: "round-6", label: "Round Table", capacity: 6, icon: "⭕", shape: "ROUND", description: "6 Guests" },
  { id: "round-8", label: "Round Table", capacity: 8, icon: "⭕", shape: "ROUND", description: "8 Guests" },
  { id: "round-10", label: "Round Table", capacity: 10, icon: "⭕", shape: "ROUND", description: "10 Guests" },
  { id: "round-12", label: "Round Table", capacity: 12, icon: "⭕", shape: "ROUND", description: "12 Guests" },
];

const RECTANGLE_TABLES: TableConfig[] = [
  { id: "rect-4", label: "Rectangle Table", capacity: 4, icon: "▭", shape: "RECTANGULAR", description: "4 Guests (1+1+2)" },
  { id: "rect-6", label: "Rectangle Table", capacity: 6, icon: "▭", shape: "RECTANGULAR", description: "6 Guests (1+1+4)" },
  { id: "rect-8", label: "Rectangle Table", capacity: 8, icon: "▭", shape: "RECTANGULAR", description: "8 Guests (1+1+6)" },
  { id: "rect-10", label: "Rectangle Table", capacity: 10, icon: "▭", shape: "RECTANGULAR", description: "10 Guests (1+1+8)" },
];

const SPECIAL_TABLES: TableConfig[] = [
  { id: "head-8", label: "Head Table", capacity: 8, icon: "👑", shape: "RECTANGULAR", description: "8 Guests (VIP)" },
  { id: "head-12", label: "Head Table", capacity: 12, icon: "👑", shape: "RECTANGULAR", description: "12 Guests (VIP)" },
  { id: "cocktail", label: "Cocktail Table", capacity: 4, icon: "🍸", shape: "ROUND", description: "4 Guests (Standing)" },
  { id: "square-4", label: "Square Table", capacity: 4, icon: "▢", shape: "SQUARE", description: "4 Guests" },
];

const SPECIAL_AREAS: TableConfig[] = [
  { id: "dance-floor", label: "Dance Floor", capacity: 0, icon: "💃", shape: "SQUARE", description: "Event Area" },
  { id: "stage", label: "Stage", capacity: 0, icon: "🎭", shape: "RECTANGULAR", description: "Performance Area" },
  { id: "bar", label: "Bar", capacity: 0, icon: "🍸", shape: "RECTANGULAR", description: "Bar Area" },
  { id: "buffet", label: "Buffet Table", capacity: 0, icon: "🍽️", shape: "RECTANGULAR", description: "Food Service" },
  { id: "entrance", label: "Entrance", capacity: 0, icon: "🚪", shape: "RECTANGULAR", description: "Entry Point" },
];

const CHAIR_ROWS: TableConfig[] = [
  { id: "row-10", label: "Chair Row", capacity: 10, icon: "🪑", shape: "RECTANGULAR", description: "10 Chairs", isRow: true },
  { id: "row-15", label: "Chair Row", capacity: 15, icon: "🪑", shape: "RECTANGULAR", description: "15 Chairs", isRow: true },
  { id: "row-20", label: "Chair Row", capacity: 20, icon: "🪑", shape: "RECTANGULAR", description: "20 Chairs", isRow: true },
  { id: "row-25", label: "Chair Row", capacity: 25, icon: "🪑", shape: "RECTANGULAR", description: "25 Chairs", isRow: true },
];

export default function ElementLibrary({
  onTableSelect,
  className = "",
  totalGuests = 0,
  totalTables = 0,
  totalElements = 0,
}: ElementLibraryProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    roundTables: true,
    rectangleTables: true,
    specialTables: true,
    specialAreas: true,
    chairRows: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className={`seating-font-inter bg-gray-50 border-r border-gray-200 p-5 overflow-y-auto ${className}`} style={{ backgroundColor: "var(--seating-neutral-100)" }}>
      <h3 className="seating-section-label mb-4" style={{ color: "var(--seating-neutral-900)" }}>
        Table Library
      </h3>

      {/* Statistics - Using Design System */}
      <div className="seating-stats-panel mb-5">
        <h4 className="seating-section-label mb-2" style={{ fontSize: "0.75em" }}>
          Layout Stats
        </h4>
        <div className="space-y-1">
          <div className="seating-stat-item">
            <span className="seating-stat-label">Total Guests:</span>
            <span className="seating-stat-value">{totalGuests}</span>
          </div>
          <div className="seating-stat-item">
            <span className="seating-stat-label">Tables:</span>
            <span className="seating-stat-value">{totalTables}</span>
          </div>
          <div className="seating-stat-item">
            <span className="seating-stat-label">Elements:</span>
            <span className="seating-stat-value">{totalElements}</span>
          </div>
        </div>
      </div>

      {/* Round Tables - Collapsible */}
      <Collapsible open={expandedSections.roundTables} onOpenChange={() => toggleSection('roundTables')} className="mb-6">
        <CollapsibleTrigger className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity">
          <h4 className="seating-section-label" style={{ color: "var(--seating-primary)", fontSize: "0.75em" }}>
            Round Tables
          </h4>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.roundTables ? 'rotate-180' : ''}`} style={{ color: "var(--seating-primary)" }} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2">
            {ROUND_TABLES.map((table) => (
              <LibraryItem key={table.id} config={table} onSelect={onTableSelect} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Rectangle Tables - Collapsible */}
      <Collapsible open={expandedSections.rectangleTables} onOpenChange={() => toggleSection('rectangleTables')} className="mb-6">
        <CollapsibleTrigger className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity">
          <h4 className="seating-section-label" style={{ color: "var(--seating-primary)", fontSize: "0.75em" }}>
            Rectangle Tables
          </h4>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.rectangleTables ? 'rotate-180' : ''}`} style={{ color: "var(--seating-primary)" }} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2">
            {RECTANGLE_TABLES.map((table) => (
              <LibraryItem key={table.id} config={table} onSelect={onTableSelect} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Special Tables - Collapsible */}
      <Collapsible open={expandedSections.specialTables} onOpenChange={() => toggleSection('specialTables')} className="mb-6">
        <CollapsibleTrigger className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity">
          <h4 className="seating-section-label" style={{ color: "var(--seating-primary)", fontSize: "0.75em" }}>
            Special Tables
          </h4>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.specialTables ? 'rotate-180' : ''}`} style={{ color: "var(--seating-primary)" }} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2">
            {SPECIAL_TABLES.map((table) => (
              <LibraryItem key={table.id} config={table} onSelect={onTableSelect} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Special Areas - Collapsible */}
      <Collapsible open={expandedSections.specialAreas} onOpenChange={() => toggleSection('specialAreas')} className="mb-6">
        <CollapsibleTrigger className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity">
          <h4 className="seating-section-label" style={{ color: "var(--seating-primary)", fontSize: "0.75em" }}>
            Special Areas
          </h4>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.specialAreas ? 'rotate-180' : ''}`} style={{ color: "var(--seating-primary)" }} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2">
            {SPECIAL_AREAS.map((area) => (
              <LibraryItem key={area.id} config={area} onSelect={onTableSelect} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Chair Rows - Collapsible */}
      <Collapsible open={expandedSections.chairRows} onOpenChange={() => toggleSection('chairRows')} className="mb-6">
        <CollapsibleTrigger className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity">
          <h4 className="seating-section-label" style={{ color: "var(--seating-primary)", fontSize: "0.75em" }}>
            Chair Rows
          </h4>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.chairRows ? 'rotate-180' : ''}`} style={{ color: "var(--seating-primary)" }} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2">
            {CHAIR_ROWS.map((row) => (
              <LibraryItem key={row.id} config={row} onSelect={onTableSelect} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Help Text - Polished */}
      <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: "rgba(102, 126, 234, 0.1)", border: "1px solid rgba(102, 126, 234, 0.3)" }}>
        <p className="text-xs mb-2" style={{ color: "var(--seating-primary)" }}>
          💡 <strong>Tip:</strong> Click any table to add it to your floor plan. Drag to position, and click to select for editing.
        </p>
        <p className="text-xs" style={{ color: "var(--seating-primary)" }}>
          ⌨️ <strong>Hold Shift</strong> and drag to group tables together.
        </p>
      </div>
    </div>
  );
}

interface LibraryItemProps {
  config: TableConfig;
  onSelect: (config: TableConfig) => void;
}

// SVG Preview Component for Tables
function TablePreview({ shape, capacity, isRow }: { shape: TableShape; capacity: number; isRow?: boolean }) {
  const renderTable = () => {
    const tableColor = "#2c3e50";
    const seatColor = "#4CAF50";
    const strokeWidth = 2;

    // Theatre-style chair row preview
    if (isRow) {
      const seats = Math.min(capacity, 8); // Show max 8 in preview
      const spacing = 6;
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="mx-auto">
          {/* Row label */}
          <text x="2" y="30" fontSize="8" fill={tableColor} dominantBaseline="middle">A</text>

          {/* Horizontal row of seats */}
          {Array.from({ length: seats }).map((_, i) => {
            const x = 12 + (i * spacing);
            return <circle key={i} cx={x} cy="30" r="2.5" fill={seatColor} />;
          })}
        </svg>
      );
    }

    if (shape === "ROUND") {
      const seats = Math.min(capacity, 12);
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="mx-auto">
          {/* Round table outline */}
          <circle cx="30" cy="30" r="15" fill="none" stroke={tableColor} strokeWidth={strokeWidth} />

          {/* Seats around table */}
          {Array.from({ length: seats }).map((_, i) => {
            const angle = (i * 360) / seats - 90;
            const rad = (angle * Math.PI) / 180;
            const x = 30 + Math.cos(rad) * 23;
            const y = 30 + Math.sin(rad) * 23;
            return <circle key={i} cx={x} cy={y} r="3" fill={seatColor} />;
          })}
        </svg>
      );
    } else if (shape === "RECTANGULAR") {
      const seatsPerSide = Math.ceil(capacity / 2);
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="mx-auto">
          {/* Rectangular table outline */}
          <rect x="15" y="22" width="30" height="16" fill="none" stroke={tableColor} strokeWidth={strokeWidth} rx="2" />

          {/* Seats on top */}
          {Array.from({ length: Math.ceil(seatsPerSide / 2) }).map((_, i) => (
            <circle key={`top-${i}`} cx={20 + i * 10} cy="15" r="3" fill={seatColor} />
          ))}

          {/* Seats on bottom */}
          {Array.from({ length: Math.floor(seatsPerSide / 2) }).map((_, i) => (
            <circle key={`bottom-${i}`} cx={20 + i * 10} cy="45" r="3" fill={seatColor} />
          ))}

          {/* Seats on sides */}
          <circle cx="8" cy="30" r="3" fill={seatColor} />
          <circle cx="52" cy="30" r="3" fill={seatColor} />
        </svg>
      );
    } else if (shape === "SQUARE") {
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="mx-auto">
          {/* Square table outline */}
          <rect x="20" y="20" width="20" height="20" fill="none" stroke={tableColor} strokeWidth={strokeWidth} rx="2" />

          {/* 4 Seats around square */}
          <circle cx="30" cy="12" r="3" fill={seatColor} />
          <circle cx="30" cy="48" r="3" fill={seatColor} />
          <circle cx="12" cy="30" r="3" fill={seatColor} />
          <circle cx="48" cy="30" r="3" fill={seatColor} />
        </svg>
      );
    }

    return null;
  };

  return <div className="w-[60px] h-[60px] flex items-center justify-center">{renderTable()}</div>;
}

function LibraryItem({ config, onSelect }: LibraryItemProps) {
  return (
    <button
      onClick={() => onSelect(config)}
      className="w-full seating-library-item text-left active:scale-95"
      style={{
        backgroundColor: "white",
        border: "2px solid var(--seating-neutral-300)",
        borderRadius: "var(--seating-radius-lg)",
        padding: "12px",
        cursor: "pointer",
        transition: "var(--seating-transition)",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = "var(--seating-primary)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--seating-shadow-md)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "var(--seating-neutral-300)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-center gap-3">
        {/* Show SVG preview for tables, emoji for special areas */}
        {config.capacity > 0 ? (
          <TablePreview shape={config.shape} capacity={config.capacity} isRow={config.isRow} />
        ) : (
          <div className="seating-library-item-icon text-2xl opacity-80 w-[60px] h-[60px] flex items-center justify-center">
            {config.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="seating-library-item-title text-sm truncate" style={{ fontWeight: 600, color: "var(--seating-neutral-900)", marginBottom: "2px" }}>
            {config.label}
          </p>
          <p className="seating-library-item-capacity text-xs" style={{ color: "var(--seating-neutral-600)" }}>
            {config.description}
          </p>
        </div>
      </div>
    </button>
  );
}

// Export table configurations for use in other components
export { ROUND_TABLES, RECTANGLE_TABLES, SPECIAL_TABLES, SPECIAL_AREAS, CHAIR_ROWS };
