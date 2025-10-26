"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Share2,
  ArrowLeft,
  Ticket,
  AlertCircle,
  ExternalLink,
  Bell,
  X
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const eventDetails = useQuery(api.public.queries.getPublicEventDetails, {
    eventId,
  });

  // Waitlist state
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistTierId, setWaitlistTierId] = useState<Id<"ticketTiers"> | undefined>(undefined);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistQuantity, setWaitlistQuantity] = useState(1);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  const joinWaitlist = useMutation(api.waitlist.mutations.joinWaitlist);

  if (eventDetails === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  if (eventDetails === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600 mb-6">
              This event doesn't exist or is no longer available.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: eventDetails.name,
      text: `Check out this event: ${eventDetails.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleJoinWaitlist = (tierId?: Id<"ticketTiers">) => {
    setWaitlistTierId(tierId);
    setShowWaitlistModal(true);
  };

  const handleSubmitWaitlist = async () => {
    if (!waitlistEmail || !waitlistName || waitlistQuantity < 1) {
      alert("Please fill in all fields");
      return;
    }

    setIsJoiningWaitlist(true);
    try {
      await joinWaitlist({
        eventId,
        ticketTierId: waitlistTierId,
        email: waitlistEmail,
        name: waitlistName,
        quantity: waitlistQuantity,
      });
      alert("Successfully joined the waitlist! We'll notify you when tickets become available.");
      setShowWaitlistModal(false);
      setWaitlistEmail("");
      setWaitlistName("");
      setWaitlistQuantity(1);
      setWaitlistTierId(undefined);
    } catch (error: any) {
      alert(error.message || "Failed to join waitlist");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const isUpcoming = eventDetails.startDate ? eventDetails.startDate > Date.now() : false;
  const isPast = eventDetails.endDate ? eventDetails.endDate < Date.now() : false;
  const showTickets = eventDetails.eventType === "TICKETED_EVENT" &&
                       eventDetails.ticketsVisible &&
                       eventDetails.paymentConfigured &&
                       isUpcoming;

  // Check if all tickets are sold out
  const allTicketsSoldOut = eventDetails.ticketTiers?.every(
    tier => tier.quantity !== undefined && tier.sold !== undefined && tier.quantity - tier.sold <= 0
  ) ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Events</span>
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full h-64 md:h-96 bg-gray-200"
      >
        {eventDetails.imageUrl ? (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
            src={eventDetails.imageUrl}
            alt={eventDetails.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <Calendar className="w-24 h-24 text-white opacity-50" />
          </div>
        )}

        {/* Event Type Badge */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute top-4 left-4"
        >
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            eventDetails.eventType === "SAVE_THE_DATE"
              ? "bg-yellow-500 text-white"
              : eventDetails.eventType === "FREE_EVENT"
              ? "bg-green-500 text-white"
              : "bg-blue-500 text-white"
          }`}>
            {eventDetails.eventType === "SAVE_THE_DATE"
              ? "Save the Date"
              : eventDetails.eventType === "FREE_EVENT"
              ? "Free Event"
              : "Ticketed Event"}
          </span>
        </motion.div>

        {/* Past Event Badge */}
        {isPast && (
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute top-4 right-4"
          >
            <span className="px-3 py-1 bg-gray-700 text-white rounded-full text-xs font-semibold">
              Past Event
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="md:col-span-2"
            >
              {/* Event Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {eventDetails.name}
              </h1>

              {/* Categories */}
              {eventDetails.categories && eventDetails.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {eventDetails.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="prose max-w-none mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{eventDetails.description}</p>
              </div>

              {/* Additional Details - Commented out until schema is updated
              {eventDetails.additionalDetails && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Information</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{eventDetails.additionalDetails}</p>
                </div>
              )} */}

              {/* Organizer */}
              {eventDetails.organizer && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Organized By</h3>
                  <p className="text-gray-700 font-medium">{eventDetails.organizer.name || "Event Organizer"}</p>
                  {eventDetails.organizer.email && (
                    <a
                      href={`mailto:${eventDetails.organizer.email}`}
                      className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                    >
                      Contact Organizer
                    </a>
                  )}
                </div>
              )}
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="md:col-span-1"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
                {/* Date & Time */}
                {eventDetails.startDate && (
                  <div className="flex items-start gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {format(eventDetails.startDate, "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(eventDetails.startDate, "h:mm a")}
                        {eventDetails.endDate && ` - ${format(eventDetails.endDate, "h:mm a")}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {eventDetails.location && typeof eventDetails.location === "object" && (
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">{eventDetails.location.venueName}</p>
                      <p className="text-sm text-gray-600">
                        {eventDetails.location.address}
                        <br />
                        {eventDetails.location.city}, {eventDetails.location.state} {eventDetails.location.zipCode}
                      </p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          `${eventDetails.location.address}, ${eventDetails.location.city}, ${eventDetails.location.state}`
                        )}`}
                        target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-1 inline-flex items-center gap-1"
                    >
                      View Map
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                )}

                {/* Capacity - Commented out until schema is updated
                {eventDetails.capacity && (
                  <div className="flex items-start gap-3 mb-6">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Capacity: {eventDetails.capacity} attendees
                      </p>
                    </div>
                  </div>
                )} */}

                {/* Ticket Tiers Display for TICKETED_EVENT */}
                {eventDetails.eventType === "TICKETED_EVENT" && eventDetails.ticketTiers && eventDetails.ticketTiers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="mb-6 pb-6 border-b border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Ticket className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Available Tickets</h3>
                    </div>
                    <div className="space-y-2">
                      {eventDetails.ticketTiers.map((tier, index) => {
                        const isSoldOut = tier.quantity !== undefined && tier.sold !== undefined && tier.quantity - tier.sold <= 0;
                        return (
                          <motion.div
                            key={tier._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                            className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-gray-900">{tier.name}</p>
                              <p className="font-bold text-blue-600 text-lg">
                                ${(tier.price / 100).toFixed(2)}
                              </p>
                            </div>
                            {tier.description && (
                              <p className="text-xs text-gray-600 mb-1">{tier.description}</p>
                            )}
                            {tier.quantity !== undefined && tier.sold !== undefined && (
                              <div className="flex items-center justify-between gap-2 mt-2">
                                <p className={`text-xs font-medium ${
                                  tier.quantity - tier.sold > 0 ? "text-green-600" : "text-red-600"
                                }`}>
                                  {tier.quantity - tier.sold > 0
                                    ? `${tier.quantity - tier.sold} tickets available`
                                    : "Sold out"}
                                </p>
                                {isSoldOut && (
                                  <button
                                    onClick={() => handleJoinWaitlist(tier._id)}
                                    className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600 transition-colors"
                                  >
                                    <Bell className="w-3 h-3" />
                                    Waitlist
                                  </button>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Door Price Display for FREE_EVENT */}
                {eventDetails.eventType === "FREE_EVENT" && eventDetails.doorPrice && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="mb-6 pb-6 border-b border-gray-200"
                  >
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Ticket className="w-5 h-5 text-green-600" />
                        <p className="font-semibold text-green-900">Door Price</p>
                      </div>
                      <p className="text-green-800 font-bold text-lg">{eventDetails.doorPrice}</p>
                      <p className="text-xs text-green-700 mt-1">Payment accepted at venue</p>
                    </div>
                  </motion.div>
                )}

                {/* CTA Button */}
                {showTickets && eventDetails.ticketTiers && eventDetails.ticketTiers.length > 0 ? (
                  allTicketsSoldOut ? (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => handleJoinWaitlist()}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
                      >
                        <Bell className="w-5 h-5" />
                        Join Waitlist
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href={`/events/${eventId}/checkout`}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
                      >
                        <Ticket className="w-5 h-5" />
                        Buy Tickets
                      </Link>
                    </motion.div>
                  )
                ) : eventDetails.eventType === "FREE_EVENT" && isUpcoming ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={`/events/${eventId}/register`}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                    >
                      <Ticket className="w-5 h-5" />
                      Register Free
                    </Link>
                  </motion.div>
                ) : eventDetails.eventType === "SAVE_THE_DATE" ? (
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-yellow-800 font-medium">
                      Tickets coming soon!
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Save this date on your calendar
                    </p>
                  </div>
                ) : isPast ? (
                  <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">This event has ended</p>
                  </div>
                ) : null}

                {/* Ticket Info */}
                {!eventDetails.ticketsVisible && eventDetails.eventType === "TICKETED_EVENT" && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600">
                      Ticket sales have not started yet. Check back soon!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlistModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-900">Join Waitlist</h2>
                </div>
                <button
                  onClick={() => setShowWaitlistModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                We'll notify you when tickets become available for this event.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="waitlist-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="waitlist-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="waitlist-name"
                    type="text"
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="waitlist-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Tickets
                  </label>
                  <input
                    id="waitlist-quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={waitlistQuantity}
                    onChange={(e) => setWaitlistQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmitWaitlist}
                  disabled={isJoiningWaitlist}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isJoiningWaitlist ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Joining...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Join Waitlist
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowWaitlistModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
