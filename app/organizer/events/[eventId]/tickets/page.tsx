"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Plus,
  Ticket,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Calendar,
  Info,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function TicketTiersPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [showAddTier, setShowAddTier] = useState(false);
  const [editingTier, setEditingTier] = useState<Id<"ticketTiers"> | null>(null);

  // Form state
  const [tierName, setTierName] = useState("");
  const [tierDescription, setTierDescription] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [tierQuantity, setTierQuantity] = useState("");
  const [tierSaleStart, setTierSaleStart] = useState("");
  const [tierSaleEnd, setTierSaleEnd] = useState("");

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const ticketTiers = useQuery(api.public.queries.getPublicEventDetails, { eventId });

  const createTier = useMutation(api.tickets.mutations.createTicketTier);
  const deleteTier = useMutation(api.tickets.mutations.deleteTicketTier);

  const isLoading = !event || !currentUser;

  if (isLoading) {
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

  const handleCreateTier = async () => {
    if (!tierName || !tierPrice || !tierQuantity) {
      alert("Please fill in all required fields");
      return;
    }

    const priceCents = Math.round(parseFloat(tierPrice) * 100);
    const quantity = parseInt(tierQuantity);

    try {
      await createTier({
        eventId,
        name: tierName,
        description: tierDescription || undefined,
        price: priceCents,
        quantity,
        saleStart: tierSaleStart ? new Date(tierSaleStart).getTime() : undefined,
        saleEnd: tierSaleEnd ? new Date(tierSaleEnd).getTime() : undefined,
      });

      // Reset form
      setTierName("");
      setTierDescription("");
      setTierPrice("");
      setTierQuantity("");
      setTierSaleStart("");
      setTierSaleEnd("");
      setShowAddTier(false);
    } catch (error: any) {
      console.error("Create tier error:", error);
      alert(error.message || "Failed to create ticket tier");
    }
  };

  const handleDeleteTier = async (tierId: Id<"ticketTiers">) => {
    try {
      await deleteTier({ tierId });
    } catch (error: any) {
      console.error("Delete tier error:", error);
      alert(error.message || "Failed to delete ticket tier");
    }
  };

  const tiers = ticketTiers?.ticketTiers || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href={`/organizer/events`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ticket Tiers</h1>
              <p className="text-gray-600 mt-1">{event.name}</p>
            </div>
            <button
              onClick={() => setShowAddTier(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Ticket Tier
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {tiers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No ticket tiers yet</h3>
            <p className="text-gray-600 mb-6">
              Create ticket tiers to start selling tickets for this event
            </p>
            <button
              onClick={() => setShowAddTier(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Ticket Tier
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tiers.map((tier) => {
              const soldOut = tier.sold >= tier.quantity;
              const saleActive = !tier.saleStart || tier.saleStart <= Date.now();
              const saleEnded = tier.saleEnd && tier.saleEnd < Date.now();

              return (
                <div
                  key={tier._id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                        {soldOut && (
                          <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                            SOLD OUT
                          </span>
                        )}
                        {!soldOut && saleEnded && (
                          <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                            ENDED
                          </span>
                        )}
                        {!soldOut && !saleActive && (
                          <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                            NOT STARTED
                          </span>
                        )}
                      </div>

                      {tier.description && (
                        <p className="text-gray-600 mb-4">{tier.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <DollarSign className="w-4 h-4" />
                            Price
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            ${(tier.price / 100).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <Users className="w-4 h-4" />
                            Quantity
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {tier.sold} / {tier.quantity}
                          </p>
                        </div>

                        {tier.saleStart && (
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <Calendar className="w-4 h-4" />
                              Sale Start
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(tier.saleStart), "MMM d, h:mm a")}
                            </p>
                          </div>
                        )}

                        {tier.saleEnd && (
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <Calendar className="w-4 h-4" />
                              Sale End
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(tier.saleEnd), "MMM d, h:mm a")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDeleteTier(tier._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete tier"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Ticket Tier Modal */}
      {showAddTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Create Ticket Tier</h2>
              <p className="text-gray-600 mt-1">
                Add a new ticket type for this event
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Tier Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Name *
                  </label>
                  <input
                    type="text"
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    placeholder="e.g., General Admission, VIP, Early Bird"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={tierDescription}
                    onChange={(e) => setTierDescription(e.target.value)}
                    placeholder="Describe what's included with this ticket..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={tierPrice}
                        onChange={(e) => setTierPrice(e.target.value)}
                        placeholder="25.00"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={tierQuantity}
                      onChange={(e) => setTierQuantity(e.target.value)}
                      placeholder="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Sale Period (Optional) */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Sale Period (Optional)
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={tierSaleStart}
                      onChange={(e) => setTierSaleStart(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={tierSaleEnd}
                      onChange={(e) => setTierSaleEnd(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddTier(false)}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTier}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Create Ticket Tier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
