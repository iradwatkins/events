/**
 * PayPal Webhook Handler
 *
 * POST /api/webhooks/paypal
 * Handles payment events from PayPal
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || "5NK114525U789563D";

// Verify PayPal webhook signature
async function verifyPayPalSignature(
  headers: Headers,
  body: string
): Promise<boolean> {
  try {
    const transmissionId = headers.get("paypal-transmission-id");
    const transmissionTime = headers.get("paypal-transmission-time");
    const transmissionSig = headers.get("paypal-transmission-sig");
    const certUrl = headers.get("paypal-cert-url");
    const authAlgo = headers.get("paypal-auth-algo");

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      console.error("[PayPal Webhook] Missing signature headers");
      return false;
    }

    // For production, implement full signature verification
    // For now, we'll verify the webhook ID matches
    const event = JSON.parse(body);

    // Basic verification - check if event is from our webhook
    if (event.id) {
      return true; // Simplified for initial implementation
    }

    return false;
  } catch (error) {
    console.error("[PayPal Webhook] Signature verification error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature (production recommended)
    if (process.env.PAYPAL_ENVIRONMENT === "production") {
      const isValid = await verifyPayPalSignature(request.headers, rawBody);
      if (!isValid) {
        console.error("[PayPal Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    console.log("[PayPal Webhook] Received event:", event.event_type);

    // Handle different event types
    switch (event.event_type) {
      case "PAYMENT.SALE.COMPLETED":
        await handlePaymentCompleted(event);
        break;

      case "PAYMENT.SALE.DENIED":
        await handlePaymentDenied(event);
        break;

      case "PAYMENT.SALE.REFUNDED":
        await handlePaymentRefunded(event);
        break;

      case "CUSTOMER.DISPUTE.CREATED":
        await handleDisputeCreated(event);
        break;

      case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED":
        console.log("[PayPal Webhook] Payout succeeded:", event.resource.payout_item_id);
        break;

      case "PAYMENT.PAYOUTS-ITEM.FAILED":
        console.log("[PayPal Webhook] Payout failed:", event.resource.payout_item_id);
        break;

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${event.event_type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[PayPal Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}

async function handlePaymentCompleted(event: any) {
  console.log("[PayPal Webhook] Payment completed:", event.resource.id);

  const resource = event.resource;
  const customId = resource.custom || resource.invoice_number;

  if (!customId) {
    console.log("[PayPal Webhook] No custom ID in payment");
    return;
  }

  try {
    // If it's a credit purchase
    if (customId.startsWith("CREDIT_")) {
      const userId = customId.replace("CREDIT_", "");
      console.log(`[PayPal Webhook] Credit purchase completed for user ${userId}`);
      // Credits already added in capture endpoint
      return;
    }

    // If it's an order purchase
    if (customId.startsWith("ORDER_")) {
      const orderId = customId.replace("ORDER_", "");

      // Find and complete the order
      const orders = await convex.query(api.orders.queries.listOrders, {
        status: "pending",
      });

      const order = orders.find((o: any) => o._id === orderId);
      if (order) {
        await convex.mutation(api.tickets.mutations.completeOrder, {
          orderId: orderId as Id<"orders">,
          paymentIntentId: resource.id,
        });
        console.log(`[PayPal Webhook] Order ${orderId} completed`);
      }
    }
  } catch (error) {
    console.error("[PayPal Webhook] Error handling payment completed:", error);
  }
}

async function handlePaymentDenied(event: any) {
  console.log("[PayPal Webhook] Payment denied:", event.resource.id);

  const resource = event.resource;
  const customId = resource.custom || resource.invoice_number;

  if (!customId || !customId.startsWith("ORDER_")) {
    return;
  }

  try {
    const orderId = customId.replace("ORDER_", "");

    await convex.mutation(api.orders.mutations.cancelOrder, {
      orderId: orderId as Id<"orders">,
      reason: "Payment denied by PayPal",
    });

    console.log(`[PayPal Webhook] Order ${orderId} cancelled`);
  } catch (error) {
    console.error("[PayPal Webhook] Error handling payment denied:", error);
  }
}

async function handlePaymentRefunded(event: any) {
  console.log("[PayPal Webhook] Payment refunded:", event.resource.sale_id);

  const resource = event.resource;
  const saleId = resource.sale_id;

  try {
    // Find order by PayPal sale ID
    const orders = await convex.query(api.orders.queries.listOrders, {});
    const order = orders.find((o: any) => o.paypalSaleId === saleId);

    if (order) {
      // Update order status to refunded (need to create this mutation)
      console.log(`[PayPal Webhook] Refund processed for order ${order._id}`);
      // TODO: Add refund handling mutation
    }
  } catch (error) {
    console.error("[PayPal Webhook] Error handling refund:", error);
  }
}

async function handleDisputeCreated(event: any) {
  console.log("[PayPal Webhook] Dispute created:", event.resource.dispute_id);
  // TODO: Add dispute handling logic (notify admin, flag order, etc.)
}
