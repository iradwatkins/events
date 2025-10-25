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
import { getTimezoneFromLocation, getTimezoneName } from "@/lib/timezone";
import { Id } from "@/convex/_generated/dataModel";

type EventType = "TICKETED_EVENT" | "FREE_EVENT" | "SAVE_THE_DATE";

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect timezone when city or state changes
  useEffect(() => {
    if (city && state) {
      const tz = getTimezoneFromLocation(city, state);
      setTimezone(tz);
      setDetectedTimezone(getTimezoneName(tz));
    }
  }, [city, state]);

  const createEvent = useMutation(api.events.mutations.createEvent);
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
  //         <Link href="/login?callbackUrl=/organizer/events/create" className="text-blue-600 hover:underline font-medium">
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

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n\n${missingFields.map(f => `• ${f}`).join('\n')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        name: eventName,
        eventType,
        description,
        categories,
        startDate: new Date(startDate).getTime(),
        endDate: endDate ? new Date(endDate).getTime() : new Date(startDate).getTime(),
        timezone,
        location: {
          venueName: venueName || undefined,
          address: address || undefined,
          city,
          state,
          zipCode: zipCode || undefined,
          country,
        },
        capacity: capacity ? parseInt(capacity) : undefined,
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

      // Keep spinning while redirecting
      alert("Event created successfully!");

      console.log("[CREATE EVENT] Redirecting to payment setup...");
      router.push(`/organizer/events/${eventId}/payment-setup`);

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
              className="h-full bg-blue-600 transition-all duration-300"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Event Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { type: "TICKETED_EVENT" as EventType, label: "Ticketed Event", desc: "Sell tickets" },
                    { type: "FREE_EVENT" as EventType, label: "Free Event", desc: "Free registration" },
                    { type: "SAVE_THE_DATE" as EventType, label: "Save the Date", desc: "Coming soon" },
                  ].map(({ type, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => setEventType(type)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        eventType === type
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{label}</p>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
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
                          ? "bg-blue-600 text-white"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* Auto-detected timezone */}
              {detectedTimezone && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Timezone: {detectedTimezone}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
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
                  Event Capacity (Optional)
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of attendees
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Image (Optional)
                </label>
                <ImageUpload
                  onImageUploaded={(storageId) => setUploadedImageId(storageId)}
                  onImageRemoved={() => setUploadedImageId(null)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
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
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Creating Event..." : "Create Event"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
