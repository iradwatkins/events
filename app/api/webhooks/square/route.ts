/**
 * Square Webhook Handler
 *
 * POST /api/webhooks/square
 * Handles payment events from Square
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Square webhook signature verification
function verifySquareSignature(
  body: string,
  signatureHeader: string | null,
  signatureKey: string
): boolean {
  if (!signatureHeader) return false;

  try {
    const hmac = crypto.createHmac("sha256", signatureKey);
    hmac.update(body);
    const hash = hmac.digest("base64");

    return hash === signatureHeader;
  } catch (error) {
    console.error("[Square Webhook] Signature verification error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-square-hmacsha256-signature");

    // Verify webhook signature (production only)
    if (process.env.SQUARE_ENVIRONMENT === "production") {
      const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
      if (!signatureKey) {
        console.error("[Square Webhook] Missing SQUARE_WEBHOOK_SIGNATURE_KEY");
        return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
      }

      const isValid = verifySquareSignature(rawBody, signature, signatureKey);
      if (!isValid) {
        console.error("[Square Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    console.log("[Square Webhook] Received event:", event.type);

    // Handle different event types
    switch (event.type) {
      case "payment.created":
        await handlePaymentCreated(event.data);
        break;

      case "payment.updated":
        await handlePaymentUpdated(event.data);
        break;

      case "refund.created":
        await handleRefundCreated(event.data);
        break;

      case "refund.updated":
        await handleRefundUpdated(event.data);
        break;

      default:
        console.log(`[Square Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Square Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}

async function handlePaymentCreated(data: any) {
  console.log("[Square Webhook] Payment created:", data.id);

  const payment = data.object?.payment;
  if (!payment) {
    console.error("[Square Webhook] No payment object in data");
    return;
  }

  // Extract order reference from payment metadata
  const orderId = payment.note || payment.reference_id;
  if (!orderId) {
    console.log("[Square Webhook] No order ID in payment");
    return;
  }

  try {
    // Find order by external payment ID
    const orders = await convex.query(api.orders.queries.listOrders, {
      status: "pending",
    });

    const order = orders.find((o: any) => o.squarePaymentId === payment.id);
    if (!order) {
      console.log(`[Square Webhook] Order not found for payment ${payment.id}`);
      return;
    }

    // Payment is created - typically moves to APPROVED quickly
    console.log(`[Square Webhook] Payment created for order ${order._id}`);
  } catch (error) {
    console.error("[Square Webhook] Error handling payment created:", error);
  }
}

async function handlePaymentUpdated(data: any) {
  console.log("[Square Webhook] Payment updated:", data.id);

  const payment = data.object?.payment;
  if (!payment) {
    console.error("[Square Webhook] No payment object in data");
    return;
  }

  try {
    // Find order by Square payment ID
    const orders = await convex.query(api.orders.queries.listOrders, {
      status: "pending",
    });

    const order = orders.find((o: any) => o.squarePaymentId === payment.id);
    if (!order) {
      console.log(`[Square Webhook] Order not found for payment ${payment.id}`);
      return;
    }

    // Check payment status
    if (payment.status === "COMPLETED") {
      console.log(`[Square Webhook] Payment completed for order ${order._id}`);

      // Complete the order
      await convex.mutation(api.tickets.mutations.completeOrder, {
        orderId: order._id as Id<"orders">,
        paymentIntentId: payment.id,
      });

      console.log(`[Square Webhook] Order ${order._id} completed successfully`);
    } else if (payment.status === "FAILED" || payment.status === "CANCELED") {
      console.log(`[Square Webhook] Payment ${payment.status} for order ${order._id}`);

      // Cancel the order
      await convex.mutation(api.orders.mutations.cancelOrder, {
        orderId: order._id as Id<"orders">,
        reason: `Payment ${payment.status.toLowerCase()}`,
      });
    }
  } catch (error) {
    console.error("[Square Webhook] Error handling payment updated:", error);
  }
}

async function handleRefundCreated(data: any) {
  console.log("[Square Webhook] Refund created:", data.id);

  const refund = data.object?.refund;
  if (!refund) {
    console.error("[Square Webhook] No refund object in data");
    return;
  }

  try {
    // Find order by payment ID
    const orders = await convex.query(api.orders.queries.listOrders, {});
    const order = orders.find((o: any) => o.squarePaymentId === refund.payment_id);

    if (!order) {
      console.log(`[Square Webhook] Order not found for refund ${refund.id}`);
      return;
    }

    console.log(`[Square Webhook] Refund created for order ${order._id}`);

    // Update order status
    await convex.mutation(api.orders.mutations.updateOrderStatus, {
      orderId: order._id as Id<"orders">,
      status: "refunded",
    });

    console.log(`[Square Webhook] Order ${order._id} marked as refunded`);
  } catch (error) {
    console.error("[Square Webhook] Error handling refund created:", error);
  }
}

async function handleRefundUpdated(data: any) {
  console.log("[Square Webhook] Refund updated:", data.id);
  // Similar to refund created, handle status changes
}
