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

  return (
    <>
      {/* Desktop: 4 columns */}
      <div
        className="hidden md:block"
        style={{
          columnCount: 4,
          columnGap: '16px',
        }}
      >
        {events.map((event: any) => (
          <div
            key={event._id}
            style={{
              breakInside: 'avoid',
              marginBottom: '16px',
            }}
          >
            <MasonryEventCard event={event} />
          </div>
        ))}
      </div>

      {/* Tablet: 3 columns */}
      <div
        className="hidden sm:block md:hidden"
        style={{
          columnCount: 3,
          columnGap: '16px',
        }}
      >
        {events.map((event: any) => (
          <div
            key={event._id}
            style={{
              breakInside: 'avoid',
              marginBottom: '16px',
            }}
          >
            <MasonryEventCard event={event} />
          </div>
        ))}
      </div>

      {/* Mobile: 2 columns */}
      <div
        className="block sm:hidden"
        style={{
          columnCount: 2,
          columnGap: '12px',
        }}
      >
        {events.map((event: any) => (
          <div
            key={event._id}
            style={{
              breakInside: 'avoid',
              marginBottom: '12px',
            }}
          >
            <MasonryEventCard event={event} />
          </div>
        ))}
      </div>
    </>
  );
}
