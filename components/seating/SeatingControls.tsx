"use client";

import React from "react";
import { Undo, ZoomIn, ZoomOut, Maximize2, Save, Download } from "lucide-react";

interface SeatingControlsProps {
  onUndo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  canUndo?: boolean;
  zoom?: number;
}

export default function SeatingControls({
  onUndo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSave,
  onExport,
  canUndo = false,
  zoom = 1.0,
}: SeatingControlsProps) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
      {/* Undo */}
      {onUndo && (
        <>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Undo last action (Ctrl+Z)"
          >
            <Undo className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-200" />
        </>
      )}

      {/* Zoom Controls */}
      {(onZoomIn || onZoomOut || onResetZoom) && (
        <>
          <button
            onClick={onZoomOut}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <div className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {(zoom * 100).toFixed(0)}%
          </div>

          <button
            onClick={onZoomIn}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <button
            onClick={onResetZoom}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset zoom (0)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-200" />
        </>
      )}

      {/* Save/Export */}
      {onSave && (
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Save layout"
        >
          <Save className="w-4 h-4" />
          <span className="text-sm font-medium">Save</span>
        </button>
      )}

      {onExport && (
        <button
          onClick={onExport}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Export layout"
        >
          <Download className="w-5 h-5" />
        </button>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="ml-auto text-xs text-gray-500 hidden lg:block">
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">Ctrl+Z</kbd> Undo
        <span className="mx-2">•</span>
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">+/-</kbd> Zoom
      </div>
    </div>
  );
}

// Hook for managing zoom and undo state
export function useSeatingControls() {
  const [zoom, setZoom] = React.useState(1.0);
  const [history, setHistory] = React.useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);

  const addToHistory = (state: any) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      return history[historyIndex - 1];
    }
    return null;
  };

  const zoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 2.0));
  };

  const zoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };

  const resetZoom = () => {
    setZoom(1.0);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }

      // + for zoom in
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      }

      // - for zoom out
      if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      }

      // 0 for reset zoom
      if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, zoom]);

  return {
    zoom,
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    addToHistory,
    undo,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
