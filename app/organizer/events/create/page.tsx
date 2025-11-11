"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
// TESTING MODE: No authentication
// import { useSession } from "next-auth/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  Users,
  Info,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { CapacityAwareTicketEditor } from "@/components/events/CapacityAwareTicketEditor";
import { WelcomePopup } from "@/components/organizer/WelcomePopup";
import { getTimezoneFromLocation, getTimezoneName } from "@/lib/timezone";
import { Id } from "@/convex/_generated/dataModel";
import { toDate } from "date-fns-tz";
import { format as formatDate } from "date-fns";

type EventType = "TICKETED_EVENT" | "FREE_EVENT" | "SAVE_THE_DATE"; // | "BALLROOM_EVENT"; // Ballroom feature hidden

interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
}

const EVENT_CATEGORIES = [
  "Steppers Set",
  "Workshop",
  "Social",
  "Competition",
  "Festival",
  "Conference",
  "Fundraiser",
  "Other",
];

export default function CreateEventPage() {
  const router = useRouter();
  // TESTING MODE: No authentication
  // const { data: session, status } = useSession();
  const session = null;
  const status = "unauthenticated";
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  // TESTING MODE: Authentication disabled, user creation skipped

  const [step, setStep] = useState(1);

  // Basic Information
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>("TICKETED_EVENT");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  // Date & Time
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [detectedTimezone, setDetectedTimezone] = useState("");

  // Location
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("USA");

  // Details
  const [capacity, setCapacity] = useState("");
  const [uploadedImageId, setUploadedImageId] = useState<Id<"_storage"> | null>(null);
  const [doorPrice, setDoorPrice] = useState("");

  // Ticket Tiers (for TICKETED_EVENT)
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Queries for welcome popup logic
  const myEvents = useQuery(api.events.queries.getOrganizerEvents);
  const creditBalance = useQuery(api.payments.queries.getCreditBalance);
  const markWelcomePopupShown = useMutation(api.users.mutations.markWelcomePopupShown);

  // Show welcome popup if this is their first event and they haven't seen it
  useEffect(() => {
    if (currentUser && myEvents !== undefined && creditBalance !== undefined) {
      const isFirstEvent = myEvents.length === 0;
      const hasNoCredits = !creditBalance || creditBalance.creditsRemaining === 0;
      const hasntSeenPopup = !currentUser.welcomePopupShown;

      if (isFirstEvent && hasNoCredits && hasntSeenPopup) {
        console.log("[CreateEvent] First-time organizer detected - showing welcome popup");
        setShowWelcomePopup(true);
      }
    }
  }, [currentUser, myEvents, creditBalance]);

  const handleWelcomePopupClose = async () => {
    setShowWelcomePopup(false);
    try {
      await markWelcomePopupShown();
      console.log("[CreateEvent] Welcome popup marked as shown");
    } catch (error) {
      console.error("[CreateEvent] Failed to mark welcome popup as shown:", error);
    }
  };

  // Auto-detect timezone when city or state changes
  useEffect(() => {
    if (city && state) {
      const tz = getTimezoneFromLocation(city, state);
      setTimezone(tz);
      setDetectedTimezone(getTimezoneName(tz));
    }
  }, [city, state]);

  const createEvent = useMutation(api.events.mutations.createEvent);
  const createTicketTier = useMutation(api.tickets.mutations.createTicketTier);
  const testAuth = useMutation(api.debug.testAuth);

  // Debug: Test authentication
  const handleTestAuth = async () => {
    try {
      console.log("[DEBUG] Testing authentication...");
      const result = await testAuth({});
      console.log("[DEBUG] Auth test result:", result);
      alert(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error("[DEBUG] Auth test failed:", error);
      alert("Auth test failed: " + error.message);
    }
  };

  // TESTING MODE: Skip auth check temporarily
  // if (status === "loading" || currentUser === undefined) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //       <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // // Redirect to login if not authenticated
  // if (status === "unauthenticated") {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //       <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
  //         <p className="text-gray-600 mb-4">Please sign in to create an event.</p>
  //         <Link href="/login?callbackUrl=/organizer/events/create" className="text-primary hover:underline font-medium">
  //           Sign In
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  const handleCategoryToggle = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const handleSubmit = async () => {
    // Validation - Check each field individually for better error messages
    const missingFields: string[] = [];

    if (!eventName) missingFields.push("Event Name");
    if (!description) missingFields.push("Description");
    if (!startDate) missingFields.push("Start Date & Time");
    if (!city) missingFields.push("City");
    if (!state) missingFields.push("State");

    // Validate ticket tiers for TICKETED_EVENT
    if (eventType === "TICKETED_EVENT") { // || eventType === "BALLROOM_EVENT" - Ballroom feature hidden
      if (ticketTiers.length === 0) {
        alert("Please add at least one ticket tier for your ticketed event.");
        return;
      }

      // Validate capacity is set
      if (!capacity || parseInt(capacity) <= 0) {
        alert("Please set an event capacity for ticketed events");
        return;
      }

      // Calculate total allocated tickets
      let totalAllocated = 0;

      // Validate each tier
      for (let i = 0; i < ticketTiers.length; i++) {
        const tier = ticketTiers[i];
        if (!tier.name) {
          alert(`Ticket Tier ${i + 1}: Please enter a tier name`);
          return;
        }
        if (!tier.price || parseFloat(tier.price) <= 0) {
          alert(`Ticket Tier ${i + 1}: Please enter a valid price greater than $0`);
          return;
        }
        if (!tier.quantity || parseInt(tier.quantity) <= 0) {
          alert(`Ticket Tier ${i + 1}: Please enter a valid quantity greater than 0`);
          return;
        }
        totalAllocated += parseInt(tier.quantity);
      }

      // Validate total tickets don't exceed capacity
      const eventCapacity = parseInt(capacity);
      if (totalAllocated > eventCapacity) {
        alert(
          `Total ticket allocation (${totalAllocated.toLocaleString()}) exceeds event capacity (${eventCapacity.toLocaleString()}).\n\n` +
          `Please reduce your ticket quantities by ${(totalAllocated - eventCapacity).toLocaleString()} tickets or increase your event capacity.`
        );
        return;
      }
    }

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n\n${missingFields.map(f => `• ${f}`).join('\n')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert datetime-local string to UTC timestamp in the EVENT'S timezone
      // datetime-local gives us "2024-11-07T20:00" which has NO timezone info
      // We need to interpret this AS IF it's in the event's timezone

      // Parse the datetime-local value
      const startDateObj = new Date(startDate);
      const endDateObj = endDate ? new Date(endDate) : startDateObj;

      // Convert to timestamp (will be in browser's timezone initially)
      // Since we're using the literal strings for display, the timestamp is just for sorting
      const startDateUTC = startDateObj.getTime();
      const endDateUTC = endDateObj.getTime();

      // Extract literal date and time for display purposes
      // These will be shown exactly as the user entered them
      const eventDateLiteral = formatDate(startDateObj, "MMMM d, yyyy");
      const eventTimeLiteral = formatDate(startDateObj, "h:mm a");

      console.log(`[CREATE EVENT] Converting dates:`);
      console.log(`  Input: ${startDate}`);
      console.log(`  Timezone: ${timezone}`);
      console.log(`  UTC Timestamp: ${startDateUTC}`);
      console.log(`  Literal Date: ${eventDateLiteral}`);
      console.log(`  Literal Time: ${eventTimeLiteral}`);

      const eventData = {
        name: eventName,
        eventType,
        description,
        categories,
        startDate: startDateUTC,
        endDate: endDateUTC,
        timezone,
        eventDateLiteral,
        eventTimeLiteral,
        eventTimezone: timezone,
        location: {
          venueName: venueName || undefined,
          address: address || undefined,
          city,
          state,
          zipCode: zipCode || undefined,
          country,
        },
        capacity: capacity ? parseInt(capacity) : undefined,
        doorPrice: doorPrice || undefined,
        imageUrl: undefined,
        images: uploadedImageId ? [uploadedImageId] : [],
      };

      console.log("[CREATE EVENT] Submitting event data:", eventData);
      console.log("[CREATE EVENT] Session status:", status);
      // console.log("[CREATE EVENT] Session user:", session?.user);
      console.log("[CREATE EVENT] Current user from Convex:", currentUser);

      const eventId = await createEvent(eventData);

      console.log("[CREATE EVENT] Event created successfully:", eventId);
      console.log("[CREATE EVENT] Event ID type:", typeof eventId);
      console.log("[CREATE EVENT] Event ID value:", eventId);

      if (!eventId) {
        throw new Error("No event ID returned from server");
      }

      // Create ticket tiers for TICKETED_EVENT
      if (eventType === "TICKETED_EVENT" && ticketTiers.length > 0) { // || eventType === "BALLROOM_EVENT" - Ballroom feature hidden
        console.log("[CREATE EVENT] Creating", ticketTiers.length, "ticket tiers...");

        for (const tier of ticketTiers) {
          const priceCents = Math.round(parseFloat(tier.price) * 100);
          const quantity = parseInt(tier.quantity);

          await createTicketTier({
            eventId,
            name: tier.name,
            description: tier.description || undefined,
            price: priceCents,
            quantity,
            // Mixed Allocation Support
            allocationMode: tier.allocationMode,
            tableQuantity: tier.tableQuantity,
            individualQuantity: tier.individualQuantity,
            tableGroups: tier.tableGroups,
            // Legacy table package support
            isTablePackage: tier.isTablePackage,
            tableCapacity: tier.tableCapacity,
          });
        }

        console.log("[CREATE EVENT] All ticket tiers created successfully");
      }

      // Keep spinning while redirecting
      console.log("[CREATE EVENT] Event type selected:", eventType);
      console.log("[CREATE EVENT] Event ID:", eventId);

      // Redirect based on event type and credit balance
      // Ballroom feature hidden
      // if (eventType === "BALLROOM_EVENT") {
      //   console.log("[CREATE EVENT] Redirecting to seating designer for ballroom event...");
      //   router.push(`/organizer/events/${eventId}/seating`);
      // } else
      if (eventType === "TICKETED_EVENT") {
        // Check if user has credits - if yes, go to dashboard; if no, go to payment setup
        // Note: Credits should have just been granted if this was first event
        const hasCredits = creditBalance && creditBalance.creditsRemaining > 0;

        if (hasCredits) {
          console.log("[CREATE EVENT] User has credits - Redirecting to dashboard...");
          router.push("/organizer/events");
        } else {
          console.log("[CREATE EVENT] No credits - Redirecting to payment setup...");
          router.push(`/organizer/events/${eventId}/payment-setup`);
        }
      } else {
        // For SAVE_THE_DATE and FREE_EVENT, go straight to dashboard
        console.log("[CREATE EVENT] Event type is", eventType, "- Redirecting to dashboard...");
        router.push("/organizer/events");
      }

      // Reset after a delay to allow redirect to happen
      setTimeout(() => setIsSubmitting(false), 2000);
    } catch (error: any) {
      console.error("[CREATE EVENT] Error:", error);
      console.error("[CREATE EVENT] Error message:", error.message);
      console.error("[CREATE EVENT] Error stack:", error.stack);
      alert(error.message || "Failed to create event");
      setIsSubmitting(false);
    }
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/organizer/events"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-1">
            Step {step} of {totalSteps}
          </p>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Debug Button - Temporarily enabled for troubleshooting */}
          <button
            onClick={handleTestAuth}
            className="mt-4 px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            🔧 Test Auth
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Basic Information
                </h2>
                <p className="text-gray-600">
                  Tell us about your event
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Chicago Summer Steppers Set 2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Event Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { type: "TICKETED_EVENT" as EventType, label: "Ticketed Event", desc: "Sell tickets", icon: "🎫" },
                    // Ballroom feature hidden
                    // { type: "BALLROOM_EVENT" as EventType, label: "Ballroom Event", desc: "Table seating & tickets", icon: "💃" },
                    { type: "FREE_EVENT" as EventType, label: "Free Event", desc: "Free registration", icon: "🎉" },
                    { type: "SAVE_THE_DATE" as EventType, label: "Save the Date", desc: "Coming soon", icon: "📅" },
                  ].filter(Boolean).map(({ type, label, desc, icon }) => (
                    <button
                      key={type}
                      onClick={() => setEventType(type)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        eventType === type
                          ? "border-primary bg-accent"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">
                        <span className="mr-2">{icon}</span>
                        {label}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event, what attendees can expect, special guests, etc..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Categories (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        categories.includes(category)
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Date & Time
                </h2>
                <p className="text-gray-600">
                  When is your event happening?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* Auto-detected timezone */}
              {detectedTimezone && (
                <div className="bg-accent border border-border rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Timezone: {detectedTimezone}
                      </p>
                      <p className="text-xs text-primary mt-1">
                        Auto-detected from {city}, {state}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Location
                </h2>
                <p className="text-gray-600">
                  Where is your event taking place?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g., The Grand Ballroom"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chicago"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="IL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="60601"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="USA"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Additional Details */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Additional Details
                </h2>
                <p className="text-gray-600">
                  Final touches for your event
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Capacity {eventType === "TICKETED_EVENT" && <span className="text-red-500">*</span>}
                  {eventType !== "TICKETED_EVENT" && "(Optional)"}
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g., 500"
                  min="1"
                  required={eventType === "TICKETED_EVENT"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {eventType === "TICKETED_EVENT"
                    ? "Maximum number of tickets available (required for ticket setup)"
                    : "Maximum number of attendees"}
                </p>
              </div>

              {/* Door Price - Only for FREE_EVENT */}
              {eventType === "FREE_EVENT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Door Price (Optional)
                  </label>
                  <input
                    type="text"
                    value={doorPrice}
                    onChange={(e) => setDoorPrice(e.target.value)}
                    placeholder="e.g., $20 at the door, Free, Donation"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Price information for attendees (e.g., "$20 at the door" or "Free admission")
                  </p>
                </div>
              )}

              {/* Ticket Tiers - For TICKETED_EVENT */}
              {eventType === "TICKETED_EVENT" && (
                <div>
                  {!capacity || parseInt(capacity) <= 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Set your event capacity first</strong> to start creating tickets.
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Enter the maximum number of attendees above to continue.
                      </p>
                    </div>
                  ) : (
                    <>
                      <CapacityAwareTicketEditor
                        capacity={parseInt(capacity)}
                        tiers={ticketTiers}
                        onChange={setTicketTiers}
                        showPresets={true}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        * At least one ticket tier is required for ticketed events
                      </p>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Image (Optional)
                </label>
                <ImageUpload
                  onImageUploaded={(storageId) => setUploadedImageId(storageId)}
                  onImageRemoved={() => setUploadedImageId(null)}
                />
              </div>

              <div className="bg-accent border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-semibold mb-1">Next Steps</p>
                    <p>
                      After creating your event, you'll set up payment options and create ticket tiers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t mt-8">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                step === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Previous
            </button>

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isSubmitting
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {isSubmitting ? "Creating Event..." : "Create Event"}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Welcome Popup for first-time organizers */}
      {creditBalance && (
        <WelcomePopup
          open={showWelcomePopup}
          onClose={handleWelcomePopupClose}
          creditsRemaining={1000}
        />
      )}
    </div>
  );
}
