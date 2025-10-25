# Coding Standards
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025

---

## Overview

This document defines the coding standards for the SteppersLife Event Ticketing Platform. All developers must follow these guidelines to ensure consistency, maintainability, and quality.

---

## General Principles

### 1. Code Quality
- **Write self-documenting code** - Clear variable names over comments
- **Keep functions small** - Single responsibility principle
- **DRY (Don't Repeat Yourself)** - Extract reusable logic
- **YAGNI (You Aren't Gonna Need It)** - Don't over-engineer

### 2. TypeScript Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 3. Code Review Requirements
- All code must be reviewed before merging
- Run linter and tests before submitting PR
- Address all TypeScript errors (no `@ts-ignore` without explanation)

---

## TypeScript Standards

### File Naming
```bash
# Components (PascalCase)
EventCard.tsx
TicketCheckout.tsx

# Utilities (camelCase)
formatCurrency.ts
validateEmail.ts

# Types/Interfaces
types.ts
interfaces.ts

# Constants
constants.ts
CATEGORIES.ts (if exported constants)
```

### Type Definitions

**Prefer Interfaces for Objects:**
```typescript
// Good
interface Event {
  id: string;
  name: string;
  startDate: number;
}

// Avoid (unless union/intersection types needed)
type Event = {
  id: string;
  name: string;
};
```

**Use Type for Unions/Aliases:**
```typescript
type EventType = "SAVE_THE_DATE" | "FREE_EVENT" | "TICKETED_EVENT";
type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";
```

**Explicit Return Types:**
```typescript
// Good
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

// Avoid
function calculateTotal(price: number, quantity: number) {
  return price * quantity; // Inferred, but not explicit
}
```

---

## Next.js 16 App Router Patterns

### Server vs. Client Components

**Default to Server Components:**
```typescript
// app/events/page.tsx
// ✅ Server Component (default)
export default async function EventsPage() {
  const events = await getEvents();
  return <EventsList events={events} />;
}
```

**Use Client Components Only When Needed:**
```typescript
// components/EventCard.tsx
"use client"; // ✅ Only when using hooks/interactivity

import { useState } from "react";

export function EventCard({ event }: Props) {
  const [expanded, setExpanded] = useState(false);
  // ... interactive logic
}
```

**When to Use "use client":**
- `useState`, `useEffect`, or other React hooks
- Browser APIs (window, localStorage, etc.)
- Event handlers (onClick, onChange, etc.)
- Real-time subscriptions (Convex `useQuery`)

### File Organization by Route Group

```bash
app/
├── (auth)/          # Auth-related pages (login, register)
│   ├── login/
│   └── register/
├── (public)/        # Public pages (homepage, event listings)
│   ├── events/
│   └── page.tsx
├── (dashboard)/     # Protected user/organizer dashboards
│   ├── dashboard/
│   └── organizer/
├── (scanner)/       # Scanner PWA
│   └── scan/
└── api/             # API routes
    └── webhooks/
```

### Route Handlers (API Routes)

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    // ... webhook logic
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook failed" },
      { status: 400 }
    );
  }
}
```

---

## React Component Standards

### Component Structure

```typescript
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 1. Types/Interfaces
interface EventFormProps {
  eventId?: string;
  onSuccess?: () => void;
}

// 2. Component
export function EventForm({ eventId, onSuccess }: EventFormProps) {
  // 3. Hooks (State, Convex, etc.)
  const [formData, setFormData] = useState({
    name: "",
    date: new Date(),
  });
  const createEvent = useMutation(api.events.mutations.createEvent);

  // 4. Event Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createEvent(formData);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  // 5. Render
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <Button type="submit">Create Event</Button>
    </form>
  );
}
```

### Component Naming

- **PascalCase for components:** `EventCard`, `TicketCheckout`
- **camelCase for functions:** `formatCurrency`, `validateEmail`
- **Descriptive names:** `UserRegistrationForm` vs. `Form`

### Props Destructuring

```typescript
// ✅ Good - Destructure props
export function EventCard({ event, onEdit }: EventCardProps) {
  return <div>{event.name}</div>;
}

// ❌ Avoid - Using props object
export function EventCard(props: EventCardProps) {
  return <div>{props.event.name}</div>;
}
```

---

## Convex Standards

### Function Organization

```bash
convex/
├── schema.ts              # Database schema
├── auth.ts                # Authentication config
├── events/
│   ├── mutations.ts       # Write operations
│   ├── queries.ts         # Read operations
│   └── validators.ts      # Zod schemas (if needed)
├── tickets/
│   ├── mutations.ts
│   └── queries.ts
└── payments/
    └── stripe.ts          # Actions (Node environment)
```

### Convex Query Pattern

```typescript
// convex/events/queries.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    // 1. Fetch data
    const event = await ctx.db.get(args.eventId);

    // 2. Check existence
    if (!event) {
      throw new Error("Event not found");
    }

    // 3. Authorization (if needed)
    if (event.status !== "PUBLISHED") {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authorized");
      }
    }

    // 4. Return data
    return event;
  },
});
```

### Convex Mutation Pattern

```typescript
// convex/events/mutations.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createEvent = mutation({
  args: {
    name: v.string(),
    startDate: v.number(),
    // ... other args
  },
  handler: async (ctx, args) => {
    // 1. Authentication check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // 2. Validation
    if (args.startDate < Date.now()) {
      throw new Error("Event date must be in the future");
    }

    // 3. Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // 4. Insert
    const eventId = await ctx.db.insert("events", {
      ...args,
      organizerId: user._id,
      status: "DRAFT",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 5. Return result
    return eventId;
  },
});
```

### Convex Action Pattern (Node Environment)

```typescript
// convex/payments/stripe.ts
"use node"; // Required for Node APIs

