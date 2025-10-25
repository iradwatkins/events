# Epic 3: Ticket Purchase & Payment Processing

**Priority:** P0 (Critical)
**Sprint:** Week 5-6
**Total Points:** 21
**Dependencies:** Epic 2 (Events must be publishable)

---

## Epic Overview

Enable public users to browse published events, view ticket availability in real-time, purchase tickets via Stripe Connect, receive QR-coded tickets via email, and manage their ticket orders.

### Goals
- Seamless ticket purchasing experience (<2 min checkout)
- Real-time inventory management (prevent overselling)
- Secure payment processing via Stripe Connect
- Immediate ticket delivery with QR codes
- Clear order confirmation and receipts

### Success Criteria
- [ ] Public can view all published events
- [ ] Real-time ticket availability updates
- [ ] Stripe payment processing working
- [ ] QR codes generated and emailed
- [ ] Payment success rate >95%
- [ ] Checkout completion rate >80%

---

## Summary of Stories

1. **Story 3.1:** Public Event Detail Page
2. **Story 3.2:** Real-Time Ticket Inventory Display
3. **Story 3.3:** Ticket Purchase Checkout Flow
4. **Story 3.4:** Stripe Connect Payment Processing
5. **Story 3.5:** QR Code Generation
6. **Story 3.6:** Ticket Email Delivery

---

## Story 3.1: Event Detail Page (Public)

**Priority:** P0 | **Effort:** 4 points | **Sprint:** Week 5

### Acceptance Criteria
- [ ] Public users can view published event details at `/events/[eventId]`
- [ ] Event page shows: name, description, date, time, location, images, categories
- [ ] For ticketed events: ticket availability, price, "Buy Tickets" button
- [ ] For free events: door price displayed, location details prominent
- [ ] Mobile-responsive design
- [ ] SEO optimized with meta tags

### Technical Implementation

**Convex Query:** `convex/events/queries.ts`
```typescript
export const getPublicEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.status !== "PUBLISHED") {
      return null;
    }

    // Get tickets if applicable
    if (event.eventType === "TICKETED_EVENT") {
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .filter((q) => q.eq(q.field("active"), true))
        .collect();

      return { ...event, tickets };
    }

    return event;
  },
});
```

**Component:** `app/(public)/events/[eventId]/page.tsx`
```typescript
export default async function EventPage({ params }: { params: { eventId: string } }) {
  return <EventDetailView eventId={params.eventId} />;
}
```

---

## Story 3.2: Real-Time Ticket Inventory

**Priority:** P0 | **Effort:** 3 points | **Sprint:** Week 5

### Acceptance Criteria
- [ ] Ticket availability updates in real-time across all clients
- [ ] Shows "X tickets remaining"
- [ ] Sold out badge when inventory depleted
- [ ] Warning when <10% remaining
- [ ] "Y people buying now" indicator for reserved tickets
- [ ] Cannot add to cart if sold out

### Technical Implementation

**Convex Query:** `convex/tickets/queries.ts`
```typescript
export const getTicketAvailability = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return tickets.map((ticket) => ({
      ...ticket,
      available: ticket.quantityTotal - ticket.quantitySold - ticket.quantityReserved,
      percentRemaining:
        ((ticket.quantityTotal - ticket.quantitySold - ticket.quantityReserved) /
         ticket.quantityTotal) * 100,
    }));
  },
});
```

**Component:** `components/tickets/TicketAvailability.tsx`
```typescript
export function TicketAvailability({ eventId }: { eventId: string }) {
  const availability = useQuery(api.tickets.queries.getTicketAvailability, {
    eventId: eventId as any,
  });

  // Real-time subscription automatically updates
  return (
    <div className="space-y-4">
      {availability?.map((ticket) => (
        <TicketCard key={ticket._id} ticket={ticket} />
      ))}
    </div>
  );
}
```

---

## Story 3.3: Ticket Purchase (Checkout)

**Priority:** P0 | **Effort:** 5 points | **Sprint:** Week 6

### Acceptance Criteria
- [ ] User can select ticket quantity (up to max per order)
- [ ] Checkout page shows: event info, tickets, subtotal, fees, total
- [ ] User enters: name, email, phone (if logged in, pre-filled)
- [ ] Guest checkout available (no account required)
- [ ] Cart reserves tickets for 10 minutes
- [ ] Inventory released if timer expires
- [ ] Loading states during processing

