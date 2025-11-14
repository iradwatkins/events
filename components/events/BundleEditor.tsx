"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Package, DollarSign, Tag, Calendar, TrendingDown, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface TicketTier {
  _id: Id<"ticketTiers">;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  available: number;
}

interface IncludedTier {
  tierId: Id<"ticketTiers">;
  tierName: string;
  quantity: number;
  eventId?: Id<"events">; // For multi-event bundles
  eventName?: string; // For multi-event bundles
}

interface BundleFormData {
  name: string;
  description: string;
  price: string;
  includedTiers: IncludedTier[];
  totalQuantity: string;
  saleStart: string;
  saleEnd: string;
  bundleType: "SINGLE_EVENT" | "MULTI_EVENT";
  selectedEventIds: Id<"events">[]; // For multi-event bundles
}

interface BundleEditorProps {
  eventId: Id<"events">;
}

export function BundleEditor({ eventId }: BundleEditorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingBundleId, setEditingBundleId] = useState<Id<"ticketBundles"> | null>(null);
  const [formData, setFormData] = useState<BundleFormData>({
    name: "",
    description: "",
    price: "",
    includedTiers: [],
    totalQuantity: "",
    saleStart: "",
    saleEnd: "",
    bundleType: "SINGLE_EVENT",
    selectedEventIds: [eventId], // Start with current event
  });

  // Fetch ticket tiers for this event (for single-event mode)
  const tiers = useQuery(api.events.queries.getEventTicketTiers, {
    eventId,
  }) as TicketTier[] | undefined;

  // Fetch existing bundles
  const bundles = useQuery(api.bundles.queries.getBundlesForEvent, {
    eventId,
    includeInactive: true,
  });

  const createBundle = useMutation(api.bundles.mutations.createTicketBundle);
  const updateBundle = useMutation(api.bundles.mutations.updateTicketBundle);
  const deleteBundle = useMutation(api.bundles.mutations.deleteTicketBundle);

  // Fetch all events from this organizer (for multi-event bundle creation)
  const organizerEvents = useQuery(api.events.queries.getOrganizerEvents);

  // Fetch tiers from multiple events when in multi-event mode
  const multiEventTiers = useQuery(
    api.tickets.queries.getTiersFromMultipleEvents,
    formData.bundleType === "MULTI_EVENT" && formData.selectedEventIds.length > 0
      ? { eventIds: formData.selectedEventIds }
      : "skip"
  );

  // Use multi-event tiers in multi-event mode, regular tiers in single-event mode
  const availableTiers = formData.bundleType === "MULTI_EVENT" ? multiEventTiers : tiers;

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      includedTiers: [],
      totalQuantity: "",
      saleStart: "",
      saleEnd: "",
      bundleType: "SINGLE_EVENT",
      selectedEventIds: [eventId],
    });
    setIsCreating(false);
    setEditingBundleId(null);
  };

  const addTierToBundle = (
    tierId: Id<"ticketTiers">,
    eventIdParam?: Id<"events">,
    eventNameParam?: string
  ) => {
    const tier = availableTiers?.find((t) => t._id === tierId);
    if (!tier) return;

    // Check if tier already added
    if (formData.includedTiers.some((it) => it.tierId === tierId)) {
      alert("This tier is already included in the bundle");
      return;
    }

    const newTier: IncludedTier = {
      tierId,
      tierName: tier.name,
      quantity: 1,
    };

    // Add event info for multi-event bundles
    if (formData.bundleType === "MULTI_EVENT") {
      newTier.eventId = eventIdParam || (tier as any).eventId;
      newTier.eventName = eventNameParam || (tier as any).eventName;
    }

    setFormData({
      ...formData,
      includedTiers: [...formData.includedTiers, newTier],
    });
  };

  const removeTierFromBundle = (tierId: Id<"ticketTiers">) => {
    setFormData({
      ...formData,
      includedTiers: formData.includedTiers.filter((it) => it.tierId !== tierId),
    });
  };

  const updateTierQuantity = (tierId: Id<"ticketTiers">, quantity: number) => {
    setFormData({
      ...formData,
      includedTiers: formData.includedTiers.map((it) =>
        it.tierId === tierId ? { ...it, quantity } : it
      ),
    });
  };

  const calculateRegularPrice = () => {
    if (!availableTiers) return 0;
    let total = 0;
    for (const includedTier of formData.includedTiers) {
      const tier = availableTiers.find((t) => t._id === includedTier.tierId);
      if (tier) {
        total += tier.price * includedTier.quantity;
      }
    }
    return total;
  };

  const calculateSavings = () => {
    const regularPrice = calculateRegularPrice();
    const bundlePrice = parseFloat(formData.price) * 100 || 0;
    return regularPrice - bundlePrice;
  };

  const calculateSavingsPercentage = () => {
    const regularPrice = calculateRegularPrice();
    if (regularPrice === 0) return 0;
    const savings = calculateSavings();
    return Math.round((savings / regularPrice) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.includedTiers.length === 0) {
      alert("Please add at least one ticket tier to the bundle");
      return;
    }

    if (!formData.name.trim()) {
      alert("Please enter a bundle name");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("Please enter a valid bundle price");
      return;
    }

    if (!formData.totalQuantity || parseInt(formData.totalQuantity) <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    try {
      const bundleData: any = {
        eventId,
        name: formData.name,
        description: formData.description || undefined,
        price: Math.round(parseFloat(formData.price) * 100),
        includedTiers: formData.includedTiers,
        totalQuantity: parseInt(formData.totalQuantity),
        saleStart: formData.saleStart ? new Date(formData.saleStart).getTime() : undefined,
        saleEnd: formData.saleEnd ? new Date(formData.saleEnd).getTime() : undefined,
        bundleType: formData.bundleType,
      };

      // For multi-event bundles, include all event IDs
      if (formData.bundleType === "MULTI_EVENT") {
        bundleData.eventIds = formData.selectedEventIds;
      }

      if (editingBundleId) {
        await updateBundle({
          bundleId: editingBundleId,
          ...bundleData,
        });
      } else {
        await createBundle(bundleData);
      }

      resetForm();
    } catch (error: any) {
      alert(error.message || "Failed to save bundle");
    }
  };

  const handleEdit = (bundle: any) => {
    setFormData({
      name: bundle.name,
      description: bundle.description || "",
      price: (bundle.price / 100).toFixed(2),
      includedTiers: bundle.includedTiers,
      totalQuantity: bundle.totalQuantity.toString(),
      saleStart: bundle.saleStart ? new Date(bundle.saleStart).toISOString().split("T")[0] : "",
      saleEnd: bundle.saleEnd ? new Date(bundle.saleEnd).toISOString().split("T")[0] : "",
    });
    setEditingBundleId(bundle._id);
    setIsCreating(true);
  };

  const handleDelete = async (bundleId: Id<"ticketBundles">) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return;

    try {
      await deleteBundle({ bundleId });
    } catch (error: any) {
      alert(error.message || "Failed to delete bundle");
    }
  };

  const handleToggleActive = async (bundle: any) => {
    try {
      await updateBundle({
        bundleId: bundle._id,
        isActive: !bundle.isActive,
      });
    } catch (error: any) {
      alert(error.message || "Failed to update bundle status");
    }
  };

  if (!tiers) {
    return <div className="text-gray-600">Loading ticket tiers...</div>;
  }

  if (tiers.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">No ticket tiers available</p>
        <p className="text-sm text-gray-500">Create ticket tiers first before creating bundles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ticket Bundles</h3>
          <p className="text-sm text-gray-600">
            Package multiple tickets together at a discounted price
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Bundle
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          className="bg-accent border-2 border-primary/30 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {editingBundleId ? "Edit Bundle" : "Create New Bundle"}
            </h4>
            <button type="button" onClick={resetForm} className="text-gray-600 hover:text-gray-800">
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            {/* Bundle Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 3-Day Weekend Pass, VIP Package"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what's included in this bundle..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Included Tiers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Included Tickets *
              </label>

              {/* Selected Tiers */}
              {formData.includedTiers.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {formData.includedTiers.map((includedTier) => {
                    const tier = availableTiers?.find((t) => t._id === includedTier.tierId);
                    return (
                      <div
                        key={includedTier.tierId}
                        className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{includedTier.tierName}</div>
                          <div className="text-sm text-gray-600">
                            ${((tier?.price || 0) / 100).toFixed(2)} each
                            {includedTier.eventName && (
                              <span className="ml-2 px-2 py-0.5 bg-accent text-primary text-xs rounded">
                                {includedTier.eventName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={includedTier.quantity}
                            onChange={(e) =>
                              updateTierQuantity(includedTier.tierId, parseInt(e.target.value) || 1)
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTierFromBundle(includedTier.tierId)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                  No tickets added yet. Select from available tiers below.
                </div>
              )}

              {/* Add Tier Dropdown */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const selectedTier = availableTiers?.find(
                      (t) => t._id === (e.target.value as Id<"ticketTiers">)
                    );
                    if (selectedTier) {
                      const evtId = (selectedTier as any).eventId;
                      const evtName = (selectedTier as any).eventName;
                      addTierToBundle(selectedTier._id, evtId, evtName);
                    }
                    e.target.value = "";
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                defaultValue=""
              >
                <option value="">+ Add Ticket Type</option>
                {availableTiers
                  ?.filter((tier) => !formData.includedTiers.some((it) => it.tierId === tier._id))
                  .map((tier) => (
                    <option key={tier._id} value={tier._id}>
                      {tier.name} - ${(tier.price / 100).toFixed(2)} ({tier.available} available)
                    </option>
                  ))}
              </select>
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Regular Price (Calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Regular Price
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={`$${(calculateRegularPrice() / 100).toFixed(2)}`}
                    disabled
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">If bought separately</p>
              </div>

              {/* Bundle Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bundle Price (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Your bundle price</p>
              </div>

              {/* Savings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Savings</label>
                <div className="relative">
                  <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                  <input
                    type="text"
                    value={`$${(calculateSavings() / 100).toFixed(2)} (${calculateSavingsPercentage()}%)`}
                    disabled
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-medium"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Customer saves</p>
              </div>
            </div>

            {/* Quantity and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bundles Available *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                  placeholder="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Sale Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Starts (Optional)
                </label>
                <input
                  type="date"
                  value={formData.saleStart}
                  onChange={(e) => setFormData({ ...formData, saleStart: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Sale End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Ends (Optional)
                </label>
                <input
                  type="date"
                  value={formData.saleEnd}
                  onChange={(e) => setFormData({ ...formData, saleEnd: e.target.value })}
                  min={formData.saleStart}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {editingBundleId ? "Update Bundle" : "Create Bundle"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Existing Bundles List */}
      {bundles && bundles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Existing Bundles</h4>
          {bundles.map((bundle) => (
            <div
              key={bundle._id}
              className={`border rounded-lg p-4 ${
                bundle.isActive ? "bg-white border-gray-200" : "bg-gray-50 border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-5 h-5 text-primary" />
                    <h5 className="font-semibold text-gray-900">{bundle.name}</h5>
                    {!bundle.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  {bundle.description && (
                    <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Price:</span>{" "}
                      <span className="font-semibold text-primary">
                        ${(bundle.price / 100).toFixed(2)}
                      </span>
                      {bundle.regularPrice && (
                        <span className="text-gray-500 line-through ml-2">
                          ${(bundle.regularPrice / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Savings:</span>{" "}
                      <span className="font-semibold text-green-600">
                        {bundle.percentageSavings}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Available:</span>{" "}
                      <span className="font-medium">
                        {bundle.available} / {bundle.totalQuantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sold:</span>{" "}
                      <span className="font-medium">{bundle.sold}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {bundle.includedTiersDetails?.map((tier: any) => (
                      <div
                        key={tier.tierId}
                        className="text-xs px-2 py-1 bg-accent text-primary rounded"
                      >
                        {tier.quantity}x {tier.tierName}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(bundle)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    disabled={bundle.sold > 0}
                    title={bundle.sold > 0 ? "Cannot edit bundle with sales" : "Edit bundle"}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(bundle)}
                    className={`px-3 py-1 text-sm rounded ${
                      bundle.isActive
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {bundle.isActive ? "Deactivate" : "Activate"}
                  </button>
                  {bundle.sold === 0 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(bundle._id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {bundles && bundles.length === 0 && !isCreating && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No bundles created yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Create bundles to package multiple tickets together at a discount
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Bundle
          </button>
        </div>
      )}
    </div>
  );
}
