"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PayPalPaymentProps {
  amount: number; // in cents
  orderId?: string;
  currency?: string;
  description?: string;
  onSuccess: (paypalOrderId: string) => void;
  onError: (error: string) => void;
}

export function PayPalPayment({
  amount,
  orderId,
  currency = "USD",
  description,
  onSuccess,
  onError,
}: PayPalPaymentProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load PayPal SDK
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=${currency}`;
    script.async = true;
    script.onload = initializePayPal;
    script.onerror = () => {
      setError("Failed to load PayPal SDK");
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [amount, orderId, currency, description]);

  async function initializePayPal() {
    const PayPal = (window as any).paypal;
    if (!PayPal) {
      setError("PayPal SDK not loaded");
      setIsLoading(false);
      return;
    }

    try {
      await PayPal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
        },
        createOrder: async () => {
          try {
            // Create PayPal order via our API
            const response = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                amount,
                currency,
                orderId,
                description: description || "Event Ticket Purchase",
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Failed to create PayPal order");
            }

            return data.id;
          } catch (err: any) {
            onError(err.message || "Failed to create PayPal order");
            throw err;
          }
        },
        onApprove: async (data: any) => {
          try {
            // Capture the payment
            const response = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderID: data.orderID,
                convexOrderId: orderId,
              }),
            });

            const captureData = await response.json();

            if (!response.ok || !captureData.success) {
              throw new Error(captureData.error || "Payment capture failed");
            }

            onSuccess(data.orderID);
          } catch (err: any) {
            onError(err.message || "Payment capture failed");
          }
        },
        onError: (err: any) => {
          console.error("PayPal error:", err);
          onError(err.message || "PayPal payment failed");
        },
        onCancel: () => {
          onError("Payment cancelled");
        },
      }).render(paypalRef.current);

      setIsLoading(false);
    } catch (err: any) {
      console.error("Failed to initialize PayPal:", err);
      setError("Failed to initialize PayPal buttons");
      setIsLoading(false);
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading PayPal...</span>
        </div>
      )}
      <div ref={paypalRef} className={isLoading ? "hidden" : ""}></div>
    </div>
  );
}
