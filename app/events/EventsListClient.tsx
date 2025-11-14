"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Calendar, MapPin, Tag, Clock, Search, Filter } from "lucide-react";
import { useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function EventsListClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [showPastEvents, setShowPastEvents] = useState(false);

  const events = useQuery(api.public.queries.getPublishedEvents, {
    searchTerm: searchTerm || undefined,
    category: selectedCategory,
    includePast: showPastEvents,
  });

  const categories = useQuery(api.public.queries.getCategories, {});

  // Format date
  function formatEventDate(timestamp: number, timezone?: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone || "America/New_York",
    });
  }

  // Format time
  function formatEventTime(timestamp: number, timezone?: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone || "America/New_York",
    });
  }

  if (events === undefined) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading events...</p>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Page Title */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">All Events</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Discover amazing stepping events, workshops, and socials
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events by name, description, or location..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || undefined)}
                  className="pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories?.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Past Events Toggle */}
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={showPastEvents}
                  onChange={(e) => setShowPastEvents(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show past events
                </span>
              </label>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedCategory) && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent text-accent-foreground">
                    Search: {searchTerm}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-2 text-primary hover:text-primary/80"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent text-accent-foreground">
                    Category: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory(undefined)}
                      className="ml-2 text-primary hover:text-primary/80"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Events Grid */}
        <div className="container mx-auto px-4 py-8">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No events found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedCategory
                  ? "Try adjusting your filters to find more events"
                  : "Check back soon for upcoming events!"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Showing {events.length} {events.length === 1 ? "event" : "events"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  const isPast = event.endDate && event.endDate < Date.now();

                  return (
                    <Link
                      key={event._id}
                      href={`/events/${event._id}`}
                      className="group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      {/* Event Image */}
                      <div className="relative h-48 bg-gradient-to-br from-primary to-primary/80 overflow-hidden">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-white opacity-50" />
                          </div>
                        )}
                        {isPast && (
                          <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Past Event
                          </div>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="p-5">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {event.name}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        {/* Date & Time */}
                        <div className="flex items-start gap-2 mb-2 text-sm text-gray-700 dark:text-gray-300">
                          <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                          <div>
                            <div className="font-medium">
                              {formatEventDate(event.startDate, event.timezone)}
                            </div>
                            {event.eventTimeLiteral && (
                              <div className="text-gray-600 dark:text-gray-400">
                                {event.eventTimeLiteral}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        {event.location && (
                          <div className="flex items-center gap-2 mb-3 text-sm text-gray-700 dark:text-gray-300">
                            <MapPin className="w-4 h-4 shrink-0 text-primary" />
                            <span>
                              {event.location.venueName && `${event.location.venueName}, `}
                              {event.location.city}, {event.location.state}
                            </span>
                          </div>
                        )}

                        {/* Categories */}
                        {event.categories && event.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {event.categories.slice(0, 3).map((category, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground"
                              >
                                <Tag className="w-3 h-3" />
                                {category}
                              </span>
                            ))}
                            {event.categories.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                +{event.categories.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            by {event.organizerName || "SteppersLife"}
                          </span>
                          <span className="text-primary font-medium group-hover:underline">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
