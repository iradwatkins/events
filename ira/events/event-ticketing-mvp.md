# MVP Development Plan: SteppersLife Event Ticketing System

**Version:** 1.0  
**Date:** October 24, 2025  
**Product Owner:** BMAD PO Agent  
**Status:** Approved for Development

---

## 1. Executive Summary

This document defines the Minimum Viable Product (MVP) for the SteppersLife Event Ticketing System. The MVP focuses on core functionality that enables event organizers to create and manage events, sell tickets with Stripe Connect payments, and provides attendees with a seamless ticket purchase experience. Advanced features like queue systems, cash payments, and multi-day events are deferred to Phase 2.

### MVP Timeline: 8-12 Weeks
- **Weeks 1-2**: Foundation & Authentication
- **Weeks 3-4**: Event Creation & Management  
- **Weeks 5-6**: Ticketing & Payments
- **Weeks 7-8**: QR Codes & Scanning
- **Weeks 9-10**: Search & Discovery
- **Weeks 11-12**: Testing & Polish

---

## 2. MVP Scope

### 2.1 In Scope (Phase 1)

#### ✅ Core Features
1. **User Authentication**
   - Email/password registration and login
   - Google OAuth sign-in
   - User profile management

2. **Event Creation (3 Types)**
   - Save the Date events (image + basic info)
   - Free events with door price display
   - Single-day ticketed events

3. **Ticket Sales**
   - Single ticket type per event
   - Fixed pricing only (no early bird/tiered)
   - Stripe Connect payment processing
   - Real-time inventory tracking
   - Basic purchase limits (max per order)

4. **Ticket Management**
   - QR code generation for tickets
   - Email delivery of tickets
   - View tickets in user dashboard
   - Order history

5. **Event Entry**
   - Mobile-friendly QR scanner (PWA)
   - Basic ticket validation
   - Manual ticket lookup by email/name
   - Scan history logging

6. **Search & Discovery**
   - Browse all published events
   - Filter by category (Set, Workshop, Cruise, etc.)
   - Search by event name/location
   - Event detail pages

7. **Organizer Tools**
   - Event creation and editing
   - Stripe Connect onboarding
   - Basic sales dashboard
   - Export attendee list

### 2.2 Out of Scope (Phase 2+)

#### ❌ Deferred Features
- Multi-day events and bundles
- Multiple ticket tiers per event
- Queue system for high-demand events
- Cash payment with seller verification
- Authorized seller network
- Payment splitting
- Ticket transfers/resale
- Event staff management (beyond basic scanning)
- Discount codes
- Waitlist for sold-out events
- Reserved seating
- Event analytics and reporting
- Email marketing tools
- Social features (friends, "Who's Going")
- Mobile native apps (PWA only for MVP)

---

## 3. Technical Foundation

### 3.1 Tech Stack (From Architecture)
```
Frontend:  Next.js 16.0.0, React 19.2.0, TypeScript, Tailwind CSS 4.x
Backend:   Convex v1.28.0 (expert-vulture-775.convex.cloud)
Auth:      @convex-dev/auth v0.0.90
Payments:  Stripe v19.1.0, Stripe Connect
Deploy:    PM2, Port 3004, Node.js 22.19.0
```

### 3.2 MVP Database Schema

For MVP, we'll implement a simplified version of the full schema:

```typescript
// Simplified MVP Schema

export default defineSchema({
  users: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  events: defineTable({
    name: v.string(),
    description: v.string(),
    organizerId: v.id("users"),
    organizerName: v.string(),
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
    startDate: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    location: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
    }),
    images: v.array(v.string()),
    categories: v.array(v.string()),
    doorPrice: v.optional(v.string()),
    stripeConnectAccountId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_status", ["status"]),

  tickets: defineTable({
    eventId: v.id("events"),
    ticketType: v.string(),
    price: v.number(),
    quantityTotal: v.number(),
    quantitySold: v.number(),
    maxPerOrder: v.number(),
    salesStart: v.number(),
    salesEnd: v.number(),
    active: v.boolean(),
  }).index("by_event", ["eventId"]),

  orders: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    orderNumber: v.string(),
    quantity: v.number(),
    totalAmount: v.number(),
    paymentStatus: v.union(
      v.literal("PENDING"),
      v.literal("COMPLETED"),
      v.literal("FAILED")
    ),
    stripePaymentIntentId: v.optional(v.string()),
    buyerName: v.string(),
    buyerEmail: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"]),

  ticketInstances: defineTable({
    orderId: v.id("orders"),
    ticketId: v.id("tickets"),
    eventId: v.id("events"),
    ticketNumber: v.string(),
    qrCode: v.string(),
    qrHash: v.string(),
    status: v.union(
      v.literal("VALID"),
      v.literal("SCANNED"),
      v.literal("CANCELLED")
    ),
    scannedAt: v.optional(v.number()),
    ownerId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_qr_hash", ["qrHash"]),

  scans: defineTable({
    ticketInstanceId: v.id("ticketInstances"),
    eventId: v.id("events"),
    scannedBy: v.id("users"),
    valid: v.boolean(),
    scannedAt: v.number(),
  }).index("by_event", ["eventId"]),
});
```

