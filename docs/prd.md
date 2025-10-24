# Product Requirements Document: SteppersLife Event Ticketing Platform
## MVP Build-Ready Version

**Version:** 1.0 (Build-Ready)
**Date:** October 24, 2025
**Product Manager:** John (PM Agent)
**Status:** Approved for Development
**Timeline:** 8-12 Weeks (MVP)

---

## 1. Executive Summary

The SteppersLife Event Ticketing Platform enables event organizers to create, promote, and manage events with flexible ticketing options. This PRD defines the **Minimum Viable Product (MVP)** scope—everything developers need to build the first production-ready version of the platform.

### MVP Scope

This MVP focuses on core event ticketing functionality:

✅ **In Scope (Build This):**
- User authentication (email/password + Google OAuth)
- Three event types: Save the Date, Free Events, Single-Day Ticketed Events
- Stripe Connect payment processing
- QR code generation and ticket delivery
- Mobile QR scanner (PWA)
- Event search and discovery
- User ticket dashboard

❌ **Out of Scope (Phase 2+):**
- Multi-day events and bundles
- Queue system for high-demand events
- Cash payments via authorized sellers
- Payment splitting
- Ticket transfers/resale
- Multiple ticket tiers (Early Bird, VIP)
- Reserved seating

### Tech Stack

```
Frontend:  Next.js 16.0, React 19, TypeScript, Tailwind CSS 4.x
Backend:   Convex v1.28.0 (Real-time BaaS)
Auth:      @convex-dev/auth v0.0.90
Payments:  Stripe v19.1.0, Stripe Connect
Deploy:    PM2, Port 3004, Production
```

---

## 2. Goals & Success Metrics

### Primary Goals
1. Enable event organizers to create and publish events in < 10 minutes
2. Provide seamless ticket purchasing experience (< 2 min checkout)
3. Deliver reliable QR-based event entry system (>98% scan success)
4. Support real-time inventory updates across all clients

### Success Metrics (First Month Post-Launch)
| Metric | Target |
|--------|--------|
| Events Created | 50+ |
| Tickets Sold | 500+ |
| Checkout Completion Rate | >80% |
| Payment Success Rate | >95% |
| Scan Success Rate | >98% |
| Page Load Time | <2s (p95) |
| System Uptime | >99.5% |

---

## 3. User Personas

### Event Organizer
**Profile:** Community members who create and manage events
**Goals:**
- Quickly create professional event listings
- Accept online payments with minimal fees
- Track ticket sales in real-time
- Validate attendees at event entry

### Ticket Buyer
**Profile:** Community members purchasing event tickets
**Goals:**
- Discover relevant events easily
- Purchase tickets quickly and securely
- Access tickets on mobile device
- Receive immediate confirmation

### Event Staff
**Profile:** Volunteers/staff scanning tickets at event entry
**Goals:**
- Quickly validate tickets via QR scan
- Handle edge cases (duplicate scans, lost tickets)
- Work offline when internet is unreliable

---

## 4. Product Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────┐
│                    Users (Web + Mobile)                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Next.js 16 Frontend (Port 3004)             │
│              • Server Components (React 19)              │
│              • Client Components (Interactive)           │
│              • Middleware (Auth, Rate Limiting)          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         Convex Real-Time Backend (BaaS)                  │
│         expert-vulture-775.convex.cloud                  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Database    │  │  Functions   │  │  File Storage│  │
│  │  (Real-time) │  │  (Serverless)│  │  (Images/QR) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
┌─────────▼─────────┐   ┌───────▼────────┐
│  @convex-dev/auth │   │ Stripe Connect │
│  • Google OAuth   │   │ • Payments     │
│  • Email/Password │   │ • Splits       │
└───────────────────┘   └────────────────┘
```

### Data Flow: Ticket Purchase

```
1. User → Browse Events → Select Tickets
                   ↓
2. Convex → Reserve Inventory (5 min hold)
                   ↓
3. Stripe → Create Payment Intent (with Connect split)
                   ↓
4. User → Submit Payment (Stripe Elements)
                   ↓
5. Stripe Webhook → Payment Confirmed
                   ↓
