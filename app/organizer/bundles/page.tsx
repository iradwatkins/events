"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Package, Plus, Filter, TrendingUp, DollarSign, Users, Calendar, Edit, Trash2, Eye, EyeOff, BarChart3 } from "lucide-react";
import Link from "next/link";
import { BundleEditor } from "@/components/events/BundleEditor";
import { Id } from "@/convex/_generated/dataModel";

export default function OrganizerBundlesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "single" | "multi">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const [editingBundleId, setEditingBundleId] = useState<Id<"ticketBundles"> | null>(null);

  // Fetch organizer's events
  const events = useQuery(api.events.queries.getMyEvents);

  // Fetch all bundles (we'll filter client-side)
  // For now, we'll need to fetch bundles per event and aggregate
  // This is a placeholder - we'll need a new backend query
  const allBundles = useQuery(api.bundles.queries.getAllOrganizerBundles);

  const updateBundle = useMutation(api.bundles.mutations.updateTicketBundle);
  const deleteBundle = useMutation(api.bundles.mutations.deleteTicketBundle);

  // Filter bundles based on selected filters
  const filteredBundles = allBundles?.filter((bundle) => {
    // Filter by type
    if (filterType === "single" && bundle.bundleType !== "SINGLE_EVENT") return false;
    if (filterType === "multi" && bundle.bundleType !== "MULTI_EVENT") return false;

    // Filter by status
    if (filterStatus === "active" && !bundle.isActive) return false;
    if (filterStatus === "inactive" && bundle.isActive) return false;

    return true;
  }) || [];

  const handleToggleActive = async (bundleId: Id<"ticketBundles">, currentStatus: boolean) => {
    try {
      await updateBundle({
        bundleId,
        isActive: !currentStatus,
      });
    } catch (error: any) {
      alert(error.message || "Failed to update bundle status");
    }
  };

  const handleDelete = async (bundleId: Id<"ticketBundles">) => {
    if (!confirm("Are you sure you want to delete this bundle? This cannot be undone.")) {
      return;
    }

    try {
      await deleteBundle({ bundleId });
    } catch (error: any) {
      alert(error.message || "Failed to delete bundle");
    }
  };

  // Calculate stats
  const stats = {
    total: allBundles?.length || 0,
    active: allBundles?.filter(b => b.isActive).length || 0,
    totalRevenue: allBundles?.reduce((sum, b) => sum + (b.sold * b.price), 0) || 0,
    totalSold: allBundles?.reduce((sum, b) => sum + b.sold, 0) || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-purple-600" />
                Bundle Management
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage single-event and multi-event ticket bundles
              </p>
            </div>
            {!isCreating && events && events.length > 0 && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Bundle
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bundles</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Package className="w-10 h-10 text-purple-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Bundles</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                </div>
                <Eye className="w-10 h-10 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bundles Sold</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalSold}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    ${(stats.totalRevenue / 100).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-emerald-600 opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {isCreating && events && events.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <BundleEditor
              eventId={selectedEventId || events[0]._id}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {!isCreating && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="single">Single Event</option>
                <option value="multi">Multi-Event</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <div className="ml-auto text-sm text-gray-600">
                Showing {filteredBundles.length} of {stats.total} bundles
              </div>
            </div>
          </div>
        )}

        {/* Bundles List */}
        {!isCreating && (
          <div className="space-y-4">
            {filteredBundles.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {allBundles && allBundles.length > 0 ? "No bundles match your filters" : "No bundles yet"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {allBundles && allBundles.length > 0
                    ? "Try adjusting your filters to see more bundles"
                    : "Create your first bundle to package tickets together at discounted prices"}
                </p>
                {(!allBundles || allBundles.length === 0) && events && events.length > 0 && (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Bundle
                  </button>
                )}
              </div>
            ) : (
              filteredBundles.map((bundle) => (
                <div
                  key={bundle._id}
                  className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 ${
                    !bundle.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Bundle Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <Package className="w-6 h-6 text-purple-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">{bundle.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              bundle.bundleType === "MULTI_EVENT"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {bundle.bundleType === "MULTI_EVENT" ? "Multi-Event" : "Single Event"}
                            </span>
                            {!bundle.isActive && (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
                                Inactive
                              </span>
                            )}
                          </div>
                          {bundle.description && (
                            <p className="text-gray-600 text-sm">{bundle.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Bundle Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">Bundle Price</p>
                          <p className="text-lg font-bold text-purple-600">
                            ${(bundle.price / 100).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Regular Price</p>
                          <p className="text-sm text-gray-900 line-through">
                            ${(bundle.regularPrice / 100).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Savings</p>
                          <p className="text-lg font-bold text-green-600">
                            {bundle.percentageSavings}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Sold / Available</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {bundle.sold} / {bundle.available}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Revenue</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            ${((bundle.sold * bundle.price) / 100).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Included Tickets */}
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Included Tickets:</p>
                        <div className="flex flex-wrap gap-2">
                          {bundle.includedTiersDetails?.map((tier: any) => (
                            <div
                              key={tier.tierId}
                              className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-medium"
                            >
                              {tier.quantity}x {tier.tierName}
                              {tier.eventName && (
                                <span className="ml-1 opacity-75">({tier.eventName})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(bundle._id, bundle.isActive)}
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                          bundle.isActive
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {bundle.isActive ? (
                          <>
                            <EyeOff className="w-4 h-4 inline mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 inline mr-1" />
                            Activate
                          </>
                        )}
                      </button>

                      {bundle.sold === 0 && (
                        <button
                          onClick={() => handleDelete(bundle._id)}
                          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* No Events Warning */}
        {events && events.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No events yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create an event first before you can create bundles
            </p>
            <Link
              href="/organizer/events/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create First Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
