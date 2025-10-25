"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

interface SquarePaymentFormProps {
  amount: number; // in cents
  onPaymentSuccess: (paymentId: string, receiptUrl?: string) => void;
  onPaymentError: (error: string) => void;
  orderId: string;
  eventId: string;
  eventName: string;
  buyerEmail: string;
}

export function SquarePaymentForm({
  amount,
  onPaymentSuccess,
  onPaymentError,
  orderId,
  eventId,
  eventName,
  buyerEmail,
}: SquarePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
    const initializeSquare = async () => {
      if (!(window as any).Square) {
        const script = document.createElement("script");
        script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
        script.async = true;
        script.onload = () => initializePaymentForm();
        document.body.appendChild(script);
      } else {
        await initializePaymentForm();
      }
    };

    const initializePaymentForm = async () => {
      try {
        const payments = (window as any).Square.payments(
          process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
        );

        const cardInstance = await payments.card();
        await cardInstance.attach("#card-container");
        setCard(cardInstance);
        setIsLoading(false);
      } catch (error) {
        console.error("Square initialization error:", error);
        onPaymentError("Failed to initialize payment form");
        setIsLoading(false);
      }
    };

    initializeSquare();

    return () => {
      if (card) {
        card.destroy();
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!card) {
      onPaymentError("Payment form not initialized");
      return;
    }

    setIsProcessing(true);

    try {
      // Tokenize the card
      const result = await card.tokenize();

      if (result.status === "OK") {
        // Send token to backend for processing
        const response = await fetch("/api/square/process-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceId: result.token,
            amount,
            orderId,
            eventId,
            eventName,
            buyerEmail,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          onPaymentSuccess(data.paymentId, data.receiptUrl);
        } else {
          onPaymentError(data.error || "Payment processing failed");
        }
      } else {
        onPaymentError(
          result.errors?.[0]?.message || "Card tokenization failed"
        );
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      onPaymentError(error.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card Input Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}
        <div
          id="card-container"
          className="min-h-[100px] border border-gray-300 rounded-lg p-4 bg-white"
        ></div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isLoading || isProcessing}
        className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all ${
          isLoading || isProcessing
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ${(amount / 100).toFixed(2)}
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Secured by Square</span>
      </div>
    </div>
  );
}

// Extend window type for Square - handled via type assertion where needed
// Square SDK is loaded dynamically via script tag