### Technical Implementation

**Convex Mutation:** `convex/orders/mutations.ts`
```typescript
export const createOrder = mutation({
  args: {
    eventId: v.id("events"),
    ticketId: v.id("tickets"),
    quantity: v.number(),
    buyerName: v.string(),
    buyerEmail: v.string(),
    buyerPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check ticket availability
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const available = ticket.quantityTotal - ticket.quantitySold - ticket.quantityReserved;
    if (available < args.quantity) {
      throw new Error("Not enough tickets available");
    }

    // Reserve inventory
    await ctx.db.patch(args.ticketId, {
      quantityReserved: ticket.quantityReserved + args.quantity,
    });

    // Create order
    const orderId = await ctx.db.insert("orders", {
      userId: ctx.auth.getUserIdentity()?.subject as any || null,
      eventId: args.eventId,
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: args.quantity,
      totalAmount: ticket.price * args.quantity,
      paymentStatus: "PENDING",
      buyerName: args.buyerName,
      buyerEmail: args.buyerEmail,
      buyerPhone: args.buyerPhone,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Set expiration (10 minutes)
    setTimeout(async () => {
      const order = await ctx.db.get(orderId);
      if (order?.paymentStatus === "PENDING") {
        // Release reservation
        await ctx.db.patch(args.ticketId, {
          quantityReserved: ticket.quantityReserved - args.quantity,
        });
      }
    }, 10 * 60 * 1000);

    return { orderId, orderNumber };
  },
});
```

---

## Story 3.4: Stripe Connect Payment Processing

**Priority:** P0 | **Effort:** 5 points | **Sprint:** Week 6

### Acceptance Criteria
- [ ] Payment intent created with correct amount
- [ ] Platform fee deducted (2.5% configurable)
- [ ] Remaining funds transferred to organizer's Stripe account
- [ ] Stripe Elements form loads
- [ ] Payment confirmation returned
- [ ] Failed payments handled gracefully
- [ ] Webhook confirms completion

### Technical Implementation

**Convex Action:** `convex/payments/stripe.ts`
```typescript
"use node";

import Stripe from "stripe";
import { v } from "convex/values";
import { action } from "../_generated/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createPaymentIntent = action({
  args: {
    orderId: v.id("orders"),
    amount: v.number(), // in cents
    connectedAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const platformFee = Math.round(args.amount * 0.025); // 2.5%

    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
      application_fee_amount: platformFee,
      transfer_data: {
        destination: args.connectedAccountId,
      },
      metadata: {
        orderId: args.orderId,
      },
    });

    // Save payment intent ID to order
    await ctx.runMutation(internal.orders.mutations.updatePaymentIntent, {
      orderId: args.orderId,
      paymentIntentId: paymentIntent.id,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },
});
```

**Webhook Handler:** `app/api/webhooks/stripe/route.ts`
```typescript
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      // Confirm order, generate tickets, send email
      await convex.mutation(api.orders.mutations.confirmOrder, {
        orderId: orderId as any,
      });
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Story 3.5: QR Code Generation

**Priority:** P0 | **Effort:** 3 points | **Sprint:** Week 6

### Acceptance Criteria
- [ ] Unique QR code generated for each ticket
- [ ] QR contains: ticket ID, timestamp, HMAC signature
- [ ] QR code format: PNG, 400x400px
- [ ] HMAC prevents tampering
- [ ] QR codes stored in Convex file storage
- [ ] Downloadable as image

### Technical Implementation

**Convex Action:** `convex/tickets/qrcode.ts`
```typescript
"use node";

import QRCode from "qrcode";
import crypto from "crypto";
import { v } from "convex/values";
import { action } from "../_generated/server";

