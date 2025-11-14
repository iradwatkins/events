"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Ticket } from "lucide-react";
import { formatEventDate, formatEventTime } from "@/lib/date-format";

interface MasonryEventCardProps {
  event: {
    _id: string;
    name: string;
    startDate?: number;
    timezone?: string;
    imageUrl?: string;
    images: string[];
    eventType: string;
    ticketsVisible?: boolean;
    organizerName?: string;
    isClaimable?: boolean;
  };
}

export function MasonryEventCard({ event }: MasonryEventCardProps) {
  // Use imageUrl from event, fallback to Unsplash random images
  const imageUrl =
    event.imageUrl ||
    (event.images && event.images[0]) ||
    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80`;

  return (
    <Link href={`/events/${event._id}`} className="group block cursor-pointer">
      <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
        {/* Full-height Event Image with natural aspect ratio */}
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={event.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UzZTNlMyIvPjwvc3ZnPg=="
          />
        </div>

        {/* Gradient overlay for better badge visibility */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-lg" />

        {/* Event Type Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
            {event.eventType.replace("_", " ")}
          </span>
        </div>

        {/* Tickets Available Badge - Top Right */}
        {event.ticketsVisible && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-sm">
              <Ticket className="w-3 h-3" />
              <span>Available</span>
            </div>
          </div>
        )}

        {/* Date Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
            <Calendar className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-semibold text-gray-900">
              {formatEventDate(event.startDate, event.timezone)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
