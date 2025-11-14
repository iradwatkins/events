"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  Calendar,
  Ticket,
  MapPin,
  Download,
  ArrowLeft,
  QrCode,
  Share2,
  Send,
  X,
  Armchair,
  Edit,
  Trash2,
  Package,
  PackageOpen,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { formatEventLocation } from "@/lib/location-format";
import toast from "react-hot-toast";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function MyTicketsPage() {
  const tickets = useQuery(api.tickets.queries.getMyTickets);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [transferModalTicket, setTransferModalTicket] = useState<any | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferName, setTransferName] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // CRUD state management
  const [editModalTicket, setEditModalTicket] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [bundleName, setBundleName] = useState("");
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [deleteConfirmTicket, setDeleteConfirmTicket] = useState<any | null>(null);

  // Mutations
  const initiateTransfer = useMutation(api.transfers.mutations.initiateTransfer);
  const updateTicket = useMutation(api.tickets.mutations.updateTicket);
  const deleteTicket = useMutation(api.tickets.mutations.deleteTicket);
  const bundleTickets = useMutation(api.tickets.mutations.bundleTickets);
  const unbundleTickets = useMutation(api.tickets.mutations.unbundleTickets);

  // Group tickets by event
  const groupedTickets = tickets?.reduce(
    (acc, ticket) => {
      if (!ticket.event) return acc;

      const eventId = ticket.event._id;
      if (!acc[eventId]) {
        acc[eventId] = {
          event: ticket.event,
          tickets: [],
        };
      }
      acc[eventId].tickets.push(ticket);
      return acc;
    },
    {} as Record<string, { event: any; tickets: any[] }>
  );

  // Separate upcoming and past events
  const now = Date.now();
  const upcomingEvents = groupedTickets
    ? Object.values(groupedTickets).filter(
        (group: any) => group.event.startDate && group.event.startDate >= now
      )
    : [];
  const pastEvents = groupedTickets
    ? Object.values(groupedTickets).filter(
        (group: any) => !group.event.startDate || group.event.startDate < now
      )
    : [];

  const handleDownloadTicket = (ticketCode: string, eventName: string) => {
    // Create a simple download by opening the ticket in a new window
    window.print();
  };

  const handleShareTicket = (ticketCode: string, eventName: string) => {
    if (navigator.share) {
      navigator.share({
        title: `Ticket for ${eventName}`,
        text: `My ticket code: ${ticketCode}`,
      });
    } else {
      navigator.clipboard.writeText(ticketCode);
      toast.success("Ticket code copied to clipboard!");
    }
  };

  const handleTransferTicket = (ticket: any) => {
    setTransferModalTicket(ticket);
    setTransferEmail("");
    setTransferName("");
  };

  const handleSubmitTransfer = async () => {
    if (!transferModalTicket || !transferEmail || !transferName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsTransferring(true);
    try {
      await initiateTransfer({
        ticketId: transferModalTicket._id as Id<"tickets">,
        toEmail: transferEmail,
        toName: transferName,
      });

      toast.success(
        `Transfer initiated! An email has been sent to ${transferEmail} to accept the ticket.`
      );
      setTransferModalTicket(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to transfer ticket");
    } finally {
      setIsTransferring(false);
    }
  };

  // Edit ticket functionality
  const handleEditTicket = (ticket: any) => {
    setEditModalTicket(ticket);
    setEditName(ticket.attendeeName || "");
    setEditEmail(ticket.attendeeEmail || "");
  };

  const handleSubmitEdit = async () => {
    if (!editModalTicket) return;

    try {
      await updateTicket({
        ticketId: editModalTicket._id as Id<"tickets">,
        attendeeName: editName,
        attendeeEmail: editEmail,
      });

      toast.success("Ticket updated successfully!");
      setEditModalTicket(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update ticket");
    }
  };

  // Delete ticket functionality
  const handleDeleteTicket = async (ticket: any) => {
    setDeleteConfirmTicket(ticket);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmTicket) return;

    try {
      await deleteTicket({
        ticketId: deleteConfirmTicket._id as Id<"tickets">,
      });

      toast.success("Ticket cancelled successfully");
      setDeleteConfirmTicket(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel ticket");
    }
  };

  // Bundle functionality
  const handleToggleTicketSelection = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
  };

  const handleCreateBundle = async () => {
    if (!bundleName.trim()) {
      toast.error("Please enter a bundle name");
      return;
    }

    if (selectedTickets.length < 2) {
      toast.error("Select at least 2 tickets to bundle");
      return;
    }

    try {
      await bundleTickets({
        ticketIds: selectedTickets as Id<"tickets">[],
        bundleName: bundleName.trim(),
      });

      toast.success(`Bundle "${bundleName}" created successfully!`);
      setSelectedTickets([]);
      setBundleName("");
      setShowBundleModal(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create bundle");
    }
  };

  const handleUnbundle = async (ticketIds: string[]) => {
    try {
      await unbundleTickets({
        ticketIds: ticketIds as Id<"tickets">[],
      });

      toast.success("Tickets unbundled successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to unbundle tickets");
    }
  };

  // Check if ticket is editable
  const isTicketEditable = (ticket: any) => {
    if (ticket.status === "SCANNED" || ticket.status === "CANCELLED") return false;
    if (ticket.event?.startDate && Date.now() >= ticket.event.startDate) return false;
    return true;
  };

  if (!tickets) {
    return (
      <>
        <PublicHeader showCreateButton={false} />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </>
    );
  }

  if (tickets.length === 0) {
    return (
      <>
        <PublicHeader showCreateButton={false} />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="text-center">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 dark:text-white">No tickets yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your purchased tickets will appear here
            </p>
            <Link
              href="/"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Group bundled tickets
  const bundledTickets: Record<string, any[]> = {};
  tickets.forEach((ticket) => {
    if (ticket.bundleId) {
      if (!bundledTickets[ticket.bundleId]) {
        bundledTickets[ticket.bundleId] = [];
      }
      bundledTickets[ticket.bundleId].push(ticket);
    }
  });

  return (
    <>
      <PublicHeader showCreateButton={false} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and manage your event tickets
              </p>
            </div>

            {/* Bundle Actions */}
            {selectedTickets.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedTickets.length} ticket{selectedTickets.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setShowBundleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Package className="w-4 h-4" />
                  Create Bundle
                </button>
                <button
                  onClick={() => setSelectedTickets([])}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
              <div className="space-y-6">
                {upcomingEvents.map(({ event, tickets: eventTickets }) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{event.name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-gray-600">
                            {event.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(event.startDate), "PPP")}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {formatEventLocation(event.location)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="bg-accent text-primary px-3 py-1 rounded-full text-sm font-medium">
                          {eventTickets.length} ticket{eventTickets.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {eventTickets.map((ticket) => {
                          const isExpanded = expandedTicket === ticket._id;
                          const editable = isTicketEditable(ticket);

                          return (
                            <div
                              key={ticket._id}
                              className={`border rounded-lg transition-all ${
                                selectedTickets.includes(ticket._id)
                                  ? "border-primary bg-accent"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-3 flex-1">
                                    {/* Selection checkbox */}
                                    <input
                                      type="checkbox"
                                      checked={selectedTickets.includes(ticket._id)}
                                      onChange={() => handleToggleTicketSelection(ticket._id)}
                                      className="mt-1"
                                      disabled={!editable}
                                    />

                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {ticket.attendeeName || "Unnamed Ticket"}
                                        </span>
                                        {ticket.bundleId && (
                                          <span className="px-2 py-1 bg-accent text-primary text-xs rounded-full">
                                            {ticket.bundleName || "Bundled"}
                                          </span>
                                        )}
                                        {ticket.status === "CANCELLED" && (
                                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                            Cancelled
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        {ticket.attendeeEmail}
                                      </div>
                                      {ticket.tierName && (
                                        <div className="text-sm text-gray-500 mt-1">
                                          {ticket.tierName}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Action buttons */}
                                    {editable && (
                                      <>
                                        <button
                                          onClick={() => handleEditTicket(ticket)}
                                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                          title="Edit ticket"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleTransferTicket(ticket)}
                                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                          title="Transfer ticket"
                                        >
                                          <Send className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTicket(ticket)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Cancel ticket"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}

                                    <button
                                      onClick={() =>
                                        setExpandedTicket(isExpanded ? null : ticket._id)
                                      }
                                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded content */}
                                <AnimatePresence>
                                  {isExpanded && ticket.ticketCode && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="mt-4 pt-4 border-t"
                                    >
                                      <div className="flex flex-col items-center">
                                        <QRCodeSVG
                                          value={ticket.ticketCode}
                                          size={200}
                                          level="H"
                                          includeMargin={true}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                          Ticket Code: {ticket.ticketCode}
                                        </p>
                                        <div className="flex gap-2 mt-4">
                                          <button
                                            onClick={() =>
                                              handleShareTicket(ticket.ticketCode, event.name)
                                            }
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                                          >
                                            <Share2 className="w-4 h-4" />
                                            Share
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDownloadTicket(ticket.ticketCode, event.name)
                                            }
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                                          >
                                            <Download className="w-4 h-4" />
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Unbundle action for bundled tickets */}
                      {Object.entries(bundledTickets).map(([bundleId, bundleTickets]) => {
                        const bundleInThisEvent = bundleTickets.filter(
                          (t) => t.eventId === event._id
                        );
                        if (bundleInThisEvent.length === 0) return null;

                        return (
                          <div key={bundleId} className="mt-4 p-3 bg-accent rounded-lg">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-primary">
                                  Bundle: {bundleInThisEvent[0].bundleName}
                                </span>
                                <span className="text-sm text-primary">
                                  ({bundleInThisEvent.length} tickets)
                                </span>
                              </div>
                              <button
                                onClick={() => handleUnbundle(bundleInThisEvent.map((t) => t._id))}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-primary hover:bg-accent rounded-lg transition-colors"
                              >
                                <PackageOpen className="w-4 h-4" />
                                Unbundle
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Past Events Section */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Events</h2>
              <div className="space-y-6">
                {pastEvents.map(({ event, tickets: eventTickets }) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden opacity-75"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{event.name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-gray-600">
                            {event.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(event.startDate), "PPP")}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {formatEventLocation(event.location)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          {eventTickets.length} ticket{eventTickets.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {eventTickets.map((ticket) => (
                          <div key={ticket._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  {ticket.attendeeName || "Unnamed Ticket"}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {ticket.attendeeEmail}
                                </div>
                                {ticket.status === "SCANNED" && (
                                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    <Check className="w-3 h-3" />
                                    Scanned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transfer Modal */}
        {transferModalTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Transfer Ticket</h3>
                <button
                  onClick={() => setTransferModalTicket(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient's Name
                  </label>
                  <input
                    type="text"
                    value={transferName}
                    onChange={(e) => setTransferName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                    placeholder="Enter recipient's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient's Email
                  </label>
                  <input
                    type="email"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                    placeholder="Enter recipient's email"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSubmitTransfer}
                    disabled={isTransferring}
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isTransferring ? "Transferring..." : "Transfer Ticket"}
                  </button>
                  <button
                    onClick={() => setTransferModalTicket(null)}
                    className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Edit Ticket</h3>
                <button
                  onClick={() => setEditModalTicket(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendee Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                    placeholder="Enter attendee name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendee Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                    placeholder="Enter attendee email"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSubmitEdit}
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditModalTicket(null)}
                    className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bundle Modal */}
        {showBundleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Create Bundle</h3>
                <button
                  onClick={() => setShowBundleModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bundle Name
                  </label>
                  <input
                    type="text"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                    placeholder="Enter bundle name (e.g., Family Pack)"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Creating bundle with {selectedTickets.length} selected ticket
                    {selectedTickets.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreateBundle}
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                  >
                    Create Bundle
                  </button>
                  <button
                    onClick={() => setShowBundleModal(false)}
                    className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-xl font-bold">Cancel Ticket</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this ticket? This action cannot be undone.
              </p>

              <div className="bg-gray-50 p-3 rounded-lg mb-6">
                <div className="text-sm">
                  <span className="font-medium">Ticket:</span>{" "}
                  {deleteConfirmTicket.attendeeName || "Unnamed"}
                </div>
                <div className="text-sm text-gray-600">{deleteConfirmTicket.attendeeEmail}</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Yes, Cancel Ticket
                </button>
                <button
                  onClick={() => setDeleteConfirmTicket(null)}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Keep Ticket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <PublicFooter />
    </>
  );
}
