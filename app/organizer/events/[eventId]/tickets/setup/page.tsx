"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Trash2, ArrowLeft, Check, Ticket, Gift, DollarSign } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type TicketTierForm = {
  name: string;
  description: string;
  price: string;
  quantity: string;
  saleStart: string;
  saleEnd: string;
  isTablePackage: boolean;
  tableCapacity: string;
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
      isTablePackage: false,
      tableCapacity: "4",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const existingTiers = useQuery(api.events.queries.getEventTicketTiers, { eventId });
  const credits = useQuery(api.credits.queries.getMyCredits);

  const createTicketTier = useMutation(api.tickets.mutations.createTicketTier);

  const isLoading = !event || !currentUser || credits === undefined;

  // Calculate total tickets needed and cost breakdown
  const costBreakdown = useMemo(() => {
    if (!credits) return null;

    let totalTicketsNeeded = 0;
    const tierBreakdowns: Array<{
      tierIndex: number;
      quantity: number;
      freeTickets: number;
      paidTickets: number;
      cost: number;
    }> = [];

    let creditsRemaining = credits.creditsRemaining;

    tiers.forEach((tier, index) => {
      const quantity = parseInt(tier.quantity) || 0;
      if (quantity <= 0) return;

      totalTicketsNeeded += quantity;

      const freeTickets = Math.min(quantity, creditsRemaining);
      const paidTickets = Math.max(0, quantity - creditsRemaining);
      const cost = paidTickets * 0.30;

      tierBreakdowns.push({
        tierIndex: index,
        quantity,
        freeTickets,
        paidTickets,
        cost,
      });

      creditsRemaining -= freeTickets;
    });

    const totalFreeTickets = tierBreakdowns.reduce((sum, t) => sum + t.freeTickets, 0);
    const totalPaidTickets = tierBreakdowns.reduce((sum, t) => sum + t.paidTickets, 0);
    const totalCost = tierBreakdowns.reduce((sum, t) => sum + t.cost, 0);

    return {
      totalTicketsNeeded,
      totalFreeTickets,
      totalPaidTickets,
      totalCost,
      tierBreakdowns,
      creditsAfter: credits.creditsRemaining - totalFreeTickets,
    };
  }, [tiers, credits]);

  // Check if user is the organizer
  if (!isLoading && event.organizerId !== currentUser?._id) {
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
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
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
        isTablePackage: false,
        tableCapacity: "4",
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
          isTablePackage: tier.isTablePackage,
          tableCapacity: tier.isTablePackage ? parseInt(tier.tableCapacity) : undefined,
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
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
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
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Set Up Ticket Tiers</h1>
          </div>
          <p className="text-gray-600">
            Create different ticket types for "{event.name}"
          </p>
        </motion.div>

        {/* Credit Balance Banner */}
        {credits && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 bg-primary border-2 border-green-200 rounded-lg p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Free Ticket Credits Available
                </h3>
                <p className="text-gray-700 mb-3">
                  You have <span className="font-bold text-green-700">{credits.creditsRemaining} free tickets</span> remaining out of your {credits.creditsTotal} total credits.
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">Pricing:</span>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      First {credits.creditsTotal} tickets: <strong className="text-green-700">FREE</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      Additional tickets: <strong className="text-primary">$0.30 each</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
                        {tier.isTablePackage ? "Number of Tables Available *" : "Quantity Available *"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tier.quantity}
                        onChange={(e) => handleTierChange(index, "quantity", e.target.value)}
                        placeholder={tier.isTablePackage ? "4" : "100"}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                          errors[index]?.quantity ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[index]?.quantity && (
                        <p className="text-red-600 text-sm mt-1">{errors[index].quantity}</p>
                      )}
                      {tier.isTablePackage && (
                        <p className="text-xs text-gray-500 mt-1">
                          Number of tables available for purchase
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Table Package Option */}
                  <div className="bg-accent border border-primary rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`tablePackage-${index}`}
                        checked={tier.isTablePackage}
                        onChange={(e) => {
                          const newTiers = [...tiers];
                          newTiers[index].isTablePackage = e.target.checked;
                          setTiers(newTiers);
                        }}
                        className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                      />
                      <div className="flex-1">
                        <label htmlFor={`tablePackage-${index}`} className="font-semibold text-foreground cursor-pointer">
                          Sell as Table Package
                        </label>
                        <p className="text-sm text-foreground mt-1">
                          Enable this to sell entire tables instead of individual seats. Customers must purchase all seats at a table together.
                        </p>

                        {tier.isTablePackage && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3"
                          >
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Seats per Table *
                            </label>
                            <select
                              value={tier.tableCapacity}
                              onChange={(e) => handleTierChange(index, "tableCapacity", e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
                            >
                              <option value="2">2 seats</option>
                              <option value="4">4 seats</option>
                              <option value="6">6 seats</option>
                              <option value="8">8 seats</option>
                              <option value="10">10 seats</option>
                              <option value="12">12 seats</option>
                            </select>
                            <p className="text-xs text-primary mt-2">
                              <strong>Price breakdown:</strong> ${tier.price ? (parseFloat(tier.price) / parseInt(tier.tableCapacity || "4")).toFixed(2) : "0.00"} per seat
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown for this Tier */}
                  {costBreakdown && tier.quantity && parseInt(tier.quantity) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-primary border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Cost for this tier
                          </h4>
                          {(() => {
                            const breakdown = costBreakdown.tierBreakdowns.find(
                              (b) => b.tierIndex === index
                            );
                            if (!breakdown) return null;

                            return (
                              <div className="space-y-1 text-sm">
                                {breakdown.freeTickets > 0 && (
                                  <div className="flex items-center justify-between text-green-700">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                      {breakdown.freeTickets} free tickets
                                    </span>
                                    <strong>$0.00</strong>
                                  </div>
                                )}
                                {breakdown.paidTickets > 0 && (
                                  <div className="flex items-center justify-between text-primary">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                                      {breakdown.paidTickets} paid tickets × $0.30
                                    </span>
                                    <strong>${breakdown.cost.toFixed(2)}</strong>
                                  </div>
                                )}
                                <div className="border-t border-border pt-2 mt-2 flex items-center justify-between font-bold text-gray-900">
                                  <span>Total for this tier:</span>
                                  <span className={breakdown.cost > 0 ? "text-primary" : "text-green-700"}>
                                    {breakdown.cost > 0 ? `$${breakdown.cost.toFixed(2)}` : "FREE"}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Early Bird Pricing Section */}
                  <div className="bg-accent border border-border rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">i</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Early Bird Pricing</h4>
                        <p className="text-sm text-accent-foreground">
                          Set sale dates to create time-based pricing. Leave blank for always-available tiers.
                        </p>
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
                        <p className="text-xs text-gray-500 mt-1">When this tier becomes available</p>
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
                        <p className="text-xs text-gray-500 mt-1">When this tier stops being available</p>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-white border border-border rounded">
                      <p className="text-xs text-accent-foreground">
                        <strong>Example:</strong> Create "Early Bird" tier with sale end date, then "General Admission" tier with no dates for automatic price increase!
                      </p>
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
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Another Tier
          </motion.button>
        </div>

        {/* Total Summary */}
        {costBreakdown && costBreakdown.totalTicketsNeeded > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary border-2 border-primary rounded-lg p-6 mt-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Total Summary
            </h3>
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Total tickets needed:</span>
                <strong className="text-gray-900">{costBreakdown.totalTicketsNeeded}</strong>
              </div>
              <div className="h-px bg-gray-200"></div>
              {costBreakdown.totalFreeTickets > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Free tickets used:
                  </span>
                  <strong className="text-green-700">{costBreakdown.totalFreeTickets}</strong>
                </div>
              )}
              {costBreakdown.totalPaidTickets > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Paid tickets:
                  </span>
                  <strong className="text-primary">
                    {costBreakdown.totalPaidTickets} × $0.30 = ${costBreakdown.totalCost.toFixed(2)}
                  </strong>
                </div>
              )}
              <div className="h-px bg-gray-200"></div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">Total Cost:</span>
                <span className={`text-2xl font-bold ${
                  costBreakdown.totalCost > 0 ? "text-primary" : "text-green-700"
                }`}>
                  {costBreakdown.totalCost > 0 ? `$${costBreakdown.totalCost.toFixed(2)}` : "FREE"}
                </span>
              </div>
              {costBreakdown.creditsAfter >= 0 && (
                <>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Credits remaining after:</span>
                    <strong className="text-gray-900">{costBreakdown.creditsAfter} free tickets</strong>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

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
                ? "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
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
        <div className="mt-6 bg-accent border border-border rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Tip:</span> You can create multiple ticket tiers with different prices and quantities. For example, Early Bird tickets at a lower price, General Admission, and VIP tickets with extra perks.
          </p>
        </div>
      </div>
    </div>
  );
}
