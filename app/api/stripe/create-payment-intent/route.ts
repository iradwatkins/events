import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Validate environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error("[Stripe] CRITICAL: STRIPE_SECRET_KEY is not set!");
}

// Initialize Stripe client
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

/**
 * Create a Payment Intent with Stripe Connect split payments
 * POST /api/stripe/create-payment-intent
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      amount, // Total amount in cents
      currency = "usd",
      connectedAccountId, // Organizer's Stripe Connect account ID
      platformFee, // Platform fee in cents
      orderId,
      orderNumber,
      metadata = {},
    } = body;

    if (!amount || !connectedAccountId) {
      return NextResponse.json({ error: "Missing required payment details" }, { status: 400 });
    }


    // Create Payment Intent with Destination Charges
    // Money goes to platform first, then automatically transfers to connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      application_fee_amount: platformFee, // Platform's cut
      transfer_data: {
        destination: connectedAccountId, // Organizer's account
      },
      metadata: {
        orderId: orderId || "",
        orderNumber: orderNumber || "",
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true, // Automatically supports cards, Apple Pay, Google Pay
      },
    });


    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("[Stripe Payment Intent] Creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

/**
 * Confirm payment status
 * GET /api/stripe/create-payment-intent?paymentIntentId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const paymentIntentId = searchParams.get("paymentIntentId");

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment Intent ID is required" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    });
  } catch (error: any) {
    console.error("[Stripe Payment Intent] Retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve payment intent" },
      { status: 500 }
    );
  }
}
