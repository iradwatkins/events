"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  DollarSign,
  AlertCircle,
  Check,
  Settings,
} from "lucide-react";
import Link from "next/link";

type MerchantProcessor = "SQUARE" | "STRIPE" | "PAYPAL";

export default function PaymentMethodsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [selectedProcessor, setSelectedProcessor] = useState<MerchantProcessor | null>(null);
  const [creditCardEnabled, setCreditCardEnabled] = useState(true);
  const [cashAppEnabled, setCashAppEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const event = useQuery(api.events.queries.getEventById, { eventId });
  const paymentConfig = useQuery(api.paymentConfig.queries.getEventPaymentConfig, { eventId });

  // Mutation
  const updatePaymentMethods = useMutation(api.paymentConfig.mutations.updatePaymentMethods);

  const isLoading = event === undefined;

  // Initialize state from existing config
  useState(() => {
    if (paymentConfig) {
      setSelectedProcessor((paymentConfig.merchantProcessor as MerchantProcessor) || null);
      setCreditCardEnabled(paymentConfig.creditCardEnabled ?? true);
      setCashAppEnabled(paymentConfig.cashAppEnabled ?? false);
    }
  });

  // Check if user is the organizer
  if (!isLoading && event.organizerId !== currentUser?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!selectedProcessor) {
      alert("Please select a merchant processor");
      return;
    }

    setIsSaving(true);
    try {
      await updatePaymentMethods({
        eventId,
        merchantProcessor: selectedProcessor,
        creditCardEnabled,
        cashAppEnabled,
      });

      alert("Payment methods updated successfully!");
      router.push(`/organizer/events/${eventId}`);
    } catch (error: any) {
      alert(`Failed to update payment methods: ${error.message}`);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Link
          href={`/organizer/events/${eventId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
          </div>
          <p className="text-gray-600">
            Configure which payment methods your customers can use to purchase tickets
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-accent border border-primary/30 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">Payment Hierarchy:</p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li>
                  <strong>Organizer Level (This Page):</strong> Choose merchant processor and
                  enable/disable online payment methods
                </li>
                <li>
                  <strong>Staff Level:</strong> Individual staff can toggle accepting cash payments
                  in-person only
                </li>
                <li>
                  <strong>Cash payments do not require merchant account setup</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Merchant Processor Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Merchant Processor</h2>
          <p className="text-sm text-gray-600 mb-6">
            Choose your preferred payment processor for handling credit card and Cash App payments
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Square */}
            <button
              onClick={() => setSelectedProcessor("SQUARE")}
              className={`p-6 rounded-lg border-2 transition ${
                selectedProcessor === "SQUARE"
                  ? "border-primary bg-accent"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold">Square</span>
                {selectedProcessor === "SQUARE" && <Check className="w-6 h-6 text-primary" />}
              </div>
              <p className="text-sm text-gray-600">
                Industry-leading payment processing with simple pricing
              </p>
            </button>

            {/* Stripe */}
            <button
              onClick={() => setSelectedProcessor("STRIPE")}
              className={`p-6 rounded-lg border-2 transition ${
                selectedProcessor === "STRIPE"
                  ? "border-primary bg-accent"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold">Stripe</span>
                {selectedProcessor === "STRIPE" && <Check className="w-6 h-6 text-primary" />}
              </div>
              <p className="text-sm text-gray-600">
                Developer-friendly payments with powerful features
              </p>
            </button>

            {/* PayPal */}
            <button
              onClick={() => setSelectedProcessor("PAYPAL")}
              className={`p-6 rounded-lg border-2 transition ${
                selectedProcessor === "PAYPAL"
                  ? "border-primary bg-accent"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold">PayPal</span>
                {selectedProcessor === "PAYPAL" && <Check className="w-6 h-6 text-primary" />}
              </div>
              <p className="text-sm text-gray-600">
                Trusted by millions worldwide for online payments
              </p>
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Enable Payment Methods</h2>
          <p className="text-sm text-gray-600 mb-6">
            Select which online payment methods customers can use at checkout
          </p>

          <div className="space-y-4">
            {/* Credit/Debit Cards */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Credit/Debit Cards</h3>
                  <p className="text-sm text-gray-600">
                    Accept Visa, Mastercard, American Express, and Discover
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={creditCardEnabled}
                  onChange={(e) => setCreditCardEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Cash App */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Cash App Pay</h3>
                  <p className="text-sm text-gray-600">
                    Let customers pay directly from their Cash App balance
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cashAppEnabled}
                  onChange={(e) => setCashAppEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Cash In-Person */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Cash In-Person</h3>
                  <p className="text-sm text-gray-600">
                    Managed by individual staff members on their settings page
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Staff can toggle this option to accept cash payments when selling tickets in
                    person
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Check className="w-4 h-4" />
                <span>Always Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedProcessor}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
          >
            {isSaving ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Payment Methods
              </>
            )}
          </button>
          <Link
            href={`/organizer/events/${eventId}`}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