---

## 4. MVP Feature Breakdown

## Epic 1: Authentication & User Management

### Story 1.1: User Registration with Email/Password
**Priority:** P0 (Critical)  
**Effort:** 3 points  
**Sprint:** Week 1

**Acceptance Criteria:**
- User can register with email and password
- Password must meet requirements (8+ chars, 1 uppercase, 1 number)
- Email verification email sent upon registration
- User cannot log in until email verified
- Registration form shows validation errors

**Technical Tasks:**
- Set up @convex-dev/auth with email provider
- Create registration Convex mutation
- Build registration form component
- Implement email verification flow
- Add form validation with Zod

---

### Story 1.2: User Login
**Priority:** P0 (Critical)  
**Effort:** 2 points  
**Sprint:** Week 1

**Acceptance Criteria:**
- User can log in with verified email/password
- Session persists across browser refreshes
- Invalid credentials show error message
- "Remember me" option available
- Redirect to homepage after successful login

**Technical Tasks:**
- Create login Convex mutation
- Build login form component
- Implement session management
- Add "Remember me" functionality
- Handle authentication errors

---

### Story 1.3: Google OAuth Sign-In
**Priority:** P1 (High)  
**Effort:** 2 points  
**Sprint:** Week 1

**Acceptance Criteria:**
- User can sign in with Google account
- Google profile picture and name auto-populated
- Redirect to homepage after successful sign-in
- Works seamlessly on mobile devices

**Technical Tasks:**
- Configure Google OAuth in @convex-dev/auth
- Add Google sign-in button to login/register pages
- Handle OAuth callback
- Map Google user data to Convex user schema

---

### Story 1.4: User Profile Page
**Priority:** P2 (Medium)  
**Effort:** 2 points  
**Sprint:** Week 2

**Acceptance Criteria:**
- User can view profile information
- User can edit name, phone number
- User can upload profile picture
- Changes saved successfully

**Technical Tasks:**
- Create profile page component
- Build profile edit form
- Implement Convex file storage for profile pictures
- Create update profile mutation

---

## Epic 2: Event Creation & Management

### Story 2.1: Create Save the Date Event
**Priority:** P0 (Critical)  
**Effort:** 3 points  
**Sprint:** Week 3

**Acceptance Criteria:**
- Organizer can create "Save the Date" event type
- Required fields: name, date, organizer name, category, featured image
- Image upload supports JPG, PNG, WebP (max 5MB)
- Event saved as DRAFT status
- Success message shown after creation

**Technical Tasks:**
- Create event creation form component
- Implement image upload to Convex storage
- Create event creation Convex mutation
- Add form validation
- Build event type selection UI

---

### Story 2.2: Create Free Event
**Priority:** P0 (Critical)  
**Effort:** 3 points  
**Sprint:** Week 3

**Acceptance Criteria:**
- Organizer can create "Free Event" type
- All event details captured: name, date, time, location, description
- Door price displayed (text only, no payment)
- Event saved as DRAFT
- Location address validated

**Technical Tasks:**
- Add location input with address validation
- Build rich text editor for description (TipTap or similar)
- Create time picker component
- Extend event creation mutation

---

### Story 2.3: Create Ticketed Event (Single-Day)
**Priority:** P0 (Critical)  
**Effort:** 5 points  
**Sprint:** Week 4

