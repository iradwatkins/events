"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Users,
  Calendar,
  Save,
  X,
  Gift,
  AlertCircle,
  CheckCircle,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";

interface UnifiedTicketManagerProps {
  eventId: Id<"events">;
}

interface TicketTierFormData {
  name: string;
  description: string;
  price: number; // in cents
  quantity: number;
  saleStart?: number;
  saleEnd?: number;
  isTablePackage?: boolean;
  tableCapacity?: number;
}

export function UnifiedTicketManager({ eventId }: UnifiedTicketManagerProps) {
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTierData, setNewTierData] = useState<TicketTierFormData>({
    name: "",
    description: "",
    price: 0,
    quantity: 0,
  });

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const ticketTiersData = useQuery(api.public.queries.getPublicEventDetails, { eventId });
  const credits = useQuery(api.credits.queries.getMyCredits);

  const createTier = useMutation(api.tickets.mutations.createTicketTier);
  const updateTier = useMutation(api.tickets.mutations.updateTicketTier);
  const deleteTier = useMutation(api.tickets.mutations.deleteTicketTier);

  const tiers = ticketTiersData?.ticketTiers || [];

  // Calculate credit usage
  const creditUsage = useMemo(() => {
    if (!credits) return null;

    const totalAllocated = tiers.reduce((sum, tier) => sum + tier.quantity, 0);
    const totalSold = tiers.reduce((sum, tier) => sum + tier.sold, 0);
    const creditsUsed = credits.creditsUsed;
    const creditsRemaining = credits.creditsRemaining;

    return {
      totalAllocated,
      totalSold,
      creditsUsed,
      creditsRemaining,
      creditsTotal: credits.creditsTotal,
    };
  }, [tiers, credits]);

  const toggleExpanded = (tierId: string) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(tierId)) {
      newExpanded.delete(tierId);
    } else {
      newExpanded.add(tierId);
    }
    setExpandedTiers(newExpanded);
  };

  const handleCreateTier = async () => {
    if (!newTierData.name || newTierData.price <= 0 || newTierData.quantity <= 0) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createTier({
        eventId,
        name: newTierData.name,
        description: newTierData.description || undefined,
        price: newTierData.price,
        quantity: newTierData.quantity,
        saleStart: newTierData.saleStart,
        saleEnd: newTierData.saleEnd,
        isTablePackage: newTierData.isTablePackage,
        tableCapacity: newTierData.tableCapacity,
      });

      // Reset form
      setNewTierData({
        name: "",
        description: "",
        price: 0,
        quantity: 0,
      });
      setIsCreating(false);
    } catch (error: any) {
      console.error("Create tier error:", error);
      alert(error.message || "Failed to create ticket tier");
    }
  };

  const handleUpdateTier = async (tierId: Id<"ticketTiers">, updates: Partial<TicketTierFormData>) => {
    try {
      const result = await updateTier({
        tierId,
        ...updates,
      });

      if (result.creditsRefunded > 0) {
        alert(`Success! ${result.creditsRefunded} credits refunded`);
      } else if (result.creditsDeducted > 0) {
        alert(`Success! ${result.creditsDeducted} credits deducted`);
      }

      setEditingTier(null);
    } catch (error: any) {
      console.error("Update tier error:", error);
      alert(error.message || "Failed to update ticket tier");
    }
  };

  const handleDeleteTier = async (tierId: Id<"ticketTiers">) => {
    if (!confirm("Delete this ticket tier? Credits will be refunded.")) {
      return;
    }

    try {
      const result = await deleteTier({ tierId });
      if (result.creditsRefunded > 0) {
        alert(`Deleted! ${result.creditsRefunded} credits refunded`);
      }
    } catch (error: any) {
      console.error("Delete tier error:", error);
      alert(error.message || "Failed to delete ticket tier");
    }
  };

  const handleDuplicate = async (tier: any) => {
    try {
      await createTier({
        eventId,
        name: `${tier.name} (Copy)`,
        description: tier.description,
        price: tier.price,
        quantity: tier.quantity,
        saleStart: tier.saleStart,
        saleEnd: tier.saleEnd,
        isTablePackage: tier.isTablePackage,
        tableCapacity: tier.tableCapacity,
      });
    } catch (error: any) {
      console.error("Duplicate tier error:", error);
      alert(error.message || "Failed to duplicate ticket tier");
    }
  };

  if (!event || credits === undefined) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content - Ticket Tiers */}
      <div className="lg:col-span-3 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ticket Tiers</h2>
              <p className="text-gray-600 mt-1">
                Manage ticket types for {event.name}
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Tier
            </button>
          </div>
        </div>

        {/* Credit Balance Banner */}
        {creditUsage && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Credit Balance</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="text-2xl font-bold text-green-700">
                      {creditUsage.creditsRemaining}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Used</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {creditUsage.creditsUsed}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {creditUsage.creditsTotal}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create New Tier Form */}
        {isCreating && (
          <div className="bg-white rounded-lg shadow-md border-2 border-primary p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create New Ticket Tier</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tier Name *
                  </label>
                  <input
                    type="text"
                    value={newTierData.name}
                    onChange={(e) => setNewTierData({ ...newTierData, name: e.target.value })}
                    placeholder="e.g., General Admission"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newTierData.price / 100}
                      onChange={(e) => setNewTierData({ ...newTierData, price: Math.round(parseFloat(e.target.value) * 100) })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={newTierData.quantity}
                  onChange={(e) => setNewTierData({ ...newTierData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTierData.description}
                  onChange={(e) => setNewTierData({ ...newTierData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTier}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Tier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Tier Cards */}
        {tiers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Ticket Tiers Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first ticket tier to start selling tickets
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create First Tier
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tiers.map((tier) => {
              const isExpanded = expandedTiers.has(tier._id);
              const soldOut = tier.sold >= tier.quantity;
              const saleActive = !tier.saleStart || tier.saleStart <= Date.now();
              const saleEnded = tier.saleEnd && tier.saleEnd < Date.now();

              return (
                <div
                  key={tier._id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  {/* Compact View */}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
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

                        <div className="grid grid-cols-3 gap-4">
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
                              Sold
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              {tier.sold} / {tier.quantity}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <Ticket className="w-4 h-4" />
                              Available
                            </div>
                            <p className="text-lg font-bold text-green-700">
                              {tier.quantity - tier.sold}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpanded(tier._id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDuplicate(tier)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTier(tier._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {tier.saleStart && (
                            <div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <Calendar className="w-4 h-4" />
                                Sale Start
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(tier.saleStart), "MMM d, yyyy h:mm a")}
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
                                {format(new Date(tier.saleEnd), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                          )}

                          {tier.isTablePackage && (
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Table Package</div>
                              <p className="text-sm font-medium text-gray-900">
                                {tier.tableCapacity} seats per table
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setEditingTier(tier._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar - Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>

          {creditUsage && (
            <div className="space-y-4">
              <div className="pb-4 border-b">
                <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {creditUsage.totalAllocated}
                </p>
              </div>

              <div className="pb-4 border-b">
                <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
                <p className="text-2xl font-bold text-green-700">
                  {creditUsage.totalSold}
                </p>
              </div>

              <div className="pb-4 border-b">
                <p className="text-sm text-gray-600 mb-1">Available</p>
                <p className="text-2xl font-bold text-blue-700">
                  {creditUsage.totalAllocated - creditUsage.totalSold}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Credit Usage</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${(creditUsage.creditsUsed / creditUsage.creditsTotal) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">
                  {creditUsage.creditsUsed} / {creditUsage.creditsTotal} credits used
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
