# Source Tree Structure
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Last Updated:** October 25, 2025

---

## Overview

This document explains the complete folder structure of the SteppersLife Event Ticketing Platform, including routing patterns, component organization, and file naming conventions.

---

## Project Root

```
event.stepperslife.com/
├── .bmad-core/              # BMAD framework configuration
├── .claude/                 # Claude Code configuration
├── .github/                 # GitHub Actions CI/CD
├── .husky/                  # Git hooks
├── .vscode/                 # VSCode settings
├── app/                     # Next.js App Router (main application)
├── components/              # Reusable React components
├── convex/                  # Convex backend (database, functions, actions)
├── docs/                    # Documentation (PRD, architecture, stories)
├── lib/                     # Utility functions and shared logic
├── logs/                    # PM2 process logs
├── public/                  # Static assets (images, sounds, manifest)
├── scripts/                 # Automation scripts (deployment, seeding)
├── tests/                   # E2E and integration tests
├── STEPFILES/               # Original requirements and mockups
├── .env.local               # Local environment variables (gitignored)
├── .env.production.example  # Production env template
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # NPM dependencies
├── ecosystem.config.js      # PM2 deployment configuration
└── README.md                # Project overview
```

---

## App Directory (Next.js 16 App Router)

### Route Group Organization

Next.js 16 uses **route groups** (folders wrapped in parentheses) to organize routes without affecting the URL structure.

```
app/
├── (auth)/                  # Authentication pages (login, register)
│   ├── login/
│   │   └── page.tsx         # /login
│   ├── register/
│   │   └── page.tsx         # /register
│   └── layout.tsx           # Shared layout for auth pages
│
├── (public)/                # Public-facing pages
│   ├── events/
│   │   ├── page.tsx         # /events (event listing)
│   │   └── [eventId]/
│   │       └── page.tsx     # /events/[id] (event detail)
│   ├── page.tsx             # / (homepage)
│   └── layout.tsx           # Public layout
│
├── (dashboard)/             # Protected user/organizer dashboards
│   ├── dashboard/
│   │   ├── tickets/
│   │   │   ├── page.tsx     # /dashboard/tickets (my tickets)
│   │   │   └── [ticketId]/
│   │   │       └── page.tsx # /dashboard/tickets/[id]
│   │   ├── orders/
│   │   │   └── page.tsx     # /dashboard/orders (order history)
│   │   └── profile/
│   │       └── page.tsx     # /dashboard/profile
│   │
│   ├── organizer/
│   │   ├── events/
│   │   │   ├── page.tsx     # /organizer/events (my events)
│   │   │   ├── create/
│   │   │   │   └── page.tsx # /organizer/events/create
│   │   │   └── [eventId]/
│   │   │       ├── page.tsx # /organizer/events/[id] (event detail)
│   │   │       └── edit/
│   │   │           └── page.tsx # /organizer/events/[id]/edit
│   │   └── onboarding/
│   │       ├── page.tsx     # /organizer/onboarding (Stripe Connect)
│   │       └── complete/
│   │           └── page.tsx # /organizer/onboarding/complete
│   │
│   └── layout.tsx           # Dashboard layout (nav, sidebar)
│
├── (scanner)/               # Scanner PWA (event staff)
│   └── scan/
│       └── [eventId]/
│           ├── page.tsx     # /scan/[eventId] (QR scanner)
│           └── history/
│               └── page.tsx # /scan/[eventId]/history (scan log)
│
├── api/                     # API routes (webhooks, server actions)
│   └── webhooks/
│       └── stripe/
│           └── route.ts     # POST /api/webhooks/stripe
│
├── layout.tsx               # Root layout (HTML, fonts, providers)
├── globals.css              # Global styles (Tailwind imports)
├── error.tsx                # Global error boundary
├── loading.tsx              # Global loading state
└── not-found.tsx            # 404 page
```

---

## Route Group Breakdown

### `(auth)` - Authentication Pages

**Purpose:** Login, registration, password reset
**Layout:** Minimal layout (no navigation, centered form)
**Authentication:** Public (redirects if already logged in)

**Files:**
- `login/page.tsx` - Email/password + Google OAuth login
- `register/page.tsx` - User registration form
- `reset-password/page.tsx` - Password reset flow
- `layout.tsx` - Shared auth layout

**Example URL:**
```
/login
/register
/reset-password
```

---

### `(public)` - Public Pages

**Purpose:** Homepage, event browsing, event details
**Layout:** Full navigation header, footer
**Authentication:** Public (no login required)

**Files:**
- `page.tsx` - Homepage (hero, featured events, categories)
- `events/page.tsx` - Event listing (grid, search, filters)
- `events/[eventId]/page.tsx` - Event detail (buy tickets)
- `layout.tsx` - Public layout (navbar, footer)

**Example URL:**
```
/ (homepage)
/events (listing)
/events/j77x9z8... (event detail)
```

---

### `(dashboard)` - User & Organizer Dashboards

**Purpose:** Ticket management, event management
**Layout:** Sidebar navigation, dashboard header
**Authentication:** Protected (requires login)

#### User Dashboard (`/dashboard`)

