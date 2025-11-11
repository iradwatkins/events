"use client";

import { useState } from "react";
import { Plus, Trash2, Ticket, DollarSign, Users, Sparkles, Zap } from "lucide-react";
import { CapacityProgressBar } from "./CapacityProgressBar";
import { PricingTierForm, PricingTier } from "./PricingTierForm";

export interface TableGroup {
  seatsPerTable: number;
  numberOfTables: number;
  sold?: number;
}

export interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
  pricingTiers?: PricingTier[];
  // Legacy table package support
  isTablePackage?: boolean;
  tableCapacity?: number;
  // Mixed Allocation support
  allocationMode?: "individual" | "table" | "mixed";
  tableQuantity?: number;
  individualQuantity?: number;
  // Multiple table groups
  tableGroups?: TableGroup[];
}

interface CapacityAwareTicketEditorProps {
  capacity: number;
  tiers: TicketTier[];
  onChange: (tiers: TicketTier[]) => void;
  sold?: number; // Total tickets sold (for existing events)
  showPresets?: boolean;
}

// Preset templates for quick setup
const TEMPLATES = [
  {
    id: "standard",
    name: "Standard Split (70% GA, 30% VIP)",
    description: "Most common setup for events",
    icon: Sparkles,
    generate: (capacity: number) => [
      {
        id: `tier-${Date.now()}-1`,
        name: "General Admission",
        description: "Standard entry to the event",
        price: "",
        quantity: String(Math.floor(capacity * 0.7)),
      },
      {
        id: `tier-${Date.now()}-2`,
        name: "VIP",
        description: "Premium experience with exclusive perks",
        price: "",
        quantity: String(Math.floor(capacity * 0.3)),
      },
    ],
  },
  {
    id: "ga-only",
    name: "General Admission Only",
    description: "Single tier, all tickets equal",
    icon: Ticket,
    generate: (capacity: number) => [
      {
        id: `tier-${Date.now()}-1`,
        name: "General Admission",
        description: "Entry to the event",
        price: "",
        quantity: String(capacity),
      },
    ],
  },
  {
    id: "premium",
    name: "Premium Event (50% GA, 50% VIP)",
    description: "Equal split for upscale events",
    icon: Zap,
    generate: (capacity: number) => [
      {
        id: `tier-${Date.now()}-1`,
        name: "General Admission",
        description: "Standard entry to the event",
        price: "",
        quantity: String(Math.floor(capacity * 0.5)),
      },
      {
        id: `tier-${Date.now()}-2`,
        name: "VIP",
        description: "Premium experience with exclusive perks",
        price: "",
        quantity: String(Math.ceil(capacity * 0.5)),
      },
    ],
  },
];

// Quick-add ticket types
const TICKET_TYPES = [
  {
    value: "ga",
    label: "General Admission",
    description: "Standard entry tickets",
    defaultName: "General Admission",
    defaultDescription: "Standard entry to the event",
  },
  {
    value: "vip",
    label: "VIP",
    description: "Premium experience tickets",
    defaultName: "VIP",
    defaultDescription: "Premium experience with exclusive perks",
  },
  {
    value: "table",
    label: "Table Package",
    description: "Reserved table seating",
    defaultName: "Table Package",
    defaultDescription: "Reserved table with seating",
  },
  {
    value: "custom",
    label: "Custom Ticket Type",
    description: "Create your own ticket type",
    defaultName: "",
    defaultDescription: "",
  },
];

