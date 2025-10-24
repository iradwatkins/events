"use client";

import { MasonryEventCard } from "./MasonryEventCard";

interface MasonryGridProps {
  events: any[];
}

export function MasonryGrid({ events }: MasonryGridProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No events found</p>
        <p className="text-gray-400 text-sm mt-2">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  // Split events into 4 columns for desktop
  const desktopColumns = [[], [], [], []] as any[][];
  events.forEach((event, index) => {
    desktopColumns[index % 4].push(event);
  });

  // Split events into 2 columns for mobile
  const mobileColumns = [[], []] as any[][];
  events.forEach((event, index) => {
    mobileColumns[index % 2].push(event);
  });

  return (
    <>
      {/* Desktop: 4-column masonry grid */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {desktopColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="grid gap-4">
            {column.map((event: any) => (
              <MasonryEventCard key={event._id} event={event} />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile: 2-column masonry grid */}
      <div className="md:hidden grid grid-cols-2 gap-4">
        {mobileColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="grid gap-4">
            {column.map((event: any) => (
              <MasonryEventCard key={event._id} event={event} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