**Files:**
- `tickets/page.tsx` - My tickets (upcoming & past)
- `tickets/[ticketId]/page.tsx` - Ticket detail (QR code, download)
- `orders/page.tsx` - Order history
- `profile/page.tsx` - User profile settings

**Example URL:**
```
/dashboard/tickets
/dashboard/tickets/k88y0a9...
/dashboard/orders
/dashboard/profile
```

#### Organizer Dashboard (`/organizer`)

**Files:**
- `events/page.tsx` - My events (draft, published)
- `events/create/page.tsx` - Create new event
- `events/[eventId]/page.tsx` - Event detail (sales analytics)
- `events/[eventId]/edit/page.tsx` - Edit event
- `onboarding/page.tsx` - Stripe Connect onboarding
- `onboarding/complete/page.tsx` - Onboarding success

**Example URL:**
```
/organizer/events
/organizer/events/create
/organizer/events/j77x9z8.../edit
/organizer/onboarding
```

---

### `(scanner)` - Scanner PWA

**Purpose:** QR code scanning for event entry
**Layout:** Full-screen scanner UI
**Authentication:** Protected (organizer + staff only)

**Files:**
- `scan/[eventId]/page.tsx` - QR scanner page
- `scan/[eventId]/history/page.tsx` - Scan history log

**Example URL:**
```
/scan/j77x9z8... (scanner)
/scan/j77x9z8.../history (scan log)
```

---

### `api/` - API Routes

**Purpose:** Server-side endpoints (webhooks, server actions)

**Files:**
- `api/webhooks/stripe/route.ts` - Stripe webhook handler

**Example URL:**
```
POST /api/webhooks/stripe
```

---

## Components Directory

Reusable React components organized by domain.

```
components/
├── ui/                      # shadcn/ui base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── toast.tsx
│   ├── calendar.tsx
│   ├── select.tsx
│   ├── checkbox.tsx
│   └── ... (other shadcn components)
│
├── events/                  # Event-related components
│   ├── EventCard.tsx        # Event card (grid item)
│   ├── EventForm.tsx        # Event creation/edit form
│   ├── ImageUpload.tsx      # Event image uploader
│   ├── CategorySelector.tsx # Category multi-select
│   ├── RichTextEditor.tsx   # TipTap rich text editor
│   ├── TimePicker.tsx       # Time selection
│   └── PublishButton.tsx    # Publish/unpublish event
│
├── tickets/                 # Ticketing components
│   ├── TicketCard.tsx       # Ticket display card
│   ├── TicketAvailability.tsx # Real-time inventory
│   ├── CheckoutForm.tsx     # Payment form
│   └── QRCodeDisplay.tsx    # QR code viewer
│
├── scanning/                # Scanner components
│   ├── QRScanner.tsx        # Camera-based QR scanner
│   ├── ManualLookup.tsx     # Manual ticket search
│   └── ScanHistory.tsx      # Scan log display
│
├── auth/                    # Authentication components
│   ├── GoogleSignInButton.tsx # OAuth button
│   └── LoginForm.tsx        # Email/password form
│
├── layout/                  # Layout components
│   ├── Navbar.tsx           # Top navigation
│   ├── Footer.tsx           # Site footer
│   ├── Sidebar.tsx          # Dashboard sidebar
│   └── MobileNav.tsx        # Mobile hamburger menu
│
└── providers/               # React context providers
    ├── ConvexProvider.tsx   # Convex client setup
    └── ThemeProvider.tsx    # Dark mode (future)
```

---

## Convex Directory

Backend database schema, queries, mutations, and actions.

```
convex/
├── schema.ts                # Database schema (tables, indexes)
├── auth.ts                  # @convex-dev/auth configuration
│
├── events/
│   ├── mutations.ts         # Event write operations
│   │   ├── createSaveTheDateEvent
│   │   ├── createFreeEvent
│   │   ├── createTicketedEvent
│   │   ├── updateEvent
│   │   └── publishEvent
│   │
│   └── queries.ts           # Event read operations
│       ├── getPublicEvents
│       ├── getEvent
│       ├── getOrganizerEvents
│       └── searchEvents
│
├── tickets/
│   ├── mutations.ts         # Ticket operations
│   │   ├── createTicket
│   │   └── updateTicketInventory
│   │
│   ├── queries.ts           # Ticket queries
│   │   ├── getTicketAvailability
│   │   └── getTicketInstance
│   │
│   └── qrcode.ts            # QR code generation (action)
│       └── generateTicketQR
│
├── orders/
│   ├── mutations.ts         # Order operations
│   │   ├── createOrder
│   │   ├── confirmOrder
│   │   └── updatePaymentIntent
│   │
│   └── queries.ts           # Order queries
│       ├── getUserOrders
│       └── getOrderDetails
│
├── payments/
│   └── stripe.ts            # Stripe integration (actions)
│       ├── createPaymentIntent
│       └── createConnectAccount
│
├── scanning/
│   ├── mutations.ts         # Scan operations
│   │   ├── scanTicket
│   │   └── manualCheckin
│   │
│   └── queries.ts           # Scan queries
│       ├── canScanEvent
│       ├── searchTickets
│       └── getScanHistory
│
├── email/
│   └── send.ts              # Email delivery (action)
│       └── sendTicketEmail
│
├── users/
│   ├── mutations.ts         # User operations
│   │   ├── registerUser
│   │   ├── updateProfile
│   │   └── saveStripeConnectAccount
│   │
│   └── queries.ts           # User queries
│       ├── getCurrentUser
│       └── getUserTickets
│
└── _generated/              # Convex auto-generated files
    ├── api.ts               # API client
    ├── server.ts            # Server helpers
    └── dataModel.ts         # Type-safe data model
```

