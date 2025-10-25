# Technology Stack
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025

---

## Overview

This document details the complete technology stack for the SteppersLife Event Ticketing Platform, including rationale for each technology choice, version specifications, and integration patterns.

---

## Core Stack Summary

```
Frontend:    Next.js 16.0.0, React 19.2.0, TypeScript 5.x
Backend:     Convex v1.28.0 (Real-time BaaS)
Auth:        @convex-dev/auth v0.0.90 (Deferred to Phase 2)
Payments:    Stripe v19.1.0, Stripe Connect
Styling:     Tailwind CSS 4.x, shadcn/ui
Deployment:  PM2, Port 3004, Production VPS
```

---

## Frontend Technologies

### 1. Next.js 16.0.0

**Purpose:** React framework with App Router

**Why We Chose It:**
- **App Router** - Modern routing with layouts, server components, streaming
- **Server Components** - Reduced client bundle size, better performance
- **File-based Routing** - Intuitive organization with route groups
- **Built-in Optimization** - Image optimization, code splitting, caching
- **API Routes** - Webhook handlers (Stripe, email confirmations)

**Key Features Used:**
- Server Components (default)
- Client Components ("use client" for interactivity)
- Route Groups: `(auth)`, `(public)`, `(dashboard)`, `(scanner)`
- Parallel Routes & Intercepting Routes (future: modals)
- Metadata API for SEO

**Installation:**
```bash
npm install next@16.0.0
```

**Configuration:** `next.config.ts`
```typescript
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["expert-vulture-775.convex.cloud"], // Convex file storage
  },
};
```

---

### 2. React 19.2.0

**Purpose:** UI library

**Why We Chose It:**
- **Server Components Support** - Works seamlessly with Next.js 16
- **Concurrent Features** - Suspense, streaming, transitions
- **Improved Hooks** - `useFormStatus`, `useOptimistic`
- **Best-in-class Ecosystem** - Massive community, component libraries

**Key Patterns:**
- Server Components for data fetching
- Client Components for interactivity
- `useState`, `useEffect` for local state
- `useQuery`, `useMutation` (Convex) for server state

**Installation:**
```bash
npm install react@19.2.0 react-dom@19.2.0
```

---

### 3. TypeScript 5.x

**Purpose:** Type-safe JavaScript

**Why We Chose It:**
- **Catch Errors Early** - Compile-time error detection
- **Better DX** - IntelliSense, autocomplete, refactoring support
- **Self-documenting** - Types serve as inline documentation
- **Required by Convex** - Convex schema and functions are TypeScript-first

**Configuration:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

### 4. Tailwind CSS 4.x

**Purpose:** Utility-first CSS framework

**Why We Chose It:**
- **Rapid Development** - Build UI without leaving HTML
- **Consistency** - Design system via config
- **No CSS Bloat** - Purges unused styles in production
- **Responsive Design** - Mobile-first breakpoints built-in
- **Dark Mode** - First-class support (future feature)

**Configuration:** `tailwind.config.ts`
```typescript
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#ffffff",
      },
    },
  },
};
```

**Installation:**
```bash
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

### 5. shadcn/ui

**Purpose:** Reusable component library

**Why We Chose It:**
- **Copy-Paste Components** - Own your code (not npm dependency)
- **Radix UI Primitives** - Accessible by default
- **Tailwind Styled** - Consistent with our styling approach
- **Customizable** - Modify components as needed

**Components Used:**
- `Button`, `Input`, `Label`, `Card`, `Badge`
- `Select`, `Checkbox`, `Textarea`, `Calendar`
- `Dialog`, `Toast`, `Avatar`, `Tabs`

**Installation:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog toast
```

---

## Backend Technologies

### 6. Convex v1.28.0

**Purpose:** Real-time Backend-as-a-Service (BaaS)

**Why We Chose It:**
- **Real-time Subscriptions** - Automatic UI updates (no polling)
- **Serverless Functions** - Write backend logic without managing servers
- **TypeScript-First** - Schema and functions are type-safe
- **File Storage** - Built-in storage for images, QR codes
- **No ORM Needed** - Direct database access with type inference
- **Instant Deployment** - Push code, no DevOps required

**Deployment:** `expert-vulture-775.convex.cloud`

**Key Features Used:**
- **Queries** - Real-time read operations
- **Mutations** - Write operations (insert, update, delete)
- **Actions** - Node environment for external APIs (Stripe, Email)
- **Scheduled Functions** - Cron jobs (queue processing, reminders)
- **File Storage** - Image uploads, QR code generation
- **Search** - Full-text search on event names

**Installation:**
```bash
npm install convex@1.28.0
npx convex dev
```

