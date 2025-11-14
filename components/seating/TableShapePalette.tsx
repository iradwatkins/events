"use client";

import { Circle, Square, RectangleHorizontal, Pentagon, Info } from "lucide-react";
import { motion } from "framer-motion";

export type TableShape = "ROUND" | "RECTANGULAR" | "SQUARE" | "CUSTOM";

interface TableShapeOption {
  shape: TableShape;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

const tableShapes: TableShapeOption[] = [
  {
    shape: "ROUND",
    label: "Round",
    icon: <Circle className="w-5 h-5" />,
    color: "text-primary",
    bgColor: "bg-accent hover:bg-primary/20 border-primary/40",
    description: "Circular tables (most common)",
  },
  {
    shape: "RECTANGULAR",
    label: "Rectangular",
    icon: <RectangleHorizontal className="w-5 h-5" />,
    color: "text-green-700",
    bgColor: "bg-green-100 hover:bg-green-200 border-green-300",
    description: "Long banquet-style tables",
  },
  {
    shape: "SQUARE",
    label: "Square",
    icon: <Square className="w-5 h-5" />,
    color: "text-primary",
    bgColor: "bg-accent hover:bg-purple-200 border-purple-300",
    description: "Square tables for 4-8 guests",
  },
  {
    shape: "CUSTOM",
    label: "Custom",
    icon: <Pentagon className="w-5 h-5" />,
    color: "text-orange-700",
    bgColor: "bg-orange-100 hover:bg-orange-200 border-orange-300",
    description: "Custom polygon shape",
  },
];

interface TableShapePaletteProps {
  currentShape?: TableShape;
  onShapeSelect: (shape: TableShape) => void;
  compact?: boolean;
}

export default function TableShapePalette({
  currentShape = "ROUND",
  onShapeSelect,
  compact = false,
}: TableShapePaletteProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {tableShapes.map((tableShape) => {
          const isSelected = currentShape === tableShape.shape;
          return (
            <button
              key={tableShape.shape}
              onClick={() => onShapeSelect(tableShape.shape)}
              title={tableShape.description}
              className={`
                relative p-2 rounded-lg border-2 transition-all
                ${tableShape.bgColor}
                ${isSelected ? "ring-2 ring-offset-2 ring-purple-500 scale-110" : ""}
              `}
            >
              <span className={tableShape.color}>{tableShape.icon}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-gray-900">Table Shapes</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tableShapes.map((tableShape) => {
          const isSelected = currentShape === tableShape.shape;
          return (
            <motion.button
              key={tableShape.shape}
              onClick={() => onShapeSelect(tableShape.shape)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
                ${tableShape.bgColor}
                ${isSelected ? "ring-2 ring-offset-2 ring-purple-500" : ""}
              `}
            >
              {isSelected && (
                <motion.div
                  layoutId="selected-table-shape"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              )}

              <span className={`${tableShape.color} mb-2`}>{tableShape.icon}</span>
              <span className="text-xs font-semibold text-gray-900 mb-1">{tableShape.label}</span>
              <span className="text-xs text-gray-600 text-center">{tableShape.description}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Tip:</strong> Select a shape, then click on the canvas to place a new table
        </p>
      </div>
    </div>
  );
}

export function getTableShapeIcon(shape: TableShape): React.ReactNode {
  const tableShape = tableShapes.find((ts) => ts.shape === shape);
  return tableShape?.icon || <Circle className="w-4 h-4" />;
}

export function getTableShapeColor(shape: TableShape): string {
  const tableShape = tableShapes.find((ts) => ts.shape === shape);
  return tableShape?.color || "text-primary";
}

export function getTableShapeBgColor(shape: TableShape): string {
  const tableShape = tableShapes.find((ts) => ts.shape === shape);
  return tableShape?.bgColor || "bg-accent";
}

export { tableShapes };
