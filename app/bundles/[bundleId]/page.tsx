"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use } from "react";
import {
  Package,
  Calendar,
  MapPin,
  Clock,
  Tag,
  Users,
  ChevronRight,
  CheckCircle,
  DollarSign,
  TrendingDown,
  Ticket,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import { formatEventLocation } from "@/lib/location-format";

export default function BundleDetailPage({ params }: { params: Promise<{ bundleId: string }> }) {
  const { bundleId } = use(params);

  // Fetch bundle details
  const bundle = useQuery(
    api.bundles.queries.getBundleDetails,
    { bundleId: bundleId as Id<"ticketBundles"> }
  );

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading bundle details...</p>
        </div>
      </div>
    );
  }

  // Calculate total tickets included
  const totalTickets = bundle.includedTiers.reduce((sum, tier) => sum + tier.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Bundle Overview */}
      <div className="bg-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <Link
            href="/bundles"
            className="inline-flex items-center gap-2 text-white hover:text-purple-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Bundles</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Bundle Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-8 h-8" />
                {bundle.bundleType === "MULTI_EVENT" && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                    Multi-Event Bundle
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{bundle.name}</h1>
              {bundle.description && (
                <p className="text-xl text-purple-100 mb-6">{bundle.description}</p>
              )}

              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Calendar className="w-6 h-6 mb-2" />
                  <div className="text-2xl font-bold">{bundle.events?.length || 1}</div>
                  <div className="text-sm text-purple-100">Events Included</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Ticket className="w-6 h-6 mb-2" />
                  <div className="text-2xl font-bold">{totalTickets}</div>
                  <div className="text-sm text-purple-100">Total Tickets</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <TrendingDown className="w-6 h-6 mb-2" />
                  <div className="text-2xl font-bold">{bundle.percentageSavings}%</div>
                  <div className="text-sm text-purple-100">You Save</div>
                </div>
              </div>
            </div>

            {/* Right: Pricing Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-2xl p-6 text-gray-900 sticky top-4">
                <div className="text-center mb-6">
                  <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg mb-4">
                    Save {bundle.percentageSavings}%
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Bundle Price</div>
                  <div className="text-5xl font-bold text-purple-600 mb-2">
                    ${(bundle.price / 100).toFixed(2)}
                  </div>
                  <div className="text-gray-500 line-through text-lg">
                    ${(bundle.regularPrice / 100).toFixed(2)} if bought separately
                  </div>
                  <div className="mt-2 text-green-600 font-semibold">
                    You save ${((bundle.regularPrice - bundle.price) / 100).toFixed(2)}
                  </div>
                </div>

                {/* Availability */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-semibold text-gray-900">
                      {bundle.available} / {bundle.totalQuantity}
                    </span>
                  </div>
                  {bundle.available < 10 && bundle.available > 0 && (
                    <div className="mt-2 text-red-600 text-sm font-medium">
                      Only {bundle.available} left!
                    </div>
                  )}
                </div>

                {/* Buy Button */}
                <Link
                  href={`/bundles/${bundleId}/checkout`}
                  className="block w-full bg-purple-600 text-white text-center py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Buy Bundle Now
                  <ChevronRight className="w-5 h-5 inline ml-2" />
                </Link>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Secure checkout powered by Square
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Included Events */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-purple-600" />
                Included Events
              </h2>
              <div className="space-y-4">
                {bundle.events?.map((event: any) => (
                  <div
                    key={event._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Event Image */}
                      {event.imageUrl && (
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={event.imageUrl}
                            alt={event.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Event Details */}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                          {event.name}
                        </h3>
                        {event.startDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            {new Date(event.startDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            {formatEventLocation(event.location)}
                          </div>
                        )}
                        <Link
                          href={`/events/${event._id}`}
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium mt-2"
                        >
                          View Event Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Included Tickets */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-purple-600" />
                What's Included
              </h2>
              <div className="space-y-3">
                {bundle.includedTiersDetails?.map((tier: any) => (
                  <div
                    key={tier.tierId}
                    className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {tier.quantity}x {tier.tierName}
                        </div>
                        {tier.eventName && (
                          <div className="text-sm text-gray-600">{tier.eventName}</div>
                        )}
                        {tier.tierDetails?.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {tier.tierDetails.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {tier.tierDetails && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Value</div>
                        <div className="font-semibold text-gray-900">
                          ${((tier.tierDetails.price * tier.quantity) / 100).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Value Breakdown */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Regular Price:</span>
                  <span className="font-semibold">${(bundle.regularPrice / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Bundle Savings:</span>
                  <span>-${((bundle.regularPrice - bundle.price) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-purple-600 pt-2 border-t">
                  <span>Bundle Price:</span>
                  <span>${(bundle.price / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Additional Info */}
          <div className="space-y-6">
            {/* Why Buy This Bundle */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Why Buy This Bundle?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Save {bundle.percentageSavings}% compared to buying tickets separately
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    One convenient purchase for multiple events
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Instant digital tickets delivered to your email
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    QR code entry for fast check-in at each event
                  </span>
                </li>
              </ul>
            </div>

            {/* Share */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Share This Bundle</h3>
              <p className="text-gray-600 text-sm mb-4">
                Know someone who'd love this bundle? Share it with them!
              </p>
              <button className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Copy Link to Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
