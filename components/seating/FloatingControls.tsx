"use client";

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isPanning?: boolean;
  className?: string;
}

export function FloatingControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToView,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isPanning = false,
  className,
}: FloatingControlsProps) {
  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 z-10",
        "flex flex-col gap-2",
        "bg-white/90 backdrop-blur-sm rounded-lg shadow-lg",
        "p-2 border border-gray-200",
        className
      )}
    >
      {/* Zoom Controls */}
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          title="Zoom In (Ctrl/Cmd + =)"
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="text-xs text-center font-medium px-1 py-0.5">
          {Math.round(zoom * 100)}%
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          title="Zoom Out (Ctrl/Cmd + -)"
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-px bg-gray-300" />

      {/* View Controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onFitToView}
        title="Fit to View (Ctrl/Cmd + 0)"
        className="h-8 w-8 p-0"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      {isPanning && (
        <div className="h-8 w-8 flex items-center justify-center">
          <Move className="h-4 w-4 text-blue-500" />
        </div>
      )}

      {/* Undo/Redo Controls (if available) */}
      {(onUndo || onRedo) && (
        <>
          <div className="h-px bg-gray-300" />

          {onUndo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl/Cmd + Z)"
              className="h-8 w-8 p-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          )}

          {onRedo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl/Cmd + Shift + Z)"
              className="h-8 w-8 p-0"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Keyboard shortcuts handler for canvas controls
 * Usage: Call this in a useEffect with the appropriate handlers
 */
export function useCanvasKeyboardShortcuts({
  onZoomIn,
  onZoomOut,
  onFitToView,
  onUndo,
  onRedo,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}) {
  if (typeof window === "undefined") return;

  const handleKeyDown = (e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      onZoomIn();
    } else if (isMod && (e.key === "-" || e.key === "_")) {
      e.preventDefault();
      onZoomOut();
    } else if (isMod && e.key === "0") {
      e.preventDefault();
      onFitToView();
    } else if (isMod && e.shiftKey && e.key === "Z" && onRedo) {
      e.preventDefault();
      onRedo();
    } else if (isMod && e.key === "z" && onUndo) {
      e.preventDefault();
      onUndo();
    }
  };

  return handleKeyDown;
}