6. Convex → Confirm Order → Generate QR Codes → Send Email
                   ↓
7. Real-time Update → Inventory decrements for all clients
```

---

## 5. Epics & User Stories

This PRD is sharded into detailed epic files. Each epic contains developer-ready user stories with:
- Technical implementation notes
- Convex functions to create
- React components needed
- Database schema references
- API specifications
- Acceptance criteria

### Epic 1: Authentication & User Management
**File:** [epic-01-authentication.md](./prd/epic-01-authentication.md)

**Stories:**
- 1.1: User Registration with Email/Password
- 1.2: User Login
- 1.3: Google OAuth Sign-In
- 1.4: User Profile Management

**Priority:** P0 (Critical)
**Sprint:** Week 1-2

---

### Epic 2: Event Creation & Management
**File:** [epic-02-events.md](./prd/epic-02-events.md)

**Stories:**
- 2.1: Create Save the Date Event
- 2.2: Create Free Event with Door Pricing
- 2.3: Create Single-Day Ticketed Event
- 2.4: Stripe Connect Onboarding
- 2.5: Event Listing (Organizer Dashboard)
- 2.6: Edit Event
- 2.7: Publish Event

**Priority:** P0 (Critical)
**Sprint:** Week 3-4

---

### Epic 3: Ticket Purchase & Payment Processing
**File:** [epic-03-ticketing.md](./prd/epic-03-ticketing.md)

**Stories:**
- 3.1: Event Detail Page (Public)
- 3.2: Real-Time Ticket Inventory
- 3.3: Ticket Purchase (Checkout)
- 3.4: Stripe Payment Processing
- 3.5: QR Code Generation
- 3.6: Ticket Email Delivery

**Priority:** P0 (Critical)
**Sprint:** Week 5-6

---

### Epic 4: User Ticket Management
**File:** [epic-04-user-dashboard.md](./prd/epic-04-user-dashboard.md)

**Stories:**
- 4.1: My Tickets Dashboard
- 4.2: Ticket Detail View
- 4.3: Order History

**Priority:** P1 (High)
**Sprint:** Week 7

---

### Epic 5: Event Entry & QR Scanning
**File:** [epic-05-scanning.md](./prd/epic-05-scanning.md)

**Stories:**
- 5.1: Scanner PWA Setup
- 5.2: QR Code Scanning
- 5.3: Manual Ticket Lookup
- 5.4: Scan History

**Priority:** P0 (Critical)
**Sprint:** Week 8

---

### Epic 6: Search & Discovery
**File:** [epic-06-discovery.md](./prd/epic-06-discovery.md)

**Stories:**
- 6.1: Event Listing Page
- 6.2: Category Filtering
- 6.3: Event Search
- 6.4: Homepage Design

**Priority:** P1 (High)
**Sprint:** Week 9-10

---

## 6. Technical Specifications

**File:** [technical-specs.md](./prd/technical-specs.md)

Comprehensive technical documentation including:
- Complete Convex database schema
- API specifications for all functions
- Authentication & authorization patterns
- QR code generation & validation
- Payment processing flows
- Security requirements
- Performance targets

---

## 7. Definition of Done

Before marking MVP as complete, all of the following must be true:

### Functional Requirements
- [ ] All P0 user stories completed and tested
- [ ] Users can create 3 event types and publish
- [ ] Users can purchase tickets with Stripe
- [ ] Tickets delivered via email with QR codes
- [ ] Scanner validates tickets successfully
- [ ] Events are searchable and browsable

### Non-Functional Requirements
- [ ] Mobile-responsive on all pages (320px - 1920px)
- [ ] Lighthouse score > 85 on all pages
- [ ] Page load time < 2 seconds (p95)
- [ ] Zero critical or high-severity bugs
- [ ] E2E tests pass for main user flows

### Technical Requirements
- [ ] Stripe Connect integration working in production
- [ ] Platform fees configurable
- [ ] Email delivery reliable (>99% success rate)
- [ ] Scanner works offline (basic mode)
- [ ] Real-time inventory updates functional

### Documentation
- [ ] README with setup instructions
- [ ] Environment variables documented
- [ ] Organizer user guide published
- [ ] Developer onboarding guide created

---

## 8. Sprint Plan

### Sprint 1 (Weeks 1-2): Foundation
- Set up project structure
- Configure Convex and authentication
- Implement user registration and login
- Google OAuth integration

### Sprint 2 (Weeks 3-4): Event Creation
- Build all 3 event types
- Stripe Connect onboarding
- Organizer dashboard
- Event editing

### Sprint 3 (Weeks 5-6): Ticketing
- Public event pages
- Ticket purchase flow
- Stripe payment processing
- QR code generation
- Email delivery

### Sprint 4 (Week 7): User Dashboard
- My Tickets page
- Ticket detail view
- Order history

### Sprint 5 (Week 8): Scanning
- Scanner PWA
- QR code validation
- Manual ticket lookup
- Scan logging

### Sprint 6 (Weeks 9-10): Discovery
- Event listing page
- Search functionality
- Category filtering
- Homepage design

### Sprint 7 (Weeks 11-12): Polish
- End-to-end testing
- Mobile responsiveness
- Performance optimization
- Bug fixes
- Documentation

---

## 9. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stripe Connect onboarding friction | High | Clear documentation, support chat, progressive onboarding |
| Scanner compatibility issues | High | Extensive mobile testing, fallback to manual lookup |
| Email delivery failures | Medium | Use reliable service (Resend), implement retry logic |
| Payment processing failures | High | Robust error handling, automatic refunds, monitoring |
| Performance degradation | Medium | Lazy loading, code splitting, caching, CDN |
| Real-time sync issues | Medium | Convex handles this natively, test under load |

---

## 10. Post-MVP Roadmap

After successful MVP launch, prioritize these features based on user feedback:

### Phase 2 (Months 4-6)
1. Multi-day events with bundle pricing
2. Multiple ticket tiers (Early Bird, VIP, General Admission)
3. Discount codes and promotions
4. Queue system for high-demand events
5. Ticket transfer between users

### Phase 3 (Months 7-9)
1. Authorized seller network with cash payments
2. Payment splitting for group purchases
3. Event analytics dashboard
4. Email marketing tools
5. Waitlist for sold-out events

---

## 11. Development Guidelines

### Coding Standards
- TypeScript strict mode enabled
- ESLint rules enforced
- Prettier for code formatting
- Conventional commits for git

### Component Structure
```tsx
"use client"; // Only if client-side interactivity needed

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  eventId: string;
}

