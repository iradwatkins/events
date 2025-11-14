"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SquareCardPayment } from "@/components/checkout/SquareCardPayment";
import { CashAppQRPayment } from "@/components/checkout/CashAppPayment";
import { StripeCheckout } from "@/components/checkout/StripeCheckout";
import { PayPalPayment } from "@/components/checkout/PayPalPayment";
import type { SelectedSeat } from "@/components/checkout/SeatSelection";
import type { SelectedSeat as BallroomSeat } from "@/components/seating/InteractiveSeatingChart";
import dynamic from "next/dynamic";

// Dynamic imports for heavy seating components (only loaded when needed)
const SeatSelection = dynamic(() => import("@/components/checkout/SeatSelection"), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  ),
  ssr: false,
});

const InteractiveSeatingChart = dynamic(
  () => import("@/components/seating/InteractiveSeatingChart"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    ),
    ssr: false,
  }
);
import { TierCountdown, TierAvailabilityBadge } from "@/components/events/TierCountdown";
import {
  ArrowLeft,
  CheckCircle2,
  Ticket,
  UserCheck,
  Tag,
  X,
  Package,
  Zap,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventId as Id<"events">;
  const ENABLE_SEATING = process.env.NEXT_PUBLIC_ENABLE_SEATING_CHARTS === "true";

  const [selectedTierId, setSelectedTierId] = useState<Id<"ticketTiers"> | null>(null);
  const [selectedBundleId, setSelectedBundleId] = useState<Id<"ticketBundles"> | null>(null);
  const [purchaseType, setPurchaseType] = useState<"tier" | "bundle">("tier");
  const [quantity, setQuantity] = useState(1);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cashapp" | "paypal">("card");
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
  const seatingChart = ENABLE_SEATING
    ? useQuery(api.seating.queries.getPublicSeatingChart, { eventId })
    : null;
  const paymentConfig = useQuery(api.events.queries.getPaymentConfig, { eventId });
  const staffMemberInfo = useQuery(
    api.staff.queries.getStaffByReferralCode,
    referralCode ? { referralCode } : "skip"
  );

  const createOrder = useMutation(api.tickets.mutations.createOrder);
  const createBundleOrder = useMutation(api.tickets.mutations.createBundleOrder);
  const completeOrder = useMutation(api.tickets.mutations.completeOrder);
  const completeBundleOrder = useMutation(api.tickets.mutations.completeBundleOrder);
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

  // Only require eventDetails to show tickets, not authentication
  const isLoading = eventDetails === undefined;

  if (isLoading || !eventDetails) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <PublicFooter />
      </>
    );
  }

  const selectedTier = eventDetails.ticketTiers?.find((tier: any) => tier._id === selectedTierId);
  const selectedBundle = eventDetails.bundles?.find(
    (bundle: any) => bundle._id === selectedBundleId
  );

  // Determine payment processor based on event payment model
  const paymentModel = paymentConfig?.paymentModel || "PREPAY";
  const useStripePayment = paymentModel === "CREDIT_CARD";

  const subtotal =
    purchaseType === "bundle" && selectedBundle
      ? selectedBundle.price * quantity
      : purchaseType === "tier" && selectedTier
        ? (selectedTier as any).currentPrice * quantity
        : 0;
  const discountAmount = appliedDiscount?.discountAmountCents || 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // Fee calculation depends on payment model
  let platformFee = 0;
  let processingFee = 0;

  if (paymentModel === "PREPAY") {
    // Organizer already paid platform fee upfront - no additional fees for customer
    platformFee = 0;
    processingFee = 0;
  } else {
    // CREDIT_CARD - fees added to customer's purchase
    platformFee = Math.round((subtotalAfterDiscount * 3.7) / 100) + 179; // 3.7% + $1.79
    processingFee = Math.round(((subtotalAfterDiscount + platformFee) * 2.9) / 100) + 30; // 2.9% + $0.30
  }

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

  // Ballroom seat handlers
  const handleBallroomSeatSelect = (seat: BallroomSeat) => {
    setSelectedSeats((prev) => [...prev, seat as any]);
  };

  const handleBallroomSeatDeselect = (seatId: string) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  // Reset seats when tier or quantity changes
  useEffect(() => {
    setSelectedSeats([]);
  }, [selectedTierId, quantity]);

  const handleContinueToPayment = async () => {
    if ((!selectedTierId && !selectedBundleId) || !buyerEmail || !buyerName) {
      toast.error("Please fill in all fields");
      return;
    }

    // Check if seating chart exists and seats are required (only for individual tickets)
    const requiresSeats =
      purchaseType === "tier" && seatingChart && seatingChart.sections.length > 0;
    if (requiresSeats && selectedSeats.length !== quantity) {
      toast.error(`Please select ${quantity} seat${quantity > 1 ? "s" : ""} before proceeding`);
      return;
    }

    try {
      let newOrderId;

      if (purchaseType === "bundle" && selectedBundleId) {
        // Create bundle order
        newOrderId = await createBundleOrder({
          eventId,
          bundleId: selectedBundleId,
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
        });
      } else if (purchaseType === "tier" && selectedTierId) {
        // Create regular tier order
        newOrderId = await createOrder({
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
      } else {
        throw new Error("Invalid purchase type");
      }

      setOrderId(newOrderId);
      setShowPayment(true);
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast.error(error.message || "Failed to create order. Please try again.");
    }
  };

  const handlePaymentSuccess = async (result: Record<string, unknown>) => {
    if (!orderId) return;

    try {
      // Determine payment method based on which system was used
      const usedPaymentMethod = result.paymentIntentId ? "STRIPE" : "SQUARE";
      const paymentId = (result.paymentIntentId || result.paymentId) as string;

      // Complete the order in Convex
      if (purchaseType === "bundle") {
        await completeBundleOrder({
          orderId: orderId as Id<"orders">,
          paymentId: paymentId,
          paymentMethod: usedPaymentMethod,
        });
      } else {
        await completeOrder({
          orderId: orderId as Id<"orders">,
          paymentId: paymentId,
          paymentMethod: usedPaymentMethod,
        });
      }

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
      toast.error("Payment successful but order completion failed. Please contact support.");
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
    setShowPayment(false);
    setOrderId(null);
  };

  // Success screen
  if (isSuccess) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md text-center"
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
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                View My Tickets
              </Link>
              <Link
                href={`/events/${eventId}`}
                className="block w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Event
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                  {eventDetails.startDate &&
                    format(new Date(eventDetails.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {eventDetails.location &&
                    typeof eventDetails.location === "object" &&
                    eventDetails.location.venueName &&
                    `${eventDetails.location.venueName}, `}
                  {eventDetails.location &&
                    typeof eventDetails.location === "object" &&
                    eventDetails.location.city}
                  ,{" "}
                  {eventDetails.location &&
                    typeof eventDetails.location === "object" &&
                    eventDetails.location.state}
                </p>
              </motion.div>

              {/* Referral Code Banner */}
              {referralCode && staffMemberInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-accent border-2 border-primary/30 rounded-lg p-4 mb-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Referred by {staffMemberInfo.name}
                      </h4>
                      <p className="text-sm text-primary">
                        Your purchase will be credited to this staff member
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {!showPayment ? (
                <>
                  {/* Ticket/Bundle Selection */}
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Select Tickets or Bundle</h3>

                    {/* Purchase Type Tabs */}
                    {eventDetails.bundles && eventDetails.bundles.length > 0 && (
                      <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                        <button
                          onClick={() => {
                            setPurchaseType("tier");
                            setSelectedBundleId(null);
                          }}
                          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                            purchaseType === "tier"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <Ticket className="w-4 h-4 inline mr-2" />
                          Individual Tickets
                        </button>
                        <button
                          onClick={() => {
                            setPurchaseType("bundle");
                            setSelectedTierId(null);
                          }}
                          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                            purchaseType === "bundle"
                              ? "bg-white text-primary shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <Package className="w-4 h-4 inline mr-2" />
                          Bundles
                        </button>
                      </div>
                    )}

                    {/* Individual Tickets */}
                    {purchaseType === "tier" && (
                      <div className="space-y-3">
                        {eventDetails.ticketTiers
                          ?.filter((tier: any) => {
                            const now = Date.now();
                            const isAvailable =
                              (!tier.saleStart || now >= tier.saleStart) &&
                              (!tier.saleEnd || now <= tier.saleEnd) &&
                              tier.sold < tier.quantity;
                            return isAvailable;
                          })
                          .map((tier: any) => {
                            const now = Date.now();
                            const isSoldOut = tier.sold >= tier.quantity;
                            const remaining = tier.quantity - tier.sold;
                            const isLowStock = remaining <= 10 && remaining > 0;
                            const showEarlyBird = tier.isEarlyBird && tier.currentTierName;
                            const nextPriceIncrease =
                              tier.nextPriceChange &&
                              tier.nextPriceChange.price > tier.currentPrice;

                            return (
                              <button
                                key={tier._id}
                                onClick={() => !isSoldOut && setSelectedTierId(tier._id)}
                                disabled={isSoldOut}
                                className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                                  selectedTierId === tier._id
                                    ? showEarlyBird
                                      ? "border-amber-500 bg-amber-50"
                                      : "border-primary bg-accent"
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
                                        {showEarlyBird && (
                                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-500 text-white rounded-full font-medium">
                                            <Zap className="w-3 h-3" />
                                            {tier.currentTierName}
                                          </span>
                                        )}
                                        <TierAvailabilityBadge
                                          saleStart={tier.saleStart}
                                          saleEnd={tier.saleEnd}
                                          sold={tier.sold}
                                          quantity={tier.quantity}
                                        />
                                      </div>
                                      {tier.description && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          {tier.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right ml-4">
                                      <p
                                        className={`text-lg font-bold ${showEarlyBird ? "text-amber-600" : "text-gray-900"}`}
                                      >
                                        ${(tier.currentPrice / 100).toFixed(2)}
                                      </p>
                                      {showEarlyBird && tier.price !== tier.currentPrice && (
                                        <p className="text-xs text-gray-500 line-through">
                                          ${(tier.price / 100).toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {nextPriceIncrease && (
                                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                                      <p className="text-orange-700 font-medium">
                                        Price increases to $
                                        {(tier.nextPriceChange.price / 100).toFixed(2)} on{" "}
                                        {format(tier.nextPriceChange.date, "MMM d")}
                                      </p>
                                    </div>
                                  )}

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
                                      <span className="text-gray-500">{remaining} available</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}

                    {/* Bundles */}
                    {purchaseType === "bundle" && eventDetails.bundles && (
                      <div className="space-y-3">
                        {eventDetails.bundles.map((bundle: any) => (
                          <button
                            key={bundle._id}
                            onClick={() => setSelectedBundleId(bundle._id)}
                            className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                              selectedBundleId === bundle._id
                                ? "border-primary bg-accent"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-900">{bundle.name}</p>
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-500 text-white rounded-full font-bold">
                                      <TrendingDown className="w-3 h-3" />
                                      Save {bundle.percentageSavings}%
                                    </span>
                                  </div>
                                  {bundle.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {bundle.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {bundle.includedTiers.map((includedTier: any) => (
                                      <span
                                        key={includedTier.tierId}
                                        className="text-xs px-2 py-0.5 bg-accent text-primary rounded"
                                      >
                                        {includedTier.quantity}x {includedTier.tierName}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-lg font-bold text-primary">
                                    ${(bundle.price / 100).toFixed(2)}
                                  </p>
                                  {bundle.regularPrice && (
                                    <p className="text-xs text-gray-500 line-through">
                                      ${(bundle.regularPrice / 100).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-sm text-green-600 font-medium">
                                {bundle.available} bundle{bundle.available !== 1 ? "s" : ""}{" "}
                                available
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No Available Options Message */}
                    {purchaseType === "tier" &&
                      eventDetails.ticketTiers?.every((tier: any) => {
                        const now = Date.now();
                        return (
                          (tier.saleStart && now < tier.saleStart) ||
                          (tier.saleEnd && now > tier.saleEnd) ||
                          tier.sold >= tier.quantity
                        );
                      }) && (
                        <div className="text-center py-8">
                          <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium">
                            No tickets currently available
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Check back later or contact the organizer
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Quantity */}
                  {(selectedTierId || selectedBundleId) && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Quantity</h3>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                      />
                    </div>
                  )}

                  {/* Seat Selection - Only for individual tickets */}
                  {ENABLE_SEATING &&
                    selectedTierId &&
                    purchaseType === "tier" &&
                    seatingChart &&
                    seatingChart.sections.length > 0 && (
                      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Select Your Seats</h3>
                        {seatingChart.layoutType === "TABLE_BASED" ? (
                          <InteractiveSeatingChart
                            eventId={eventId}
                            onSeatSelect={handleBallroomSeatSelect}
                            onSeatDeselect={handleBallroomSeatDeselect}
                            selectedSeats={selectedSeats as any}
                            className="min-h-[600px]"
                          />
                        ) : (
                          <SeatSelection
                            eventId={eventId}
                            ticketTierId={selectedTierId}
                            requiredSeats={quantity}
                            onSeatsSelected={handleSeatsSelected}
                          />
                        )}
                      </div>
                    )}

                  {/* Buyer Info */}
                  {(selectedTierId || selectedBundleId) && (
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder:text-gray-400"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discount Code */}
                  {(selectedTierId || selectedBundleId) && (
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
                              <p className="font-semibold text-green-900 text-lg">
                                {appliedDiscount.code}
                              </p>
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
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder:text-gray-400 uppercase"
                            />
                            <button
                              onClick={handleApplyDiscount}
                              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium whitespace-nowrap"
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

                  {/* Payment Model Info */}
                  {paymentModel === "PREPAY" ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-green-900">No Additional Fees</p>
                          <p className="text-xs text-green-700 mt-1">
                            The organizer has prepaid platform fees. You only pay the ticket price!
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Payment Method Selector - Only show for Square/CashApp/PayPal (prepaid events) */}
                  {!useStripePayment && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <button
                        onClick={() => setPaymentMethod("card")}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                          paymentMethod === "card"
                            ? "border-primary bg-accent text-foreground font-semibold"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        Credit/Debit Card
                      </button>
                      <button
                        onClick={() => setPaymentMethod("cashapp")}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                          paymentMethod === "cashapp"
                            ? "border-green-600 bg-green-50 text-green-900 font-semibold"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        Cash App Pay
                      </button>
                      <button
                        onClick={() => setPaymentMethod("paypal")}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                          paymentMethod === "paypal"
                            ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        PayPal
                      </button>
                    </div>
                  )}

                  {/* Payment Form */}
                  {useStripePayment ? (
                    // Stripe payment for CREDIT_CARD events
                    <StripeCheckout
                      total={total / 100}
                      connectedAccountId={paymentConfig?.stripeConnectAccountId || ""}
                      platformFee={platformFee + processingFee} // Total platform fee
                      orderId={orderId || undefined}
                      orderNumber={`ORD-${Date.now()}`}
                      billingContact={{
                        givenName: buyerName.split(" ")[0],
                        familyName: buyerName.split(" ").slice(1).join(" "),
                        email: buyerEmail,
                      }}
                      onPaymentSuccess={(result) =>
                        handlePaymentSuccess({ paymentIntentId: result.paymentIntentId })
                      }
                      onPaymentError={handlePaymentError}
                      onBack={() => setShowPayment(false)}
                    />
                  ) : paymentMethod === "card" ? (
                    // Square payment for PREPAID events
                    <SquareCardPayment
                      applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
                      locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
                      total={total / 100}
                      environment={
                        process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT as "sandbox" | "production"
                      }
                      billingContact={{
                        givenName: buyerName.split(" ")[0],
                        familyName: buyerName.split(" ").slice(1).join(" "),
                        email: buyerEmail,
                      }}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      onBack={() => setShowPayment(false)}
                    />
                  ) : paymentMethod === "paypal" ? (
                    // PayPal payment for PREPAID events
                    <div>
                      <PayPalPayment
                        amount={total}
                        orderId={orderId || undefined}
                        description={`${eventDetails.name} - ${purchaseType === "bundle" ? selectedBundle?.name : selectedTier?.name} x ${quantity}`}
                        onSuccess={async (paypalOrderId) => {
                          await handlePaymentSuccess({ paymentId: paypalOrderId });
                        }}
                        onError={handlePaymentError}
                      />
                      <button
                        onClick={() => setShowPayment(false)}
                        className="w-full mt-4 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Back to Order Details
                      </button>
                    </div>
                  ) : (
                    // CashApp payment
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

                {selectedTier || selectedBundle ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      {purchaseType === "bundle" && selectedBundle ? (
                        <>
                          <div className="flex-1">
                            <span className="text-gray-900 font-medium">{selectedBundle.name}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedBundle.includedTiers.map((includedTier: any) => (
                                <span
                                  key={includedTier.tierId}
                                  className="text-xs px-1.5 py-0.5 bg-accent text-primary rounded"
                                >
                                  {includedTier.quantity}x {includedTier.tierName}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">Quantity: {quantity}</span>
                          </div>
                          <span className="font-medium ml-2">${(subtotal / 100).toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-600">
                            {selectedTier?.name} x {quantity}
                          </span>
                          <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
                        </>
                      )}
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
                            ? "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
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
      <PublicFooter />
    </>
  );
}
