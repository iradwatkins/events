"use client";

import { useState, useMemo } from "react";
import { MasonryGrid } from "@/components/events/MasonryGrid";
import { GridView } from "@/components/events/GridView";
import { ListView } from "@/components/events/ListView";
import { SearchFilters } from "@/components/events/SearchFilters";
import { ViewToggle } from "@/components/events/ViewToggle";

interface Event {
  _id: string;
  name: string;
  description: string;
  location?: string | { city?: string; state?: string };
  categories?: string[];
  [key: string]: any;
}

interface HomePageContentProps {
  initialEvents: Event[];
}

export function HomePageContent({ initialEvents }: HomePageContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "masonry">("masonry");
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Filter events based on search and category
  const filteredEvents = useMemo(() => {
    let filtered = initialEvents;

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          (event.location &&
            typeof event.location === "object" &&
            event.location.city &&
            event.location.city.toLowerCase().includes(searchLower)) ||
          (event.location &&
            typeof event.location === "object" &&
            event.location.state &&
            event.location.state.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((event) => event.categories?.includes(selectedCategory));
    }

    return filtered;
  }, [initialEvents, searchQuery, selectedCategory]);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Search & Filters */}
      <div className="mb-8">
        <SearchFilters
          onSearchChange={setSearchQuery}
          onCategoryChange={setSelectedCategory}
          selectedCategory={selectedCategory}
          showPastEvents={showPastEvents}
          onTogglePastEvents={setShowPastEvents}
        />
      </div>

      {/* Results Count and View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} found
        </p>
        <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Event Views */}
      {viewMode === "masonry" && <MasonryGrid events={filteredEvents} />}
      {viewMode === "grid" && <GridView events={filteredEvents} />}
      {viewMode === "list" && <ListView events={filteredEvents} />}
    </main>
  );
}
