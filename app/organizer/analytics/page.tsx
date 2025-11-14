"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DollarSign, Ticket, Calendar, TrendingUp, Users, BarChart3, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const userEvents = useQuery(api.events.queries.getOrganizerEvents);

  // Check if still loading
  if (userEvents === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Calculate overall statistics
  const totalEvents = userEvents.length;
  const publishedEvents = userEvents.filter((e) => e.status === "PUBLISHED").length;
  const draftEvents = userEvents.filter((e) => e.status === "DRAFT").length;

  // Calculate totals from event statistics
  const totalRevenue = 0;
  const totalTicketsSold = 0;
  const totalOrders = 0;
  const totalAttendees = 0;

  // Get event-specific data (would need to fetch statistics for each event)
  const eventsWithStats = userEvents
    .filter((e) => e.status === "PUBLISHED")
    .map((event) => ({
      ...event,
      // These would come from actual queries in production
      revenue: 0,
      ticketsSold: 0,
      orders: 0,
      attendees: 0,
    }));

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your event performance and insights</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Events</p>
          <p className="text-3xl font-bold text-gray-900">{totalEvents}</p>
          <p className="text-xs text-gray-500 mt-1">
            {publishedEvents} published • {draftEvents} draft
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900">${(totalRevenue / 100).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Across all events</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
          <p className="text-3xl font-bold text-gray-900">{totalTicketsSold}</p>
          <p className="text-xs text-gray-500 mt-1">Total tickets</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Attendees</p>
          <p className="text-3xl font-bold text-gray-900">{totalAttendees}</p>
          <p className="text-xs text-gray-500 mt-1">Across all events</p>
        </motion.div>
      </div>

      {/* Event Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Event Performance
          </h2>
        </div>

        {publishedEvents > 0 ? (
          <div className="space-y-4">
            {eventsWithStats.map((event) => (
              <Link
                key={event._id}
                href={`/organizer/events/${event._id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{event.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.eventType === "TICKETED_EVENT"
                        ? "Ticketed Event"
                        : event.eventType === "FREE_EVENT"
                          ? "Free Event"
                          : "Save the Date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{event.ticketsSold}</p>
                      <p className="text-gray-600">Tickets</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">${(event.revenue / 100).toFixed(2)}</p>
                      <p className="text-gray-600">Revenue</p>
                    </div>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Published Events Yet</h3>
            <p className="text-gray-600 mb-6">Publish your first event to start seeing analytics</p>
            <Link
              href="/organizer/events/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Create Event
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">Average Ticket Price</h3>
          <p className="text-3xl font-bold">
            ${totalTicketsSold > 0 ? (totalRevenue / totalTicketsSold / 100).toFixed(2) : "0.00"}
          </p>
          <p className="text-blue-100 text-sm mt-2">Per ticket sold</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold">
            {totalOrders > 0 ? ((totalOrders / totalAttendees) * 100).toFixed(1) : "0"}%
          </p>
          <p className="text-green-100 text-sm mt-2">Orders to attendees</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">Average Event Size</h3>
          <p className="text-3xl font-bold">
            {publishedEvents > 0 ? Math.round(totalAttendees / publishedEvents) : 0}
          </p>
          <p className="text-white/80 text-sm mt-2">Attendees per event</p>
        </motion.div>
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 bg-accent border border-border rounded-lg p-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">More Analytics Coming Soon</h3>
            <p className="text-sm text-primary">
              We're working on adding charts, trend analysis, and detailed breakdowns by date range.
              Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