**Acceptance Criteria:**
- Organizer can create "Ticketed Event" type
- Event requires Stripe Connect account setup
- Single ticket type configuration: name, price, quantity
- Sales period: start date, end date
- Max tickets per order configurable
- Event saved as DRAFT

**Technical Tasks:**
- Build ticket configuration form
- Create Stripe Connect onboarding flow
- Implement Stripe account verification check
- Create ticket creation Convex mutation
- Add sales period validation logic

---

### Story 2.4: Stripe Connect Onboarding
**Priority:** P0 (Critical)  
**Effort:** 5 points  
**Sprint:** Week 4

**Acceptance Criteria:**
- Organizer directed to Stripe Connect setup before creating ticketed events
- Stripe Express account created
- Onboarding link generated and opened in new tab
- Account status tracked (pending, complete, rejected)
- Organizer can only publish ticketed events after completion
- Error handling for failed onboarding

**Technical Tasks:**
- Create Stripe Connect account creation action
- Generate account onboarding link
- Handle onboarding return URLs
- Create webhook handler for account.updated
- Store Connect account ID in events table

---

### Story 2.5: Event Listing (Organizer Dashboard)
**Priority:** P1 (High)  
**Effort:** 3 points  
**Sprint:** Week 4

**Acceptance Criteria:**
- Organizer sees list of their events
- Events grouped by status: Draft, Published, Cancelled
- Each event shows: name, date, status, ticket sales (if applicable)
- Click event to view details or edit
- "Create New Event" button prominent

**Technical Tasks:**
- Build organizer dashboard page
- Create event list component
- Query events by organizer ID
- Add status filters
- Implement event card design

---

### Story 2.6: Edit Event
**Priority:** P1 (High)  
**Effort:** 3 points  
**Sprint:** Week 4

**Acceptance Criteria:**
- Organizer can edit event details
- Cannot change event type after creation
- Changes to ticketed events show warning if tickets sold
- Success message after save
- Form pre-populated with existing data

**Technical Tasks:**
- Create event edit page
- Build edit form (reuse creation form)
- Create update event Convex mutation
- Add validation for sold tickets
- Implement change warnings

---

### Story 2.7: Publish Event
**Priority:** P1 (High)  
**Effort:** 2 points  
**Sprint:** Week 5

**Acceptance Criteria:**
- Organizer can publish draft events
- Published events visible to public
- Cannot publish ticketed event without complete Stripe setup
- Validation ensures all required fields complete
- Confirmation modal before publishing

**Technical Tasks:**
- Add publish button to event detail page
- Create publish event mutation
- Implement publishing validations
- Build confirmation modal
- Update event status to PUBLISHED

---

## Epic 3: Ticket Purchase Flow

### Story 3.1: Event Detail Page (Public)
**Priority:** P0 (Critical)  
**Effort:** 4 points  
**Sprint:** Week 5

**Acceptance Criteria:**
- Public can view published events
- Event page shows: name, description, date, time, location, images
- For ticketed events: ticket availability, price, purchase button
- For free events: door price displayed, "RSVP" or "Get Info" button
- Mobile-responsive design

**Technical Tasks:**
- Build event detail page component
- Create public event query (filter by status=PUBLISHED)
- Display event images in carousel/gallery
- Build ticket availability display
- Add responsive layout

---

### Story 3.2: Real-Time Ticket Inventory
**Priority:** P0 (Critical)  
**Effort:** 3 points  
**Sprint:** Week 5

**Acceptance Criteria:**
- Ticket availability updates in real-time
- Shows "X tickets remaining"
- Sold out status displayed when inventory depleted
- Cannot purchase if sold out
- Updates automatically when others purchase

**Technical Tasks:**
- Implement Convex real-time subscription for ticket availability
- Create inventory display component
- Add sold out UI state
- Disable purchase button when sold out

---

### Story 3.3: Ticket Purchase (Checkout)
**Priority:** P0 (Critical)  
**Effort:** 5 points  
**Sprint:** Week 6

**Acceptance Criteria:**
- User can select ticket quantity (up to max per order)
- Checkout shows: event info, ticket details, total cost, fees
- User enters payment information via Stripe Elements
- Payment processed through Stripe Connect
- Success page shown after purchase
- Tickets emailed immediately

**Technical Tasks:**
- Build checkout page component
- Integrate Stripe Elements (Card Element)
- Create payment processing Convex action
- Implement order creation mutation
- Generate and send ticket emails
- Create success page

