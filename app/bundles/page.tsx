"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  Package,
  Filter,
  Search,
  Calendar,
  DollarSign,
  TrendingDown,
  MapPin,
  Ticket,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BundlesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"savings" | "price_low" | "price_high" | "newest">("savings");

  // Fetch all active bundles
  const bundles = useQuery(api.bundles.queries.getAllActiveBundles);

  // Filter and sort bundles
  const processedBundles = bundles
    ?.filter((bundle) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = bundle.name.toLowerCase().includes(query);
        const matchesDescription = bundle.description?.toLowerCase().includes(query);
        const matchesEvent = bundle.events?.some((e: any) =>
          e.name.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesDescription && !matchesEvent) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "savings":
          return b.percentageSavings - a.percentageSavings;
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "newest":
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return 0;
      }
    }) || [];

  // Get featured bundles (highest savings, limit 3)
  const featuredBundles = bundles
    ?.slice()
    .sort((a, b) => b.percentageSavings - a.percentageSavings)
    .slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white hover:text-purple-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Events</span>
          </Link>

          <div className="text-center">
            <Package className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Ticket Bundles & Packages
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Save big with ticket bundles and VIP packages. Buy multiple tickets together at a discounted price!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Bundles Section */}
        {featuredBundles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-green-600" />
              Best Savings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBundles.map((bundle) => (
                <Link
                  key={bundle._id}
                  href={`/bundles/${bundle._id}`}
                  className="group bg-purple-50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Save {bundle.percentageSavings}%
                    </div>
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {bundle.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {bundle.description || `Bundle includes ${bundle.events?.length || 0} events`}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        ${(bundle.price / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        ${(bundle.regularPrice / 100).toFixed(2)}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bundles, events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="savings">Best Savings</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {processedBundles.length} {processedBundles.length === 1 ? "bundle" : "bundles"}
          </div>
        </div>

        {/* Bundles Grid */}
        {processedBundles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? "No bundles found" : "No bundles available"}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Check back soon for exciting ticket bundles and packages"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedBundles.map((bundle) => (
              <Link
                key={bundle._id}
                href={`/bundles/${bundle._id}`}
                className="group bg-white rounded-lg shadow hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Bundle Image (first event image) */}
                <div className="relative h-48 bg-purple-100">
                  {bundle.events && bundle.events[0]?.imageUrl ? (
                    <Image
                      src={bundle.events[0].imageUrl}
                      alt={bundle.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-16 h-16 text-purple-300" />
                    </div>
                  )}

                  {/* Savings Badge */}
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    Save {bundle.percentageSavings}%
                  </div>
                </div>

                {/* Bundle Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {bundle.name}
                  </h3>

                  {bundle.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {bundle.description}
                    </p>
                  )}

                  {/* Event List */}
                  <div className="mb-4 space-y-2">
                    {bundle.events?.slice(0, 2).map((event: any) => (
                      <div key={event._id} className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="truncate">{event.name}</span>
                      </div>
                    ))}
                    {bundle.events && bundle.events.length > 2 && (
                      <div className="text-sm text-purple-600 font-medium">
                        +{bundle.events.length - 2} more events
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Bundle Price</div>
                        <div className="text-2xl font-bold text-purple-600">
                          ${(bundle.price / 100).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 line-through">
                          ${(bundle.regularPrice / 100).toFixed(2)}
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          Save ${((bundle.regularPrice - bundle.price) / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="mt-4 w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors group-hover:shadow-lg">
                    View Bundle Details
                    <ChevronRight className="w-4 h-4 inline ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
