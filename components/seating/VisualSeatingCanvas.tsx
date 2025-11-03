"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  Grid as GridIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import TableRenderer from "./TableRenderer";
import RowRenderer from "./RowRenderer";

interface Table {
  id: string;
  number: string | number;
  shape: "ROUND" | "RECTANGULAR" | "SQUARE" | "CUSTOM";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  capacity: number;
  seats: any[];
}

interface Section {
  id: string;
  name: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  containerType?: "ROWS" | "TABLES";
  rows?: any[];
  tables?: Table[];
  ticketTierId?: any;
}

interface VisualSeatingCanvasProps {
  venueImageUrl?: string;
  sections: Section[];
  onSectionUpdate: (sectionId: string, updates: Partial<Section>) => void;
  selectedSectionId?: string;
  onSectionSelect: (sectionId: string) => void;
  // Table-specific props
  selectedTableId?: string;
  onTableSelect?: (sectionId: string, tableId: string) => void;
  onTableUpdate?: (sectionId: string, tableId: string, updates: Partial<Table>) => void;
  onTableDrop?: (config: any, x: number, y: number) => void;
  onTableContextMenu?: (e: React.MouseEvent, sectionId: string, tableId: string, tableNumber: string | number) => void;
  // Row-specific props
  onRowUpdate?: (sectionId: string, rowId: string, updates: any) => void;
  // Display control props
  showGrid?: boolean;
  showLabels?: boolean;
  // Multi-selection props
  selectedElementIds?: Set<string>;
  onMultiSelect?: (elementIds: Set<string>) => void;
}

