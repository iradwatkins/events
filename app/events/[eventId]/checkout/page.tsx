"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SquareCardPayment } from "@/components/checkout/SquareCardPayment";
import { CashAppQRPayment } from "@/components/checkout/CashAppPayment";
import SeatSelection, { SelectedSeat } from "@/components/checkout/SeatSelection";
import { TierCountdown, TierAvailabilityBadge } from "@/components/events/TierCountdown";
import { ArrowLeft, CheckCircle2, Ticket, UserCheck, Tag, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventId as Id<"events">;

  const [selectedTierId, setSelectedTierId] = useState<Id<"ticketTiers"> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cashapp'>('card');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    _id: Id<"discountCodes">;
    code: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    discountAmountCents: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);

  const eventDetails = useQuery(api.public.queries.getPublicEventDetails, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const seatingChart = useQuery(api.seating.queries.getPublicSeatingChart, { eventId });
  const staffMemberInfo = useQuery(
    api.staff.queries.getStaffByReferralCode,
    referralCode ? { referralCode } : "skip"
  );

  const createOrder = useMutation(api.tickets.mutations.createOrder);
  const completeOrder = useMutation(api.tickets.mutations.completeOrder);
  const getOrderDetails = useQuery(
    api.tickets.queries.getOrderDetails,
    orderId ? { orderId: orderId as Id<"orders"> } : "skip"
  );

  // Check for referral code in URL parameters
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) {
      setReferralCode(refParam);
    }
  }, [searchParams]);

  const isLoading = !eventDetails || !currentUser;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const selectedTier = eventDetails.ticketTiers?.find((tier) => tier._id === selectedTierId);

  const subtotal = selectedTier ? selectedTier.price * quantity : 0;
  const discountAmount = appliedDiscount?.discountAmountCents || 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const platformFee = Math.round((subtotalAfterDiscount * 3.7) / 100) + 179; // 3.7% + $1.79
  const processingFee = Math.round(((subtotalAfterDiscount + platformFee) * 2.9) / 100) + 30; // 2.9% + $0.30
  const total = subtotalAfterDiscount + platformFee + processingFee;

  const handleApplyDiscount = async () => {
    if (!discountCode || discountCode.trim().length === 0) {
      setDiscountError("Please enter a discount code");
      return;
    }

    if (!buyerEmail) {
      setDiscountError("Please enter your email first");
      return;
    }

    if (!selectedTierId) {
      setDiscountError("Please select a ticket tier first");
      return;
    }

    try {
      setDiscountError(null);

      // Call validation query manually via fetch
      const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "discounts/queries:validateDiscountCode",
          args: {
            eventId,
            code: discountCode.trim().toUpperCase(),
            userEmail: buyerEmail,
            orderTotalCents: subtotal,
            selectedTierIds: [selectedTierId],
          },
        }),
      });

      const result = await response.json();

      if (result.value.valid) {
        setAppliedDiscount({
          _id: result.value.discountCode._id,
          code: result.value.discountCode.code,
          discountType: result.value.discountCode.discountType,
          discountValue: result.value.discountCode.discountValue,
          discountAmountCents: result.value.discountCode.discountAmountCents,
        });
        setDiscountCode("");
      } else {
        setDiscountError(result.value.error || "Invalid discount code");
      }
    } catch (error) {
      console.error("Discount validation error:", error);
      setDiscountError("Failed to validate discount code");
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError(null);
  };

  const handleSeatsSelected = (seats: SelectedSeat[]) => {
    setSelectedSeats(seats);
  };

  // Reset seats when tier or quantity changes
  useEffect(() => {
    setSelectedSeats([]);
  }, [selectedTierId, quantity]);

  const handleContinueToPayment = async () => {
    if (!selectedTierId || !buyerEmail || !buyerName) {
      alert("Please fill in all fields");
      return;
    }

    // Check if seating chart exists and seats are required
    const requiresSeats = seatingChart && seatingChart.sections.length > 0;
    if (requiresSeats && selectedSeats.length !== quantity) {
      alert(`Please select ${quantity} seat${quantity > 1 ? 's' : ''} before proceeding`);
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
        referralCode: referralCode || undefined,
        discountCodeId: appliedDiscount?._id,
        discountAmountCents: appliedDiscount?.discountAmountCents,
        selectedSeats: requiresSeats ? selectedSeats : undefined,
      });

      setOrderId(newOrderId);
      setShowPayment(true);
    } catch (error) {
      console.error("Order creation error:", error);
      alert("Failed to create order. Please try again.");
    }
  };

  const handlePaymentSuccess = async (result: Record<string, unknown>) => {
    if (!orderId) return;

    try {
      // Complete the order in Convex
      await completeOrder({
        orderId: orderId as Id<"orders">,
        paymentId: result.paymentId as string,
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

            {/* Event Info */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{eventDetails.name}</h3>
              <p className="text-sm text-gray-600">
                {eventDetails.startDate && format(new Date(eventDetails.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {eventDetails.location && typeof eventDetails.location === "object" && eventDetails.location.venueName && `${eventDetails.location.venueName}, `}
                {eventDetails.location && typeof eventDetails.location === "object" && eventDetails.location.city}, {eventDetails.location && typeof eventDetails.location === "object" && eventDetails.location.state}
              </p>
            </motion.div>

            {/* Referral Code Banner */}
            {referralCode && staffMemberInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Referred by {staffMemberInfo.name}
                    </h4>
                    <p className="text-sm text-blue-700">
                      Your purchase will be credited to this staff member
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {!showPayment ? (
              <>
                {/* Ticket Selection */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Select Ticket Type</h3>
                  <div className="space-y-3">
                    {eventDetails.ticketTiers
                      ?.filter((tier) => {
                        const now = Date.now();
                        const isAvailable = (!tier.saleStart || now >= tier.saleStart) &&
                                           (!tier.saleEnd || now <= tier.saleEnd) &&
                                           (tier.sold < tier.quantity);
                        return isAvailable;
                      })
                      .map((tier) => {
                        const now = Date.now();
                        const isSoldOut = tier.sold >= tier.quantity;
                        const remaining = tier.quantity - tier.sold;
                        const isLowStock = remaining <= 10 && remaining > 0;

                        return (
                          <button
                            key={tier._id}
                            onClick={() => !isSoldOut && setSelectedTierId(tier._id)}
                            disabled={isSoldOut}
                            className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                              selectedTierId === tier._id
                                ? "border-blue-600 bg-blue-50"
                                : isSoldOut
                                ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-900">{tier.name}</p>
                                    <TierAvailabilityBadge
                                      saleStart={tier.saleStart}
                                      saleEnd={tier.saleEnd}
                                      sold={tier.sold}
                                      quantity={tier.quantity}
                                    />
                                  </div>
                                  {tier.description && (
                                    <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                                  )}
                                </div>
                                <p className="text-lg font-bold text-gray-900 ml-4">
                                  ${(tier.price / 100).toFixed(2)}
                                </p>
                              </div>

                              {/* Additional Info Row */}
                              <div className="flex items-center gap-4 text-sm">
                                {/* Countdown */}
                                {tier.saleEnd && tier.saleEnd > now && (
                                  <TierCountdown endDate={tier.saleEnd} />
                                )}

                                {/* Stock Warning */}
                                {isLowStock && (
                                  <span className="text-orange-600 font-medium">
                                    Only {remaining} left!
                                  </span>
                                )}

                                {/* Quantity Info */}
                                {!isLowStock && !isSoldOut && (
                                  <span className="text-gray-500">
                                    {remaining} available
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {/* No Available Tiers Message */}
                  {eventDetails.ticketTiers?.every((tier) => {
                    const now = Date.now();
                    return (tier.saleStart && now < tier.saleStart) ||
                           (tier.saleEnd && now > tier.saleEnd) ||
                           (tier.sold >= tier.quantity);
                  }) && (
                    <div className="text-center py-8">
                      <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">No tickets currently available</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Check back later or contact the organizer
                      </p>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                {selectedTierId && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Quantity</h3>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                    />
                  </div>
                )}

                {/* Seat Selection */}
                {selectedTierId && seatingChart && seatingChart.sections.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Select Your Seats</h3>
                    <SeatSelection
                      eventId={eventId}
                      ticketTierId={selectedTierId}
                      requiredSeats={quantity}
                      onSeatsSelected={handleSeatsSelected}
                    />
                  </div>
                )}

                {/* Buyer Info */}
                {selectedTierId && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Your Information</h3>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder:text-gray-400"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Discount Code */}
                {selectedTierId && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Discount Code
                    </h3>

                    {/* Applied Discount Display */}
                    {appliedDiscount ? (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-green-900 text-lg">{appliedDiscount.code}</p>
                            <p className="text-sm text-green-700 mt-1">
                              {appliedDiscount.discountType === "PERCENTAGE"
                                ? `${appliedDiscount.discountValue}% off`
                                : `$${(appliedDiscount.discountValue / 100).toFixed(2)} off`}
                              {" - "}
                              You save ${(appliedDiscount.discountAmountCents / 100).toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={handleRemoveDiscount}
                            className="p-2 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                            title="Remove discount"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Discount Code Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => {
                              setDiscountCode(e.target.value.toUpperCase());
                              setDiscountError(null);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyDiscount();
                              }
                            }}
                            placeholder="Enter code"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder:text-gray-400 uppercase"
                          />
                          <button
                            onClick={handleApplyDiscount}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                          >
                            Apply
                          </button>
                        </div>

                        {/* Discount Error Message */}
                        {discountError && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600 mt-2 flex items-center gap-1"
                          >
                            {discountError}
                          </motion.p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>

                {/* Payment Method Selector */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Credit/Debit Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cashapp')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      paymentMethod === 'cashapp'
                        ? 'border-green-600 bg-green-50 text-green-900 font-semibold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Cash App Pay
                  </button>
                </div>

                {/* Payment Form */}
                {paymentMethod === 'card' ? (
                  <SquareCardPayment
                    applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
                    locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
                    total={total / 100}
                    environment={process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT as 'sandbox' | 'production'}
                    billingContact={{
                      givenName: buyerName.split(' ')[0],
                      familyName: buyerName.split(' ').slice(1).join(' '),
                      email: buyerEmail,
                    }}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    onBack={() => setShowPayment(false)}
                  />
                ) : (
                  <CashAppQRPayment
                    total={total / 100}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    onBack={() => setShowPayment(false)}
                  />
                )}
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
                    <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
                  </div>

                  {appliedDiscount && (
                    <div className="flex items-center justify-between text-sm bg-green-50 -mx-2 px-2 py-2 rounded">
                      <span className="text-green-700 font-medium flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        Discount ({appliedDiscount.code})
                      </span>
                      <span className="font-medium text-green-700">
                        -${(appliedDiscount.discountAmountCents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-medium">${(platformFee / 100).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="font-medium">${(processingFee / 100).toFixed(2)}</span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">Total</span>
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
                <p className="text-gray-500 text-sm">Select a ticket type to continue</p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