export function CapacityAwareTicketEditor({
  capacity,
  tiers,
  onChange,
  sold = 0,
  showPresets = true,
}: CapacityAwareTicketEditorProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());

  // Helper function to calculate tier capacity
  const getTierCapacity = (tier: TicketTier): number => {
    if (tier.allocationMode === "mixed") {
      // Calculate total from all table groups
      const tableSeats = (tier.tableGroups || []).reduce((sum, group) => {
        return sum + (group.seatsPerTable * group.numberOfTables);
      }, 0);
      const individuals = tier.individualQuantity || 0;
      return tableSeats + individuals;
    } else if (tier.allocationMode === "table" || tier.isTablePackage) {
      const quantity = tier.tableQuantity || parseInt(tier.quantity) || 0;
      return quantity * (tier.tableCapacity || 0);
    } else {
      return tier.individualQuantity || parseInt(tier.quantity) || 0;
    }
  };

  // Calculate allocated tickets (accounting for table packages and mixed allocation)
  const allocated = tiers.reduce((sum, tier) => {
    return sum + getTierCapacity(tier);
  }, 0);

  // Calculate remaining capacity
  const remaining = capacity - allocated;
  const isOverCapacity = allocated > capacity;

  // Generate tier colors for breakdown
  const tierColors = [
    "#3B82F6", // blue
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#F59E0B", // amber
    "#10B981", // green
    "#6366F1", // indigo
  ];

  const breakdown = tiers.map((tier, index) => {
    return {
      name: tier.name || `Tier ${index + 1}`,
      quantity: getTierCapacity(tier),
      color: tierColors[index % tierColors.length],
    };
  });

  // Apply preset template
  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    const newTiers = template.generate(capacity);
    onChange(newTiers);
  };

  // Quick-add ticket type
  const quickAddTicket = (typeValue: string) => {
    const ticketType = TICKET_TYPES.find((t) => t.value === typeValue);
    if (!ticketType) return;

    const newTier: TicketTier = {
      id: `tier-${Date.now()}`,
      name: ticketType.defaultName,
      description: ticketType.defaultDescription,
      price: "",
      quantity: typeValue === "table" ? "10" : String(Math.max(0, remaining)),
      isTablePackage: typeValue === "table",
      tableCapacity: typeValue === "table" ? 8 : undefined,
    };

    onChange([...tiers, newTier]);
    setShowQuickAdd(false);
    setExpandedTiers(new Set([...Array.from(expandedTiers), newTier.id]));
  };

  // Add custom tier
  const addTier = () => {
    const newTier: TicketTier = {
      id: `tier-${Date.now()}`,
      name: "",
      description: "",
      price: "",
      quantity: String(Math.max(0, remaining)),
    };
    onChange([...tiers, newTier]);
    setExpandedTiers(new Set([...Array.from(expandedTiers), newTier.id]));
  };

  // Remove tier
  const removeTier = (id: string) => {
    onChange(tiers.filter((tier) => tier.id !== id));
    const newExpanded = new Set(expandedTiers);
    newExpanded.delete(id);
    setExpandedTiers(newExpanded);
  };

  // Update tier field
  const updateTier = (id: string, field: keyof TicketTier, value: any) => {
    onChange(
      tiers.map((tier) =>
        tier.id === id ? { ...tier, [field]: value } : tier
      )
    );
  };

  // Update tier pricing
  const updateTierPricing = (id: string, pricingTiers: PricingTier[]) => {
    onChange(
      tiers.map((tier) =>
        tier.id === id ? { ...tier, pricingTiers } : tier
      )
    );
  };

  // Toggle tier expansion
  const toggleTierExpansion = (id: string) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTiers(newExpanded);
  };

  // Handle table package toggle with smart conversion
  const handleTablePackageToggle = (tierId: string, checked: boolean) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    const currentQuantity = parseInt(tier.quantity) || 0;
    const tableCapacity = tier.tableCapacity || 8;

    if (checked && currentQuantity > 0) {
      // User is converting tickets to tables
      const suggestedTables = Math.floor(currentQuantity / tableCapacity);
      const remainder = currentQuantity % tableCapacity;

      if (suggestedTables > 0) {
        const confirmMessage =
          `Convert ${currentQuantity} tickets to table packages?\n\n` +
          `Suggested: ${suggestedTables} ${suggestedTables === 1 ? 'table' : 'tables'} × ${tableCapacity} seats = ${suggestedTables * tableCapacity} seats\n` +
          `${remainder > 0 ? `(${remainder} ${remainder === 1 ? 'ticket' : 'tickets'} will be removed due to remainder)\n\n` : '\n'}` +
          `Click OK to convert, or Cancel to set manually.`;

        if (window.confirm(confirmMessage)) {
          updateTier(tierId, "quantity", String(suggestedTables));
        }
      }
    } else if (!checked && currentQuantity > 0 && tier.isTablePackage && tier.tableCapacity) {
      // User is converting tables back to tickets
      const totalSeats = currentQuantity * tier.tableCapacity;
      const confirmMessage =
        `Convert ${currentQuantity} ${currentQuantity === 1 ? 'table' : 'tables'} back to individual tickets?\n\n` +
        `This will create ${totalSeats} individual tickets.\n\n` +
        `Click OK to convert, or Cancel to keep current quantity.`;

      if (window.confirm(confirmMessage)) {
        updateTier(tierId, "quantity", String(totalSeats));
      }
    }

    updateTier(tierId, "isTablePackage", checked);
  };

  return (
    <div className="space-y-6">
      {/* Capacity Progress Bar */}
      {capacity > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <CapacityProgressBar
            capacity={capacity}
            allocated={allocated}
            sold={sold}
            showBreakdown={tiers.length > 0 && tiers.length <= 6}
            breakdown={breakdown}
          />
        </div>
      )}

      {/* Preset Templates */}
      {showPresets && tiers.length === 0 && capacity > 0 && (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-primary/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Setup Templates
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get started fast with a pre-configured ticket setup
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-left hover:border-primary hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ticket Tiers Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ticket Tiers
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {capacity > 0
                ? `Distribute your ${capacity.toLocaleString()} ticket capacity`
                : "Add different ticket types with varying prices"}
            </p>
          </div>

          {/* Quick Add Dropdown */}
          <div className="relative">
            {!showQuickAdd ? (
              <button
                type="button"
                onClick={() => setShowQuickAdd(true)}
                disabled={capacity > 0 && remaining <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              >
                <Plus className="w-4 h-4" />
                Add Ticket
              </button>
            ) : (
              <div className="absolute right-0 top-0 z-10 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 space-y-1">
                  {TICKET_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => quickAddTicket(type.value)}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tier List */}
        {tiers.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No ticket tiers yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              {capacity > 0
                ? "Use a template above or add tickets manually"
                : "Add at least one ticket tier to enable ticketing"}
            </p>
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              Add First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tiers.map((tier, index) => {
              const tierQuantity = parseInt(tier.quantity) || 0;
              const tierPrice = parseFloat(tier.price) || 0;
              const isExpanded = expandedTiers.has(tier.id);

              return (
                <div
                  key={tier.id}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Tier Header - Always Visible */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            style={{
                              backgroundColor:
                                tierColors[index % tierColors.length],
                            }}
                          />
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {tier.name || `Ticket Tier ${index + 1}`}
                          </h4>
                          {tier.isTablePackage && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                              Table
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>
                              {tier.isTablePackage && tier.tableCapacity
                                ? `${tierQuantity} tables × ${tier.tableCapacity} seats`
                                : `${tierQuantity.toLocaleString()} tickets`}
                            </span>
                          </div>
                          {tierPrice > 0 && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>${(tierPrice / 100).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleTierExpansion(tier.id)}
                          className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        >
                          {isExpanded ? "Collapse" : "Expand"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTier(tier.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tier Details - Expandable */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ticket Name *
                        </label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) =>
                            updateTier(tier.id, "name", e.target.value)
                          }
                          placeholder="e.g., General Admission, VIP"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={tier.description}
                          onChange={(e) =>
                            updateTier(tier.id, "description", e.target.value)
                          }
                          placeholder="Describe what's included with this ticket"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                      </div>

                      {/* Price and Quantity */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Price */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Price *
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              $
                            </div>
                            <input
                              type="number"
                              value={tier.price}
                              onChange={(e) =>
                                updateTier(tier.id, "price", e.target.value)
                              }
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Price per ticket
                          </p>
                        </div>

                        {/* Quantity - Only show for individual mode or legacy */}
                        {(!tier.allocationMode || tier.allocationMode === "individual") && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              value={tier.individualQuantity || tier.quantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateTier(tier.id, "quantity", val);
                                updateTier(tier.id, "individualQuantity", parseInt(val) || 0);
                              }}
                              placeholder="0"
                              min="1"
                              max={capacity > 0 ? remaining + tierQuantity : undefined}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            {capacity > 0 && remaining + tierQuantity > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Max available: {(remaining + tierQuantity).toLocaleString()} tickets
                              </p>
                            )}
                          </div>
                        )}
                        {/* Placeholder for mixed/table modes */}
                        {(tier.allocationMode === "mixed" || tier.allocationMode === "table") && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Total Capacity
                            </label>
                            <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg">
                              {getTierCapacity(tier)} seats
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Configure allocation below
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Allocation Mode Selection */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ticket Sale Format
                        </label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                            <input
                              type="radio"
                              name={`allocationMode-${tier.id}`}
                              checked={!tier.allocationMode || tier.allocationMode === "individual"}
                              onChange={() => updateTier(tier.id, "allocationMode", "individual")}
                              className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Individual tickets only
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                            <input
                              type="radio"
                              name={`allocationMode-${tier.id}`}
                              checked={tier.allocationMode === "table"}
                              onChange={() => updateTier(tier.id, "allocationMode", "table")}
                              className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Table packages only
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                            <input
                              type="radio"
                              name={`allocationMode-${tier.id}`}
                              checked={tier.allocationMode === "mixed"}
                              onChange={() => updateTier(tier.id, "allocationMode", "mixed")}
                              className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Both tables AND individual tickets
                            </span>
                          </label>
                        </div>

                        {/* Mixed Allocation Controls */}
                        {tier.allocationMode === "mixed" && (
                          <div className="mt-4 space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                              Configure how to split this tier
                            </div>

                            {/* Total Tier Capacity */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Total Tier Capacity *
                              </label>
                              <input
                                type="number"
                                value={tier.quantity || ""}
                                onChange={(e) => {
                                  const totalCapacity = parseInt(e.target.value) || 0;
                                  updateTier(tier.id, "quantity", e.target.value);

                                  // Auto-calculate individual tickets after tables are allocated
                                  const tableSeats = (tier.tableGroups || []).reduce((sum, group) => {
                                    return sum + (group.seatsPerTable * group.numberOfTables);
                                  }, 0);
                                  const remainingIndividual = Math.max(0, totalCapacity - tableSeats);
                                  updateTier(tier.id, "individualQuantity", remainingIndividual);
                                }}
                                placeholder="e.g., 100"
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Total tickets in this tier (tables + individual)
                              </p>
                            </div>

                            {/* Table Groups */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Table Groups
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentGroups = tier.tableGroups || [];
                                    const newGroups = [...currentGroups, { seatsPerTable: 4, numberOfTables: 0 }];
                                    updateTier(tier.id, "tableGroups", newGroups);
                                  }}
                                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Group
                                </button>
                              </div>

                              {(tier.tableGroups || []).length === 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                                  No table groups yet. Click "Add Group" to add different table sizes.
                                </p>
                              )}

                              {(tier.tableGroups || []).map((group, groupIndex) => (
                                <div key={groupIndex} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 space-y-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Group {groupIndex + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newGroups = (tier.tableGroups || []).filter((_, i) => i !== groupIndex);
                                        updateTier(tier.id, "tableGroups", newGroups);

                                        // Recalculate individual tickets
                                        const totalCapacity = parseInt(tier.quantity) || 0;
                                        const tableSeats = newGroups.reduce((sum, g) => sum + (g.seatsPerTable * g.numberOfTables), 0);
                                        updateTier(tier.id, "individualQuantity", Math.max(0, totalCapacity - tableSeats));
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Seats per table
                                      </label>
                                      <select
                                        value={group.seatsPerTable}
                                        onChange={(e) => {
                                          const newGroups = [...(tier.tableGroups || [])];
                                          newGroups[groupIndex] = { ...group, seatsPerTable: parseInt(e.target.value) };
                                          updateTier(tier.id, "tableGroups", newGroups);

                                          // Recalculate individual tickets
                                          const totalCapacity = parseInt(tier.quantity) || 0;
                                          const tableSeats = newGroups.reduce((sum, g) => sum + (g.seatsPerTable * g.numberOfTables), 0);
                                          updateTier(tier.id, "individualQuantity", Math.max(0, totalCapacity - tableSeats));
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded"
                                      >
                                        <option value="2">2 seats</option>
                                        <option value="4">4 seats</option>
                                        <option value="6">6 seats</option>
                                        <option value="8">8 seats</option>
                                        <option value="10">10 seats</option>
                                        <option value="12">12 seats</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Number of tables
                                      </label>
                                      <input
                                        type="number"
                                        value={group.numberOfTables || ""}
                                        onChange={(e) => {
                                          const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                          const newGroups = [...(tier.tableGroups || [])];
                                          newGroups[groupIndex] = { ...group, numberOfTables: val };
                                          updateTier(tier.id, "tableGroups", newGroups);

                                          // Recalculate individual tickets
                                          const totalCapacity = parseInt(tier.quantity) || 0;
                                          const tableSeats = newGroups.reduce((sum, g) => sum + (g.seatsPerTable * g.numberOfTables), 0);
                                          updateTier(tier.id, "individualQuantity", Math.max(0, totalCapacity - tableSeats));
                                        }}
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded"
                                      />
                                    </div>
                                  </div>

                                  {group.numberOfTables > 0 && (
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                      = {group.numberOfTables * group.seatsPerTable} seats
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Individual Tickets (Auto-calculated, Read-only) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Individual Tickets (Auto-calculated)
                              </label>
                              <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg">
                                {tier.individualQuantity || 0} tickets
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Remaining tickets after table allocation
                              </p>
                            </div>

                            {/* Total Breakdown */}
                            <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                              <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                <Users className="w-4 h-4" />
                                Breakdown
                              </div>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {parseInt(tier.quantity) || 0} total seats
                              </div>
                              <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-0.5">
                                {(tier.tableGroups || []).map((group, idx) => (
                                  <div key={idx}>
                                    • {group.numberOfTables} tables of {group.seatsPerTable} seats ({group.numberOfTables * group.seatsPerTable} seats)
                                  </div>
                                ))}
                                {(tier.individualQuantity || 0) > 0 && (
                                  <div>• {tier.individualQuantity} individual tickets</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Table Only Mode */}
                        {tier.allocationMode === "table" && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Seats per Table
                              </label>
                              <select
                                value={tier.tableCapacity || 8}
                                onChange={(e) =>
                                  updateTier(tier.id, "tableCapacity", parseInt(e.target.value))
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              >
                                <option value="2">2 seats</option>
                                <option value="4">4 seats</option>
                                <option value="6">6 seats</option>
                                <option value="8">8 seats</option>
                                <option value="10">10 seats</option>
                                <option value="12">12 seats</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Number of Tables
                              </label>
                              <input
                                type="number"
                                value={tier.tableQuantity || parseInt(tier.quantity) || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  updateTier(tier.id, "tableQuantity", val);
                                  updateTier(tier.id, "quantity", String(val));
                                }}
                                placeholder="0"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                              {(tier.tableQuantity || parseInt(tier.quantity) || 0) > 0 && tier.tableCapacity && (
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  = {(tier.tableQuantity || parseInt(tier.quantity) || 0) * tier.tableCapacity} total seats
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Early Bird Pricing */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <PricingTierForm
                          tiers={tier.pricingTiers || []}
                          onChange={(pricingTiers) =>
                            updateTierPricing(tier.id, pricingTiers)
                          }
                          basePrice={tierPrice}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Capacity Warning - Only show if over capacity */}
      {isOverCapacity && capacity > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Your ticket tiers exceed the event capacity. Please reduce ticket quantities
            or increase your event capacity.
          </p>
        </div>
      )}
    </div>
  );
}