**Configuration:** `convex/schema.ts`
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    name: v.string(),
    startDate: v.number(),
    organizerId: v.id("users"),
    status: v.union(v.literal("DRAFT"), v.literal("PUBLISHED")),
  })
    .index("by_status", ["status"])
    .index("by_organizer", ["organizerId"])
    .searchIndex("search_events", {
      searchField: "name",
      filterFields: ["status"],
    }),
});
```

---

## Authentication (Phase 2)

### 7. @convex-dev/auth v0.0.90

**Purpose:** Authentication for Convex apps

**Why We Chose It (For Later):**
- **Convex-native** - Seamless integration with Convex functions
- **Multiple Providers** - Email/password, Google OAuth, Apple, etc.
- **Session Management** - JWT tokens, HTTP-only cookies
- **Type-safe** - Full TypeScript support

**Note:** Authentication is deferred to the final phase of development.

**Installation (When Ready):**
```bash
npm install @convex-dev/auth@0.0.90
```

---

## Payment Processing

### 8. Stripe v19.1.0

**Purpose:** Payment processing

**Why We Chose It:**
- **Industry Standard** - Trusted by millions
- **Stripe Connect** - Marketplace payments (platform takes 2.5% fee)
- **PCI Compliant** - No card data touches our servers
- **Excellent Docs** - Easy integration
- **Webhooks** - Reliable payment confirmations

**Features Used:**
- **Payment Intents** - Card payments
- **Stripe Connect Express** - Organizer payout accounts
- **Webhooks** - `payment_intent.succeeded`, `account.updated`
- **Elements** - Pre-built card input UI

**Installation:**
```bash
npm install stripe@19.1.0 @stripe/stripe-js @stripe/react-stripe-js
```

**Backend (Convex Action):**
```typescript
"use node";

import Stripe from "stripe";
import { action } from "../_generated/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createPaymentIntent = action({
  args: { amount: v.number(), connectedAccountId: v.string() },
  handler: async (ctx, args) => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
      application_fee_amount: Math.round(args.amount * 0.025), // 2.5%
      transfer_data: {
        destination: args.connectedAccountId,
      },
    });

    return paymentIntent.client_secret;
  },
});
```

**Frontend (React):**
```typescript
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

---

## QR Code & Scanning

### 9. qrcode v1.5.4

**Purpose:** QR code generation (server-side)

**Why We Chose It:**
- **Node-compatible** - Works in Convex actions
- **Data URL Output** - Easy to embed in emails
- **High Error Correction** - Level H for reliability

**Usage:**
```typescript
import QRCode from "qrcode";

const qrCode = await QRCode.toDataURL(JSON.stringify(ticketData), {
  errorCorrectionLevel: "H",
  width: 400,
});
```

---

### 10. html5-qrcode v2.3.8

**Purpose:** QR code scanning (client-side)

**Why We Chose It:**
- **Camera Access** - Uses getUserMedia API
- **Auto-detection** - Scans QR codes automatically
- **Cross-browser** - Works on iOS/Android

**Usage:**
```typescript
import { Html5QrcodeScanner } from "html5-qrcode";

const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10 });

scanner.render(
  (decodedText) => {
    console.log("Scanned:", decodedText);
  },
  (error) => console.error(error)
);
```

---

## Email Delivery

### 11. Resend v4.0.0

**Purpose:** Transactional email service

**Why We Chose It:**
- **Simple API** - Easy integration
- **High Deliverability** - 99%+ success rate
- **React Email Support** - HTML emails via JSX
- **Attachments** - .ics calendar files

**Installation:**
```bash
npm install resend@4.0.0
```

**Usage:**
```typescript
"use node";

import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);

await resend.emails.send({
  from: "SteppersLife <tickets@stepperslife.com>",
  to: ["user@example.com"],
  subject: "Your Tickets",
  html: "<h1>Your Tickets</h1>",
  attachments: [
    {
      filename: "event.ics",
      content: generateICSFile(event),
    },
  ],
});
```

---

## Rich Text Editing

### 12. TipTap v2.8.0

**Purpose:** WYSIWYG editor for event descriptions

**Why We Chose It:**
- **Headless** - Fully customizable UI
- **Extensible** - Plugin-based architecture
- **React Integration** - First-class React support
- **Prosemirror-based** - Robust editing engine

**Installation:**
```bash
npm install @tiptap/react @tiptap/starter-kit
```

**Usage:**
```typescript
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const editor = useEditor({
  extensions: [StarterKit],
  content: "<p>Event description</p>",
  onUpdate: ({ editor }) => {
    onChange(editor.getHTML());
  },
});

return <EditorContent editor={editor} />;
```

---

## Utilities

### 13. date-fns v4.1.0

**Purpose:** Date formatting and manipulation

**Why We Chose It:**
- **Lightweight** - Tree-shakeable functions
- **Immutable** - Doesn't mutate dates
- **Locale Support** - Internationalization ready

