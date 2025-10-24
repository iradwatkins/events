# Technical Specifications

**Version:** 1.0
**Date:** October 24, 2025
**Status:** Build-Ready

---

## 1. Technology Stack

### Core Technologies
```
Frontend:  Next.js 16.0.0 (App Router)
           React 19.2.0
           TypeScript 5.x
           Tailwind CSS 4.x

Backend:   Convex v1.28.0 (expert-vulture-775.convex.cloud)
           Real-time BaaS with subscriptions

Auth:      @convex-dev/auth v0.0.90
           Google OAuth, Email/Password

Payments:  Stripe v19.1.0
           Stripe Connect (Express accounts)

Deploy:    PM2 (Cluster mode, Port 3004)
           Production: events.stepperslife.com
```

---

## 2. Complete Convex Database Schema

**File:** `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==================== USERS ====================
  users: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.id("_storage")),
    stripeCustomerId: v.optional(v.string()),
    stripeConnectAccountId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"]),

  // ==================== EVENTS ====================
  events: defineTable({
    // Basic Info
    name: v.string(),
    description: v.string(),
    organizerId: v.id("users"),
    organizerName: v.string(),

    // Type & Status
    eventType: v.union(
      v.literal("SAVE_THE_DATE"),
      v.literal("FREE_EVENT"),
      v.literal("TICKETED_EVENT")
    ),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("PUBLISHED"),
      v.literal("CANCELLED")
    ),

    // Date/Time (MVP: Single-day only)
    startDate: v.number(), // Unix timestamp
    startTime: v.optional(v.string()), // "7:00 PM"
    endTime: v.optional(v.string()), // "11:00 PM"
    timezone: v.string(), // "America/New_York"

    // Location
    location: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),

    // Media & Categorization
    images: v.array(v.id("_storage")),
    categories: v.array(v.string()),

    // Event Type Specific
    doorPrice: v.optional(v.string()), // For FREE_EVENT

    // Settings
    maxTicketsPerOrder: v.number(),
    minTicketsPerOrder: v.number(),
    allowWaitlist: v.boolean(), // Future: Phase 2
    allowTransfers: v.boolean(), // Future: Phase 2

    // Stripe Connect
    stripeConnectAccountId: v.optional(v.string()),
    stripeAccountSetupComplete: v.boolean(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_status", ["status"])
    .index("by_start_date", ["startDate"])
    .searchIndex("search_events", {
      searchField: "name",
      filterFields: ["status", "eventType"],
    }),

  // ==================== TICKETS ====================
  tickets: defineTable({
    eventId: v.id("events"),

    // Ticket Details
    ticketType: v.string(), // "General Admission"
    description: v.optional(v.string()),
    price: v.number(), // In cents

    // Inventory
    quantityTotal: v.number(),
    quantitySold: v.number(),
    quantityReserved: v.number(), // Temporarily held during checkout

    // Sales Period
    salesStart: v.number(),
    salesEnd: v.number(),

    // Limits
    maxPerOrder: v.number(),
    minPerOrder: v.number(),

    // Status
    active: v.boolean(),

    createdAt: v.number(),
  })
    .index("by_event", ["eventId"]),

  // ==================== ORDERS ====================
  orders: defineTable({
    // User & Event
    userId: v.optional(v.id("users")), // Optional for guest checkout
    eventId: v.id("events"),
    orderNumber: v.string(), // "ORD-1234567890-abc"

    // Items
    quantity: v.number(), // MVP: Simple quantity

    // Pricing
    totalAmount: v.number(), // In cents

    // Payment
    paymentStatus: v.union(
      v.literal("PENDING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("REFUNDED")
    ),
    paymentMethod: v.optional(v.literal("STRIPE")),
    stripePaymentIntentId: v.optional(v.string()),
    stripeChargeId: v.optional(v.string()),

    // Buyer Info
    buyerName: v.string(),
    buyerEmail: v.string(),
    buyerPhone: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_order_number", ["orderNumber"])
    .index("by_payment_status", ["paymentStatus"]),

  // ==================== TICKET INSTANCES ====================
  ticketInstances: defineTable({
    // References
    orderId: v.id("orders"),
    ticketId: v.id("tickets"),
    eventId: v.id("events"),

    // Ticket Details
    ticketNumber: v.string(), // Unique ticket #
    ticketType: v.optional(v.string()), // "General Admission"
    qrCode: v.string(), // Base64 data URL
    qrHash: v.string(), // HMAC signature for validation

    // Status
    status: v.union(
      v.literal("VALID"),
      v.literal("SCANNED"),
      v.literal("CANCELLED")
    ),

    // Scanning
    scannedAt: v.optional(v.number()),
    scannedBy: v.optional(v.id("users")),

    // Ownership
    currentOwnerId: v.id("users"),

    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_event", ["eventId"])
    .index("by_ticket_number", ["ticketNumber"])
    .index("by_qr_hash", ["qrHash"])
    .index("by_owner", ["currentOwnerId"])
    .index("by_status", ["status"]),

  // ==================== SCANS ====================
  scans: defineTable({
    ticketInstanceId: v.id("ticketInstances"),
    eventId: v.id("events"),
    scannedBy: v.id("users"),

    // Scan Details
    scanType: v.union(
      v.literal("QR_SCAN"),
      v.literal("MANUAL_LOOKUP")
    ),
    manualReason: v.optional(v.string()),

    // Validation
    valid: v.boolean(),
    errorMessage: v.optional(v.string()),

    scannedAt: v.number(),
  })
    .index("by_ticket", ["ticketInstanceId"])
    .index("by_event", ["eventId"])
    .index("by_scanner", ["scannedBy"]),
});
```