---

## Docs Directory

Documentation for PRD, architecture, and user stories.

```
docs/
├── prd.md                   # Main PRD (executive summary, MVP scope)
│
├── prd/                     # Sharded epic documents
│   ├── epic-01-authentication.md
│   ├── epic-02-events.md
│   ├── epic-03-ticketing.md
│   ├── epic-04-user-dashboard.md
│   ├── epic-05-scanning.md
│   ├── epic-06-discovery.md
│   └── technical-specs.md   # Complete technical specifications
│
├── architecture/            # Architecture documentation
│   ├── coding-standards.md  # Development guidelines
│   ├── tech-stack.md        # Technology choices & rationale
│   └── source-tree.md       # This file (folder structure)
│
├── stories/                 # Executable user stories
│   ├── _template.md         # Story template (BMAD format)
│   ├── story-2.1-save-the-date-event.md
│   ├── story-2.2-free-event.md
│   └── ... (24 total stories)
│
└── DEVELOPMENT_ROADMAP.md   # Sprint-by-sprint plan
```

---

## Lib Directory

Shared utilities and helper functions.

```
lib/
├── utils.ts                 # General utilities
│   ├── cn()                 # Tailwind class merger
│   ├── formatCurrency()     # Money formatting
│   └── formatDate()         # Date formatting
│
├── validations.ts           # Zod schemas
│   ├── EventSchema
│   ├── TicketSchema
│   └── OrderSchema
│
└── constants.ts             # App constants
    ├── CATEGORIES
    ├── EVENT_TYPES
    └── PLATFORM_FEE_PERCENTAGE
```

---

## Public Directory

Static assets served directly by Next.js.

```
public/
├── manifest.json            # PWA manifest (scanner app)
├── icons/
│   ├── scanner-192.png
│   ├── scanner-512.png
│   └── favicon.ico
├── sounds/
│   ├── success.mp3          # Valid scan beep
│   └── error.mp3            # Invalid scan beep
└── images/
    └── logo.svg             # SteppersLife logo
```

---

## Naming Conventions

### Files

```bash
# React Components (PascalCase)
EventCard.tsx
TicketCheckout.tsx

# Pages (page.tsx)
app/events/page.tsx

# Layouts (layout.tsx)
app/(public)/layout.tsx

# API Routes (route.ts)
app/api/webhooks/stripe/route.ts

# Utilities (camelCase)
lib/formatCurrency.ts
lib/validateEmail.ts

# Convex Functions (camelCase)
convex/events/mutations.ts → createEvent, updateEvent
convex/events/queries.ts → getEvent, getPublicEvents
```

### Folders

```bash
# Route Groups (parentheses)
app/(auth)/
app/(public)/

# Dynamic Routes (brackets)
app/events/[eventId]/

# Domains (plural or singular)
components/events/
components/tickets/
convex/orders/
```

---

## Import Paths

### Absolute Imports (`@/`)

```typescript
// ✅ Use absolute imports for cleaner code
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

// ❌ Avoid relative imports (confusing)
import { Button } from "../../../../components/ui/button";
```

**Configuration:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## File Size Guidelines

- **Components:** < 300 lines (split into smaller components if larger)
- **Pages:** < 200 lines (extract logic to hooks/utils)
- **Convex Functions:** < 150 lines per function
- **Utils:** < 100 lines per file

---

## Epic → File Mapping

| Epic | App Routes | Components | Convex |
|------|------------|------------|--------|
| Epic 1: Auth | `(auth)/login`, `(auth)/register` | `auth/LoginForm`, `auth/GoogleSignInButton` | `users/mutations`, `users/queries` |
| Epic 2: Events | `organizer/events/*` | `events/EventForm`, `events/EventCard` | `events/mutations`, `events/queries` |
| Epic 3: Ticketing | `events/[id]`, `checkout` | `tickets/CheckoutForm`, `tickets/TicketCard` | `orders/mutations`, `payments/stripe` |
| Epic 4: User Dashboard | `dashboard/tickets/*` | `tickets/TicketCard`, `tickets/QRCodeDisplay` | `users/queries`, `tickets/queries` |
| Epic 5: Scanning | `scan/[eventId]` | `scanning/QRScanner`, `scanning/ManualLookup` | `scanning/mutations`, `scanning/queries` |
| Epic 6: Discovery | `events`, `/` | `events/EventSearch`, `events/CategoryFilter` | `events/queries (searchEvents)` |

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** Development Team

**Next Review:** When adding new route groups or major refactoring
