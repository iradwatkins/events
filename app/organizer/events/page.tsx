"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Calendar, Plus, Settings, Users, TicketCheck, DollarSign, Ticket } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { formatEventDate } from "@/lib/date-format";
import { useRouter } from "next/navigation";

export default function OrganizerEventsPage() {
  const router = useRouter();

  // TESTING MODE: Commented out authentication check
  // const currentUser = useQuery(api.users.queries.getCurrentUser);
  const events = useQuery(api.events.queries.getOrganizerEvents);
  const credits = useQuery(api.credits.queries.getMyCredits);

  const isLoading = events === undefined || credits === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // TESTING MODE: Skip auth check
  // if (!currentUser) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //       <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
  //         <p className="text-gray-600 mb-4">Please sign in to access your organizer dashboard.</p>
  //         <Link href="/login" className="text-blue-600 hover:underline font-medium">
  //           Sign In
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

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
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
              <p className="text-gray-600 mt-1">Manage your events and ticket sales</p>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/organizer/events/create"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Credit Balance Widget */}
        {credits && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Free Ticket Credits
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      You have <span className="font-bold text-green-700">{credits.creditsRemaining}</span> free tickets remaining
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        {credits.creditsUsed} used
                      </span>
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        {credits.creditsTotal} total
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="bg-white rounded-lg px-4 py-2 border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">After free tickets:</p>
                    <p className="text-sm font-bold text-gray-900">
                      <span className="text-blue-700">$0.30</span> per ticket
                    </p>
                  </div>
                  {credits.creditsRemaining <= 20 && credits.creditsRemaining > 0 && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded px-3 py-1">
                      <p className="text-xs font-semibold text-yellow-800">
                        Running low!
                      </p>
                    </div>
                  )}
                  {credits.creditsRemaining === 0 && (
                    <div className="bg-red-50 border border-red-300 rounded px-3 py-1">
                      <p className="text-xs font-semibold text-red-800">
                        No free tickets left
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {/* My Events Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
        </div>

        {events.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first event to start selling tickets
            </p>
            <Link
              href="/organizer/events/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Event
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => {
              const isUpcoming = event.startDate ? event.startDate > Date.now() : false;
              const isPast = event.endDate ? event.endDate < Date.now() : false;

              return (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Event Image */}
                    <div className="sm:w-48 h-32 sm:h-auto bg-gray-200 flex-shrink-0">
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
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {event.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {event.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatEventDate(event.startDate, event.timezone)}
                              </span>
                            )}
                            {event.eventType && (
                              <span className="px-2 py-1 text-xs font-semibold bg-gray-100 rounded-full">
                                {event.eventType.replace("_", " ")}
                              </span>
                            )}
                            {isPast && (
                              <span className="px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-600 rounded-full">
                                Ended
                              </span>
                            )}
                            {isUpcoming && (
                              <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                                Upcoming
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 mt-4">
                        <Link
                          href={`/events/${event._id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          View Public Page
                        </Link>

                        {!event.paymentModelSelected && event.eventType === "TICKETED_EVENT" && (
                          <Link
                            href={`/organizer/events/${event._id}/payment-setup`}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Setup Payment
                          </Link>
                        )}

                        {event.paymentModelSelected && (
                          <>
                            <Link
                              href={`/organizer/events/${event._id}/tickets`}
                              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <TicketCheck className="w-4 h-4" />
                              Manage Tickets
                            </Link>
                            <Link
                              href={`/organizer/events/${event._id}/staff`}
                              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Users className="w-4 h-4" />
                              Manage Staff
                            </Link>
                            <Link
                              href={`/organizer/events/${event._id}/sales`}
                              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                              View Sales
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
