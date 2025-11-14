/**
 * PayPal Credit Purchase API
 *
 * POST /api/credits/purchase-with-paypal
 * Process credit purchases using PayPal
 */

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convexClient as convex } from "@/lib/auth/convex-client";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY!;
const PAYPAL_API_BASE =
  process.env.PAYPAL_ENVIRONMENT === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

// Get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, credits, orderID } = body;

    if (!userId || !credits || !orderID) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Capture the PayPal order
    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error("[PayPal Credit Purchase] Capture failed:", captureData);
      return NextResponse.json(
        { error: "Failed to capture PayPal payment", details: captureData },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (captureData.status === "COMPLETED") {
      // Calculate amount paid
      const PRICE_PER_TICKET_CENTS = 30;
      const amountPaid = credits * PRICE_PER_TICKET_CENTS;

      // Add credits to user account via Convex
      await convex.mutation(api.credits.mutations.purchaseCredits, {
        userId: userId as Id<"users">,
        credits,
        amountPaid,
        paypalOrderId: orderID,
      });

      return NextResponse.json(
        {
          success: true,
          orderID: captureData.id,
          credits,
          message: `Successfully purchased ${credits} ticket credits`,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          error: "Payment not completed",
          status: captureData.status,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[PayPal Credit Purchase] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
