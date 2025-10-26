"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  Calendar,
  DollarSign,
  Ticket,
  TrendingUp,
  Activity,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminDashboard() {
  const analytics = useQuery(api.adminPanel.queries.getPlatformAnalytics, {});
  const recentActivity = useQuery(api.adminPanel.queries.getRecentActivity, {});

  if (!analytics || !recentActivity) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Users",
      value: analytics.users.total,
      subtext: `${analytics.users.organizers} organizers`,
      icon: Users,
      color: "blue",
      change: `+${analytics.users.recentSignups} this week`,
    },
    {
      name: "Total Events",
      value: analytics.events.total,
      subtext: `${analytics.events.published} published`,
      icon: Calendar,
      color: "purple",
      change: `+${analytics.events.recentCreated} this week`,
    },
    {
      name: "Platform Revenue",
      value: `$${(analytics.revenue.platformRevenue / 100).toFixed(2)}`,
      subtext: "from platform fees",
      icon: DollarSign,
      color: "green",
      change: `${analytics.orders.total} total orders`,
    },
    {
      name: "Tickets Sold",
      value: analytics.tickets.total,
      subtext: `${analytics.tickets.scanRate.toFixed(1)}% scan rate`,
      icon: Ticket,
      color: "orange",
      change: `${analytics.tickets.scanned} scanned`,
    },
  ];

  const revenueStats = [
    {
      name: "Gross Merchandise Value",
      value: `$${(analytics.revenue.gmv / 100).toLocaleString()}`,
      description: "Total revenue across all events",
    },
    {
      name: "Average Order Value",
      value: `$${(analytics.revenue.averageOrderValue / 100).toFixed(2)}`,
      description: "Average per transaction",
    },
    {
      name: "Platform Commission",
      value: `$${(analytics.revenue.platformRevenue / 100).toLocaleString()}`,
      description: "Total platform fees collected",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-600 mt-1">Real-time platform analytics and system health</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-100 text-blue-600",
            purple: "bg-purple-100 text-purple-600",
            green: "bg-green-100 text-green-600",
            orange: "bg-orange-100 text-orange-600",
          }[stat.color];

          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colorClasses} rounded-full flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Stats */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Revenue Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {revenueStats.map((stat) => (
            <div key={stat.name}>
              <p className="text-green-100 text-sm mb-1">{stat.name}</p>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-green-100 text-xs">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Users
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentActivity.users.slice(0, 5).map((user) => (
                <Link
                  key={user._id}
                  href={`/admin/users`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.name || "Unnamed User"}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : user.role === "organizer"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role || "user"}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/admin/users"
              className="block text-center mt-4 text-sm text-red-600 hover:underline"
            >
              View All Users →
            </Link>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Events
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentActivity.events.slice(0, 5).map((event) => (
                <Link
                  key={event._id}
                  href={`/admin/events`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{event.name}</p>
                    <p className="text-sm text-gray-600">{event.organizerName || "Unknown"}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      event.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : event.status === "DRAFT"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {event.status || "DRAFT"}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/admin/events"
              className="block text-center mt-4 text-sm text-red-600 hover:underline"
            >
              View All Events →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Orders
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentActivity.orders.slice(0, 10).map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {order._id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{order.eventName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.buyerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${(order.totalCents / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(order.createdAt), "MMM d, h:mm a")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/users"
          className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 transition-colors"
        >
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Manage Users</h3>
          <p className="text-sm text-gray-600">View and moderate all platform users</p>
        </Link>

        <Link
          href="/admin/events"
          className="bg-white border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 transition-colors"
        >
          <Calendar className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Manage Events</h3>
          <p className="text-sm text-gray-600">Moderate and manage all events</p>
        </Link>

        <Link
          href="/admin/analytics"
          className="bg-white border-2 border-green-200 rounded-lg p-6 hover:border-green-400 transition-colors"
        >
          <Activity className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">View Analytics</h3>
          <p className="text-sm text-gray-600">Detailed platform analytics and reports</p>
        </Link>
      </div>
    </div>
  );
}
