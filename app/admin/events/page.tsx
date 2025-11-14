"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Calendar,
  Filter,
  Trash2,
  Eye,
  DollarSign,
  Ticket,
  MapPin,
  Clock,
  CheckCircle2,
  FileText,
  XCircle,
  AlertCircle,
  Gift,
  Edit,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";

export default function EventsModerationPage() {
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [claimModalEventId, setClaimModalEventId] = useState<Id<"events"> | null>(null);
  const [claimCode, setClaimCode] = useState("");

  const allEvents = useQuery(
    api.adminPanel.queries.getAllEvents,
    statusFilter !== "all" ? { status: statusFilter } : {}
  );

  const updateEventStatus = useMutation(api.adminPanel.mutations.updateEventStatus);
  const deleteEvent = useAction(api.adminPanel.mutations.deleteEvent);
  const markClaimable = useMutation(api.adminPanel.mutations.markEventAsClaimable);
  const unmarkClaimable = useMutation(api.adminPanel.mutations.unmarkEventAsClaimable);

  const handleStatusChange = async (eventId: Id<"events">, newStatus: EventStatus) => {
    try {
      await updateEventStatus({ eventId, status: newStatus });
    } catch (error: unknown) {
      alert(`Failed to update status: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDeleteEvent = async (eventId: Id<"events">, eventName: string) => {
    try {
      const result = await deleteEvent({ eventId });
      // Page will auto-refresh via Convex reactivity
    } catch (error: unknown) {
      alert(`Failed to delete event: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleMakeClaimable = async () => {
    if (!claimModalEventId) return;

    try {
      await markClaimable({
        eventId: claimModalEventId,
        claimCode: claimCode || undefined,
      });
      setClaimModalEventId(null);
      setClaimCode("");
    } catch (error: unknown) {
      alert(
        `Failed to mark event as claimable: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleUnmarkClaimable = async (eventId: Id<"events">) => {
    try {
      await unmarkClaimable({ eventId });
    } catch (error: unknown) {
      alert(`Failed to unmark event: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!allEvents) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = {
    total: allEvents.length,
    published: allEvents.filter((e) => e.status === "PUBLISHED").length,
    draft: allEvents.filter((e) => e.status === "DRAFT").length,
    cancelled: allEvents.filter((e) => e.status === "CANCELLED").length,
    completed: allEvents.filter((e) => e.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Event Moderation</h1>
        <p className="text-gray-600 mt-1">Manage and moderate all platform events</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent text-primary rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent text-primary rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="all">All Events</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Draft Only</option>
            <option value="CANCELLED">Cancelled Only</option>
            <option value="COMPLETED">Completed Only</option>
          </select>

          <span className="text-sm text-gray-600">
            Showing {allEvents.length} {allEvents.length === 1 ? "event" : "events"}
          </span>
        </div>
      </div>

      {/* Events Grid */}
      {allEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {allEvents.map((event) => (
            <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Event Flyer - Thumbnail */}
                <div className="md:w-48 md:h-48 flex-shrink-0 bg-gray-100">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-l-lg"
                      onClick={() => window.open(event.imageUrl, "_blank")}
                      title="Click to view full-size flyer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary rounded-l-lg">
                      <Calendar className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Event Details - Right Side */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === "PUBLISHED"
                              ? "bg-green-100 text-green-800"
                              : event.status === "DRAFT"
                                ? "bg-yellow-100 text-yellow-800"
                                : event.status === "CANCELLED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-accent text-accent-foreground"
                          }`}
                        >
                          {event.status || "DRAFT"}
                        </span>
                        {event.isClaimable && !event.organizerId && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            Claimable
                          </span>
                        )}
                        {event.isClaimable && event.organizerId && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Claimed
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {event.description || "No description"}
                      </p>

                      {/* Event Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {event.startDate
                              ? format(new Date(event.startDate), "MMM d, yyyy h:mm a")
                              : "No date"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">
                            {typeof event.location === "string"
                              ? event.location
                              : event.location
                                ? `${event.location.city}, ${event.location.state}`
                                : "No location"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Ticket className="w-4 h-4" />
                          <span>{event.ticketCount || 0} tickets sold</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>${((event.revenue || 0) / 100).toFixed(2)} revenue</span>
                        </div>
                      </div>

                      {/* Organizer Info */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Organizer:</span> {event.organizerName}
                          {" • "}
                          <span className="text-gray-500">{event.organizerEmail}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Change Status:</span>
                      <button
                        onClick={() => handleStatusChange(event._id, "PUBLISHED")}
                        disabled={event.status === "PUBLISHED"}
                        className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => handleStatusChange(event._id, "DRAFT")}
                        disabled={event.status === "DRAFT"}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Draft
                      </button>
                      <button
                        onClick={() => handleStatusChange(event._id, "CANCELLED")}
                        disabled={event.status === "CANCELLED"}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleStatusChange(event._id, "COMPLETED")}
                        disabled={event.status === "COMPLETED"}
                        className="px-3 py-1 text-sm bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Complete
                      </button>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      {event.isClaimable ? (
                        <button
                          onClick={() => handleUnmarkClaimable(event._id)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                          title="Remove from claimable list"
                        >
                          <Gift className="w-4 h-4" />
                          Unmark Claimable
                        </button>
                      ) : (
                        <button
                          onClick={() => setClaimModalEventId(event._id)}
                          className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
                          title="Make event claimable by organizers"
                        >
                          <Gift className="w-4 h-4" />
                          Make Claimable
                        </button>
                      )}
                      <a
                        href={`/organizer/events/${event._id}/edit`}
                        className="p-2 text-primary hover:bg-accent rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <Edit className="w-4 h-4" />
                      </a>
                      <a
                        href={`/events/${event._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-primary hover:bg-accent rounded-lg transition-colors"
                        title="View event"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteEvent(event._id, event.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium mb-1">Event Moderation Guidelines</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Events with sold tickets cannot be deleted, only cancelled</li>
            <li>Published events are visible to all users on the platform</li>
            <li>Draft events are only visible to the organizer</li>
            <li>Cancelled events show as cancelled to ticket holders</li>
            <li>Completed events are archived but still accessible</li>
            <li>Claimable events appear in organizers' dashboards to claim ownership</li>
          </ul>
        </div>
      </div>

      {/* Claim Code Modal */}
      {claimModalEventId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-emerald-600" />
              <h3 className="text-xl font-bold text-gray-900">Make Event Claimable</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This event will be available for organizers to claim ownership. You can optionally set
              a claim code for security.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claim Code (Optional)
              </label>
              <input
                type="text"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value)}
                placeholder="Enter a claim code or leave empty"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                If set, organizers must enter this code to claim the event
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleMakeClaimable}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Make Claimable
              </button>
              <button
                onClick={() => {
                  setClaimModalEventId(null);
                  setClaimCode("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