import { action } from "../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createPaymentIntent = action({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // External API calls allowed in actions
    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
    });

    // Can run mutations via ctx.runMutation
    await ctx.runMutation(internal.orders.updatePaymentIntent, {
      orderId: args.orderId,
      paymentIntentId: paymentIntent.id,
    });

    return paymentIntent.client_secret;
  },
});
```

---

## Styling Standards (Tailwind CSS)

### Class Ordering
```typescript
// Use consistent ordering: layout → spacing → typography → colors → effects
<div className="flex flex-col gap-4 p-6 text-lg font-bold text-white bg-black rounded-lg shadow-lg">
```

### Component Variants with CVA
```typescript
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "rounded-lg font-semibold transition", // base
  {
    variants: {
      variant: {
        primary: "bg-black text-white hover:bg-gray-800",
        secondary: "bg-gray-200 text-black hover:bg-gray-300",
      },
      size: {
        sm: "px-3 py-1 text-sm",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  }
);
```

### Responsive Design
```typescript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## Error Handling

### Frontend Error Handling

```typescript
"use client";

import { useToast } from "@/components/ui/use-toast";

export function ExampleComponent() {
  const { toast } = useToast();
  const createEvent = useMutation(api.events.mutations.createEvent);

  const handleSubmit = async () => {
    try {
      await createEvent({ name: "Event" });

      toast({
        title: "Success",
        description: "Event created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };
}
```

### Backend Error Handling (Convex)

```typescript
export const updateEvent = mutation({
  args: { eventId: v.id("events"), name: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity || event.organizerId !== identity.subject) {
      throw new Error("Not authorized to edit this event");
    }

    await ctx.db.patch(args.eventId, { name: args.name });
    return { success: true };
  },
});
```

---

## Testing Standards

### Component Tests (Jest + React Testing Library)

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { EventCard } from "./EventCard";

describe("EventCard", () => {
  it("renders event name", () => {
    const event = { name: "Summer Social", startDate: Date.now() };
    render(<EventCard event={event} />);

    expect(screen.getByText("Summer Social")).toBeInTheDocument();
  });

  it("calls onEdit when edit button clicked", () => {
    const onEdit = jest.fn();
    render(<EventCard event={mockEvent} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from "@playwright/test";

test("user can purchase tickets", async ({ page }) => {
  await page.goto("/events");

  await page.click("text=Buy Tickets");
  await page.fill("#quantity", "2");
  await page.click("text=Checkout");

  await expect(page).toHaveURL(/checkout/);
});
```

---

## Performance Best Practices

### 1. Image Optimization
```typescript
import Image from "next/image";

// ✅ Use Next.js Image component
<Image
  src={event.imageUrl}
  alt={event.name}
  width={400}
  height={300}
  className="rounded-lg"
/>

// ❌ Don't use <img> tags
<img src={event.imageUrl} alt={event.name} />
```

### 2. Lazy Loading
```typescript
import dynamic from "next/dynamic";

// Lazy load heavy components
const QRScanner = dynamic(() => import("@/components/scanning/QRScanner"), {
  ssr: false,
  loading: () => <div>Loading scanner...</div>,
});
```

### 3. Memoization
```typescript
import { useMemo } from "react";

function EventsList({ events }: Props) {
  const sortedEvents = useMemo(() => {
    return events.sort((a, b) => a.startDate - b.startDate);
  }, [events]);

  return <>{/* render sorted events */}</>;
}
```

---

## Git Commit Standards

### Conventional Commits

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat     # New feature
fix      # Bug fix
docs     # Documentation
style    # Formatting, no code change
refactor # Code change that neither fixes a bug nor adds a feature
test     # Adding tests
chore    # Build process, dependencies

# Examples:
feat(events): add multi-day event support
fix(tickets): resolve QR code validation error
docs(readme): update deployment instructions
refactor(checkout): simplify payment flow
```

### Branch Naming

```bash
# Format: <type>/<short-description>

feature/story-2.1-save-the-date
fix/ticket-validation-bug
refactor/payment-flow
docs/api-documentation
```

---

## Security Standards

### 1. Input Validation (Zod)

```typescript
import { z } from "zod";

const EventSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  startDate: z.number().min(Date.now()),
});

// Validate before mutation
const validated = EventSchema.parse(args);
```

### 2. Environment Variables

```typescript
// ❌ Never commit secrets
STRIPE_SECRET_KEY=sk_live_abc123

// ✅ Use .env.local (gitignored)
STRIPE_SECRET_KEY=sk_test_xyz789

// ✅ Reference in code
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

### 3. XSS Prevention

```typescript
// ✅ React automatically escapes
<div>{user.name}</div>

// ⚠️ Use dangerouslySetInnerHTML with caution
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

---

## Code Review Checklist

Before submitting a PR:

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Code follows naming conventions
- [ ] No hardcoded values (use constants/env vars)
- [ ] Error handling implemented
- [ ] Loading states added where needed
- [ ] Mobile responsive (if UI changes)
- [ ] Accessibility considered (semantic HTML, ARIA labels)

---

## Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Document Control**

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** Development Team
