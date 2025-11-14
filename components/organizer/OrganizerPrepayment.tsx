"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
import { SquareCardPayment } from "@/components/checkout/SquareCardPayment";
import { CashAppQRPayment } from "@/components/checkout/CashAppPayment";

interface OrganizerPrepaymentProps {
  eventId: string;
  eventName: string;
  estimatedTickets: number;
  pricePerTicket: number; // in dollars (e.g., 0.30)
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export function OrganizerPrepayment({
  eventId,
  eventName,
  estimatedTickets,
  pricePerTicket,
  onPaymentSuccess,
  onCancel,
}: OrganizerPrepaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<"square" | "cashapp" | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const totalAmount = estimatedTickets * pricePerTicket;
  const totalAmountCents = Math.round(totalAmount * 100);

  const handlePaymentMethodSelect = (method: "square" | "cashapp") => {
    setSelectedMethod(method);
    setShowPayment(true);
  };

  const handleSquarePaymentSuccess = async (result: Record<string, unknown>) => {
    // TODO: Call Convex mutation to update payment config
    onPaymentSuccess();
  };

  const handleSquarePaymentError = (error: string) => {
    console.error("[Prepayment] Payment error:", error);
    alert(`Payment failed: ${error}`);
  };

  const handleCashAppPaymentSuccess = async (result: Record<string, unknown>) => {
    // TODO: Call Convex mutation to update payment config
    onPaymentSuccess();
  };

  const handleCashAppPaymentError = (error: string) => {
    console.error("[Prepayment] CashApp payment error:", error);
    alert(`Payment failed: ${error}`);
  };

  if (showPayment && selectedMethod === "square") {
    return (
      <div className="max-w-2xl mx-auto">
        <SquareCardPayment
          applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || ""}
          locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ""}
          total={totalAmount}
          environment={
            (process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT as "sandbox" | "production") || "sandbox"
          }
          onPaymentSuccess={handleSquarePaymentSuccess}
          onPaymentError={handleSquarePaymentError}
          onBack={() => {
            setShowPayment(false);
            setSelectedMethod(null);
          }}
        />
      </div>
    );
  }

  if (showPayment && selectedMethod === "cashapp") {
    return (
      <div className="max-w-2xl mx-auto">
        <CashAppQRPayment
          total={totalAmount}
          onPaymentSuccess={handleCashAppPaymentSuccess}
          onPaymentError={handleCashAppPaymentError}
          onBack={() => {
            setShowPayment(false);
            setSelectedMethod(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Platform Fee Payment</h2>
        <p className="text-gray-600">
          Pay upfront for "{eventName}" and collect 100% of ticket sales
        </p>
      </div>

      {/* Payment Summary */}
      <Card className="bg-accent border-2 border-border">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Platform Fee</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">${totalAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-600">
              {estimatedTickets} tickets × ${pricePerTicket.toFixed(2)} each
            </p>
          </div>

          <div className="mt-6 bg-white rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900 mb-1">What happens after payment:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>✓ Your event is activated immediately</li>
                  <li>✓ Customers can purchase tickets</li>
                  <li>✓ You receive 100% of ticket sales revenue</li>
                  <li>✓ No additional fees per transaction</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Square Payment */}
        <button
          onClick={() => handlePaymentMethodSelect("square")}
          className="bg-white rounded-lg border-2 border-gray-200 p-6 text-left hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Square</h3>
              <p className="text-sm text-primary">Credit/Debit Card</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Instant activation
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Secure payment processing
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              All major cards accepted
            </div>
          </div>

          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-foreground">Recommended</p>
          </div>
        </button>

        {/* CashApp Payment */}
        <button
          onClick={() => handlePaymentMethodSelect("cashapp")}
          className="bg-white rounded-lg border-2 border-gray-200 p-6 text-left hover:border-green-600 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">CashApp</h3>
              <p className="text-sm text-green-600">Mobile Payment</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Pay from your phone
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              No card needed
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Manual verification (24hrs)
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-green-900">Alternative Option</p>
          </div>
        </button>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={onCancel} className="text-gray-600 hover:text-gray-900">
          Cancel and Go Back
        </Button>
      </div>
    </div>
  );
}
