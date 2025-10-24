"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MasonryGrid } from "@/components/events/MasonryGrid";
import { GridView } from "@/components/events/GridView";
import { ListView } from "@/components/events/ListView";
import { SearchFilters } from "@/components/events/SearchFilters";
import { ViewToggle } from "@/components/events/ViewToggle";
import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "masonry">("masonry");

  // Fetch published events
  const events = useQuery(api.public.queries.getPublishedEvents, {
    limit: 100,
  });

  // Filter events based on search and category
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let filtered = events;

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.city.toLowerCase().includes(searchLower) ||
          event.location.state.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((event) =>
        event.categories.includes(selectedCategory)
      );
    }

    return filtered;
  }, [events, searchQuery, selectedCategory]);

  const isLoading = events === undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <Calendar className="w-8 h-8 text-blue-600" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  SteppersLife Events
                </h1>
                <p className="text-sm text-gray-500">
                  Discover amazing stepping events
                </p>
              </div>
            </Link>

            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <Link
                href="/my-tickets"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                My Tickets
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/organizer/events/create"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Event</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <SearchFilters
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            selectedCategory={selectedCategory}
          />
        </motion.div>

        {/* Results Count and View Toggle */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          {filteredEvents && (
            <p className="text-gray-600">
              {filteredEvents.length}{" "}
              {filteredEvents.length === 1 ? "event" : "events"} found
            </p>
          )}

          <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading events...</p>
          </div>
        )}

        {/* Event Views */}
        {!isLoading && (
          <>
            {viewMode === "masonry" && <MasonryGrid events={filteredEvents || []} />}
            {viewMode === "grid" && <GridView events={filteredEvents || []} />}
            {viewMode === "list" && <ListView events={filteredEvents || []} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-sm text-gray-600">
                SteppersLife Events is your premier platform for discovering and
                attending stepping events.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">For Organizers</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/organizer/events/create" className="hover:text-blue-600">
                    Create Event
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-blue-600">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-blue-600">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/privacy" className="hover:text-blue-600">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-blue-600">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
            <p>&copy; 2025 SteppersLife Events. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
