/**
 * PayPal Capture Order API
 *
 * POST /api/paypal/capture-order
 * Captures payment after PayPal approval
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
    const { orderID, convexOrderId } = body;

    if (!orderID) {
      return NextResponse.json({ error: "PayPal order ID is required" }, { status: 400 });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Capture the order
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
      console.error("[PayPal] Capture failed:", captureData);
      return NextResponse.json(
        { error: "Failed to capture PayPal payment", details: captureData },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (captureData.status === "COMPLETED") {
      // Complete the order in Convex if provided
      if (convexOrderId) {
        await convex.mutation(api.tickets.mutations.completeOrder, {
          orderId: convexOrderId as Id<"orders">,
          paymentIntentId: orderID,
        });
      }

      return NextResponse.json(
        {
          success: true,
          orderID: captureData.id,
          status: captureData.status,
          payer: captureData.payer,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          status: captureData.status,
          message: "Payment not completed",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[PayPal] Error capturing order:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
