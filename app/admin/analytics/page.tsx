"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Ticket,
  ShoppingCart,
  Activity,
  BarChart3,
  PieChart,
} from "lucide-react";
import { motion } from "framer-motion";

export default function PlatformAnalyticsPage() {
  const analytics = useQuery(api.adminPanel.queries.getPlatformAnalytics, {});
  const allEvents = useQuery(api.adminPanel.queries.getAllEvents, {});
  const allUsers = useQuery(api.adminPanel.queries.getAllUsers, {});

  if (!analytics || !allEvents || !allUsers) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Calculate top performing events
  const topEvents = [...allEvents].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 10);

  // Calculate organizer statistics
  const organizerStats = allUsers
    .filter((u: any) => u.role === "organizer")
    .map((organizer: any) => {
      const organizerEvents = allEvents.filter(
        (e: any) => e.organizerId?.toString() === organizer._id.toString()
      );
      const totalRevenue = organizerEvents.reduce(
        (sum: number, e: any) => sum + (e.revenue || 0),
        0
      );
      const totalTickets = organizerEvents.reduce(
        (sum: number, e: any) => sum + (e.ticketCount || 0),
        0
      );

      return {
        organizer,
        eventCount: organizerEvents.length,
        totalRevenue,
        totalTickets,
      };
    })
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Calculate conversion rates
  const conversionRate =
    analytics.users.total > 0 ? (analytics.users.organizers / analytics.users.total) * 100 : 0;

  const ticketScanRate = analytics.tickets.scanRate;

  const eventPublishRate =
    analytics.events.total > 0 ? (analytics.events.published / analytics.events.total) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed insights and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-green-100 text-sm mb-1">Platform Revenue</p>
          <p className="text-3xl font-bold mb-1">
            ${(analytics.revenue.platformRevenue / 100).toLocaleString()}
          </p>
          <p className="text-green-100 text-xs">From {analytics.orders.total} orders</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-blue-100 text-sm mb-1">Total Users</p>
          <p className="text-3xl font-bold mb-1">{analytics.users.total.toLocaleString()}</p>
          <p className="text-blue-100 text-xs">+{analytics.users.recentSignups} this week</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-white/80 text-sm mb-1">Total Events</p>
          <p className="text-3xl font-bold mb-1">{analytics.events.total.toLocaleString()}</p>
          <p className="text-white/80 text-xs">+{analytics.events.recentCreated} this week</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <Ticket className="w-8 h-8" />
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-orange-100 text-sm mb-1">Tickets Sold</p>
          <p className="text-3xl font-bold mb-1">{analytics.tickets.total.toLocaleString()}</p>
          <p className="text-orange-100 text-xs">{analytics.tickets.scanned} scanned</p>
        </motion.div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Revenue Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Gross Merchandise Value</p>
              <p className="text-lg font-bold text-gray-900">
                ${(analytics.revenue.gmv / 100).toLocaleString()}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: "100%" }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Total revenue across all events</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Platform Commission</p>
              <p className="text-lg font-bold text-gray-900">
                ${(analytics.revenue.platformRevenue / 100).toLocaleString()}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${analytics.revenue.gmv > 0 ? (analytics.revenue.platformRevenue / analytics.revenue.gmv) * 100 : 0}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.revenue.gmv > 0
                ? ((analytics.revenue.platformRevenue / analytics.revenue.gmv) * 100).toFixed(1)
                : 0}
              % of GMV
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Average Order Value</p>
              <p className="text-lg font-bold text-gray-900">
                ${(analytics.revenue.averageOrderValue / 100).toFixed(2)}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${analytics.revenue.averageOrderValue > 0 ? Math.min((analytics.revenue.averageOrderValue / 10000) * 100, 100) : 0}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Per transaction</p>
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent text-primary rounded-full flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">User to Organizer</p>
              <p className="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full"
              style={{ width: `${conversionRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.users.organizers} of {analytics.users.total} users are organizers
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ticket Scan Rate</p>
              <p className="text-2xl font-bold text-gray-900">{ticketScanRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-orange-600 h-3 rounded-full"
              style={{ width: `${ticketScanRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.tickets.scanned} of {analytics.tickets.total} tickets scanned
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent text-primary rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Event Publish Rate</p>
              <p className="text-2xl font-bold text-gray-900">{eventPublishRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full"
              style={{ width: `${eventPublishRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.events.published} of {analytics.events.total} events published
          </p>
        </div>
      </div>

      {/* Top Performing Events */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Top Performing Events
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Event Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Organizer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tickets Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topEvents.map((event, index) => (
                <tr key={event._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-800"
                          : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : index === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-accent text-primary"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-500">
                      {event.status === "PUBLISHED" ? "Live" : event.status || "Draft"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{event.organizerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.ticketCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    ${((event.revenue || 0) / 100).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Organizers */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Top Organizers
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {organizerStats.map((stat: any, index: number) => (
              <div key={stat.organizer._id} className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-800"
                      : index === 1
                        ? "bg-gray-100 text-gray-800"
                        : index === 2
                          ? "bg-orange-100 text-orange-800"
                          : "bg-accent text-primary"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{stat.organizer.name}</p>
                  <p className="text-sm text-gray-600">{stat.organizer.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{stat.eventCount} events</p>
                  <p className="text-sm text-gray-500">{stat.totalTickets} tickets</p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="font-bold text-green-600">
                    ${(stat.totalRevenue / 100).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
