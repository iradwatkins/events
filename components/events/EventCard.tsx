"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Ticket, Clock } from "lucide-react";
import { formatEventDate, formatEventTime } from "@/lib/date-format";

interface EventCardProps {
  event: {
    _id: string;
    name: string;
    description: string;
    startDate?: number;
    timezone?: string;
    location: {
      city: string;
      state: string;
    };
    images: string[];
    imageUrl?: string;
    eventType: string;
    categories: string[];
    ticketsVisible?: boolean;
    organizerName?: string;
    isClaimable?: boolean;
  };
}

export function EventCard({ event }: EventCardProps) {
  // Use imageUrl from event, fallback to Unsplash random images
  const imageUrl =
    event.imageUrl ||
    (event.images && event.images[0]) ||
    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80`;

  return (
    <Link href={`/events/${event._id}`} className="group block cursor-pointer">
      <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
        {/* Event Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={imageUrl}
            alt={event.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2UzZTNlMyIvPjwvc3ZnPg=="
          />

          {/* Event Type Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
              {event.eventType.replace("_", " ")}
            </span>
          </div>

          {/* Tickets Available Badge */}
          {event.ticketsVisible && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-sm">
                <Ticket className="w-3 h-3" />
                <span>Available</span>
              </div>
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="p-4 space-y-2">
          {/* Event Name */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.name}
          </h3>

          {/* Date & Time - Always in EVENT's timezone */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatEventDate(event.startDate, event.timezone)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatEventTime(event.startDate, event.timezone)}</span>
          </div>

          {/* Location */}
          {event.location && (event.location.city || event.location.state) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                {event.location.city && event.location.state
                  ? `${event.location.city}, ${event.location.state}`
                  : event.location.city || event.location.state}
              </span>
            </div>
          )}

          {/* Categories */}
          {event.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.categories.slice(0, 2).map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {category}
                </span>
              ))}
              {event.categories.length > 2 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  +{event.categories.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
