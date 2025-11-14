"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Calendar,
  TrendingUp,
  Ticket,
  Gift,
  DollarSign,
  Check,
  Plus,
  ArrowRight,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatEventDate } from "@/lib/date-format";

export default function OrganizerDashboardPage() {
  const events = useQuery(api.events.queries.getOrganizerEvents);
  const credits = useQuery(api.credits.queries.getMyCredits);

  const isLoading = events === undefined || credits === undefined;

  // Calculate dashboard statistics
  const totalTicketsAllocated =
    events?.reduce((sum, event) => sum + (event.totalTickets || 0), 0) || 0;
  const totalTicketsSold = events?.reduce((sum, event) => sum + (event.ticketsSold || 0), 0) || 0;
  const totalRevenue = events?.reduce((sum, event) => sum + (event.totalRevenue || 0), 0) || 0;
  const percentageUsed = credits ? (credits.creditsUsed / credits.creditsTotal) * 100 : 0;

  // Get upcoming events
  const upcomingEvents =
    events?.filter((event) => event.startDate && event.startDate > Date.now()).slice(0, 3) || [];

  // Get recent events
  const recentEvents = events?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Overview of your events and credits</p>
            </div>
            <Link
              href="/organizer/events/create"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Credit Balance Section */}
        {credits && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-primary rounded-lg shadow-lg p-8 text-white">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Available Credits</h2>
                  </div>
                  <p className="text-white/90 mb-4">Ready to use for ticket creation</p>

                  <div className="mb-6">
                    <div className="text-5xl lg:text-6xl font-bold mb-2">
                      {credits.creditsRemaining.toLocaleString()}
                    </div>
                    <p className="text-xl text-white/90">tickets available</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        Usage: {credits.creditsUsed.toLocaleString()} /{" "}
                        {credits.creditsTotal.toLocaleString()}
                      </span>
                      <span>{percentageUsed.toFixed(1)}% used</span>
                    </div>
                    <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3">
                      <div
                        className="bg-white rounded-full h-3 transition-all duration-500"
                        style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-sm font-medium">$0.30 per ticket</p>
                  </div>
                  {credits.creditsTotal === 300 && credits.creditsUsed === 0 && (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4" />
                        <span className="font-semibold">Welcome Bonus!</span>
                      </div>
                    </div>
                  )}
                  {credits.creditsRemaining <= 100 && credits.creditsRemaining > 0 && (
                    <div className="bg-orange-500 rounded-lg px-4 py-2">
                      <p className="text-sm font-semibold">Running low!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">{events?.length || 0}</p>
              </div>
            </div>
            <Link
              href="/organizer/events"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Allocated</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalTicketsAllocated.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Tickets created across all events</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tickets Sold</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalTicketsSold.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Successful ticket sales</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(totalRevenue / 100).toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Gross ticket sales</p>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
                <Link href="/organizer/events" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming events</p>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event._id}
                      href={`/organizer/events/${event._id}`}
                      className="block p-4 hover:bg-gray-50 rounded-lg transition-colors border"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">{event.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {event.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatEventDate(event.startDate, event.timezone)}
                          </span>
                        )}
                        {event.totalTickets && (
                          <span className="flex items-center gap-1">
                            <Ticket className="w-4 h-4" />
                            {event.ticketsSold || 0}/{event.totalTickets} sold
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Events</h2>
                <Link href="/organizer/events" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No events yet</p>
                  <Link
                    href="/organizer/events/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Event
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <Link
                      key={event._id}
                      href={`/organizer/events/${event._id}`}
                      className="block p-4 hover:bg-gray-50 rounded-lg transition-colors border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{event.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            {event.ticketTierCount !== undefined && (
                              <span className="flex items-center gap-1">
                                <Ticket className="w-4 h-4" />
                                {event.ticketTierCount} tiers
                              </span>
                            )}
                            {event.totalTickets && <span>{event.totalTickets} tickets</span>}
                          </div>
                        </div>
                        {event.startDate && event.startDate > Date.now() && (
                          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/organizer/events/create"
              className="flex items-center gap-3 p-6 bg-white border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Event</h3>
                <p className="text-sm text-gray-600">Start a new event</p>
              </div>
            </Link>

            <Link
              href="/organizer/events"
              className="flex items-center gap-3 p-6 bg-white border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Events</h3>
                <p className="text-sm text-gray-600">View all your events</p>
              </div>
            </Link>

            <Link
              href="/organizer/analytics"
              className="flex items-center gap-3 p-6 bg-white border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-600">Check your stats</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
