"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
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
  X,
  TrendingDown,
  Package,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { formatEventDate, formatEventTime, formatEventDateTime } from "@/lib/date-format";
import { SocialShareButtons } from "@/components/events/SocialShareButtons";
import InteractiveSeatingChart from "@/components/seating/InteractiveSeatingChart";

interface EventDetailClientProps {
  eventId: Id<"events">;
}

export default function EventDetailClient({ eventId }: EventDetailClientProps) {
  const router = useRouter();
  const ENABLE_SEATING = process.env.NEXT_PUBLIC_ENABLE_SEATING_CHARTS === "true";

  const eventDetails = useQuery(api.public.queries.getPublicEventDetails, {
    eventId,
  });
  const seatingChart = ENABLE_SEATING
    ? useQuery(api.seating.queries.getPublicSeatingChart, { eventId })
    : null;
  const eventBundles = useQuery(api.bundles.queries.getBundlesForPublicEvent, { eventId });

  // Waitlist state
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [waitlistTierId, setWaitlistTierId] = useState<Id<"ticketTiers"> | undefined>(undefined);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistQuantity, setWaitlistQuantity] = useState(1);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  const joinWaitlist = useMutation(api.waitlist.mutations.joinWaitlist);

  // Close flyer modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFlyerModal) {
        setShowFlyerModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showFlyerModal]);

  if (eventDetails === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
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
  const showTickets =
    eventDetails.eventType === "TICKETED_EVENT" &&
    eventDetails.ticketsVisible &&
    eventDetails.paymentConfigured &&
    isUpcoming;

  // Check if all tickets are sold out
  const allTicketsSoldOut =
    eventDetails.ticketTiers?.every(
      (tier) =>
        tier.quantity !== undefined && tier.sold !== undefined && tier.quantity - tier.sold <= 0
    ) ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-primary transition-colors"
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

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Section: Flyer (Left) + Event Info (Right) */}
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            {/* Flyer Image - Left (2/5 width) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-2"
            >
              <div className="relative w-full bg-gray-200 rounded-xl overflow-hidden shadow-lg sticky top-24">
                {eventDetails.imageUrl ? (
                  <div onClick={() => setShowFlyerModal(true)} className="cursor-pointer">
                    <img
                      src={eventDetails.imageUrl}
                      alt={eventDetails.name}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] flex items-center justify-center bg-primary">
                    <Calendar className="w-24 h-24 text-white opacity-50" />
                  </div>
                )}

                {/* Event Type Badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                      eventDetails.eventType === "SAVE_THE_DATE"
                        ? "bg-yellow-500 text-white"
                        : eventDetails.eventType === "FREE_EVENT"
                          ? "bg-green-500 text-white"
                          : "bg-primary text-white"
                    }`}
                  >
                    {eventDetails.eventType === "SAVE_THE_DATE"
                      ? "Save the Date"
                      : eventDetails.eventType === "FREE_EVENT"
                        ? "Free Event"
                        : "Ticketed Event"}
                  </span>
                </div>

                {/* Past Event Badge */}
                {isPast && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-gray-700 text-white rounded-full text-xs font-semibold shadow-lg">
                      Past Event
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Event Info - Right (3/5 width) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:col-span-3"
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
                      className="px-3 py-1 bg-accent text-primary rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Event Details Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                {/* Date & Time */}
                {eventDetails.startDate && (
                  <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-200">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {formatEventDate(eventDetails.startDate, eventDetails.timezone)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatEventTime(eventDetails.startDate, eventDetails.timezone)}
                        {eventDetails.endDate &&
                          ` - ${formatEventTime(eventDetails.endDate, eventDetails.timezone)}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {eventDetails.location && typeof eventDetails.location === "object" && (
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {eventDetails.location.venueName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {eventDetails.location.address}
                        <br />
                        {eventDetails.location.city}, {eventDetails.location.state}{" "}
                        {eventDetails.location.zipCode}
                      </p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          `${eventDetails.location.address}, ${eventDetails.location.city}, ${eventDetails.location.state}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm mt-1 inline-flex items-center gap-1"
                      >
                        View Map
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Ticket Tiers Display for TICKETED_EVENT */}
              {eventDetails.eventType === "TICKETED_EVENT" &&
                eventDetails.ticketTiers &&
                eventDetails.ticketTiers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="mb-6"
                  >
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Ticket className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-gray-900">Available Tickets</h3>
                      </div>
                      <div className="space-y-3">
                        {eventDetails.ticketTiers.map((tier: any, index: number) => {
                          const isSoldOut =
                            tier.quantity !== undefined &&
                            tier.sold !== undefined &&
                            tier.quantity - tier.sold <= 0;
                          const showEarlyBird = tier.isEarlyBird && tier.currentTierName;
                          const nextPriceIncrease =
                            tier.nextPriceChange && tier.nextPriceChange.price > tier.currentPrice;

                          return (
                            <motion.div
                              key={tier._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                                showEarlyBird
                                  ? "bg-amber-50 border-amber-200"
                                  : "bg-accent border-blue-100"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-900">{tier.name}</p>
                                    {showEarlyBird && (
                                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-500 text-white rounded-full font-medium">
                                        <Zap className="w-3 h-3" />
                                        {tier.currentTierName}
                                      </span>
                                    )}
                                  </div>
                                  {tier.description && (
                                    <p className="text-sm text-gray-600">{tier.description}</p>
                                  )}
                                </div>
                                <div className="text-right ml-2">
                                  <p
                                    className={`font-bold text-xl ${showEarlyBird ? "text-amber-600" : "text-primary"}`}
                                  >
                                    ${(tier.currentPrice / 100).toFixed(2)}
                                  </p>
                                  {showEarlyBird && tier.price !== tier.currentPrice && (
                                    <p className="text-sm text-gray-500 line-through">
                                      ${(tier.price / 100).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {nextPriceIncrease && (
                                <div className="mt-2 mb-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                  <p className="text-orange-700 font-medium">
                                    Price increases to $
                                    {(tier.nextPriceChange.price / 100).toFixed(2)} on{" "}
                                    {format(tier.nextPriceChange.date, "MMM d, yyyy")}
                                  </p>
                                </div>
                              )}

                              {tier.quantity !== undefined && tier.sold !== undefined && (
                                <div className="flex items-center justify-between gap-2 mt-2">
                                  <p
                                    className={`text-sm font-medium ${
                                      tier.quantity - tier.sold > 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {tier.quantity - tier.sold > 0
                                      ? `${tier.quantity - tier.sold} tickets available`
                                      : "Sold out"}
                                  </p>
                                  {isSoldOut && (
                                    <button
                                      onClick={() => handleJoinWaitlist(tier._id)}
                                      className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 transition-colors"
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
                    </div>
                  </motion.div>
                )}

              {/* Ticket Bundles Display */}
              {eventDetails.eventType === "TICKETED_EVENT" &&
                eventBundles &&
                eventBundles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    className="mb-6"
                  >
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-gray-900">Ticket Bundles</h3>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            Save More
                          </span>
                        </div>
                        <Link
                          href="/bundles"
                          className="text-sm text-primary hover:text-primary font-medium flex items-center gap-1"
                        >
                          View All Bundles
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="space-y-3">
                        {eventBundles.map((bundle: any, index: number) => (
                          <motion.div
                            key={bundle._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                            className="bg-accent border border-purple-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => router.push(`/bundles/${bundle._id}`)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-semibold text-gray-900">{bundle.name}</p>
                                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-500 text-white rounded-full font-bold">
                                    <TrendingDown className="w-3 h-3" />
                                    Save {bundle.percentageSavings}%
                                  </span>
                                  {bundle.bundleType === "MULTI_EVENT" && (
                                    <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full font-medium">
                                      Multi-Event
                                    </span>
                                  )}
                                </div>
                                {bundle.description && (
                                  <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>
                                )}

                                {/* Show events for multi-event bundles */}
                                {bundle.bundleType === "MULTI_EVENT" &&
                                  bundle.events &&
                                  bundle.events.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-xs text-gray-500 mb-1">
                                        Includes {bundle.events.length} events:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {bundle.events.map((event: any) => (
                                          <span
                                            key={event._id}
                                            className="text-xs px-2 py-0.5 bg-accent text-primary rounded border border-primary/30"
                                          >
                                            <Calendar className="w-3 h-3 inline mr-1" />
                                            {event.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                {/* Show included tickets */}
                                <div className="flex flex-wrap gap-1">
                                  {bundle.includedTiersDetails?.slice(0, 3).map((tier: any) => (
                                    <span
                                      key={tier.tierId}
                                      className="text-xs px-2 py-0.5 bg-accent text-primary rounded"
                                    >
                                      {tier.quantity}x {tier.tierName}
                                    </span>
                                  ))}
                                  {bundle.includedTiersDetails &&
                                    bundle.includedTiersDetails.length > 3 && (
                                      <span className="text-xs px-2 py-0.5 text-primary font-medium">
                                        +{bundle.includedTiersDetails.length - 3} more
                                      </span>
                                    )}
                                </div>
                              </div>
                              <div className="text-right ml-2">
                                <p className="font-bold text-primary text-xl">
                                  ${(bundle.price / 100).toFixed(2)}
                                </p>
                                {bundle.regularPrice && (
                                  <p className="text-sm text-gray-500 line-through">
                                    ${(bundle.regularPrice / 100).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-sm font-medium text-green-600">
                                {bundle.available} bundle{bundle.available !== 1 ? "s" : ""}{" "}
                                available
                              </p>
                              <button className="text-sm text-primary hover:text-primary font-medium">
                                View Details →
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

              {/* Door Price Display for FREE_EVENT */}
              {eventDetails.eventType === "FREE_EVENT" && eventDetails.doorPrice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mb-6"
                >
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Ticket className="w-5 h-5 text-green-600" />
                        <p className="font-semibold text-green-900">Door Price</p>
                      </div>
                      <p className="text-green-800 font-bold text-lg">{eventDetails.doorPrice}</p>
                      <p className="text-xs text-green-700 mt-1">Payment accepted at venue</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* View Seating Chart Button */}
              {ENABLE_SEATING && seatingChart && seatingChart.sections.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="mb-6"
                >
                  <button
                    onClick={() => setShowSeatingModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary/40 text-primary rounded-lg hover:bg-accent transition-colors font-medium"
                  >
                    <MapPin className="w-5 h-5" />
                    View Seating Chart
                  </button>
                </motion.div>
              )}

              {/* CTA Button */}
              {showTickets && eventDetails.ticketTiers && eventDetails.ticketTiers.length > 0 ? (
                allTicketsSoldOut ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mb-6"
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
                    className="mb-6"
                  >
                    <Link
                      href={`/events/${eventId}/checkout`}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
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
                  className="mb-6"
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
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800 font-medium">Tickets coming soon!</p>
                  <p className="text-xs text-yellow-700 mt-1">Save this date on your calendar</p>
                </div>
              ) : isPast ? (
                <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                  <p className="text-sm text-gray-600">This event has ended</p>
                </div>
              ) : null}

              {/* Ticket Info */}
              {!eventDetails.ticketsVisible && eventDetails.eventType === "TICKETED_EVENT" && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                  <p className="text-xs text-gray-600">
                    Ticket sales have not started yet. Check back soon!
                  </p>
                </div>
              )}

              {/* Organizer */}
              {(eventDetails.organizer || eventDetails.organizerName) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Organized By</h3>
                  <p className="text-gray-700 font-medium text-xl">
                    {eventDetails.organizer?.name ||
                      eventDetails.organizerName ||
                      "Event Organizer"}
                  </p>
                  {eventDetails.organizer?.email && (
                    <a
                      href={`mailto:${eventDetails.organizer.email}`}
                      className="text-primary hover:underline text-sm mt-2 inline-block"
                    >
                      Contact Organizer
                    </a>
                  )}
                  {/* Show credit line only for admin-posted events */}
                  {eventDetails.isClaimable && (
                    <p className="text-[7pt] text-gray-400 mt-2">posted by stepperslife.com</p>
                  )}
                </div>
              )}

              {/* Social Share Buttons */}
              <div className="mt-6">
                <SocialShareButtons
                  eventName={eventDetails.name}
                  eventUrl={typeof window !== "undefined" ? window.location.href : ""}
                  eventDate={
                    eventDetails.startDate
                      ? formatEventDate(eventDetails.startDate, eventDetails.timezone)
                      : ""
                  }
                  hasTickets={showTickets}
                />
              </div>
            </motion.div>
          </div>

          {/* Description Section - Full Width Below */}
          {eventDetails.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                <div className="prose max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{eventDetails.description}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Seating Chart Modal */}
      <AnimatePresence>
        {ENABLE_SEATING && showSeatingModal && seatingChart && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-6 my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-gray-900">Seating Chart</h2>
                </div>
                <button
                  onClick={() => setShowSeatingModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Venue Image */}
              {seatingChart.venueImageUrl && (
                <div className="mb-6 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={seatingChart.venueImageUrl}
                    alt="Venue Layout"
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Interactive Ballroom Chart for TABLE_BASED layouts */}
              {seatingChart.layoutType === "TABLE_BASED" ? (
                <div className="mb-6">
                  <InteractiveSeatingChart
                    eventId={eventId}
                    onSeatSelect={() => {}} // Read-only preview, no selection
                    onSeatDeselect={() => {}}
                    selectedSeats={[]}
                    className="min-h-[500px]"
                  />
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Click "Buy Tickets" below to select your seats
                  </p>
                </div>
              ) : (
                /* Traditional Row/Section view for ROW_BASED layouts */
                <div className="space-y-6">
                  {seatingChart.sections.map((section: any, sectionIndex: number) => (
                    <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: section.color || "#3B82F6" }}
                        ></div>
                        <h3 className="text-lg font-bold text-gray-900">{section.name}</h3>
                      </div>

                      {/* Row-based seating */}
                      {section.rows && section.rows.length > 0 && (
                        <div className="space-y-2">
                          {section.rows.map((row: any) => (
                            <div key={row.id} className="flex items-center gap-2">
                              <span className="w-8 text-sm font-medium text-gray-600 text-right">
                                {row.label}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {row.seats.map((seat: any) => (
                                  <div
                                    key={seat.id}
                                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium border-2 ${
                                      seat.status === "RESERVED"
                                        ? "bg-gray-300 text-gray-600 border-gray-400"
                                        : seat.status === "UNAVAILABLE"
                                          ? "bg-gray-200 text-gray-500 border-gray-400"
                                          : "bg-white text-gray-900 border-gray-900"
                                    }`}
                                    title={`Seat ${seat.number} - ${seat.status}`}
                                  >
                                    {seat.number}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Table-based seating */}
                      {section.tables && section.tables.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {section.tables.map((table: any) => (
                            <div
                              key={table.id}
                              className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                            >
                              <p className="font-semibold text-gray-900 mb-2">
                                Table {table.number}
                              </p>
                              <div className="flex gap-1 flex-wrap">
                                {table.seats.map((seat: any) => (
                                  <div
                                    key={seat.id}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
                                      seat.status === "RESERVED"
                                        ? "bg-gray-300 text-gray-600 border-gray-400"
                                        : "bg-white text-gray-900 border-gray-900"
                                    }`}
                                    title={`Seat ${seat.number}`}
                                  >
                                    {seat.number}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Legend - Only show for ROW_BASED layouts */}
              {seatingChart.layoutType !== "TABLE_BASED" && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white border-2 border-gray-900 rounded"></div>
                      <span className="text-gray-700">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 border-2 border-gray-400 rounded"></div>
                      <span className="text-gray-700">Reserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 border-2 border-gray-400 rounded"></div>
                      <span className="text-gray-700">Unavailable</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Link
                  href={`/events/${eventId}/checkout`}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  onClick={() => setShowSeatingModal(false)}
                >
                  <Ticket className="w-5 h-5" />
                  Buy Tickets
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <label
                    htmlFor="waitlist-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="waitlist-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="waitlist-quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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

      {/* Flyer Enlargement Modal */}
      <AnimatePresence>
        {showFlyerModal && eventDetails.imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFlyerModal(false)}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl max-h-[90vh] cursor-default"
            >
              {/* Close button */}
              <button
                onClick={() => setShowFlyerModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Full-size flyer image */}
              <img
                src={eventDetails.imageUrl}
                alt={eventDetails.name}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />

              {/* Hint text */}
              <p className="absolute -bottom-10 left-0 right-0 text-center text-white text-sm opacity-75">
                Click outside or press ESC to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
