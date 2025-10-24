"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Trash2, ArrowLeft, Check, Ticket } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type TicketTierForm = {
  name: string;
  description: string;
  price: string;
  quantity: string;
  saleStart: string;
  saleEnd: string;
};

export default function TicketSetupPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [tiers, setTiers] = useState<TicketTierForm[]>([
    {
      name: "General Admission",
      description: "",
      price: "",
      quantity: "",
      saleStart: "",
      saleEnd: "",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const existingTiers = useQuery(api.events.queries.getEventTicketTiers, { eventId });

  const createTicketTier = useMutation(api.tickets.mutations.createTicketTier);

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

  // If tiers already exist, show them and allow viewing
  if (existingTiers && existingTiers.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link
            href={`/organizer/events/${eventId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-2 mb-6">
              <Check className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Ticket Tiers Configured</h1>
            </div>

            <p className="text-gray-600 mb-6">
              Your ticket tiers are set up for this event.
            </p>

            <div className="space-y-4">
              {existingTiers.map((tier) => (
                <div
                  key={tier._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                      {tier.description && (
                        <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-700">
                          <span className="font-medium">Price:</span> ${(tier.price / 100).toFixed(2)}
                        </span>
                        <span className="text-gray-700">
                          <span className="font-medium">Quantity:</span> {tier.quantity}
                        </span>
                        <span className="text-gray-700">
                          <span className="font-medium">Sold:</span> {tier.sold}
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tier.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {tier.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href={`/organizer/events/${eventId}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Event Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAddTier = () => {
    setTiers([
      ...tiers,
      {
        name: "",
        description: "",
        price: "",
        quantity: "",
        saleStart: "",
        saleEnd: "",
      },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
      // Remove errors for this tier
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleTierChange = (index: number, field: keyof TicketTierForm, value: string) => {
    const newTiers = [...tiers];
    newTiers[index][field] = value;
    setTiers(newTiers);

    // Clear error for this field
    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      setErrors(newErrors);
    }
  };

  const validateTiers = (): boolean => {
    const newErrors: Record<number, Record<string, string>> = {};
    let isValid = true;

    tiers.forEach((tier, index) => {
      const tierErrors: Record<string, string> = {};

      if (!tier.name.trim()) {
        tierErrors.name = "Name is required";
        isValid = false;
      }

      if (!tier.price || parseFloat(tier.price) <= 0) {
        tierErrors.price = "Price must be greater than 0";
        isValid = false;
      }

      if (!tier.quantity || parseInt(tier.quantity) <= 0) {
        tierErrors.quantity = "Quantity must be greater than 0";
        isValid = false;
      }

      if (Object.keys(tierErrors).length > 0) {
        newErrors[index] = tierErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateTiers()) {
      return;
    }

    setIsProcessing(true);
    try {
      // Create all ticket tiers
      for (const tier of tiers) {
        await createTicketTier({
          eventId,
          name: tier.name,
          description: tier.description || undefined,
          price: Math.round(parseFloat(tier.price) * 100), // Convert to cents
          quantity: parseInt(tier.quantity),
          saleStart: tier.saleStart ? new Date(tier.saleStart).getTime() : undefined,
          saleEnd: tier.saleEnd ? new Date(tier.saleEnd).getTime() : undefined,
        });
      }

      // Redirect to event dashboard
      router.push(`/organizer/events/${eventId}`);
    } catch (error) {
      console.error("Error creating ticket tiers:", error);
      alert("Failed to create ticket tiers. Please try again.");
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href={`/organizer/events/${eventId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Set Up Ticket Tiers</h1>
          </div>
          <p className="text-gray-600">
            Create different ticket types for "{event.name}"
          </p>
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {tiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tier {index + 1}
                  </h3>
                  {tiers.length > 1 && (
                    <button
                      onClick={() => handleRemoveTier(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Tier Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tier Name *
                    </label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleTierChange(index, "name", e.target.value)}
                      placeholder="e.g., General Admission, VIP, Early Bird"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                        errors[index]?.name ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors[index]?.name && (
                      <p className="text-red-600 text-sm mt-1">{errors[index].name}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={tier.description}
                      onChange={(e) => handleTierChange(index, "description", e.target.value)}
                      placeholder="Optional description of what's included..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (USD) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tier.price}
                          onChange={(e) => handleTierChange(index, "price", e.target.value)}
                          placeholder="0.00"
                          className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                            errors[index]?.price ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors[index]?.price && (
                        <p className="text-red-600 text-sm mt-1">{errors[index].price}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity Available *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tier.quantity}
                        onChange={(e) => handleTierChange(index, "quantity", e.target.value)}
                        placeholder="100"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                          errors[index]?.quantity ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[index]?.quantity && (
                        <p className="text-red-600 text-sm mt-1">{errors[index].quantity}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Sale Start */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sale Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={tier.saleStart}
                        onChange={(e) => handleTierChange(index, "saleStart", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>

                    {/* Sale End */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sale End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={tier.saleEnd}
                        onChange={(e) => handleTierChange(index, "saleEnd", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Tier Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleAddTier}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Another Tier
          </motion.button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Link
            href={`/organizer/events/${eventId}`}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancel
          </Link>

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              !isProcessing
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Tiers...
              </span>
            ) : (
              "Complete Setup"
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Tip:</span> You can create multiple ticket tiers with different prices and quantities. For example, Early Bird tickets at a lower price, General Admission, and VIP tickets with extra perks.
          </p>
        </div>
      </div>
    </div>
  );
}