export const generateTicketQR = action({
  args: {
    ticketInstanceId: v.id("ticketInstances"),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const data = `${args.ticketInstanceId}:${timestamp}`;

    // Generate HMAC signature
    const hmac = crypto
      .createHmac("sha256", process.env.QR_CODE_SECRET_KEY!)
      .update(data)
      .digest("hex");

    const qrData = {
      ticketId: args.ticketInstanceId,
      timestamp,
      signature: hmac,
    };

    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "H",
      width: 400,
    });

    // Save to ticket instance
    await ctx.runMutation(internal.tickets.mutations.saveQRCode, {
      ticketInstanceId: args.ticketInstanceId,
      qrCode,
      qrHash: hmac,
    });

    return { qrCode, qrHash: hmac };
  },
});
```

---

## Story 3.6: Ticket Email Delivery

**Priority:** P0 | **Effort:** 3 points | **Sprint:** Week 6

### Acceptance Criteria
- [ ] Email sent immediately after successful payment
- [ ] Email contains: event details, order number, QR code(s)
- [ ] "Add to Calendar" link included (.ics file)
- [ ] Professional HTML template
- [ ] Resend option in user dashboard
- [ ] Email delivery >99% success rate

### Technical Implementation

**Convex Action:** `convex/email/send.ts`
```typescript
"use node";

import { Resend } from "resend";
import { v } from "convex/values";
import { action } from "../_generated/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendTicketEmail = action({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.runQuery(internal.orders.queries.getOrderDetails, {
      orderId: args.orderId,
    });

    const { data, error } = await resend.emails.send({
      from: "SteppersLife Events <tickets@stepperslife.com>",
      to: [order.buyerEmail],
      subject: `Your tickets for ${order.eventName}`,
      html: generateTicketEmailHTML(order),
      attachments: [
        {
          filename: "event.ics",
          content: generateICSFile(order),
        },
      ],
    });

    if (error) throw new Error(`Email failed: ${error.message}`);

    return { emailId: data.id };
  },
});

function generateTicketEmailHTML(order: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .ticket { border: 2px solid #000; padding: 20px; margin: 20px 0; }
        .qr-code { text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Tickets</h1>
        </div>

        <p>Hi ${order.buyerName},</p>
        <p>Thank you for your purchase! Here are your tickets for <strong>${order.eventName}</strong>.</p>

        <div class="ticket">
          <h2>${order.eventName}</h2>
          <p><strong>Date:</strong> ${new Date(order.eventDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${order.eventTime}</p>
          <p><strong>Location:</strong> ${order.eventLocation}</p>
          <p><strong>Order #:</strong> ${order.orderNumber}</p>

          <div class="qr-code">
            ${order.tickets.map((t: any) => `
              <img src="${t.qrCode}" alt="QR Code" width="200" />
              <p>Ticket ${t.ticketNumber}</p>
            `).join('')}
          </div>
        </div>

        <p>Show this QR code at the event entrance for entry.</p>
      </div>
    </body>
    </html>
  `;
}
```

---

## Epic-Level Acceptance Criteria

- [ ] All 6 stories completed and tested
- [ ] Public can browse and purchase tickets
- [ ] Real-time inventory prevents overselling
- [ ] Stripe payments processing correctly
- [ ] QR codes generated and secure
- [ ] Emails delivered reliably
- [ ] Checkout flow <2 minutes
- [ ] Payment success rate >95%
- [ ] Mobile responsive checkout
- [ ] E2E tests passing

---

## Dependencies & Prerequisites

### External Services
- **Stripe:** Account, Connect platform, webhook endpoint
- **Email:** Resend or SendGrid API key
- **Environment Variables:**
  ```bash
  STRIPE_SECRET_KEY=...
  STRIPE_WEBHOOK_SECRET=...
  RESEND_API_KEY=...
  QR_CODE_SECRET_KEY=...
  ```

### NPM Packages
```bash
npm install @stripe/stripe-js qrcode resend
```

---

## Technical Notes

### Payment Flow
1. User selects tickets → Creates order (reserves inventory)
2. Backend creates Stripe payment intent (with Connect split)
3. Frontend loads Stripe Elements
4. User submits payment
5. Stripe webhook confirms → Order confirmed
6. Generate QR codes → Send email → Release inventory

### Security
- HMAC signatures on QR codes prevent tampering
- Payment intent IDs stored for reconciliation
- PCI compliance via Stripe (no card data stored)
- Webhook signature verification required

### Performance
- Real-time subscriptions for inventory (Convex handles this)
- Optimistic UI updates during checkout
- QR generation asynchronous (via actions)
- Email sending asynchronous

---

## Next Epic

➡️ **Epic 4: User Ticket Management** ([epic-04-user-dashboard.md](./epic-04-user-dashboard.md))

Users need to view and manage their purchased tickets.
