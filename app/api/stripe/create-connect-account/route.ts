import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Validate environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_ENVIRONMENT = process.env.STRIPE_ENVIRONMENT || "test";

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
 * Create a Stripe Connect Express Account for an organizer
 * POST /api/stripe/create-connect-account
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
    const { email, refreshUrl, returnUrl } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create Express Connect account
    const account = await stripe.accounts.create({
      type: "express",
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      settings: {
        payouts: {
          schedule: {
            interval: "manual", // Organizer controls when they get paid
          },
        },
      },
    });


    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl || `${process.env.NEXT_PUBLIC_APP_URL}/organizer/settings`,
      return_url:
        returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/organizer/settings?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountId: account.id,
      accountLinkUrl: accountLink.url,
    });
  } catch (error: any) {
    console.error("[Stripe Connect] Account creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Stripe Connect account" },
      { status: 500 }
    );
  }
}

/**
 * Get account link for existing account (refresh onboarding)
 * PUT /api/stripe/create-connect-account
 */
export async function PUT(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { accountId, refreshUrl, returnUrl } = body;

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // Create new account link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || `${process.env.NEXT_PUBLIC_APP_URL}/organizer/settings`,
      return_url:
        returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/organizer/settings?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountLinkUrl: accountLink.url,
    });
  } catch (error: any) {
    console.error("[Stripe Connect] Account link creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account link" },
      { status: 500 }
    );
  }
}
