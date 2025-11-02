"use client";

import React from "react";
import { Save, Trash2, Download, FileText, Grid3x3, Eye } from "lucide-react";

interface CanvasControlsProps {
  onClearAll?: () => void;
  onExportLayout?: () => void;
  onSaveTemplate?: () => void;
  onGenerateReport?: () => void;
  snapToGrid?: boolean;
  onSnapToGridChange?: (enabled: boolean) => void;
  showLabels?: boolean;
  onShowLabelsChange?: (enabled: boolean) => void;
  className?: string;
}

export default function CanvasControls({
  onClearAll,
  onExportLayout,
  onSaveTemplate,
  onGenerateReport,
  snapToGrid = true,
  onSnapToGridChange,
  showLabels = true,
  onShowLabelsChange,
  className = "",
}: CanvasControlsProps) {
  return (
    <div
      className={`canvas-controls bg-white border border-gray-200 rounded-lg p-3 mb-5 flex items-center gap-3 flex-wrap ${className}`}
      style={{
        borderColor: "#e0e0e0",
        borderRadius: "6px",
      }}
    >
      {/* Action Buttons Group */}
      <div className="flex items-center gap-2">
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="px-4 py-2 rounded text-white font-medium text-sm transition-all hover:opacity-90"
            style={{
              background: "#d32f2f",
              borderRadius: "4px",
            }}
            title="Clear All Elements"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </div>
          </button>
        )}

        {onExportLayout && (
          <button
            onClick={onExportLayout}
            className="px-4 py-2 rounded text-white font-medium text-sm transition-all hover:opacity-90"
            style={{
              background: "#1a1a1a",
              borderRadius: "4px",
            }}
            title="Export Layout as JSON"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </div>
          </button>
        )}

        {onSaveTemplate && (
          <button
            onClick={onSaveTemplate}
            className="px-4 py-2 rounded text-white font-medium text-sm transition-all hover:opacity-90"
            style={{
              background: "#1a1a1a",
              borderRadius: "4px",
            }}
            title="Save as Template"
          >
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>Save Template</span>
            </div>
          </button>
        )}

        {onGenerateReport && (
          <button
            onClick={onGenerateReport}
            className="px-4 py-2 rounded text-white font-medium text-sm transition-all hover:opacity-90"
            style={{
              background: "#1a1a1a",
              borderRadius: "4px",
            }}
            title="Generate Guest Report"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Report</span>
            </div>
          </button>
        )}
      </div>

      {/* Divider */}
      <div
        className="h-8 w-px"
        style={{ background: "#e0e0e0" }}
      ></div>

      {/* Toggle Options Group */}
      <div className="flex items-center gap-4">
        {onSnapToGridChange && (
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => onSnapToGridChange(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
              style={{
                accentColor: "#1a1a1a",
              }}
            />
            <Grid3x3 className="w-4 h-4" />
            <span>Snap to Grid</span>
          </label>
        )}

        {onShowLabelsChange && (
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => onShowLabelsChange(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
              style={{
                accentColor: "#1a1a1a",
              }}
            />
            <Eye className="w-4 h-4" />
            <span>Show Labels</span>
          </label>
        )}
      </div>
    </div>
  );
}
