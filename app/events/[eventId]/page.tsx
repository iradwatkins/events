import { Metadata } from "next";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import EventDetailClient from "./EventDetailClient";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

// Fetch event data directly from Convex HTTP API for metadata
async function getEventData(eventId: string) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined");
    }

    const response = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "public/queries:getPublicEventDetails",
        args: { eventId },
        format: "json",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error("Error fetching event data:", error);
    return null;
  }
}

function formatEventDate(timestamp: number, timezone?: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone || "America/New_York",
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;

  if (!eventId) {
    return {
      title: "Event | SteppersLife Events",
      description: "Discover amazing stepping events at SteppersLife.com",
    };
  }

  const eventDetails = await getEventData(eventId);

  if (!eventDetails) {
    return {
      title: "Event Not Found | SteppersLife Events",
      description: "This event doesn't exist or is no longer available.",
    };
  }

  // Format event date for description
  const eventDateStr = eventDetails.startDate
    ? formatEventDate(eventDetails.startDate, eventDetails.timezone)
    : "";

  // Check if tickets are available
  const hasTickets =
    eventDetails.eventType === "TICKETED_EVENT" &&
    eventDetails.ticketsVisible &&
    eventDetails.paymentConfigured &&
    eventDetails.ticketTiers &&
    eventDetails.ticketTiers.length > 0;

  // Create description with event title and call to action
  const callToAction = hasTickets
    ? "Buy Tickets on SteppersLife.com"
    : "Find more events on SteppersLife.com";

  const description = `${eventDetails.name}${eventDateStr ? " - " + eventDateStr : ""}. ${callToAction}`;

  // Use OG image API route for properly sized images
  const imageUrl = eventDetails.imageUrl
    ? `https://events.stepperslife.com/api/og-image/${eventId}`
    : "https://events.stepperslife.com/og-default.png";

  // Get the event URL
  const eventUrl = `https://events.stepperslife.com/events/${eventId}`;

  return {
    title: `${eventDetails.name} | SteppersLife Events`,
    description: description,

    // Open Graph metadata for Facebook, LinkedIn, etc.
    openGraph: {
      type: "website",
      url: eventUrl,
      title: "Discover Amazing Steppin Events Nationwide",
      description: description,
      siteName: "SteppersLife Events",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: eventDetails.name,
          type: "image/jpeg",
        },
      ],
      locale: "en_US",
    },

    // Twitter Card metadata
    twitter: {
      card: "summary_large_image",
      title: eventDetails.name,
      description: description,
      images: [imageUrl],
      creator: "@SteppersLife",
      site: "@SteppersLife",
    },

    // Additional metadata
    keywords: [
      "steppin events",
      "steppers",
      "dance events",
      eventDetails.name,
      ...(eventDetails.categories || []),
      ...(eventDetails.location ? [eventDetails.location.city, eventDetails.location.state] : []),
    ],

    authors: [
      {
        name: eventDetails.organizer?.name || eventDetails.organizerName || "Event Organizer",
      },
    ],

    // Canonical URL
    alternates: {
      canonical: eventUrl,
    },

    // Other metadata
    other: {
      "event:start_time": eventDetails.startDate
        ? new Date(eventDetails.startDate).toISOString()
        : "",
      "event:end_time": eventDetails.endDate ? new Date(eventDetails.endDate).toISOString() : "",
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;

  // Check if event exists - if not, return 404
  const eventDetails = await getEventData(eventId);
  if (!eventDetails) {
    notFound();
  }

  const typedEventId = eventId as Id<"events">;

  return <EventDetailClient eventId={typedEventId} />;
}
