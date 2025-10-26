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
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export default function MyTicketsPage() {
  const tickets = useQuery(api.tickets.queries.getMyTickets);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [transferModalTicket, setTransferModalTicket] = useState<any | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferName, setTransferName] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const initiateTransfer = useMutation(api.transfers.mutations.initiateTransfer);

  // Group tickets by event
  const groupedTickets = tickets?.reduce((acc, ticket) => {
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
  }, {} as Record<string, { event: any; tickets: any[] }>);

  // Separate upcoming and past events
  const now = Date.now();
  const upcomingEvents = groupedTickets
    ? Object.values(groupedTickets).filter(
        (group) => group.event.startDate && group.event.startDate >= now
      )
    : [];
  const pastEvents = groupedTickets
    ? Object.values(groupedTickets).filter(
        (group) => !group.event.startDate || group.event.startDate < now
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
      alert("Ticket code copied to clipboard!");
    }
  };

  const handleTransferTicket = (ticket: any) => {
    setTransferModalTicket(ticket);
    setTransferEmail("");
    setTransferName("");
  };

  const handleSubmitTransfer = async () => {
    if (!transferModalTicket || !transferEmail || !transferName) {
      alert("Please fill in all fields");
      return;
    }

    setIsTransferring(true);
    try {
      await initiateTransfer({
        ticketId: transferModalTicket._id as Id<"tickets">,
        toEmail: transferEmail,
        toName: transferName,
      });

      alert(`Transfer initiated! An email has been sent to ${transferEmail} to accept the ticket.`);
      setTransferModalTicket(null);
      setTransferEmail("");
      setTransferName("");
    } catch (error: any) {
      alert(error.message || "Failed to transfer ticket");
    } finally {
      setIsTransferring(false);
    }
  };

  if (tickets === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading your tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasNoTickets = tickets.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Events</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
            <p className="text-gray-600">View and manage your event tickets</p>
          </motion.div>

          {/* No Tickets State */}
          {hasNoTickets && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Tickets Yet</h2>
              <p className="text-gray-600 mb-6">
                You haven't purchased any tickets. Browse events to get started!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
              <div className="space-y-6">
                {upcomingEvents.map((group, index) => (
                  <motion.div
                    key={group.event._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <EventTicketGroup
                      group={group}
                      isUpcoming={true}
                      expandedTicket={expandedTicket}
                      setExpandedTicket={setExpandedTicket}
                      onDownload={handleDownloadTicket}
                      onShare={handleShareTicket}
                      onTransfer={handleTransferTicket}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Events</h2>
              <div className="space-y-6">
                {pastEvents.map((group, index) => (
                  <motion.div
                    key={group.event._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <EventTicketGroup
                      group={group}
                      isUpcoming={false}
                      expandedTicket={expandedTicket}
                      setExpandedTicket={setExpandedTicket}
                      onDownload={handleDownloadTicket}
                      onShare={handleShareTicket}
                      onTransfer={handleTransferTicket}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {transferModalTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Transfer Ticket
                </h3>
                <button
                  onClick={() => setTransferModalTicket(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Transferring ticket:</p>
                <p className="font-semibold text-gray-900">{transferModalTicket.ticketCode}</p>
                <p className="text-sm text-gray-600">
                  {transferModalTicket.tier?.name || "General Admission"}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={transferName}
                    onChange={(e) => setTransferName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> The recipient will receive an email with instructions to accept this ticket. The transfer will expire in 7 days if not accepted.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitTransfer}
                  disabled={isTransferring || !transferEmail || !transferName}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isTransferring ? "Transferring..." : "Transfer Ticket"}
                </button>
                <button
                  onClick={() => setTransferModalTicket(null)}
                  disabled={isTransferring}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface EventTicketGroupProps {
  group: { event: any; tickets: any[] };
  isUpcoming: boolean;
  expandedTicket: string | null;
  setExpandedTicket: (id: string | null) => void;
  onDownload: (ticketCode: string, eventName: string) => void;
  onShare: (ticketCode: string, eventName: string) => void;
  onTransfer: (ticket: any) => void;
}

function EventTicketGroup({
  group,
  isUpcoming,
  expandedTicket,
  setExpandedTicket,
  onDownload,
  onShare,
  onTransfer,
}: EventTicketGroupProps) {
  const { event, tickets } = group;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="md:flex">
        {/* Event Image */}
        <div className="md:w-48 h-48 md:h-auto bg-gray-200 flex-shrink-0">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <Calendar className="w-12 h-12 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Link
                href={`/events/${event._id}`}
                className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {event.name}
              </Link>

              {!isUpcoming && (
                <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                  Past Event
                </span>
              )}
            </div>
          </div>

          {/* Date & Location */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {event.startDate && format(event.startDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {event.location.venueName ? `${event.location.venueName}, ` : ""}
                  {event.location.city}, {event.location.state}
                </span>
              </div>
            )}
          </div>

          {/* Tickets List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Your Tickets ({tickets.length})
            </h3>

            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Ticket Summary */}
                <button
                  onClick={() =>
                    setExpandedTicket(expandedTicket === ticket._id ? null : ticket._id)
                  }
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-blue-600" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {ticket.tier?.name || "General Admission"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Code: {ticket.ticketCode}
                      </p>
                      {ticket.seat && (
                        <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                          <Armchair className="w-3 h-3" />
                          {ticket.seat.sectionName} • Row {ticket.seat.rowLabel} • #{ticket.seat.seatNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      ticket.status === "VALID"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {ticket.status}
                    </span>
                    <QrCode className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {/* Expanded Ticket Details with QR Code */}
                {expandedTicket === ticket._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 bg-white border-t border-gray-200"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* QR Code */}
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                          <QRCodeSVG
                            value={`https://events.stepperslife.com/ticket/${ticket.ticketCode}`}
                            size={180}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                        <p className="mt-3 text-xs text-gray-500 text-center max-w-[180px]">
                          Scan this QR code at the event entrance
                        </p>
                      </div>

                      {/* Ticket Details */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-3">Ticket Details</h4>
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="text-gray-500">Ticket Code</dt>
                            <dd className="font-mono text-gray-900 font-semibold">{ticket.ticketCode}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Tier</dt>
                            <dd className="text-gray-900">{ticket.tier?.name || "General Admission"}</dd>
                          </div>
                          {ticket.tier?.price && (
                            <div>
                              <dt className="text-gray-500">Price</dt>
                              <dd className="text-gray-900">${(ticket.tier.price / 100).toFixed(2)}</dd>
                            </div>
                          )}
                          {ticket.seat && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 -mx-1">
                              <dt className="text-blue-700 font-semibold flex items-center gap-2 mb-1">
                                <Armchair className="w-4 h-4" />
                                Assigned Seat
                              </dt>
                              <dd className="text-blue-900 font-bold text-lg">
                                {ticket.seat.sectionName} • Row {ticket.seat.rowLabel} • Seat {ticket.seat.seatNumber}
                              </dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-gray-500">Status</dt>
                            <dd className={`font-semibold ${
                              ticket.status === "VALID" ? "text-green-600" : "text-gray-600"
                            }`}>
                              {ticket.status}
                            </dd>
                          </div>
                          {ticket.order?.paidAt && (
                            <div>
                              <dt className="text-gray-500">Purchased</dt>
                              <dd className="text-gray-900">
                                {format(ticket.order.paidAt, "MMM d, yyyy 'at' h:mm a")}
                              </dd>
                            </div>
                          )}
                        </dl>

                        {/* Actions */}
                        {isUpcoming && (
                          <div className="flex flex-wrap gap-2 mt-6">
                            <button
                              onClick={() => onDownload(ticket.ticketCode, event.name)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              Print Ticket
                            </button>
                            <button
                              onClick={() => onShare(ticket.ticketCode, event.name)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                            {ticket.status === "VALID" && !ticket.scannedAt && (
                              <button
                                onClick={() => onTransfer(ticket)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                              >
                                <Send className="w-4 h-4" />
                                Transfer
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
