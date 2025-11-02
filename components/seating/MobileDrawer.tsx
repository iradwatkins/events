"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  snapPoints?: number[]; // Percentage heights [30, 60, 90]
  className?: string;
}

export function MobileDrawer({
  children,
  defaultOpen = false,
  snapPoints = [30, 60, 90],
  className,
}: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [snapIndex, setSnapIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const currentHeight = snapPoints[snapIndex];

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = startY - currentY;
    const threshold = 50; // Minimum swipe distance

    if (deltaY > threshold && snapIndex < snapPoints.length - 1) {
      // Swipe up - expand
      setSnapIndex(snapIndex + 1);
      setIsOpen(true);
    } else if (deltaY < -threshold && snapIndex > 0) {
      // Swipe down - collapse
      setSnapIndex(snapIndex - 1);
      if (snapIndex - 1 === 0) {
        setIsOpen(false);
      }
    } else if (deltaY < -threshold && snapIndex === 0) {
      // Close completely
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      setSnapIndex(1); // Open to middle snap point
    } else {
      setIsOpen(false);
      setSnapIndex(0);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white rounded-t-2xl shadow-2xl",
          "transition-transform duration-300 ease-out",
          "md:hidden", // Only show on mobile
          className
        )}
        style={{
          height: isOpen ? `${currentHeight}vh` : "60px",
          transform: isDragging
            ? `translateY(${Math.max(0, currentY - startY)}px)`
            : "translateY(0)",
        }}
      >
        {/* Handle */}
        <div
          className="flex flex-col items-center justify-center pt-2 pb-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleToggle}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-2" />
          <GripHorizontal className="h-4 w-4 text-gray-400" />
        </div>

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Content */}
        <div
          className={cn(
            "overflow-y-auto px-4 pb-4",
            !isOpen && "opacity-0 pointer-events-none"
          )}
          style={{
            height: isOpen ? `calc(${currentHeight}vh - 60px)` : "0",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * Simplified mobile drawer with just open/close states
 */
export function SimpleMobileDrawer({
  children,
  isOpen,
  onClose,
  title,
  className,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white rounded-t-2xl shadow-2xl",
          "transition-transform duration-300 ease-out",
          "md:hidden",
          isOpen ? "translate-y-0" : "translate-y-full",
          className
        )}
        style={{ height: "70vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronDown className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 py-4" style={{ height: "calc(70vh - 64px)" }}>
          {children}
        </div>
      </div>
    </>
  );
}
