"use client";

import { useState } from "react";
import { Plus, Trash2, Ticket, DollarSign, Users } from "lucide-react";

interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
}

interface TicketTierEditorProps {
  tiers: TicketTier[];
  onChange: (tiers: TicketTier[]) => void;
}

export function TicketTierEditor({ tiers, onChange }: TicketTierEditorProps) {
  const addTier = () => {
    const newTier: TicketTier = {
      id: `tier-${Date.now()}`,
      name: "",
      description: "",
      price: "",
      quantity: "",
    };
    onChange([...tiers, newTier]);
  };

  const removeTier = (id: string) => {
    onChange(tiers.filter((tier) => tier.id !== id));
  };

  const updateTier = (id: string, field: keyof TicketTier, value: string) => {
    onChange(
      tiers.map((tier) =>
        tier.id === id ? { ...tier, [field]: value } : tier
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ticket Tiers</h3>
          <p className="text-sm text-gray-600">
            Add different ticket types with varying prices
          </p>
        </div>
        <button
          type="button"
          onClick={addTier}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      {tiers.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No ticket tiers yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Add at least one ticket tier to enable ticketing
          </p>
          <button
            type="button"
            onClick={addTier}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Tier
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tiers.map((tier, index) => (
            <div
              key={tier.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Tier {index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => removeTier(tier.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tier Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tier Name *
                  </label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id, "name", e.target.value)}
                    placeholder="e.g., General Admission, VIP, Early Bird"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => updateTier(tier.id, "price", e.target.value)}
                      placeholder="25.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Available *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      value={tier.quantity}
                      onChange={(e) => updateTier(tier.id, "quantity", e.target.value)}
                      placeholder="100"
                      min="1"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={tier.description}
                    onChange={(e) => updateTier(tier.id, "description", e.target.value)}
                    placeholder="Benefits included with this tier..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tiers.length > 0 && (
        <button
          type="button"
          onClick={addTier}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Another Tier
        </button>
      )}
    </div>
  );
}
