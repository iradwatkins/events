"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import { MasonryGrid } from "@/components/events/MasonryGrid";
import { GridView } from "@/components/events/GridView";
import { ListView } from "@/components/events/ListView";
import { SearchFilters } from "@/components/events/SearchFilters";
import { ViewToggle } from "@/components/events/ViewToggle";
import { PublicFooter } from "@/components/layout/PublicFooter";
import Link from "next/link";
import { Plus, LogOut, User, Ticket, Calendar, LogIn, Sun, Moon, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function Home() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "masonry">("masonry");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Fetch published events (upcoming or past based on toggle)
  const upcomingEvents = useQuery(
    api.public.queries.getPublishedEvents,
    !showPastEvents ? { limit: 100 } : "skip"
  );

  const pastEvents = useQuery(
    api.public.queries.getPastEvents,
    showPastEvents ? { limit: 100 } : "skip"
  );

  // Fetch active products
  const products = useQuery(api.products.queries.getActiveProducts);

  const events = showPastEvents ? pastEvents : upcomingEvents;

  // Filter events based on search and category
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let filtered = events;

    // Remove duplicates based on _id (just in case)
    const seen = new Set();
    filtered = filtered.filter((event) => {
      if (seen.has(event._id)) {
        return false;
      }
      seen.add(event._id);
      return true;
    });

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50"
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SteppersLife Events</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Discover amazing stepping events</p>
              </div>
            </Link>

            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              {/* Theme Toggle Button */}
              {mounted && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  )}
                </motion.button>
              )}

              {isAuthenticated ? (
                <>
                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {user?.image ? (
                        <Image
                          src={user.image}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
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
                              {user?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
                          {user?.role === "admin" && (
                            <Link
                              href="/admin"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <User className="w-4 h-4" />
                              Admin Panel
                            </Link>
                          )}

                          {/* Sign Out */}
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              logout();
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
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create Event</span>
                    </Link>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Logged out navigation */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/organizer/events/create"
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create Event</span>
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
            showPastEvents={showPastEvents}
            onTogglePastEvents={setShowPastEvents}
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
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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

      {/* Products Section */}
      {products && products.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="container mx-auto px-4 py-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-8 h-8 text-primary" />
                Shop Products
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Browse our exclusive stepping merchandise and products
              </p>
            </div>
            <Link
              href="/shop"
              className="text-primary hover:underline font-medium"
            >
              View All Products →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <motion.div
                key={product._id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <Link href={`/shop/${product._id}`}>
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                    {product.primaryImage ? (
                      <Image
                        src={product.primaryImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                        SALE
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-primary">
                          ${(product.price / 100).toFixed(2)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="ml-2 text-sm text-gray-500 line-through">
                            ${(product.compareAtPrice / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {product.trackInventory && (
                        <span className={`text-xs ${product.inventoryQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.inventoryQuantity > 0 ? `${product.inventoryQuantity} in stock` : 'Out of stock'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
