"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Calendar,
  Ticket,
  MapPin,
  Download,
  Mail,
  ArrowLeft,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function MyTicketsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const upcomingEvents = useQuery(api.tickets.queries.getMyUpcomingEvents);
  const pastEvents = useQuery(api.tickets.queries.getMyPastEvents);

  // Check if user is authenticated
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              Please sign in to view your tickets.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = upcomingEvents === undefined || pastEvents === undefined;
  const hasNoTickets = upcomingEvents?.length === 0 && pastEvents?.length === 0;

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

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">{currentUser.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading your tickets...</p>
            </div>
          )}

          {/* No Tickets State */}
          {!isLoading && hasNoTickets && (
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
          {!isLoading && upcomingEvents && upcomingEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
              <div className="space-y-4">
                {upcomingEvents.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <EventTicketCard item={item} isUpcoming={true} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Past Events */}
          {!isLoading && pastEvents && pastEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Events</h2>
              <div className="space-y-4">
                {pastEvents.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <EventTicketCard item={item} isUpcoming={false} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EventTicketCardProps {
  item: any;
  isUpcoming: boolean;
}

function EventTicketCard({ item, isUpcoming }: EventTicketCardProps) {
  const event = item;
  const tickets = [];
  const totalTickets = item.totalTickets || 0;

  const handleDownloadTickets = () => {
    // TODO: Implement PDF ticket download
    alert("PDF download feature coming soon!");
  };

  const handleEmailTickets = () => {
    // TODO: Implement email tickets
    alert("Email tickets feature coming soon!");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {format(event.startDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {event.location.venueName}, {event.location.city}, {event.location.state}
              </span>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">
                Your Tickets
              </span>
              <span className="text-sm text-gray-600">
                {totalTickets} {totalTickets === 1 ? "ticket" : "tickets"}
              </span>
            </div>

            {/* Removed individual ticket display for now - will be re-added when query structure is updated */}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isUpcoming && (
              <>
                <button
                  onClick={handleDownloadTickets}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Tickets
                </button>
                <button
                  onClick={handleEmailTickets}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Mail className="w-4 h-4" />
                  Email Tickets
                </button>
              </>
            )}

            <Link
              href={`/events/${event._id}`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              View Event Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