---

## 3. API Specifications

### Authentication APIs

**Auth Provider:** `@convex-dev/auth`

```typescript
// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password(),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
});
```

### Core Convex Function Types

**Queries** (Read-only, real-time subscribed)
- `api.events.queries.getPublicEvents`
- `api.events.queries.getEvent`
- `api.tickets.queries.getTicketAvailability`
- `api.users.queries.getCurrentUser`

**Mutations** (Write operations)
- `api.events.mutations.createSaveTheDateEvent`
- `api.events.mutations.createFreeEvent`
- `api.events.mutations.createTicketedEvent`
- `api.orders.mutations.createOrder`
- `api.scanning.mutations.scanTicket`

**Actions** (External API calls, Node environment)
- `api.stripe.connect.createConnectAccount`
- `api.payments.stripe.createPaymentIntent`
- `api.tickets.qrcode.generateTicketQR`
- `api.email.send.sendTicketEmail`

---

## 4. Stripe Connect Integration

### Payment Flow

```typescript
// 1. Create Payment Intent (Convex Action)
export const createPaymentIntent = action({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
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
      metadata: { orderId: args.orderId },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },
});

// 2. Frontend Payment Processing
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();

  const handleSubmit = async (e) => {
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (paymentIntent.status === "succeeded") {
      // Order confirmed via webhook
    }
  };
}

// 3. Webhook Handler
// app/api/webhooks/stripe/route.ts
export async function POST(req: NextRequest) {
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  if (event.type === "payment_intent.succeeded") {
    await confirmOrder(event.data.object.metadata.orderId);
  }
}
```

---

## 5. QR Code Security

### Generation

```typescript
import QRCode from "qrcode";
import crypto from "crypto";

export async function generateTicketQR(ticketInstanceId: string) {
  const timestamp = Date.now();
  const data = `${ticketInstanceId}:${timestamp}`;

  // HMAC Signature
  const hmac = crypto
    .createHmac("sha256", process.env.QR_CODE_SECRET_KEY!)
    .update(data)
    .digest("hex");

  const qrData = {
    ticketId: ticketInstanceId,
    timestamp,
    signature: hmac,
  };

  const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
    errorCorrectionLevel: "H",
    width: 400,
  });

  return { qrCode, qrHash: hmac };
}
```

### Validation

```typescript
export function validateQRSignature(
  ticketInstanceId: string,
  timestamp: number,
  signature: string
): boolean {
  // Reject if timestamp too old (24 hours)
  if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
    return false;
  }

  const data = `${ticketInstanceId}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.QR_CODE_SECRET_KEY!)
    .update(data)
    .digest("hex");

  return signature === expectedSignature;
}
```

---

## 6. Environment Variables

### Development (.env.local)

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3004
NODE_ENV=development

# Convex
CONVEX_DEPLOYMENT=expert-vulture-775
NEXT_PUBLIC_CONVEX_URL=https://expert-vulture-775.convex.cloud

# Auth (@convex-dev/auth)
AUTH_GOOGLE_ID=your_google_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your_google_client_secret
JWT_PRIVATE_KEY=your_jwt_private_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=tickets@stepperslife.com

# QR Code Security
QR_CODE_SECRET_KEY=your_secret_key_for_hmac_signatures
```

### Production