---

### Story 3.4: Stripe Payment Processing
**Priority:** P0 (Critical)  
**Effort:** 5 points  
**Sprint:** Week 6

**Acceptance Criteria:**
- Payment intent created with correct amount
- Platform fee deducted (e.g., 2.5%)
- Remaining funds transferred to organizer's Connect account
- Payment confirmation returned to frontend
- Failed payments handled gracefully
- Webhook confirms payment completion

**Technical Tasks:**
- Create Stripe payment intent action
- Calculate platform fees
- Set up transfer_data for Connect account
- Handle payment_intent.succeeded webhook
- Implement error handling for failed payments
- Test with Stripe test cards

---

### Story 3.5: QR Code Generation
**Priority:** P0 (Critical)  
**Effort:** 3 points  
**Sprint:** Week 6

**Acceptance Criteria:**
- Unique QR code generated for each ticket
- QR code contains: ticket ID, timestamp, HMAC signature
- QR code embedded in ticket email
- QR code downloadable as PNG
- QR code accessible in user dashboard

**Technical Tasks:**
- Implement QR code generation library (qrcode)
- Create HMAC signature logic
- Generate QR code on ticket instance creation
- Store QR code in Convex (base64 or file storage)
- Add QR code to email template

---

### Story 3.6: Ticket Email Delivery
**Priority:** P0 (Critical)  
**Effort:** 3 points  
**Sprint:** Week 6

**Acceptance Criteria:**
- Email sent immediately after successful purchase
- Email contains: event details, ticket QR code, order number
- Email includes "Add to Calendar" link
- Professional email template design
- Resend option in user dashboard

**Technical Tasks:**
- Set up email service (Resend or SendGrid)
- Create ticket email template (HTML + text)
- Implement email sending in Convex action
- Generate "Add to Calendar" .ics file
- Add email resend functionality

---

## Epic 4: User Ticket Management

### Story 4.1: My Tickets Dashboard
**Priority:** P1 (High)  
**Effort:** 3 points  
**Sprint:** Week 7

**Acceptance Criteria:**
- User sees all their tickets
- Tickets grouped: Upcoming, Past
- Each ticket shows: event name, date, QR code preview, order number
- Click ticket to view full details
- Mobile-responsive

**Technical Tasks:**
- Build My Tickets page
- Query ticket instances by user ID
- Create ticket card component
- Implement upcoming/past filtering
- Add ticket detail modal

---

### Story 4.2: Ticket Detail View
**Priority:** P1 (High)  
**Effort:** 2 points  
**Sprint:** Week 7

**Acceptance Criteria:**
- User can view full ticket details
- QR code displayed large
- Event information shown
- Download QR as PNG option
- Resend ticket email option

**Technical Tasks:**
- Build ticket detail page
- Display QR code (large size)
- Add download QR button
- Implement resend email button
- Show ticket status (valid, scanned, cancelled)

---

### Story 4.3: Order History
**Priority:** P2 (Medium)  
**Effort:** 2 points  
**Sprint:** Week 7

**Acceptance Criteria:**
- User sees all past orders
- Each order shows: event name, date, quantity, total cost, status
- Click order to view details and tickets
- Export orders as PDF option

**Technical Tasks:**
- Build order history page
- Query orders by user ID
- Create order list component
- Add order detail view
- Implement PDF export (optional for MVP)

---

## Epic 5: Event Entry & Scanning

### Story 5.1: Scanner PWA Setup
**Priority:** P0 (Critical)  
**Effort:** 3 points  
**Sprint:** Week 8

**Acceptance Criteria:**
- Scanner accessible as PWA (installable on mobile)
- Works offline (basic functionality)
- Camera permissions requested
- Login required to access scanner
- Only organizer can scan their event tickets

**Technical Tasks:**
- Configure Next.js as PWA
- Create manifest.json with icons
- Build scanner layout (mobile-first)
- Implement authentication check
- Add organizer permission check

---

### Story 5.2: QR Code Scanning
**Priority:** P0 (Critical)  
**Effort:** 5 points  
**Sprint:** Week 8

**Acceptance Criteria:**
- Camera activates when scanner loaded
- QR code detected automatically
- Ticket validated in real-time
- Success: Green screen + beep, shows attendee name
- Error: Red screen + error beep, shows error message
- Duplicate scan prevented

