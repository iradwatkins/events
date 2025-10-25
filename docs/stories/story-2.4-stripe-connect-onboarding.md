# Story 2.4: Stripe Connect Onboarding

**Epic:** Epic 2 - Event Creation & Management
**Priority:** P0
**Effort:** 5 points
**Sprint:** Week 3-4
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** connect my Stripe account
**So that** I can receive payments from ticket sales

---

## Acceptance Criteria

- [ ] Organizers can initiate Stripe Connect onboarding
- [ ] Stripe Express account created
- [ ] Onboarding URL generated and user redirected
- [ ] Return URL handles success/failure
- [ ] Account ID saved to user record
- [ ] Event updated with Stripe account ID
- [ ] Can publish ticketed event only after onboarding complete

---

## Tasks

### 1. Create Stripe Connect Action

**Files:**
- `convex/payments/stripe.ts`

**Code:**
```typescript
"use node";

import Stripe from "stripe";
import { action } from "../_generated/server";
import { v } from "convex/values";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createConnectAccount = action({
  args: {
    email: v.string(),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: "express",
      email: args.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizer/onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizer/onboarding/complete?eventId=${args.eventId}`,
      type: "account_onboarding",
    });

    // Save account ID to event
    await ctx.runMutation(internal.events.mutations.updateStripeAccount, {
      eventId: args.eventId,
      stripeConnectAccountId: account.id,
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  },
});
```

---

### 2. Create Onboarding Page

**Files:**
- `app/(dashboard)/organizer/onboarding/page.tsx`

**Flow:**
1. Click "Connect Stripe"
2. Call `createConnectAccount` action
3. Redirect to Stripe onboarding URL
4. Return to `/organizer/onboarding/complete`

---

### 3. Create Onboarding Complete Page

**Files:**
- `app/(dashboard)/organizer/onboarding/complete/page.tsx`

**Tasks:**
- Verify account setup complete via Stripe API
- Update event: `stripeAccountSetupComplete = true`
- Redirect to event detail page
- Show success message

---

### 4. Update Publish Event Validation

**Files:**
- `convex/events/mutations.ts`

**Logic:**
```typescript
export const publishEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    
    if (event.eventType === "TICKETED_EVENT" && !event.stripeAccountSetupComplete) {
      throw new Error("Complete Stripe Connect onboarding before publishing");
    }

    await ctx.db.patch(args.eventId, { status: "PUBLISHED" });
  },
});
```

---

## Testing

- [ ] Can create Stripe Connect account
- [ ] Onboarding URL redirects to Stripe
- [ ] Return URL processes success
- [ ] Account ID saved correctly
- [ ] Publishing requires onboarding for ticketed events

---

## Dev Agent Record

[To be completed by dev agent]

---

**Created:** October 25, 2025
**Owner:** John (PM Agent)
