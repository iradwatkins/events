import { Metadata } from "next";
import EventsListClient from "./EventsListClient";

export const metadata: Metadata = {
  title: "All Events | SteppersLife Events",
  description:
    "Browse all upcoming stepping events, workshops, and socials. Find your next event on SteppersLife.com",
  openGraph: {
    title: "All Events | SteppersLife Events",
    description: "Browse all upcoming stepping events, workshops, and socials",
    type: "website",
  },
};

export default function EventsPage() {
  return <EventsListClient />;
}
