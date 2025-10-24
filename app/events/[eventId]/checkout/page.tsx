"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SquarePaymentForm } from "@/components/checkout/SquarePaymentForm";
import { ArrowLeft, CheckCircle2, Ticket } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [selectedTierId, setSelectedTierId] = useState<Id<"ticketTiers"> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const eventDetails = useQuery(api.public.queries.getPublicEventDetails, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const createOrder = useMutation(api.tickets.mutations.createOrder);
  const completeOrder = useMutation(api.tickets.mutations.completeOrder);
  const getOrderDetails = useQuery(
    api.tickets.queries.getOrderDetails,
    orderId ? { orderId: orderId as Id<"orders"> } : "skip"
  );

  const isLoading = !eventDetails || !currentUser;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const selectedTier = eventDetails.ticketTiers?.find(
    (tier) => tier._id === selectedTierId
  );

  const subtotal = selectedTier ? selectedTier.price * quantity : 0;
  const platformFee = Math.round((subtotal * 3.7) / 100) + 179; // 3.7% + $1.79
  const processingFee = Math.round(((subtotal + platformFee) * 2.9) / 100) + 30; // 2.9% + $0.30
  const total = subtotal + platformFee + processingFee;

  const handleContinueToPayment = async () => {
    if (!selectedTierId || !buyerEmail || !buyerName) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Create order in Convex
      const newOrderId = await createOrder({
        eventId,
        ticketTierId: selectedTierId,
        quantity,
        buyerEmail,
        buyerName,
        subtotalCents: subtotal,
        platformFeeCents: platformFee,
        processingFeeCents: processingFee,
        totalCents: total,
      });

      setOrderId(newOrderId);
      setShowPayment(true);
    } catch (error) {
      console.error("Order creation error:", error);
      alert("Failed to create order. Please try again.");
    }
  };

  const handlePaymentSuccess = async (paymentId: string, receiptUrl?: string) => {
    if (!orderId) return;

    try {
      // Complete the order in Convex
      await completeOrder({
        orderId: orderId as Id<"orders">,
        paymentId,
        paymentMethod: "SQUARE",
      });

      setIsSuccess(true);

      // Send ticket confirmation email
      // Wait for order details to be available
      setTimeout(async () => {
        try {
          const response = await fetch("/api/send-ticket-confirmation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: buyerEmail,
              orderDetails: getOrderDetails?.order,
              tickets: getOrderDetails?.tickets,
              event: getOrderDetails?.event,
            }),
          });

          if (!response.ok) {
            console.error("Failed to send ticket confirmation email");
          }
        } catch (emailError) {
          console.error("Email sending error:", emailError);
          // Don't block success screen if email fails
        }
      }, 2000);
    } catch (error) {
      console.error("Order completion error:", error);
      alert("Payment successful but order completion failed. Please contact support.");
    }
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
    setShowPayment(false);
    setOrderId(null);
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            Payment Successful!
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6"
          >
            Your tickets have been purchased. Check your email for confirmation.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Link
              href="/my-tickets"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View My Tickets
            </Link>
            <Link
              href={`/events/${eventId}`}
              className="block w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Event
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Order Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Checkout
            </h1>

            {/* Event Info */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                {eventDetails.name}
              </h3>
              <p className="text-sm text-gray-600">
                {format(new Date(eventDetails.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {eventDetails.location.venueName && `${eventDetails.location.venueName}, `}
                {eventDetails.location.city}, {eventDetails.location.state}
              </p>
            </div>

            {!showPayment ? (
              <>
                {/* Ticket Selection */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Select Ticket Type
                  </h3>
                  <div className="space-y-3">
                    {eventDetails.ticketTiers?.map((tier) => (
                      <button
                        key={tier._id}
                        onClick={() => setSelectedTierId(tier._id)}
                        className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                          selectedTierId === tier._id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {tier.name}
                            </p>
                            {tier.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {tier.description}
                              </p>
                            )}
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            ${(tier.price / 100).toFixed(2)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                {selectedTierId && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Quantity
                    </h3>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Buyer Info */}
                {selectedTierId && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Your Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Payment Details
                </h3>
                <SquarePaymentForm
                  amount={total}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  orderId={orderId!}
                  eventId={eventId}
                  eventName={eventDetails.name}
                  buyerEmail={buyerEmail}
                />
              </div>
            )}
          </motion.div>

          {/* Right: Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6 sticky top-8"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Order Summary
              </h3>

              {selectedTier ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {selectedTier.name} x {quantity}
                    </span>
                    <span className="font-medium">
                      ${(subtotal / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-medium">
                      ${(platformFee / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="font-medium">
                      ${(processingFee / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${(total / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {!showPayment && (
                    <button
                      onClick={handleContinueToPayment}
                      disabled={!buyerEmail || !buyerName}
                      className={`w-full px-6 py-4 rounded-lg font-semibold transition-all ${
                        buyerEmail && buyerName
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Continue to Payment
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Select a ticket type to continue
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
