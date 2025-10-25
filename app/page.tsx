"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
// TESTING MODE: No authentication
// import { useSession, signOut } from "next-auth/react";
import { api } from "@/convex/_generated/api";
import { MasonryGrid } from "@/components/events/MasonryGrid";
import { GridView } from "@/components/events/GridView";
import { ListView } from "@/components/events/ListView";
import { SearchFilters } from "@/components/events/SearchFilters";
import { ViewToggle } from "@/components/events/ViewToggle";
import Link from "next/link";
import { Plus, LogOut, User, Ticket, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Home() {
  // TESTING MODE: No authentication
  // const { data: session, status } = useSession();
  const session: any = null;
  const status = "unauthenticated" as const;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "masonry">("masonry");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          (event.location && typeof event.location === "object" && event.location.city && event.location.city.toLowerCase().includes(searchLower)) ||
          (event.location && typeof event.location === "object" && event.location.state && event.location.state.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((event) => event.categories?.includes(selectedCategory));
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
            <Link href="/" className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative w-12 h-12"
              >
                <Image
                  src="/logos/stepperslife-logo-dark.svg"
                  alt="SteppersLife Events Logo"
                  fill
                  className="object-contain"
                />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SteppersLife Events</h1>
                <p className="text-sm text-gray-500">Discover amazing stepping events</p>
              </div>
            </Link>

            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              {/* TESTING MODE: Authentication disabled */}
              {false ? (
                <>
                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                        >
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {session?.user?.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                          </div>

                          {/* Menu Items */}
                          <Link
                            href="/my-tickets"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Ticket className="w-4 h-4" />
                            My Tickets
                          </Link>
                          <Link
                            href="/organizer/events"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                            My Events
                          </Link>

                          {/* Sign Out */}
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              // signOut();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Create Event Button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/organizer/events/create"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create</span>
                    </Link>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Logged out navigation */}
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
                      <span className="hidden sm:inline">Create</span>
                    </Link>
                  </motion.div>
                </>
              )}
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
              {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} found
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
                SteppersLife Events is your premier platform for discovering and attending stepping
                events.
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