**Technical Tasks:**
- Integrate html5-qrcode library
- Build QR scanner component
- Create ticket validation Convex mutation
- Implement HMAC signature verification
- Add duplicate scan prevention
- Design success/error UI states
- Add audio feedback (beep sounds)

---

### Story 5.3: Manual Ticket Lookup
**Priority:** P1 (High)  
**Effort:** 2 points  
**Sprint:** Week 8

**Acceptance Criteria:**
- Scanner can search tickets by name or email
- Search results show matching tickets
- Click result to manually check-in
- Manual check-in logged separately
- Shows ticket status (valid, already scanned)

**Technical Tasks:**
- Build search interface
- Create ticket search query
- Implement manual check-in mutation
- Add manual check-in flag to scans table
- Display search results

---

### Story 5.4: Scan History
**Priority:** P2 (Medium)  
**Effort:** 2 points  
**Sprint:** Week 9

**Acceptance Criteria:**
- Organizer views all scans for their event
- Shows: attendee name, ticket number, scan time, scanner name
- Filter by date/time
- Export as CSV

**Technical Tasks:**
- Build scan history page
- Query scans by event ID
- Create scan list component
- Add date filters
- Implement CSV export

---

## Epic 6: Search & Discovery

### Story 6.1: Event Listing Page
**Priority:** P0 (Critical)  
**Effort:** 3 points  
**Sprint:** Week 9

**Acceptance Criteria:**
- Public can browse all published events
- Events displayed in grid/list view
- Each event card shows: image, name, date, location, price/free
- Pagination or infinite scroll
- Mobile-responsive

**Technical Tasks:**
- Build event listing page
- Query published events with pagination
- Create event card component
- Implement grid layout
- Add pagination controls

---

### Story 6.2: Category Filtering
**Priority:** P1 (High)  
**Effort:** 2 points  
**Sprint:** Week 9

**Acceptance Criteria:**
- Filter events by category
- Categories: Set, Workshop, Cruise, Outdoors Steppin, Holiday, Weekend, Save the Date
- Multiple categories selectable
- Filter updates event list in real-time
- Category badges on event cards

**Technical Tasks:**
- Build category filter component
- Add category query parameter to event query
- Implement multi-select checkbox UI
- Update event list on filter change

---

### Story 6.3: Event Search
**Priority:** P1 (High)  
**Effort:** 3 points  
**Sprint:** Week 10

**Acceptance Criteria:**
- Search events by name or location
- Search bar prominently placed
- Results update as user types (debounced)
- "No results" state shown when applicable
- Clear search button

**Technical Tasks:**
- Build search input component
- Implement Convex search query (search index)
- Add debouncing (300ms)
- Create "no results" UI
- Add clear button

---

### Story 6.4: Homepage Design
**Priority:** P1 (High)  
**Effort:** 3 points  
**Sprint:** Week 10

**Acceptance Criteria:**
- Attractive hero section with CTA
- "Upcoming Events" section showing next 6 events
- "Popular Categories" with icons
- Footer with links (About, Contact, Terms, Privacy)
- Mobile-responsive

**Technical Tasks:**
- Design hero section with Tailwind
- Build upcoming events carousel/grid
- Create category icons (Lucide React)
- Build footer component
- Implement responsive layout

---

## Epic 7: Testing & Polish

### Story 7.1: End-to-End Testing
**Priority:** P0 (Critical)  
**Effort:** 5 points  
**Sprint:** Week 11

**Acceptance Criteria:**
- All critical user flows tested with Playwright
- Test scenarios: signup, create event, purchase ticket, scan ticket
- Tests pass on CI/CD
- Test coverage report generated

**Technical Tasks:**
- Set up Playwright
- Write E2E tests for main flows
- Configure test environment
- Set up CI/CD pipeline
- Document test scenarios

---

### Story 7.2: Mobile Responsiveness Review
**Priority:** P1 (High)  
**Effort:** 3 points  
**Sprint:** Week 11

**Acceptance Criteria:**
- All pages work on mobile (320px - 768px)
- Touch targets minimum 44px
- No horizontal scrolling
- Images optimized for mobile
- Forms easy to use on mobile

**Technical Tasks:**
- Test all pages on mobile devices
- Fix responsive issues
- Optimize images with Next.js Image
- Improve form UX for mobile
- Test on iOS and Android