export default function VisualSeatingCanvas({
  venueImageUrl,
  sections,
  onSectionUpdate,
  selectedSectionId,
  onSectionSelect,
  selectedTableId,
  onTableSelect,
  onTableUpdate,
  onTableDrop,
  onTableContextMenu,
  onRowUpdate,
  showGrid = true,
  showLabels = true,
  selectedElementIds,
  onMultiSelect,
}: VisualSeatingCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [isResizingTable, setIsResizingTable] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // Drag-and-drop from library state
  const [isDraggingFromLibrary, setIsDraggingFromLibrary] = useState(false);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggedTableConfig, setDraggedTableConfig] = useState<any>(null);
  const dragStartPos = useRef({ x: 0, y: 0, sectionX: 0, sectionY: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const tableDragStartPos = useRef({ x: 0, y: 0, tableX: 0, tableY: 0 });
  const tableResizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0, tableX: 0, tableY: 0 });
  const currentDraggingTable = useRef<{ sectionId: string; tableId: string; isRow?: boolean } | null>(null);
  const currentResizingTable = useRef<{ sectionId: string; tableId: string; corner: string } | null>(null);
  const groupDragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Grid configuration
  const GRID_SIZE = 50; // Must match the grid size in CSS (line 781)
  const CANVAS_WIDTH = 3000;
  const CANVAS_HEIGHT = 2000;

  // Snap to grid function
  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Constrain to canvas bounds
  const constrainToBounds = (x: number, y: number, width: number, height: number) => {
    const constrainedX = Math.max(0, Math.min(x, CANVAS_WIDTH - width));
    const constrainedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - height));
    return { x: constrainedX, y: constrainedY };
  };

  // Handle section dragging
  useEffect(() => {
    if (!isDragging || !selectedSectionId) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleSectionDrag(e, selectedSectionId);
    };

    const handleMouseUp = () => {
      handleSectionDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, selectedSectionId]);

  // Handle section resizing
  useEffect(() => {
    if (!isResizing || !selectedSectionId) return;

    const handleMouseMove = (e: MouseEvent) => {
      // We need to track which corner is being resized
      // For now, we'll use a simple approach
      handleResize(e, selectedSectionId, "se");
    };

    const handleMouseUp = () => {
      handleResizeEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing, selectedSectionId]);

  // Handle table dragging
  useEffect(() => {
    if (!isDraggingTable || !currentDraggingTable.current) return;

    const { sectionId, tableId } = currentDraggingTable.current;

    const handleMouseMove = (e: MouseEvent) => {
      handleTableDrag(e, sectionId, tableId);
    };

    const handleMouseUp = () => {
      handleTableDragEnd();
      currentDraggingTable.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingTable]);

  const handleSectionDragStart = (
    e: React.MouseEvent,
    section: Section
  ) => {
    e.stopPropagation();
    setIsDragging(true);
    onSectionSelect(section.id);

    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      sectionX: section.x || 0,
      sectionY: section.y || 0,
    };
  };

  const handleSectionDrag = useCallback(
    (e: MouseEvent, sectionId: string) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      onSectionUpdate(sectionId, {
        x: dragStartPos.current.sectionX + deltaX,
        y: dragStartPos.current.sectionY + deltaY,
      });
    },
    [isDragging, onSectionUpdate]
  );

  const handleSectionDragEnd = () => {
    setIsDragging(false);
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    section: Section,
    corner: string
  ) => {
    e.stopPropagation();
    setIsResizing(true);
    onSectionSelect(section.id);

    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: section.width || 200,
      height: section.height || 150,
    };
  };

  const handleResize = useCallback(
    (e: MouseEvent, sectionId: string, corner: string) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;

      let newWidth = resizeStartPos.current.width;
      let newHeight = resizeStartPos.current.height;

      if (corner.includes("e")) newWidth += deltaX;
      if (corner.includes("w")) newWidth -= deltaX;
      if (corner.includes("s")) newHeight += deltaY;
      if (corner.includes("n")) newHeight -= deltaY;

      onSectionUpdate(sectionId, {
        width: Math.max(100, newWidth),
        height: Math.max(80, newHeight),
      });
    },
    [isResizing, onSectionUpdate]
  );

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  const rotateSection = (sectionId: string, currentRotation: number = 0) => {
    onSectionUpdate(sectionId, {
      rotation: (currentRotation + 15) % 360,
    });
  };

  const getTotalSeats = (section: Section) => {
    let total = 0;
    if (section.rows) {
      total += section.rows.reduce((sum, row) => sum + row.seats.length, 0);
    }
    if (section.tables) {
      total += section.tables.reduce((sum, table) => sum + table.seats.length, 0);
    }
    return total;
  };

  const handleTableDragStart = (
    e: React.MouseEvent,
    sectionId: string,
    table: Table | any,
    isRow: boolean = false
  ) => {
    e.stopPropagation();
    setIsDraggingTable(true);
    currentDraggingTable.current = { sectionId, tableId: table.id, isRow };
    if (onTableSelect) {
      onTableSelect(sectionId, table.id);
    }

    tableDragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      tableX: table.x || 0,
      tableY: table.y || 0,
    };

    // If dragging a selected group, store all element positions
    if (selectedElementIds && selectedElementIds.size > 0 && selectedElementIds.has(table.id)) {
      const positions = new Map<string, { x: number; y: number }>();

      sections.forEach((section) => {
        section.tables?.forEach((t) => {
          if (selectedElementIds.has(t.id)) {
            positions.set(t.id, { x: t.x, y: t.y });
          }
        });

        section.rows?.forEach((r: any) => {
          if (selectedElementIds.has(r.id)) {
            positions.set(r.id, { x: r.x || 0, y: r.y || 0 });
          }
        });
      });

      groupDragStartPositions.current = positions;
    } else {
      groupDragStartPositions.current.clear();
    }
  };

  const handleTableDrag = useCallback(
    (e: MouseEvent, sectionId: string, tableId: string) => {
      if (!isDraggingTable) return;

      // Calculate movement delta in screen coordinates
      const deltaX = e.clientX - tableDragStartPos.current.x;
      const deltaY = e.clientY - tableDragStartPos.current.y;

      // Convert to SVG coordinates (3000x2000 viewBox)
      // Scale factor depends on canvas size - use a reasonable conversion
      const scaleFactor = 2; // Adjust movement sensitivity
      const svgDeltaX = deltaX * scaleFactor;
      const svgDeltaY = deltaY * scaleFactor;

      // Check if we're dragging a selected group
      if (groupDragStartPositions.current.size > 0) {
        // Move all selected elements together using stored positions
        sections.forEach((section) => {
          // Move selected tables
          section.tables?.forEach((table) => {
            const startPos = groupDragStartPositions.current.get(table.id);
            if (startPos && onTableUpdate) {
              // Calculate new position
              const rawX = startPos.x + svgDeltaX;
              const rawY = startPos.y + svgDeltaY;

              // Apply snap-to-grid
              const snappedX = snapToGrid(rawX);
              const snappedY = snapToGrid(rawY);

              // Constrain to canvas bounds
              const { x: finalX, y: finalY } = constrainToBounds(snappedX, snappedY, table.width, table.height);

              onTableUpdate(section.id, table.id, {
                x: finalX,
                y: finalY,
              });
            }
          });

          // Move selected rows
          section.rows?.forEach((row: any) => {
            const startPos = groupDragStartPositions.current.get(row.id);
            if (startPos && onRowUpdate) {
              // Calculate new position
              const rawX = startPos.x + svgDeltaX;
              const rawY = startPos.y + svgDeltaY;

              // Apply snap-to-grid
              const snappedX = snapToGrid(rawX);
              const snappedY = snapToGrid(rawY);

              // Constrain to canvas bounds (use default width/height for rows)
              const { x: finalX, y: finalY } = constrainToBounds(snappedX, snappedY, 800, 60);

              onRowUpdate(section.id, row.id, {
                x: finalX,
                y: finalY,
              });
            }
          });
        });
      } else {
        // Single element drag
        const isRow = currentDraggingTable.current?.isRow;
        const updateFn = isRow ? onRowUpdate : onTableUpdate;

        if (!updateFn) return;

        // Calculate new position
        const rawX = tableDragStartPos.current.tableX + svgDeltaX;
        const rawY = tableDragStartPos.current.tableY + svgDeltaY;

        // Apply snap-to-grid
        const snappedX = snapToGrid(rawX);
        const snappedY = snapToGrid(rawY);

        // Get table dimensions for boundary checking
        const table = sections.find(s => s.id === sectionId)?.tables?.find(t => t.id === tableId);
        const row = sections.find(s => s.id === sectionId)?.rows?.find((r: any) => r.id === tableId);
        const width = table?.width || 800; // default width for rows
        const height = table?.height || 60; // default height for rows

        // Constrain to canvas bounds
        const { x: finalX, y: finalY } = constrainToBounds(snappedX, snappedY, width, height);

        updateFn(sectionId, tableId, {
          x: finalX,
          y: finalY,
        });
      }
    },
    [isDraggingTable, onTableUpdate, onRowUpdate, sections, snapToGrid, constrainToBounds]
  );

  const handleTableDragEnd = () => {
    setIsDraggingTable(false);
    groupDragStartPositions.current.clear();
  };

  // Handle table resizing
  const handleTableResizeStart = (
    sectionId: string,
    tableId: string,
    corner: string,
    e: React.MouseEvent,
    table: Table
  ) => {
    e.stopPropagation();
    setIsResizingTable(true);
    currentResizingTable.current = { sectionId, tableId, corner };

    tableResizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: table.width,
      height: table.height,
      tableX: table.x,
      tableY: table.y,
    };
  };

  const handleTableResize = useCallback(
    (e: MouseEvent, sectionId: string, tableId: string, corner: string) => {
      if (!isResizingTable || !onTableUpdate) return;

      const deltaX = e.clientX - tableResizeStartPos.current.x;
      const deltaY = e.clientY - tableResizeStartPos.current.y;
      const scaleFactor = 2;

      const scaledDeltaX = deltaX * scaleFactor;
      const scaledDeltaY = deltaY * scaleFactor;

      let newWidth = tableResizeStartPos.current.width;
      let newHeight = tableResizeStartPos.current.height;
      let newX = tableResizeStartPos.current.tableX;
      let newY = tableResizeStartPos.current.tableY;

      // Calculate new dimensions based on corner being dragged
      switch (corner) {
        case "nw": // Top-left
          newWidth = tableResizeStartPos.current.width - scaledDeltaX;
          newHeight = tableResizeStartPos.current.height - scaledDeltaY;
          newX = tableResizeStartPos.current.tableX + scaledDeltaX;
          newY = tableResizeStartPos.current.tableY + scaledDeltaY;
          break;
        case "ne": // Top-right
          newWidth = tableResizeStartPos.current.width + scaledDeltaX;
          newHeight = tableResizeStartPos.current.height - scaledDeltaY;
          newY = tableResizeStartPos.current.tableY + scaledDeltaY;
          break;
        case "sw": // Bottom-left
          newWidth = tableResizeStartPos.current.width - scaledDeltaX;
          newHeight = tableResizeStartPos.current.height + scaledDeltaY;
          newX = tableResizeStartPos.current.tableX + scaledDeltaX;
          break;
        case "se": // Bottom-right
          newWidth = tableResizeStartPos.current.width + scaledDeltaX;
          newHeight = tableResizeStartPos.current.height + scaledDeltaY;
          break;
      }

      // Minimum size constraints
      newWidth = Math.max(100, newWidth);
      newHeight = Math.max(80, newHeight);

      onTableUpdate(sectionId, tableId, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      });
    },
    [isResizingTable, onTableUpdate]
  );

  const handleTableResizeEnd = () => {
    setIsResizingTable(false);
    currentResizingTable.current = null;
  };

  // Handle table resize dragging
  useEffect(() => {
    if (!isResizingTable || !currentResizingTable.current) return;

    const { sectionId, tableId, corner } = currentResizingTable.current;

    const handleMouseMove = (e: MouseEvent) => {
      handleTableResize(e, sectionId, tableId, corner);
    };

    const handleMouseUp = () => {
      handleTableResizeEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizingTable]);

  // Handle drag-select rectangle
  const handleSelectionStart = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only start selection if Shift key is held and clicking on canvas background
    if (!e.shiftKey) return;

    if ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).tagName === 'rect') {
      const svg = svgRef.current;
      if (!svg) return;

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      setIsSelecting(true);
      setSelectionBox({
        startX: svgP.x,
        startY: svgP.y,
        endX: svgP.x,
        endY: svgP.y,
      });
    }
  };

  const handleSelectionMove = (e: MouseEvent) => {
    if (!isSelecting || !selectionBox || !svgRef.current) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    setSelectionBox({
      ...selectionBox,
      endX: svgP.x,
      endY: svgP.y,
    });
  };

  const handleSelectionEnd = () => {
    if (selectionBox && onMultiSelect) {
      // Calculate which elements are within selection
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);

      const selectedIds = new Set<string>();

      // Check all tables and rows
      sections.forEach((section) => {
        // Check tables
        section.tables?.forEach((table) => {
          const tableMinX = table.x;
          const tableMaxX = table.x + table.width;
          const tableMinY = table.y;
          const tableMaxY = table.y + table.height;

          // Check if table overlaps with selection box
          if (
            tableMinX < maxX &&
            tableMaxX > minX &&
            tableMinY < maxY &&
            tableMaxY > minY
          ) {
            selectedIds.add(table.id);
          }
        });

        // Check rows
        section.rows?.forEach((row: any) => {
          if (row.x !== undefined && row.y !== undefined) {
            const rowMinX = row.x;
            const rowMaxX = row.x + 800; // Approximate row width
            const rowMinY = row.y - 30;
            const rowMaxY = row.y + 30;

            if (
              rowMinX < maxX &&
              rowMaxX > minX &&
              rowMinY < maxY &&
              rowMaxY > minY
            ) {
              selectedIds.add(row.id);
            }
          }
        });
      });

      onMultiSelect(selectedIds);
    }

    setIsSelecting(false);
    setSelectionBox(null);
  };

  // Handle selection drag
  useEffect(() => {
    if (!isSelecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleSelectionMove(e);
    };

    const handleMouseUp = () => {
      handleSelectionEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelecting]);

  // Handle drag-and-drop from library
  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";

    // Update drag preview position
    if (svgRef.current && isDraggingFromLibrary) {
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      setDragPreviewPosition({ x: svgP.x, y: svgP.y });
    }
  };

  const handleCanvasDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.types.includes("application/json");
    if (data) {
      setIsDraggingFromLibrary(true);
    }
  };

  const handleCanvasDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only hide if leaving the canvas entirely
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )) {
      setIsDraggingFromLibrary(false);
      setDragPreviewPosition(null);
      setDraggedTableConfig(null);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFromLibrary(false);
    setDragPreviewPosition(null);

    // Get table config from dataTransfer
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "table-from-library" && onTableDrop && svgRef.current) {
        // Convert screen coordinates to SVG coordinates
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

        // Apply snap-to-grid to drop position
        const snappedX = snapToGrid(svgP.x);
        const snappedY = snapToGrid(svgP.y);

        // Constrain to canvas bounds (use default table size)
        const { x: finalX, y: finalY } = constrainToBounds(snappedX, snappedY, 100, 100);

        // Call the drop handler with config and snapped SVG coordinates
        onTableDrop(data.config, finalX, finalY);
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }

    setDraggedTableConfig(null);
  };

  // Update dragged table config when drag starts
  useEffect(() => {
    const handleDrag = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("application/json")) {
        try {
          const data = JSON.parse(e.dataTransfer.getData("application/json"));
          if (data.type === "table-from-library") {
            setDraggedTableConfig(data.config);
          }
        } catch {
          // Ignore errors during drag
        }
      }
    };

    window.addEventListener("drag", handleDrag);
    return () => window.removeEventListener("drag", handleDrag);
  }, []);

  return (
    <div id="seating-canvas" className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Controls Bar - Grid/Label toggles removed per user request */}

      {/* Legend - Stats Only */}
      <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Floor Plan</h4>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Total Tables:</span>
            <span className="font-bold text-gray-900">
              {sections.reduce((count, s) => count + (s.tables?.length || 0), 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Total Seats:</span>
            <span className="font-bold text-gray-900">
              {sections.reduce((count, s) => {
                return count + (s.tables?.reduce((sum, t) => sum + t.capacity, 0) || 0);
              }, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <TransformWrapper
        initialScale={0.5}
        minScale={0.1}
        maxScale={5}
        centerOnInit
        wheel={{ step: 0.1 }}
        panning={{ disabled: true }}
        doubleClick={{ disabled: false, mode: "zoomIn" }}
        limitToBounds={true}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-2">
              <button
                onClick={() => zoomIn()}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => zoomOut()}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => resetTransform()}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Reset View"
              >
                <Maximize2 className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <TransformComponent
              wrapperStyle={{ width: "100%", height: "calc(100vh - 150px)", minHeight: "800px" }}
              contentStyle={{ width: "100%", height: "100%", minHeight: "800px" }}
            >
              <div
                ref={canvasRef}
                className="relative w-full h-full"
                style={{
                  backgroundImage: venueImageUrl ? `url(${venueImageUrl})` : 'none',
                  backgroundColor: venueImageUrl ? 'transparent' : '#f9fafb',
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  minWidth: "3000px",
                  minHeight: "2000px",
                  outline: isDraggingFromLibrary ? '3px dashed #3B82F6' : 'none',
                  outlineOffset: isDraggingFromLibrary ? '-6px' : '0',
                }}
                onDragOver={handleCanvasDragOver}
                onDragEnter={handleCanvasDragEnter}
                onDragLeave={handleCanvasDragLeave}
                onDrop={handleCanvasDrop}
              >
                {/* Grid Overlay */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                      `,
                      backgroundSize: "50px 50px",
                    }}
                  />
                )}

                {/* Empty State - Show when no tables or rows */}
                {sections.reduce((count, s) => count + (s.tables?.length || 0) + (s.rows?.length || 0), 0) === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <GridIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                      <p className="text-2xl font-light text-gray-400">
                        Click on a table to start
                      </p>
                    </div>
                  </div>
                )}

                {/* Section Boxes - REMOVED: We show tables directly now, no section containers */}

                {/* Tables and Rows SVG Overlay - Larger workspace */}
                <svg
                  ref={svgRef}
                  className="absolute inset-0"
                  style={{ width: "100%", height: "100%", overflow: "visible", pointerEvents: "auto" }}
                  viewBox="0 0 3000 2000"
                  preserveAspectRatio="xMidYMid meet"
                  onMouseDown={handleSelectionStart}
                >
                  {sections.map((section) => {
                    // Render tables
                    const tables = section.tables?.map((table) => {
                      const isSelected = selectedTableId === table.id || selectedElementIds?.has(table.id);

                      return (
                        <g
                          key={table.id}
                          style={{ pointerEvents: "auto", cursor: "move" }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleTableDragStart(
                              e as unknown as React.MouseEvent,
                              section.id,
                              table
                            );
                          }}
                          onContextMenu={(e) => {
                            if (onTableContextMenu) {
                              onTableContextMenu(e as unknown as React.MouseEvent, section.id, table.id, table.number);
                            }
                          }}
                        >
                          <TableRenderer
                            table={table}
                            isSelected={isSelected}
                            onClick={() => {
                              if (onTableSelect) {
                                onTableSelect(section.id, table.id);
                              }
                            }}
                            showSeats={true}
                            showLabel={showLabels}
                            scale={1}
                            onResizeStart={(corner, e) => {
                              handleTableResizeStart(section.id, table.id, corner, e, table);
                            }}
                          />
                        </g>
                      );
                    });

                    // Render theatre-style rows
                    const rows = section.rows?.map((row: any) => {
                      const isSelected = selectedTableId === row.id || selectedElementIds?.has(row.id);

                      return (
                        <g
                          key={row.id}
                          style={{ pointerEvents: "auto", cursor: "move" }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            // Use same drag handling but mark as row
                            handleTableDragStart(
                              e as unknown as React.MouseEvent,
                              section.id,
                              row,
                              true  // isRow = true
                            );
                          }}
                        >
                          <RowRenderer
                            row={row}
                            isSelected={isSelected}
                            onClick={() => {
                              if (onTableSelect) {
                                onTableSelect(section.id, row.id);
                              }
                            }}
                            scale={1}
                          />
                        </g>
                      );
                    });

                    return (
                      <g key={section.id}>
                        {tables}
                        {rows}
                      </g>
                    );
                  })}

                  {/* Drag Preview Ghost */}
                  {isDraggingFromLibrary && dragPreviewPosition && draggedTableConfig && (
                    <g opacity={0.5} pointerEvents="none">
                      {draggedTableConfig.shape === "ROUND" ? (
                        <circle
                          cx={dragPreviewPosition.x}
                          cy={dragPreviewPosition.y}
                          r={60}
                          fill="#3B82F6"
                          stroke="#1E40AF"
                          strokeWidth={3}
                        />
                      ) : draggedTableConfig.shape === "SQUARE" ? (
                        <rect
                          x={dragPreviewPosition.x - 60}
                          y={dragPreviewPosition.y - 60}
                          width={120}
                          height={120}
                          fill="#3B82F6"
                          stroke="#1E40AF"
                          strokeWidth={3}
                          rx={4}
                        />
                      ) : (
                        <rect
                          x={dragPreviewPosition.x - 90}
                          y={dragPreviewPosition.y - 50}
                          width={180}
                          height={100}
                          fill="#3B82F6"
                          stroke="#1E40AF"
                          strokeWidth={3}
                          rx={4}
                        />
                      )}
                      <text
                        x={dragPreviewPosition.x}
                        y={dragPreviewPosition.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        {draggedTableConfig.label}
                      </text>
                    </g>
                  )}

                  {/* Selection Rectangle */}
                  {selectionBox && (
                    <rect
                      x={Math.min(selectionBox.startX, selectionBox.endX)}
                      y={Math.min(selectionBox.startY, selectionBox.endY)}
                      width={Math.abs(selectionBox.endX - selectionBox.startX)}
                      height={Math.abs(selectionBox.endY - selectionBox.startY)}
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      pointerEvents="none"
                    />
                  )}
                </svg>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
