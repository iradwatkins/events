"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use, useState } from "react";
import {
  Package,
  Calendar,
  Ticket,
  CheckCircle,
  CreditCard,
  Lock,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function BundleCheckoutPage({ params }: { params: Promise<{ bundleId: string }> }) {
  const { bundleId } = use(params);
  const [quantity, setQuantity] = useState(1);
  const [attendeeInfo, setAttendeeInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Fetch bundle details
  const bundle = useQuery(
    api.bundles.queries.getBundleDetails,
    { bundleId: bundleId as Id<"ticketBundles"> }
  );

  // Check availability
  const availability = useQuery(
    api.bundles.queries.isBundleAvailable,
    bundle ? { bundleId: bundleId as Id<"ticketBundles">, quantity } : "skip"
  );

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const totalAmount = bundle.price * quantity;
  const regularAmount = bundle.regularPrice * quantity;
  const savings = regularAmount - totalAmount;

  const canProceed =
    attendeeInfo.name.trim() &&
    attendeeInfo.email.trim() &&
    availability?.available;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href={`/bundles/${bundleId}`}
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Bundle Details
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
              <p className="text-gray-600">Complete your purchase to get your bundle tickets</p>
            </div>

            {/* Quantity Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Quantity</h2>
              <div className="flex items-center gap-4">
                <label className="text-gray-700">Number of Bundles:</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  {[...Array(Math.min(bundle.available, 10))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? "Bundle" : "Bundles"}
                    </option>
                  ))}
                </select>
              </div>
              {quantity > 1 && (
                <p className="text-sm text-gray-500 mt-2">
                  You'll receive {quantity} complete sets of all tickets in this bundle
                </p>
              )}
            </div>

            {/* Attendee Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={attendeeInfo.name}
                    onChange={(e) => setAttendeeInfo({ ...attendeeInfo, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={attendeeInfo.email}
                    onChange={(e) => setAttendeeInfo({ ...attendeeInfo, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Your tickets will be sent to this email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={attendeeInfo.phone}
                    onChange={(e) => setAttendeeInfo({ ...attendeeInfo, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-purple-600" />
                Payment Information
              </h2>

              {!availability?.available && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    {availability?.reason || "This bundle is not currently available"}
                  </p>
                </div>
              )}

              {/* Payment will be processed by Square */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">
                        Secure Payment Processing
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Your payment information is encrypted and processed securely by Square.
                        We never store your credit card details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Square Payment Form would go here */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Square payment form will be integrated here
                  </p>
                </div>

                {/* Complete Purchase Button */}
                <button
                  disabled={!canProceed}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                    canProceed
                      ? "bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {canProceed ? (
                    <>
                      Complete Purchase - ${(totalAmount / 100).toFixed(2)}
                    </>
                  ) : (
                    <>
                      Please fill in all required fields
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By completing this purchase, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Bundle Info */}
              <div className="mb-6 pb-6 border-b">
                <div className="flex items-start gap-3 mb-4">
                  <Package className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900">{bundle.name}</h3>
                    {bundle.bundleType === "MULTI_EVENT" && (
                      <p className="text-sm text-gray-600">Multi-Event Bundle</p>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900 mb-2">Includes:</div>
                  <ul className="space-y-1">
                    {bundle.includedTiersDetails?.slice(0, 3).map((tier: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>
                          {tier.quantity}x {tier.tierName}
                        </span>
                      </li>
                    ))}
                    {bundle.includedTiersDetails && bundle.includedTiersDetails.length > 3 && (
                      <li className="text-purple-600 font-medium">
                        +{bundle.includedTiersDetails.length - 3} more items
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Events */}
              <div className="mb-6 pb-6 border-b">
                <div className="font-medium text-gray-900 mb-3">Events ({bundle.events?.length || 1})</div>
                <div className="space-y-2">
                  {bundle.events?.map((event: any) => (
                    <div key={event._id} className="flex items-start gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{event.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Bundle Price:</span>
                  <span className="font-semibold">${(bundle.price / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Quantity:</span>
                  <span className="font-semibold">×{quantity}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm line-through">
                  <span>Regular Price:</span>
                  <span>${(regularAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Your Savings:</span>
                  <span>-${(savings / 100).toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t flex justify-between text-xl font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-purple-600">${(totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Savings Badge */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700 mb-1">
                  {bundle.percentageSavings}% OFF
                </div>
                <div className="text-sm text-green-600">
                  Save ${(savings / 100).toFixed(2)} with this bundle
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