export function ComponentName({ eventId }: Props) {
  const [state, setState] = useState();
  const mutation = useMutation(api.path.mutation);

  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  );
}
```

### Convex Function Structure
```typescript
// convex/path/mutations.ts
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const functionName = mutation({
  args: {
    eventId: v.id("events"),
    // ... other args
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Business logic
    const result = await ctx.db.insert("table", { ... });

    return result;
  },
});
```

### Git Workflow
```bash
# Feature branch naming
feature/story-number-short-description
# Example: feature/1.1-user-registration

# Commit message format
type(scope): subject
# Example: feat(auth): add email verification flow

# Types: feat, fix, docs, style, refactor, test, chore
```

---

## 12. Dependencies & Prerequisites

### External Services Setup Required
- **Stripe Account:** Set up Stripe Connect for marketplace payments
- **Email Service:** Configure Resend or SendGrid for ticket delivery
- **Google OAuth:** Create OAuth credentials for Google sign-in
- **Domain & SSL:** Configure events.stepperslife.com with HTTPS

### Convex Setup
- Convex project already deployed: `expert-vulture-775.convex.cloud`
- Configure production environment variables
- Set up scheduled functions (crons)

---

## Document Control

**Approval Status:** ✅ Approved for Development

**Next Steps:**
1. ✅ PRD approved and sharded
2. ⏳ Scrum Master begins sprint planning
3. ⏳ Developers set up local environment
4. ⏳ Begin Sprint 1: Authentication & Foundation

**Revision History:**
- v1.0 - October 24, 2025 - Build-ready PRD created from comprehensive PRD and MVP plan
