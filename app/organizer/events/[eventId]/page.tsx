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
  Tag,
  Plus,
  Trash2,
  Power,
  Bell,
  Mail,
  Armchair,
  FileText,
  Layout,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { convertToCSV, downloadCSV, generateAttendeeExportFilename } from "@/lib/csv";
import dynamic from "next/dynamic";

// Dynamic import for heavy BundleEditor (only loaded when viewing bundles tab)
const BundleEditor = dynamic(
  () => import("@/components/events/BundleEditor").then((mod) => ({ default: mod.BundleEditor })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    ),
    ssr: false,
  }
);

type TabType = "overview" | "orders" | "attendees" | "staff" | "discounts" | "bundles" | "waitlist";

export default function EventDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showCreateDiscount, setShowCreateDiscount] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountValue: 0,
    maxUses: undefined as number | undefined,
    maxUsesPerUser: undefined as number | undefined,
    validFrom: undefined as number | undefined,
    validUntil: undefined as number | undefined,
    minPurchaseAmount: undefined as number | undefined,
    applicableToTierIds: [] as Id<"ticketTiers">[],
  });

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const publishEvent = useMutation(api.events.mutations.publishEvent);
  const statistics = useQuery(
    api.events.queries.getEventStatistics,
    currentUser ? { eventId } : "skip"
  );
  const ticketTiers = useQuery(api.events.queries.getEventTicketTiers, { eventId });
  const orders = useQuery(api.events.queries.getEventOrders, currentUser ? { eventId } : "skip");
  const attendees = useQuery(
    api.events.queries.getEventAttendees,
    currentUser ? { eventId } : "skip"
  );
  const eventStaff = useQuery(api.staff.queries.getEventStaff, { eventId });
  const staffSummary = useQuery(
    api.staff.queries.getOrganizerStaffSummary,
    currentUser ? { eventId } : "skip"
  );
  const discountCodes = useQuery(
    api.discounts.queries.getEventDiscountCodes,
    currentUser ? { eventId } : "skip"
  );
  const bundles = useQuery(api.bundles.queries.getBundlesForEvent, { eventId });
  const waitlist = useQuery(
    api.waitlist.queries.getEventWaitlist,
    currentUser ? { eventId } : "skip"
  );
  const waitlistCount = useQuery(api.waitlist.queries.getWaitlistCount, { eventId });
  // Seating queries disabled (feature hidden)
  // const seatReservations = useQuery(
  //   api.seating.queries.getEventSeatReservations,
  //   currentUser ? { eventId } : "skip"
  // );
  // const tableAssignments = useQuery(
  //   api.seating.queries.getEventTableAssignments,
  //   currentUser ? { eventId } : "skip"
  // );

  const createDiscountCode = useMutation(api.discounts.mutations.createDiscountCode);
  const updateDiscountCode = useMutation(api.discounts.mutations.updateDiscountCode);
  const deleteDiscountCode = useMutation(api.discounts.mutations.deleteDiscountCode);
  const notifyWaitlistEntry = useMutation(api.waitlist.mutations.notifyWaitlistEntry);

  const isLoading = !event || !currentUser || !statistics;

  // Check if user is the organizer
  if (!isLoading && event.organizerId !== currentUser?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
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
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(eventUrl);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishEvent({ eventId });
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to publish event");
    } finally {
      setIsPublishing(false);
    }
  };

  // Seating feature disabled - getSeatAssignment function removed
  // const getSeatAssignment = (ticketId: Id<"tickets">) => {
  //   if (!seatReservations) return null;
  //   const reservation = seatReservations.find((r) => r.ticketId === ticketId);
  //   if (!reservation) return null;
  //
  //   if (reservation.tableId) {
  //     return `Table ${reservation.tableNumber}, Seat ${reservation.seatNumber}`;
  //   } else if (reservation.rowId) {
  //     return `Row ${reservation.rowLabel}, Seat ${reservation.seatNumber}`;
  //   }
  //   return null;
  // };

  const handleExportAttendees = () => {
    if (!attendees || attendees.length === 0) {
      alert("No attendees to export");
      return;
    }

    // Convert attendee data to CSV format
    const csvData = convertToCSV(
      attendees.map((ticket) => ({
        attendeeName: ticket.attendeeName || "N/A",
        attendeeEmail: ticket.attendeeEmail || "N/A",
        ticketCode: ticket.ticketCode || "N/A",
        tierName: ticket.tierName || "General Admission",
        status: ticket.status || "VALID",
        purchaseDate: ticket.purchaseDate,
        paymentMethod: ticket.paymentMethod || "ONLINE",
      }))
    );

    // Generate filename and download
    const filename = generateAttendeeExportFilename(event.name);
    downloadCSV(csvData, filename);
  };

  const handleCreateDiscount = async () => {
    if (!newDiscount.code || newDiscount.code.trim().length === 0) {
      alert("Please enter a discount code");
      return;
    }

    if (newDiscount.discountValue <= 0) {
      alert("Please enter a valid discount value");
      return;
    }

    try {
      await createDiscountCode({
        eventId,
        code: newDiscount.code.trim(),
        discountType: newDiscount.discountType,
        discountValue: newDiscount.discountValue,
        maxUses: newDiscount.maxUses,
        maxUsesPerUser: newDiscount.maxUsesPerUser,
        validFrom: newDiscount.validFrom,
        validUntil: newDiscount.validUntil,
        minPurchaseAmount: newDiscount.minPurchaseAmount,
        applicableToTierIds:
          newDiscount.applicableToTierIds.length > 0 ? newDiscount.applicableToTierIds : undefined,
      });

      // Reset form
      setNewDiscount({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: 0,
        maxUses: undefined,
        maxUsesPerUser: undefined,
        validFrom: undefined,
        validUntil: undefined,
        minPurchaseAmount: undefined,
        applicableToTierIds: [],
      });
      setShowCreateDiscount(false);
    } catch (error: any) {
      alert(error.message || "Failed to create discount code");
    }
  };

  const handleToggleDiscount = async (
    discountCodeId: Id<"discountCodes">,
    currentlyActive: boolean
  ) => {
    try {
      await updateDiscountCode({
        discountCodeId,
        isActive: !currentlyActive,
      });
    } catch (error: any) {
      alert(error.message || "Failed to update discount code");
    }
  };

  const handleDeleteDiscount = async (discountCodeId: Id<"discountCodes">) => {
    try {
      await deleteDiscountCode({ discountCodeId });
    } catch (error: any) {
      alert(error.message || "Failed to delete discount code");
    }
  };

  const handleNotifyWaitlist = async (waitlistId: Id<"eventWaitlist">, email: string) => {
    try {
      await notifyWaitlistEntry({ waitlistId });
    } catch (error: any) {
      alert(error.message || "Failed to notify waitlist entry");
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
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground">
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
                    <span>
                      {format(new Date(event.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    </span>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit Event
              </Link>
              {event.eventType === "TICKETED_EVENT" && (
                <Link
                  href={`/organizer/events/${eventId}/seating`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium"
                >
                  <Armchair className="w-4 h-4" />
                  Manage Seating
                </Link>
              )}
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
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "orders"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Orders ({statistics.totalOrders})
          </button>
          <button
            onClick={() => setActiveTab("attendees")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "attendees"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Attendees ({statistics.totalAttendees})
          </button>
          {/* Seating tab hidden - feature disabled */}
          {/* {tableAssignments && tableAssignments.totalAssignedSeats > 0 && (
            <button
              onClick={() => setActiveTab("seating")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "seating"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Seating ({tableAssignments.totalAssignedSeats})
            </button>
          )} */}
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "staff"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Staff ({eventStaff?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("discounts")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "discounts"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Discounts ({discountCodes?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("bundles")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "bundles"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Bundles ({bundles?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("waitlist")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "waitlist"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Waitlist ({waitlistCount || 0})
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
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics.totalTicketsSold}
                  <span className="text-lg text-gray-500">/{statistics.totalTicketsAvailable}</span>
                </p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{statistics.percentageSold.toFixed(1)}% sold</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
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
                  <BarChart3 className="w-5 h-5 text-primary" />
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
                  <Users className="w-5 h-5 text-primary" />
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
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/organizer/events/${eventId}/seating`}
                      className="text-sm text-primary hover:underline"
                    >
                      Manage Seating
                    </Link>
                    <Link
                      href={`/organizer/events/${eventId}/tickets`}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      <Ticket className="w-4 h-4" />
                      Manage Tickets
                    </Link>
                  </div>
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
                          className="bg-primary h-2 rounded-full transition-all duration-500"
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
                    className="text-sm text-primary hover:underline"
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
                <p className="text-gray-600 mb-6">Share your event link to start selling tickets</p>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
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
                <button
                  onClick={handleExportAttendees}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
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
                                  ? "bg-accent text-accent-foreground"
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

        {/* Seating Tab - HIDDEN (feature disabled) - Section removed */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            {/* Staff Summary Cards */}
            {staffSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Total Staff</span>
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{staffSummary.totalStaff}</p>
                  <p className="text-xs text-gray-500 mt-1">Active team members</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Tickets Sold by Staff</span>
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {staffSummary.totalTicketsSold}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total staff sales</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Commission Earned</span>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    ${(staffSummary.totalCommissionEarned / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total staff commissions</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Cash Collected</span>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    ${(staffSummary.totalCashCollected / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pending deposit</p>
                </motion.div>
              </div>
            )}

            {/* Staff Members List */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Staff Members</h2>
                  <Link
                    href={`/organizer/events/${eventId}/staff`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <Users className="w-4 h-4" />
                    Manage Staff
                  </Link>
                </div>
              </div>

              {eventStaff && eventStaff.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {eventStaff.map((staff) => (
                    <div key={staff._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{staff.name}</h3>
                            <p className="text-sm text-gray-600">{staff.email}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                                {staff.role}
                              </span>
                              {staff.commissionType && (
                                <span className="text-sm text-gray-600">
                                  {staff.commissionType === "PERCENTAGE"
                                    ? `${staff.commissionValue}% commission`
                                    : `$${((staff.commissionValue || 0) / 100).toFixed(2)}/ticket`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Tickets Sold</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {staff.ticketsSold}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Commission</p>
                              <p className="text-2xl font-bold text-green-600">
                                ${(staff.commissionEarned / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {staff.cashCollected && staff.cashCollected > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Cash collected: ${(staff.cashCollected / 100).toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Net payout: ${(staff.netPayout / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Staff Members Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Add staff members to help sell tickets for this event
                  </p>
                  <Link
                    href={`/organizer/events/${eventId}/staff`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    <Users className="w-5 h-5" />
                    Add Staff Members
                  </Link>
                </div>
              )}
            </div>

            {/* Top Performers */}
            {staffSummary && staffSummary.topPerformers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performers</h2>
                <div className="space-y-3">
                  {staffSummary.topPerformers.map((performer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{performer.name}</p>
                          <p className="text-sm text-gray-600">
                            {performer.ticketsSold} tickets sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ${(performer.commissionEarned / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">commission</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === "discounts" && (
          <div className="space-y-6">
            {/* Create Discount Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateDiscount(!showCreateDiscount)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {showCreateDiscount ? "Cancel" : "Create Discount Code"}
              </button>
            </div>

            {/* Create Discount Form */}
            {showCreateDiscount && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Discount Code</h2>

                <div className="space-y-6">
                  {/* Code and Type */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Code <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={newDiscount.code}
                        onChange={(e) =>
                          setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })
                        }
                        placeholder="SUMMER2024"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent uppercase"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Letters and numbers only, automatically converted to uppercase
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Type <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={newDiscount.discountType}
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            discountType: e.target.value as "PERCENTAGE" | "FIXED_AMOUNT",
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                      </select>
                    </div>
                  </div>

                  {/* Discount Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      {newDiscount.discountType === "PERCENTAGE" && (
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newDiscount.discountValue || ""}
                          onChange={(e) =>
                            setNewDiscount({
                              ...newDiscount,
                              discountValue: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="20"
                          className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      )}
                      {newDiscount.discountType === "FIXED_AMOUNT" && (
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={
                            newDiscount.discountValue
                              ? (newDiscount.discountValue / 100).toFixed(2)
                              : ""
                          }
                          onChange={(e) =>
                            setNewDiscount({
                              ...newDiscount,
                              discountValue: Math.round(parseFloat(e.target.value) * 100) || 0,
                            })
                          }
                          placeholder="10.00"
                          className="w-full px-4 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      )}
                      {newDiscount.discountType === "PERCENTAGE" ? (
                        <span className="absolute right-4 top-2.5 text-gray-500">%</span>
                      ) : (
                        <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {newDiscount.discountType === "PERCENTAGE"
                        ? "Enter a percentage between 1 and 100"
                        : "Enter the dollar amount to discount"}
                    </p>
                  </div>

                  {/* Usage Limits */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Total Uses (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newDiscount.maxUses || ""}
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            maxUses: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        placeholder="Unlimited"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Total number of times this code can be used
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Uses Per User (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newDiscount.maxUsesPerUser || ""}
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            maxUsesPerUser: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        placeholder="Unlimited"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max times each customer can use this code
                      </p>
                    </div>
                  </div>

                  {/* Validity Dates */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid From (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={
                          newDiscount.validFrom
                            ? new Date(newDiscount.validFrom).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            validFrom: e.target.value
                              ? new Date(e.target.value).getTime()
                              : undefined,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">When this code becomes valid</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid Until (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={
                          newDiscount.validUntil
                            ? new Date(newDiscount.validUntil).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            validUntil: e.target.value
                              ? new Date(e.target.value).getTime()
                              : undefined,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">When this code expires</p>
                    </div>
                  </div>

                  {/* Minimum Purchase */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Purchase Amount (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          newDiscount.minPurchaseAmount
                            ? (newDiscount.minPurchaseAmount / 100).toFixed(2)
                            : ""
                        }
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            minPurchaseAmount: e.target.value
                              ? Math.round(parseFloat(e.target.value) * 100)
                              : undefined,
                          })
                        }
                        placeholder="0.00"
                        className="w-full px-4 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum order value required to use this code
                    </p>
                  </div>

                  {/* Applicable Tiers */}
                  {ticketTiers && ticketTiers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Applicable Ticket Tiers (Optional)
                      </label>
                      <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={newDiscount.applicableToTierIds.length === 0}
                            onChange={() =>
                              setNewDiscount({ ...newDiscount, applicableToTierIds: [] })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                          <span className="font-medium">All Ticket Tiers</span>
                        </label>
                        {ticketTiers.map((tier) => (
                          <label key={tier._id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newDiscount.applicableToTierIds.includes(tier._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewDiscount({
                                    ...newDiscount,
                                    applicableToTierIds: [
                                      ...newDiscount.applicableToTierIds,
                                      tier._id,
                                    ],
                                  });
                                } else {
                                  setNewDiscount({
                                    ...newDiscount,
                                    applicableToTierIds: newDiscount.applicableToTierIds.filter(
                                      (id) => id !== tier._id
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                            <span>
                              {tier.name} - ${(tier.price / 100).toFixed(2)}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Select specific tiers this code applies to, or leave blank for all tiers
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={handleCreateDiscount}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                      Create Discount Code
                    </button>
                    <button
                      onClick={() => setShowCreateDiscount(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Discount Codes List */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Discount Codes</h2>
              </div>

              {discountCodes && discountCodes.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {discountCodes.map((discount) => {
                    const now = Date.now();
                    const isExpired = discount.validUntil && now > discount.validUntil;
                    const isNotStarted = discount.validFrom && now < discount.validFrom;
                    const isLimitReached =
                      discount.maxUses && discount.usedCount >= discount.maxUses;

                    return (
                      <div key={discount._id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900 font-mono">
                                {discount.code}
                              </h3>

                              {/* Status Badges */}
                              <div className="flex items-center gap-2">
                                {discount.isActive &&
                                  !isExpired &&
                                  !isNotStarted &&
                                  !isLimitReached && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                      Active
                                    </span>
                                  )}
                                {!discount.isActive && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                    Inactive
                                  </span>
                                )}
                                {isExpired && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                    Expired
                                  </span>
                                )}
                                {isNotStarted && (
                                  <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                                    Scheduled
                                  </span>
                                )}
                                {isLimitReached && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                    Limit Reached
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Discount Details */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-600">Discount:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {discount.discountType === "PERCENTAGE"
                                    ? `${discount.discountValue}% off`
                                    : `$${(discount.discountValue / 100).toFixed(2)} off`}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Used:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {discount.usedCount}
                                  {discount.maxUses ? ` / ${discount.maxUses}` : " times"}
                                </span>
                              </div>
                              {discount.validFrom && (
                                <div>
                                  <span className="text-gray-600">Valid From:</span>
                                  <span className="font-medium text-gray-900 ml-2">
                                    {format(new Date(discount.validFrom), "MMM d, yyyy")}
                                  </span>
                                </div>
                              )}
                              {discount.validUntil && (
                                <div>
                                  <span className="text-gray-600">Valid Until:</span>
                                  <span className="font-medium text-gray-900 ml-2">
                                    {format(new Date(discount.validUntil), "MMM d, yyyy")}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Additional Info */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                              {discount.maxUsesPerUser && (
                                <span>Max {discount.maxUsesPerUser} per user</span>
                              )}
                              {discount.minPurchaseAmount && (
                                <span>
                                  Min purchase: ${(discount.minPurchaseAmount / 100).toFixed(2)}
                                </span>
                              )}
                              {discount.applicableToTierIds &&
                                discount.applicableToTierIds.length > 0 && (
                                  <span>
                                    Tier-specific ({discount.applicableToTierIds.length} tiers)
                                  </span>
                                )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleToggleDiscount(discount._id, discount.isActive)}
                              className={`p-2 rounded-lg transition-colors ${
                                discount.isActive
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                              title={discount.isActive ? "Deactivate" : "Activate"}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            {discount.usedCount === 0 && (
                              <button
                                onClick={() => handleDeleteDiscount(discount._id)}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Discount Codes Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create discount codes to offer promotional pricing to your customers
                  </p>
                  <button
                    onClick={() => setShowCreateDiscount(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Discount Code
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bundles Tab */}
        {activeTab === "bundles" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Ticket Bundles</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create package deals by bundling multiple ticket tiers together at a discounted
                  price
                </p>
              </div>

              <BundleEditor eventId={eventId} ticketTiers={ticketTiers || []} />
            </div>
          </div>
        )}

        {/* Waitlist Tab */}
        {activeTab === "waitlist" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Event Waitlist</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage customers waiting for tickets to this event
                    </p>
                  </div>
                </div>
              </div>

              {waitlist && waitlist.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticket Tier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {waitlist.map((entry) => (
                        <tr key={entry._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                            <div className="text-sm text-gray-500">{entry.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.tier ? entry.tier.name : "Any Tier"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.quantity} {entry.quantity === 1 ? "ticket" : "tickets"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(entry.joinedAt), "MMM d, yyyy h:mm a")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                entry.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : entry.status === "NOTIFIED"
                                    ? "bg-accent text-accent-foreground"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {entry.status === "ACTIVE" && <Bell className="w-3 h-3" />}
                              {entry.status === "NOTIFIED" && <Mail className="w-3 h-3" />}
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {entry.status === "ACTIVE" && (
                              <button
                                onClick={() => handleNotifyWaitlist(entry._id, entry.email)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs font-medium"
                              >
                                <Mail className="w-3 h-3" />
                                Notify
                              </button>
                            )}
                            {entry.status === "NOTIFIED" && entry.notifiedAt && (
                              <span className="text-xs text-gray-500">
                                Notified {format(new Date(entry.notifiedAt), "MMM d")}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Waitlist Entries</h3>
                  <p className="text-gray-600">
                    When your event sells out, customers can join a waitlist to be notified when
                    tickets become available
                  </p>
                </div>
              )}
            </div>

            {/* Waitlist Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-accent border border-border rounded-lg p-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">How the Waitlist Works</h3>
                  <ul className="text-sm text-accent-foreground space-y-1 list-disc list-inside">
                    <li>Customers can join the waitlist when all tickets are sold out</li>
                    <li>
                      Waitlist entries are shown in order of when they joined (first-in, first-out)
                    </li>
                    <li>
                      Click "Notify" to mark an entry as notified (you should then contact them via
                      email)
                    </li>
                    <li>
                      Notified users have priority to purchase tickets before they become publicly
                      available again
                    </li>
                    <li>Waitlist entries automatically expire after 30 days</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