---

### Story 7.3: Performance Optimization
**Priority:** P1 (High)  
**Effort:** 3 points  
**Sprint:** Week 12

**Acceptance Criteria:**
- Page load time < 2 seconds
- First Contentful Paint < 1.5 seconds
- Lighthouse score > 90
- Images lazy-loaded
- Code splitting implemented

**Technical Tasks:**
- Run Lighthouse audits
- Optimize bundle size
- Implement lazy loading
- Add loading states
- Compress images

---

### Story 7.4: Error Handling & User Feedback
**Priority:** P1 (High)  
**Effort:** 2 points  
**Sprint:** Week 12

**Acceptance Criteria:**
- All errors show user-friendly messages
- Toast notifications for actions (success/error)
- Loading states for async operations
- 404 page designed
- 500 error page designed

**Technical Tasks:**
- Implement global error boundary
- Add toast notification system (shadcn/ui)
- Create loading skeletons
- Design 404 and 500 pages
- Test error scenarios

---

### Story 7.5: Documentation
**Priority:** P2 (Medium)  
**Effort:** 2 points  
**Sprint:** Week 12

**Acceptance Criteria:**
- README with setup instructions
- Environment variables documented
- API documentation (Convex functions)
- User guide for organizers
- FAQs page

**Technical Tasks:**
- Write README.md
- Document .env variables
- Generate API docs from Convex schema
- Create organizer guide
- Build FAQ page

---

## 5. MVP User Flows

### 5.1 Organizer Flow
```
1. Sign up / Log in
2. Complete Stripe Connect onboarding (for ticketed events)
3. Create event:
   - Save the Date → Fill basic info + image → Publish
   - Free Event → Fill all details + door price → Publish
   - Ticketed Event → Fill details + configure tickets → Publish
4. View event in dashboard
5. Monitor ticket sales in real-time
6. Use scanner PWA to check-in attendees
7. View scan history and attendee list
```

### 5.2 Ticket Buyer Flow
```
1. Browse events on homepage
2. Filter by category or search by name
3. Click event to view details
4. Select ticket quantity
5. Checkout with Stripe
6. Receive ticket email with QR code
7. View ticket in "My Tickets" dashboard
8. Show QR code at event for entry
```

### 5.3 Scanner Flow
```
1. Log in to scanner app (PWA)
2. Select event to scan for
3. Grant camera permission
4. Point camera at attendee's QR code
5. Ticket validated instantly
6. Show success/error feedback
7. Repeat for next attendee
```

---

## 6. Definition of Done

For MVP release, the following must be complete:

### Functional Requirements
- ✅ All P0 and P1 stories completed
- ✅ User can create 3 event types and publish
- ✅ User can purchase tickets with Stripe
- ✅ Tickets delivered via email with QR codes
- ✅ Scanner can validate tickets
- ✅ Events searchable and browsable

### Non-Functional Requirements
- ✅ Mobile-responsive on all pages
- ✅ Lighthouse score > 85
- ✅ Page load time < 2 seconds
- ✅ Zero critical bugs
- ✅ E2E tests pass for main flows

### Business Requirements
- ✅ Stripe Connect integration working
- ✅ Platform fees configurable
- ✅ Email delivery reliable
- ✅ Scanner works offline (basic mode)

### Documentation
- ✅ README complete
- ✅ Environment variables documented
- ✅ User guide for organizers
- ✅ Developer setup guide

---

## 7. Success Metrics

Track these KPIs after MVP launch:

### User Metrics
- **Target:** 50 events created in first month
- **Target:** 500 tickets sold in first month
- **Target:** 80% checkout completion rate
- **Target:** <5% cart abandonment rate

### Technical Metrics
- **Target:** 99.5% uptime
- **Target:** <500ms API response time (p95)
- **Target:** <2s page load time (p95)
- **Target:** <1% payment failure rate

### Business Metrics
- **Target:** $5,000 in ticket sales (GMV) in first month
- **Target:** $125 in platform fees in first month (2.5% avg)
- **Target:** 30% organizer retention (create 2nd event)

---

## 8. Risks & Mitigation

### High-Risk Items

**Risk:** Stripe Connect onboarding completion rate low  
**Mitigation:** Simplified onboarding flow, clear instructions, support chat