```bash
# Same as development, but use production keys
NEXT_PUBLIC_APP_URL=https://events.stepperslife.com
NODE_ENV=production

STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 7. Security Requirements

### Authentication & Authorization
- JWT tokens via @convex-dev/auth
- HTTP-only cookies for sessions
- Role-based access control (RBAC)
- Organizer verification on all mutations

### Payment Security
- PCI DSS compliant (via Stripe)
- No raw card data stored
- Tokenization via Stripe Elements
- Webhook signature verification required

### QR Code Security
- HMAC signatures (SHA-256)
- Timestamp validation (24-hour window)
- One-time use enforcement
- Secure random ticket numbers

### Data Protection
- HTTPS/TLS 1.3 required
- Input validation (Zod schemas)
- SQL injection prevented (Convex queries are safe)
- XSS prevention (React escaping)

---

## 8. Performance Targets

### Response Times
| Metric | Target |
|--------|--------|
| Page Load Time | <2s (p95) |
| API Response Time | <200ms (p95) |
| Ticket Purchase Completion | <3s (p95) |
| Real-time Inventory Update | <500ms latency |
| QR Scan Validation | <1s |

### Scalability
- Support 1,000 concurrent users per event
- Handle 10,000+ ticket purchases/day
- 99.9% uptime SLA
- Horizontal scaling via Convex

---

## 9. Testing Strategy

### Unit Tests
```bash
# Convex function tests
npm run test:convex

# React component tests
npm run test:components
```

### E2E Tests (Playwright)
```typescript
// tests/e2e/purchase-flow.spec.ts
test("complete ticket purchase flow", async ({ page }) => {
  await page.goto("/events");
  await page.click("text=Buy Tickets");
  await page.fill("#quantity", "2");
  await page.click("text=Checkout");
  await page.fill("#name", "John Doe");
  await page.fill("#email", "john@example.com");
  // ... Stripe Elements testing
  await expect(page).toHaveURL(/success/);
});
```

---

## 10. Deployment

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "events-stepperslife",
    script: "npm",
    args: "start",
    cwd: "/root/websites/events-stepperslife",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3004,
    },
  }]
};
```

### Deployment Commands

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Monitor
pm2 monit
pm2 logs events-stepperslife
```

---

## 11. Monitoring & Logging

### Key Metrics to Track
- **Business:** Events created, tickets sold, revenue
- **Technical:** API response times, error rates, uptime
- **User:** Page views, conversion rates, bounce rates

### Error Tracking
- Use Sentry for production error tracking
- Log all payment failures
- Track QR scan failures

---

## 12. Data Models & Relationships

```
users
  └── organizes → events (1:many)
  └── purchases → orders (1:many)
  └── owns → ticketInstances (1:many)
  └── scans → scans (1:many)

events
  └── has → tickets (1:many)
  └── receives → orders (1:many)
  └── generates → ticketInstances (1:many)

orders
  └── contains → ticketInstances (1:many)
  └── references → tickets (many:1)

ticketInstances
  └── logged_in → scans (1:many)
```

---

## 13. File Structure

```
event.stepperslife.com/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (public)/
│   │   ├── events/
│   │   └── page.tsx (homepage)
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   └── organizer/
│   ├── (scanner)/
│   │   └── scan/
│   └── api/
│       └── webhooks/stripe/
├── components/
│   ├── ui/ (shadcn components)
│   ├── events/
│   ├── tickets/
│   └── scanning/
├── convex/
│   ├── schema.ts
│   ├── auth.ts
│   ├── events/
│   ├── tickets/
│   ├── orders/
│   ├── payments/
│   ├── scanning/
│   └── email/
├── lib/
│   └── utils.ts
├── public/
│   ├── manifest.json
│   └── sounds/
└── docs/
    ├── prd.md
    └── prd/ (epics)
```

---

## 14. Dependencies

### NPM Packages (package.json)

```json
{
  "dependencies": {
    "next": "16.0.0",
    "react": "19.2.0",
    "convex": "^1.28.0",
    "@convex-dev/auth": "^0.0.90",
    "stripe": "^19.1.0",
    "@stripe/stripe-js": "^8.1.0",
    "@stripe/react-stripe-js": "^3.0.0",
    "qrcode": "^1.5.4",
    "html5-qrcode": "^2.3.8",
    "resend": "^4.0.0",
    "@tiptap/react": "^2.8.0",
    "@tiptap/starter-kit": "^2.8.0",
    "date-fns": "^4.1.0",
    "zod": "^3.24.1"
  }
}
```

---

## Document Control

**Status:** ✅ Complete and Build-Ready

**Last Updated:** October 24, 2025

**Maintained By:** Development Team

---

This technical specification provides everything developers need to implement the MVP. All schema definitions, API specs, security requirements, and deployment configurations are production-ready.
