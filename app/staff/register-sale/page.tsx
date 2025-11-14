"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, DollarSign, CheckCircle2, Ticket, CreditCard, Wallet } from "lucide-react";
import Link from "next/link";

export default function RegisterSalePage() {
  const [selectedStaffId, setSelectedStaffId] = useState<Id<"eventStaff"> | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<Id<"ticketTiers"> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CASH_APP">("CASH");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const staffPositions = useQuery(api.staff.queries.getStaffDashboard);
  const eventDetails = useQuery(
    api.public.queries.getPublicEventDetails,
    selectedEventId ? { eventId: selectedEventId } : "skip"
  );

  const createCashSale = useMutation(api.staff.mutations.createCashSale);

  if (!staffPositions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const selectedPosition = staffPositions.find((p) => p._id === selectedStaffId);
  const selectedTier = eventDetails?.ticketTiers?.find((t) => t._id === selectedTierId);

  const handleSubmit = async () => {
    if (!selectedStaffId || !selectedEventId || !selectedTierId || !buyerName) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const result = await createCashSale({
        staffId: selectedStaffId,
        eventId: selectedEventId,
        ticketTierId: selectedTierId,
        quantity,
        buyerName,
        buyerEmail: buyerEmail || undefined,
        paymentMethod,
      });

      setSuccessData(result);
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Cash sale error:", error);
      alert(error.message || "Failed to register sale");
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSuccessData(null);
    setBuyerName("");
    setBuyerEmail("");
    setQuantity(1);
    setSelectedTierId(null);
  };

  if (isSuccess && successData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sale Registered!</h2>
          <p className="text-gray-600 mb-6">
            {quantity} ticket{quantity > 1 ? "s" : ""} sold successfully
          </p>

          {/* ACTIVATION CODES - Most Important Section */}
          {successData.activationCodes && successData.activationCodes.length > 0 && (
            <div className="bg-accent border-2 border-primary rounded-lg p-6 mb-6">
              <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">
                      IMPORTANT: Customer Must Receive These Codes!
                    </p>
                    <p>
                      These are temporary activation codes. Customers need them to claim their
                      tickets online.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-3">Customer Activation Codes</h3>
              <p className="text-sm text-gray-700 mb-4">
                Write these codes on the receipt or text them to the customer:
              </p>

              <div className="space-y-3">
                {successData.activationCodes.map((code: string, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-4 border-2 border-border">
                    <div className="text-xs text-gray-600 mb-1">
                      Ticket {index + 1} of {successData.activationCodes.length}
                    </div>
                    <div className="text-5xl font-bold tracking-widest text-primary font-mono">
                      {code}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-white rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Instructions for Customer:
                </p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>
                    Visit{" "}
                    <span className="font-mono font-semibold text-primary">
                      events.stepperslife.com/activate
                    </span>
                  </li>
                  <li>Enter your 4-digit activation code</li>
                  <li>Provide your email address</li>
                  <li>Receive your official QR code ticket via email</li>
                </ol>
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <strong>Note:</strong> Each code can only be used once. The customer will receive
                  their permanent QR ticket after activation.
                </div>
              </div>
            </div>
          )}

          {/* Sale Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold">${(successData.totalPrice / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Commission:</span>
                <span className="font-bold text-green-600">
                  ${(successData.commission / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleReset}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Register Another Sale
            </button>
            <Link
              href="/staff/dashboard"
              className="block w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Register Cash Sale</h1>
        <p className="text-gray-600 mt-1">Record an in-person ticket sale</p>
      </div>

      <div>
        <div className="space-y-6">
          {/* Select Staff Position */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Select Your Position</h3>
            <div className="space-y-3">
              {staffPositions
                .filter((p) => p.event && p.role === "SELLER")
                .map((position) => (
                  <button
                    key={position._id}
                    onClick={() => {
                      setSelectedStaffId(position._id);
                      setSelectedEventId(position.event!._id);
                      setSelectedTierId(null);
                    }}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      selectedStaffId === position._id
                        ? "border-primary bg-accent"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{position.event!.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {position.ticketsSold} sold • ${(position.commissionEarned / 100).toFixed(2)}{" "}
                      earned
                    </p>
                  </button>
                ))}
            </div>
          </div>

          {/* Select Ticket Tier */}
          {selectedEventId && eventDetails && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Select Ticket Type</h3>
              <div className="space-y-3">
                {eventDetails.ticketTiers?.map((tier) => (
                  <button
                    key={tier._id}
                    onClick={() => setSelectedTierId(tier._id)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      selectedTierId === tier._id
                        ? "border-primary bg-accent"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{tier.name}</p>
                        {tier.description && (
                          <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
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
          )}

          {/* Quantity */}
          {selectedTierId && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quantity</h3>
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}

          {/* Buyer Info */}
          {selectedTierId && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Buyer Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          {selectedTierId && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === "CASH"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                  <p className="font-semibold text-gray-900">Cash</p>
                </button>
                <button
                  onClick={() => setPaymentMethod("CASH_APP")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === "CASH_APP"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Wallet className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                  <p className="font-semibold text-gray-900">Cash App</p>
                </button>
              </div>
            </div>
          )}

          {/* Summary and Submit */}
          {selectedTier && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Sale Summary
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {selectedTier.name} x {quantity}
                  </span>
                  <span className="font-medium">
                    ${((selectedTier.price * quantity) / 100).toFixed(2)}
                  </span>
                </div>
                {selectedPosition && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Your Commission</span>
                    <span className="font-medium text-green-600">
                      {selectedPosition.commissionType === "PERCENTAGE"
                        ? `${selectedPosition.commissionValue}%`
                        : `$${((selectedPosition.commissionValue || 0) / 100).toFixed(2)}/ticket`}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${((selectedTier.price * quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Box - What Happens Next */}
              <div className="bg-accent border border-border rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                  <div className="text-sm text-accent-foreground">
                    <p className="font-medium mb-1">What happens after you register this sale:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs">
                      <li>System generates activation codes for each ticket</li>
                      <li>You give these codes to the customer</li>
                      <li>Customer activates tickets online using the codes</li>
                      <li>Customer receives QR ticket via email</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!buyerName}
                className={`w-full px-6 py-4 rounded-lg font-semibold transition-all ${
                  buyerName
                    ? "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Register Sale
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
