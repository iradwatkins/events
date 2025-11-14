/**
 * PayPal Webhook Handler
 *
 * POST /api/webhooks/paypal
 * Handles payment events from PayPal
 */

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import crypto from "crypto";
import { convexClient as convex } from "@/lib/auth/convex-client";

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || "5NK114525U789563D";

// PRODUCTION: Verify PayPal webhook signature with cryptographic verification
async function verifyPayPalSignature(headers: Headers, body: string): Promise<boolean> {
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

    // SECURITY: Validate cert URL is from PayPal
    const allowedCertDomains = ["paypal.com", "paypalobjects.com"];

    let certDomain;
    try {
      const certUrlObj = new URL(certUrl);
      certDomain = certUrlObj.hostname;
    } catch (e) {
      console.error("[PayPal Webhook] Invalid cert URL");
      return false;
    }

    const isValidDomain = allowedCertDomains.some((domain) => certDomain.endsWith(domain));

    if (!isValidDomain) {
      console.error("[PayPal Webhook] Cert URL from untrusted domain:", certDomain);
      return false;
    }

    // Fetch PayPal's public certificate
    const certResponse = await fetch(certUrl);
    if (!certResponse.ok) {
      console.error("[PayPal Webhook] Failed to fetch certificate");
      return false;
    }

    const cert = await certResponse.text();

    // Compute CRC32 of the body (PayPal's requirement)
    const crc32 = computeCrc32(body);

    // Build the expected message for signature verification
    // Format: transmission_id|transmission_time|webhook_id|crc32(body)
    const message = `${transmissionId}|${transmissionTime}|${PAYPAL_WEBHOOK_ID}|${crc32}`;

    // Verify signature using PayPal's certificate
    const verifier = crypto.createVerify(authAlgo || "sha256WithRSAEncryption");
    verifier.update(message);

    const isValid = verifier.verify(cert, transmissionSig, "base64");

    if (!isValid) {
      console.error("[PayPal Webhook] Signature verification failed");
      return false;
    }

    return true;
  } catch (error) {
    console.error("[PayPal Webhook] Signature verification error:", error);
    return false;
  }
}

// CRC32 implementation for PayPal webhook verification
function computeCrc32(str: string): number {
  const crcTable = makeCrcTable();
  let crc = 0 ^ -1;

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
  }

  return (crc ^ -1) >>> 0;
}

function makeCrcTable(): number[] {
  let c;
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // PRODUCTION: Always verify webhook signature for security
    const isValid = await verifyPayPalSignature(request.headers, rawBody);
    if (!isValid) {
      console.error("[PayPal Webhook] Invalid signature - potential attack attempt");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

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
        break;

      case "PAYMENT.PAYOUTS-ITEM.FAILED":
        break;

      default:
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

  const resource = event.resource;
  const customId = resource.custom || resource.invoice_number;

  if (!customId) {
    return;
  }

  try {
    // If it's a credit purchase
    if (customId.startsWith("CREDIT_")) {
      const userId = customId.replace("CREDIT_", "");
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
      }
    }
  } catch (error) {
    console.error("[PayPal Webhook] Error handling payment completed:", error);
  }
}

async function handlePaymentDenied(event: any) {

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

  } catch (error) {
    console.error("[PayPal Webhook] Error handling payment denied:", error);
  }
}

async function handlePaymentRefunded(event: any) {

  const resource = event.resource;
  const saleId = resource.sale_id;

  try {
    // Find order by PayPal sale ID
    const orders = await convex.query(api.orders.queries.listOrders, {});
    const order = orders.find((o: any) => o.paypalSaleId === saleId);

    if (order) {
      // Update order status to refunded (need to create this mutation)
      // TODO: Add refund handling mutation
    }
  } catch (error) {
    console.error("[PayPal Webhook] Error handling refund:", error);
  }
}

async function handleDisputeCreated(event: any) {
  // TODO: Add dispute handling logic (notify admin, flag order, etc.)
}