**Usage:**
```typescript
import { format, addDays, isBefore } from "date-fns";

format(new Date(), "MMMM d, yyyy 'at' h:mm a");
// "October 25, 2025 at 7:00 PM"
```

---

### 14. Zod v3.24.1

**Purpose:** Schema validation

**Why We Chose It:**
- **TypeScript-first** - Inferred types
- **Composable** - Build complex schemas
- **Error Messages** - Clear validation errors

**Usage:**
```typescript
import { z } from "zod";

const EventSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  startDate: z.number().min(Date.now()),
});

const validated = EventSchema.parse(data);
```

---

## Development Tools

### 15. ESLint

**Purpose:** Code linting

**Configuration:** `eslint.config.mjs`
```javascript
export default {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
  },
};
```

---

### 16. Prettier

**Purpose:** Code formatting

**Configuration:** `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

### 17. Playwright

**Purpose:** E2E testing

**Installation:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Configuration:** `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3004",
  },
});
```

---

## Deployment

### 18. PM2

**Purpose:** Node.js process manager

**Why We Chose It:**
- **Cluster Mode** - Utilize all CPU cores
- **Auto Restart** - Recovers from crashes
- **Log Management** - Centralized logs
- **Zero-downtime Reload** - Graceful restarts

**Configuration:** `ecosystem.config.js`
```javascript
module.exports = {
  apps: [{
    name: "events-stepperslife",
    script: "npm",
    args: "start",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3004,
    },
  }],
};
```

**Commands:**
```bash
pm2 start ecosystem.config.js
pm2 logs events-stepperslife
pm2 monit
```

---

## Environment Variables

### Required Variables

```bash
# App
NEXT_PUBLIC_APP_URL=https://events.stepperslife.com
NODE_ENV=production

# Convex
CONVEX_DEPLOYMENT=expert-vulture-775
NEXT_PUBLIC_CONVEX_URL=https://expert-vulture-775.convex.cloud

# Stripe (Phase 2+)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=tickets@stepperslife.com

# QR Security
QR_CODE_SECRET_KEY=your_secret_key
```

---

## Version Compatibility Matrix

| Package | Version | Next.js Compat | React Compat | Node Compat |
|---------|---------|----------------|--------------|-------------|
| Next.js | 16.0.0  | -              | 19.x         | 18.x, 20.x  |
| React   | 19.2.0  | 15.x, 16.x     | -            | -           |
| Convex  | 1.28.0  | 13.x - 16.x    | 18.x, 19.x   | 18.x, 20.x  |
| Stripe  | 19.1.0  | All            | All          | 14.x+       |

---

## Technology Decision Log

### Why Convex Over Supabase/Firebase?

**Convex Advantages:**
- Real-time by default (no extra setup)
- TypeScript-first (better DX)
- Serverless functions included
- No SQL needed (type-safe queries)
- File storage built-in

**Supabase Trade-offs:**
- More mature ecosystem
- PostgreSQL (familiar to some teams)
- Open-source (self-hostable)

**Decision:** Convex for speed, real-time, and DX. Future migration to Supabase possible if needed.

---

### Why Next.js App Router Over Pages Router?

**App Router Benefits:**
- Server Components (better performance)
- Streaming (faster perceived load times)
- Layouts (reduce code duplication)
- Future-proof (Pages Router in maintenance mode)

**Pages Router Benefits:**
- More stable ecosystem
- More third-party examples

**Decision:** App Router is the future of Next.js. Initial learning curve worth long-term benefits.

---

### Why Tailwind Over CSS Modules?

**Tailwind Benefits:**
- Faster development
- Consistency via config
- No naming conflicts
- PurgeCSS removes unused styles

**CSS Modules Benefits:**
- Traditional CSS workflow
- Easier for designers

**Decision:** Tailwind for speed and consistency. Team familiar with utility-first approach.

---

## Package Installation Commands

```bash
# Core
npm install next@16.0.0 react@19.2.0 react-dom@19.2.0

# Backend
npm install convex@1.28.0

# Auth (Phase 2)
npm install @convex-dev/auth@0.0.90

# Payments
npm install stripe@19.1.0 @stripe/stripe-js @stripe/react-stripe-js

# Email
npm install resend@4.0.0

# QR Codes
npm install qrcode@1.5.4 html5-qrcode@2.3.8

# Rich Text
npm install @tiptap/react@2.8.0 @tiptap/starter-kit@2.8.0

# Utilities
npm install date-fns@4.1.0 zod@3.24.1

# Styling
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge

# shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog toast calendar select checkbox textarea

# Dev Dependencies
npm install -D typescript @types/react @types/node eslint prettier playwright
```

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** Development Team

**Next Review:** When adding new dependencies or upgrading major versions
