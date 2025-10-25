"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Check, Info, CreditCard, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

type PaymentModel = "PRE_PURCHASE" | "PAY_AS_SELL";

export default function PaymentSetupPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [selectedModel, setSelectedModel] = useState<PaymentModel | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const paymentConfig = useQuery(api.events.queries.getPaymentConfig, { eventId });
  const creditBalance = useQuery(api.payments.queries.getCreditBalance);

  const configurePayment = useMutation(api.events.mutations.configurePayment);
  const createStripeConnectAccount = useMutation(api.payments.mutations.createStripeConnectAccount);

  const isLoading = !event || !currentUser;

  // Check if user is the organizer
  if (!isLoading && event.organizerId !== currentUser?._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const handleModelSelection = async (model: PaymentModel) => {
    setSelectedModel(model);
  };

  const handleConfirm = async () => {
    if (!selectedModel) return;

    setIsProcessing(true);
    try {
      if (selectedModel === "PRE_PURCHASE") {
        // Configure pre-purchase model
        await configurePayment({
          eventId,
          model: "PRE_PURCHASE",
          ticketPrice: 0.30,
        });

        // TESTING MODE: Skip credit purchase, go straight to dashboard
        console.log("[PAYMENT SETUP] TESTING MODE - Skipping credit purchase, redirecting to dashboard");
        alert("Payment configured successfully! Redirecting to dashboard...");
        router.push("/organizer/events");
      } else {
        // Configure pay-as-sell model and create Stripe Connect account
        const { accountLinkUrl } = await createStripeConnectAccount({ eventId });

        await configurePayment({
          eventId,
          model: "PAY_AS_SELL",
          platformFeePercent: 3.7,
          platformFeeFixed: 1.79,
          stripeFeePercent: 2.9,
          stripeFeeFixed: 0.30,
        });

        // Redirect to Stripe Connect onboarding
        window.location.href = accountLinkUrl;
      }
    } catch (error) {
      console.error("Payment setup error:", error);
      alert("Failed to configure payment. Please try again.");
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If already configured, show current setup
  if (paymentConfig) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link
            href={`/organizer/events/${eventId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Payment Configured</h1>
            </div>

            <p className="text-gray-600 mb-6">
              Your payment model is already set up for this event.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900">Current Model:</p>
              <p className="text-lg text-blue-600 font-bold mt-1">
                {paymentConfig.paymentModel === "PRE_PURCHASE" ? "Pre-Purchase Credits" : "Pay-As-You-Sell"}
              </p>

              {paymentConfig.paymentModel === "PRE_PURCHASE" && (
                <p className="text-sm text-gray-600 mt-2">
                  Cost: $0.30 per ticket
                </p>
              )}

              {paymentConfig.paymentModel === "PAY_AS_SELL" && (
                <p className="text-sm text-gray-600 mt-2">
                  Platform Fee: 3.7% + $1.79 + Stripe processing (2.9% + $0.30)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate example costs for a $50 ticket
  const exampleTicketPrice = 50;
  const prePurchaseCost = 0.30;
  const payAsSellPlatformFee = (exampleTicketPrice * 0.037) + 1.79;
  const payAsSellStripeFee = (exampleTicketPrice * 0.029) + 0.30;
  const payAsSellTotalFee = payAsSellPlatformFee + payAsSellStripeFee;
  const payAsSellNetAmount = exampleTicketPrice - payAsSellTotalFee;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          href={`/organizer/events/${eventId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Payment Model
          </h1>
          <p className="text-gray-600">
            Select how you want to handle ticket sales for "{event.name}"
          </p>
        </div>

        {/* Payment Model Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Pre-Purchase Model */}
          <button
            onClick={() => handleModelSelection("PRE_PURCHASE")}
            className={`relative bg-white rounded-lg border-2 p-6 text-left transition-all hover:shadow-lg ${
              selectedModel === "PRE_PURCHASE"
                ? "border-blue-600 shadow-lg"
                : "border-gray-200"
            }`}
          >
            {selectedModel === "PRE_PURCHASE" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Pre-Purchase</h3>
                <p className="text-sm text-blue-600 font-semibold">Lowest Cost</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-900">$0.30</p>
              <p className="text-sm text-gray-600">per ticket sold</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">200 free tickets</span> for your first event
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Purchase credits upfront
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  No percentage-based fees
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Best for high-volume events
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">Example: ${exampleTicketPrice} ticket</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">You receive:</span>
                <span className="text-lg font-bold text-gray-900">
                  ${(exampleTicketPrice - prePurchaseCost).toFixed(2)}
                </span>
              </div>
            </div>
          </button>

          {/* Pay-As-Sell Model */}
          <button
            onClick={() => handleModelSelection("PAY_AS_SELL")}
            className={`relative bg-white rounded-lg border-2 p-6 text-left transition-all hover:shadow-lg ${
              selectedModel === "PAY_AS_SELL"
                ? "border-purple-600 shadow-lg"
                : "border-gray-200"
            }`}
          >
            {selectedModel === "PAY_AS_SELL" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Pay-As-You-Sell</h3>
                <p className="text-sm text-purple-600 font-semibold">No Upfront Cost</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-900">3.7% + $1.79</p>
              <p className="text-sm text-gray-600">+ Stripe fees (2.9% + $0.30)</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">No upfront payment</span> required
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Fees deducted per sale
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Powered by Stripe Connect
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Best for trying out the platform
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">Example: ${exampleTicketPrice} ticket</p>
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Platform fee:</span>
                  <span className="text-gray-700">-${payAsSellPlatformFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Stripe fee:</span>
                  <span className="text-gray-700">-${payAsSellStripeFee.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm text-gray-600">You receive:</span>
                <span className="text-lg font-bold text-gray-900">
                  ${payAsSellNetAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Need help deciding?</span> Pre-Purchase is best for established events expecting high sales. Pay-As-You-Sell is perfect for new events or when you want to test the platform with no upfront cost.
              </p>
            </div>
          </div>
        </div>

        {/* Current Credit Balance (if Pre-Purchase selected) */}
        {selectedModel === "PRE_PURCHASE" && creditBalance !== undefined && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Credit Balance</p>
                <p className="text-2xl font-bold text-gray-900">{creditBalance} credits</p>
              </div>
              {creditBalance < 100 && (
                <div className="text-right">
                  <p className="text-sm text-orange-600 font-medium">Low balance</p>
                  <p className="text-xs text-gray-500">You'll be prompted to purchase more</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Link
            href={`/organizer/events/${eventId}`}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancel
          </Link>

          <button
            onClick={handleConfirm}
            disabled={!selectedModel || isProcessing}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              selectedModel && !isProcessing
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
