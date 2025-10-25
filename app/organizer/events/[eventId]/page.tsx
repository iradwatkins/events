"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Calendar,
  MapPin,
  DollarSign,
  Ticket,
  Users,
  TrendingUp,
  Share2,
  Edit,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  Download,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";

type TabType = "overview" | "orders" | "attendees";

export default function EventDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const publishEvent = useMutation(api.events.mutations.publishEvent);
  const statistics = useQuery(api.events.queries.getEventStatistics, { eventId });
  const ticketTiers = useQuery(api.events.queries.getEventTicketTiers, { eventId });
  const orders = useQuery(api.events.queries.getEventOrders, { eventId });
  const attendees = useQuery(api.events.queries.getEventAttendees, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const isLoading = !event || !currentUser || !statistics;

  // Check if user is the organizer
  if (!isLoading && event.organizerId !== currentUser?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/events/${eventId}`;
  const isUpcoming = event.startDate ? event.startDate > Date.now() : false;
  const isPast = event.startDate ? event.startDate < Date.now() : false;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: event.description,
          url: eventUrl,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(eventUrl);
      alert("Event link copied to clipboard!");
    }
  };

  const handlePublish = async () => {
    if (!confirm("Are you sure you want to publish this event? It will be visible to the public.")) {
      return;
    }

    setIsPublishing(true);
    try {
      await publishEvent({ eventId });
      alert("Event published successfully! It will now appear on the homepage.");
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to publish event");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.status === "PUBLISHED"
                      ? "bg-green-100 text-green-800"
                      : event.status === "DRAFT"
                      ? "bg-yellow-100 text-yellow-800"
                      : event.status === "CANCELLED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {event.status}
                </span>
                {isUpcoming && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Upcoming
                  </span>
                )}
                {isPast && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Past Event
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {event.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(event.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                )}
                {event.location && typeof event.location === "object" && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {event.location.venueName && `${event.location.venueName}, `}
                      {event.location.city}, {event.location.state}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {event.status === "DRAFT" && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isPublishing ? "Publishing..." : "Publish Event"}
                </button>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <Link
                href={`/events/${eventId}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Page
              </Link>
              <Link
                href={`/organizer/events/${eventId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "orders"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Orders ({statistics.totalOrders})
          </button>
          <button
            onClick={() => setActiveTab("attendees")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "attendees"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Attendees ({statistics.totalAttendees})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${(statistics.totalRevenue / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  From {statistics.completedOrders} completed orders
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Tickets Sold</span>
                  <Ticket className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics.totalTicketsSold}
                  <span className="text-lg text-gray-500">
                    /{statistics.totalTicketsAvailable}
                  </span>
                </p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{statistics.percentageSold.toFixed(1)}% sold</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(statistics.percentageSold, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Orders</span>
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalOrders}</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {statistics.completedOrders} completed
                  </span>
                  {statistics.pendingOrders > 0 && (
                    <span className="text-yellow-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {statistics.pendingOrders} pending
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Attendees</span>
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalAttendees}</p>
                <p className="text-xs text-gray-500 mt-1">Total registered attendees</p>
              </motion.div>
            </div>

            {/* Ticket Tiers Performance */}
            {ticketTiers && ticketTiers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Ticket Tiers Performance</h2>
                  <Link
                    href={`/organizer/events/${eventId}/tickets/setup`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Manage Tiers
                  </Link>
                </div>

                <div className="space-y-4">
                  {statistics.salesByTier.map((tier) => (
                    <div key={tier.tierId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                        <span className="text-sm font-medium text-gray-600">
                          ${(tier.revenue / 100).toFixed(2)} revenue
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">Sold:</span>
                          <span className="font-medium text-gray-900 ml-2">
                            {tier.sold}/{tier.quantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Remaining:</span>
                          <span className="font-medium text-gray-900 ml-2">
                            {tier.quantity - tier.sold}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Progress:</span>
                          <span className="font-medium text-gray-900 ml-2">
                            {tier.percentageSold.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(tier.percentageSold, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Orders */}
            {statistics.recentOrders && statistics.recentOrders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View All Orders
                  </button>
                </div>

                <div className="space-y-3">
                  {statistics.recentOrders.map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.buyerName}</p>
                        <p className="text-sm text-gray-600">{order.buyerEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ${(order.totalCents / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-green-600 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* No Data State */}
            {statistics.totalOrders === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md p-12 text-center"
              >
                <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Sales Yet</h3>
                <p className="text-gray-600 mb-6">
                  Share your event link to start selling tickets
                </p>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Share2 className="w-5 h-5" />
                  Share Event
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">All Orders</h2>
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders && orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order._id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.buyerName}</div>
                          <div className="text-sm text-gray-500">{order.buyerEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.ticketCount} tickets
                        </td>
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
                                : order.status === "FAILED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                            {order.status === "PENDING" && <Clock className="w-3 h-3" />}
                            {order.status === "FAILED" && <XCircle className="w-3 h-3" />}
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendees Tab */}
        {activeTab === "attendees" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">All Attendees</h2>
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendees && attendees.length > 0 ? (
                    attendees.map((ticket) => (
                      <tr key={ticket._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {ticket.ticketCode || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.attendeeName || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.attendeeEmail || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.tierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.status === "VALID"
                                ? "bg-green-100 text-green-800"
                                : ticket.status === "SCANNED"
                                ? "bg-blue-100 text-blue-800"
                                : ticket.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {ticket.status === "VALID" && <CheckCircle2 className="w-3 h-3" />}
                            {ticket.status === "SCANNED" && <CheckCircle2 className="w-3 h-3" />}
                            {ticket.status === "CANCELLED" && <XCircle className="w-3 h-3" />}
                            {ticket.status || "VALID"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(ticket.purchaseDate), "MMM d, yyyy h:mm a")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No attendees yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