**Risk:** Scanner not working reliably on all devices  
**Mitigation:** Extensive mobile testing, fallback to manual lookup

**Risk:** Email delivery failures  
**Mitigation:** Use reliable service (Resend/SendGrid), implement retry logic

**Risk:** Payment processing failures  
**Mitigation:** Robust error handling, automatic refunds, support system

**Risk:** Slow page load times affecting conversion  
**Mitigation:** Performance optimization in Sprint 12, lazy loading, code splitting

---

## 9. Post-MVP Roadmap

After MVP launch, prioritize these Phase 2 features based on user feedback:

### Phase 2 (Months 4-6)
1. **Multi-day events and bundles** - #1 most requested
2. **Multiple ticket tiers** (Early Bird, VIP, etc.)
3. **Queue system** for high-demand events
4. **Discount codes** for promotions
5. **Ticket transfers** between users

### Phase 3 (Months 7-9)
1. **Authorized seller network** with cash payments
2. **Payment splitting** for group purchases
3. **Event analytics dashboard** with charts
4. **Email marketing** tools for organizers
5. **Waitlist** for sold-out events

### Phase 4 (Months 10-12)
1. **Reserved seating** with interactive maps
2. **Social features** (friends, "Who's Going")
3. **Mobile native apps** (iOS/Android)
4. **AI-powered recommendations**
5. **Multi-language support**

---

## 10. Development Guidelines

### Coding Standards
- TypeScript strict mode enabled
- ESLint rules enforced
- Prettier for code formatting
- Conventional commits for version control

### Component Structure
```tsx
// Example component structure
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

## 11. Sprint Planning

### Sprint Structure (2-week sprints)

**Sprint 1 (Weeks 1-2): Foundation**
- Authentication (Stories 1.1-1.4)
- Project setup and configuration
- Database schema implementation

**Sprint 2 (Weeks 3-4): Event Creation**
- All 3 event types (Stories 2.1-2.3)
- Stripe Connect onboarding (Story 2.4)
- Organizer dashboard (Stories 2.5-2.6)

**Sprint 3 (Weeks 5-6): Ticketing**
- Public event pages (Story 3.1)
- Ticket purchase flow (Stories 3.2-3.6)
- Payment processing

**Sprint 4 (Weeks 7-8): Scanning**
- User ticket dashboard (Stories 4.1-4.3)
- Scanner PWA (Stories 5.1-5.3)
- QR validation

**Sprint 5 (Weeks 9-10): Discovery**
- Event listing and search (Stories 6.1-6.4)
- Homepage design
- Category filtering

**Sprint 6 (Weeks 11-12): Polish**
- Testing (Story 7.1)
- Mobile optimization (Story 7.2)
- Performance tuning (Story 7.3)
- Error handling (Story 7.4)
- Documentation (Story 7.5)

---

## 12. Appendices

### A. Story Point Reference
- **1 point**: Very small, < 2 hours (e.g., UI fix, copy change)
- **2 points**: Small, 2-4 hours (e.g., simple form, basic query)
- **3 points**: Medium, 4-8 hours (e.g., CRUD page, complex form)
- **5 points**: Large, 1-2 days (e.g., payment integration, complex feature)
- **8 points**: Very large, 3-5 days (should be broken down)

### B. Priority Definitions
- **P0 (Critical)**: Must have for MVP, blocks launch
- **P1 (High)**: Should have for MVP, important but not blocking
- **P2 (Medium)**: Nice to have for MVP, can be deferred
- **P3 (Low)**: Future enhancement, not for MVP

### C. Useful Resources
- Next.js 15 Docs: https://nextjs.org/docs
- Convex Docs: https://docs.convex.dev
- Stripe Connect Guide: https://stripe.com/docs/connect
- shadcn/ui Components: https://ui.shadcn.com
- Radix UI: https://www.radix-ui.com

---

## Document Control

**Approval:**
- [ ] Product Owner
- [ ] Tech Lead
- [ ] Design Lead
- [ ] Stakeholders

**Next Steps:**
1. Review and approval from all stakeholders
2. Scrum Master creates story files in `/docs/stories/`
3. Begin Sprint 1 development
4. Daily standups to track progress
5. Sprint reviews and retrospectives

**Revision History:**
- v1.0 - October 24, 2025 - Initial MVP plan created
