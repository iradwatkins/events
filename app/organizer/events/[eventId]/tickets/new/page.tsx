"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UnifiedTicketManager } from "@/components/tickets/UnifiedTicketManager";

export default function NewTicketManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  if (!event || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Check if user is the organizer
  if (event.organizerId !== currentUser._id) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href={`/organizer/events/${eventId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event Dashboard
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ticket Management</h1>
            <p className="text-gray-600 mt-1">{event.name}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <UnifiedTicketManager eventId={eventId} />
      </main>
    </div>
  );
}
