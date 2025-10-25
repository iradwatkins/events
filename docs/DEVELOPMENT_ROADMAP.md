# Development Roadmap
**SteppersLife Event Ticketing Platform MVP**

**Version:** 1.0
**Last Updated:** October 25, 2025
**Total Duration:** 10-12 Weeks

---

## Overview

This roadmap outlines the sprint-by-sprint implementation plan for the SteppersLife MVP. **Authentication is intentionally deferred to the final phase** to accelerate core feature development.

---

## Development Strategy

### Key Decisions

1. **Authentication Last** - Build core features first (events, ticketing, scanning) without auth complexity
2. **Real-time First** - Leverage Convex subscriptions for all UI updates
3. **Incremental Complexity** - Start simple (Save the Date) → add complexity (Ticketed Events)
4. **Test as You Build** - Write tests alongside features (not after)

### Story Dependencies

```
Phase 1: Core Event Management (No Auth)
├── Story 2.1: Save the Date Events
├── Story 2.2: Free Events
├── Story 2.3: Ticketed Events (basic, no Stripe)
└── Story 2.5: Event Listing Dashboard

Phase 2: Payments & Ticketing
├── Story 2.4: Stripe Connect Onboarding
├── Story 3.1: Public Event Detail Pages
├── Story 3.2: Real-Time Inventory
├── Story 3.3: Ticket Checkout
├── Story 3.4: Stripe Payment Processing
├── Story 3.5: QR Code Generation
└── Story 3.6: Email Delivery

Phase 3: Scanning & Discovery
├── Story 5.1: Scanner PWA Setup
├── Story 5.2: QR Code Scanning
├── Story 5.3: Manual Lookup
├── Story 6.1: Event Listing Page
├── Story 6.2: Category Filtering
├── Story 6.3: Event Search
└── Story 6.4: Homepage

Phase 4: User Management & Polish
├── Story 4.1: My Tickets Dashboard
├── Story 4.2: Ticket Detail View
├── Story 4.3: Order History
├── Story 2.6: Edit Event
└── Story 2.7: Publish Event

Phase 5: Authentication (Final)
├── Story 1.1: User Registration
├── Story 1.2: User Login
├── Story 1.3: Google OAuth
├── Story 1.4: User Profile
└── Integrate auth into all existing features
```

---

## Sprint Breakdown

## Sprint 1-2: Foundation & Event Management (Weeks 1-2)

**Goal:** Implement core event creation without authentication

### Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 2.1 | Create Save the Date Event | 3 | Ready |
| 2.2 | Create Free Event | 3 | Pending |
| 2.3 | Create Ticketed Event (No Stripe Yet) | 5 | Pending |
| 2.5 | Event Listing (Organizer Dashboard) | 3 | Pending |

**Total Points:** 14

### Key Deliverables

- [ ] Convex schema (events, tickets tables)
- [ ] Event creation forms (3 types)
- [ ] Image upload functionality
- [ ] Category selection
- [ ] Rich text editor (TipTap)
- [ ] Date/time pickers
- [ ] Organizer dashboard with real-time updates
- [ ] Event cards (grid display)

### Technical Setup

```bash
# Install core dependencies
npm install next@16.0.0 react@19.2.0 convex@1.28.0
npm install @tiptap/react @tiptap/starter-kit
npm install date-fns zod

# shadcn/ui components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card calendar select checkbox textarea

# Start Convex
npx convex dev
```

### Definition of Done

- [ ] All 3 event types can be created
- [ ] Events display in dashboard grid
- [ ] Real-time updates working (new events appear immediately)
- [ ] Images upload successfully
- [ ] Forms validate required fields
- [ ] Mobile responsive on all pages
- [ ] Linting and TypeScript passing

---

## Sprint 3-4: Payments & Ticketing (Weeks 3-4)

**Goal:** Integrate Stripe Connect and enable ticket purchases

### Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 2.4 | Stripe Connect Onboarding | 5 | Pending |
| 3.1 | Public Event Detail Page | 4 | Pending |
| 3.2 | Real-Time Ticket Inventory | 3 | Pending |
| 3.3 | Ticket Purchase Checkout | 5 | Pending |
| 3.4 | Stripe Payment Processing | 5 | Pending |

**Total Points:** 22

### Key Deliverables

- [ ] Stripe Connect account creation
- [ ] Stripe Connect onboarding flow
- [ ] Public event pages (accessible without login)
- [ ] Real-time inventory display
- [ ] Shopping cart/checkout flow
- [ ] Stripe Elements integration
- [ ] Payment intent creation (with Connect split)
- [ ] Webhook handler (payment confirmation)
- [ ] Order confirmation page

### Technical Setup

```bash
# Install Stripe dependencies
npm install stripe@19.1.0 @stripe/stripe-js @stripe/react-stripe-js

# Environment variables
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Configuration

1. Create Stripe Connect platform application
2. Set up Express accounts for organizers
3. Configure webhook endpoint: `/api/webhooks/stripe`
4. Test in Stripe test mode

### Definition of Done

- [ ] Stripe Connect onboarding working
- [ ] Organizer accounts created successfully
- [ ] Public can view ticketed events
- [ ] Inventory updates in real-time
- [ ] Checkout flow complete (no login required for now)
- [ ] Payments process successfully
- [ ] Platform fee (2.5%) deducted correctly
- [ ] Webhook confirms orders
- [ ] Payment success rate >95% in testing

---

## Sprint 5: QR Codes & Email Delivery (Week 5)

**Goal:** Generate QR codes and deliver tickets via email

### Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 3.5 | QR Code Generation | 3 | Pending |
| 3.6 | Ticket Email Delivery | 3 | Pending |

**Total Points:** 6

### Key Deliverables

- [ ] QR code generation with HMAC signatures
- [ ] Ticket instance records created
- [ ] Email template (HTML + QR code)
- [ ] .ics calendar file attachment
- [ ] Email delivery via Resend
- [ ] Email delivery success tracking

### Technical Setup

```bash
# Install dependencies
npm install qrcode@1.5.4 resend@4.0.0

# Environment variables
RESEND_API_KEY=re_...
FROM_EMAIL=tickets@stepperslife.com
QR_CODE_SECRET_KEY=your_secret_key
```

### Email Service Setup

1. Sign up for Resend account
2. Verify domain (stepperslife.com)
3. Create API key
4. Test email delivery

### Definition of Done

- [ ] QR codes generated for all ticket purchases
- [ ] QR codes include HMAC signatures (tamper-proof)
- [ ] Emails sent immediately after payment
- [ ] Emails include event details, QR code, calendar file
- [ ] Email delivery rate >99%
- [ ] Emails render correctly (Gmail, Outlook, Apple Mail)
- [ ] QR codes scannable with phone camera

---

## Sprint 6: Scanner PWA (Week 6)

**Goal:** Build mobile-friendly QR scanner for event entry

### Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 5.1 | Scanner PWA Setup | 3 | Pending |
| 5.2 | QR Code Scanning | 5 | Pending |
| 5.3 | Manual Ticket Lookup | 2 | Pending |
| 5.4 | Scan History | 2 | Pending |

**Total Points:** 12

### Key Deliverables

- [ ] PWA manifest and service worker
- [ ] Camera-based QR scanner
- [ ] QR code validation (HMAC verification)
- [ ] Duplicate scan prevention
- [ ] Success/error feedback (visual + audio)
- [ ] Manual ticket search (name, email, ticket #)
- [ ] Scan history log
- [ ] Offline mode (basic validation)

### Technical Setup

```bash
# Install dependencies
npm install html5-qrcode@2.3.8

# Audio files
public/sounds/success.mp3
public/sounds/error.mp3

# PWA manifest
public/manifest.json
```

### Scanner Configuration

1. Request camera permissions
2. QR code format: `{ ticketId, timestamp, signature }`
3. HMAC validation on server
4. Mark ticket as "SCANNED" in database
5. Log scan event

### Definition of Done

- [ ] Scanner installable as PWA on mobile
- [ ] Camera activates on scanner load
- [ ] QR codes detected automatically
- [ ] Valid tickets show green screen + beep
- [ ] Invalid tickets show red screen + error
- [ ] Duplicate scans prevented
- [ ] Manual lookup works (fallback)
- [ ] Scan history displays correctly
- [ ] Offline mode functional (basic validation)
- [ ] Works on iOS and Android

---

## Sprint 7: Discovery & Homepage (Week 7)

**Goal:** Public event discovery and homepage

### Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 6.1 | Event Listing Page | 3 | Pending |
| 6.2 | Category Filtering | 2 | Pending |
| 6.3 | Event Search | 3 | Pending |
| 6.4 | Homepage Design | 3 | Pending |

**Total Points:** 11

### Key Deliverables

- [ ] Public event listing page (`/events`)
- [ ] Event cards in grid layout
- [ ] Category filter pills
- [ ] Search bar with autocomplete
- [ ] Homepage with hero section
- [ ] Featured events carousel
- [ ] Category links
- [ ] Footer with site links

### Technical Setup

```bash
# Search index in Convex schema
.searchIndex("search_events", {
  searchField: "name",
  filterFields: ["status", "eventType"],
})
```

### Definition of Done

- [ ] Event listing page loads all published events
- [ ] Category filtering works (multi-select)
- [ ] Search returns relevant results
- [ ] Homepage hero is engaging
- [ ] Featured events display
- [ ] Mobile responsive on all pages
- [ ] Page load time <2 seconds
- [ ] SEO meta tags added

---

## Sprint 8: User Dashboard (Week 8)

**Goal:** User ticket management and order history

### Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 4.1 | My Tickets Dashboard | 3 | Pending |
| 4.2 | Ticket Detail View | 2 | Pending |
| 4.3 | Order History | 2 | Pending |

**Total Points:** 7

### Key Deliverables

- [ ] My Tickets dashboard (`/dashboard/tickets`)
- [ ] Upcoming vs. Past tickets grouping
- [ ] Ticket detail page (full QR code)
- [ ] Download QR as PNG
- [ ] Resend email button
- [ ] Order history page
- [ ] Order filtering (status)

### Definition of Done

- [ ] Dashboard displays all user tickets
- [ ] Tickets grouped correctly (upcoming/past)
- [ ] QR codes display full-size
- [ ] Download button works
- [ ] Email resend functional
- [ ] Order history complete
- [ ] Real-time updates (new tickets appear immediately)

---

## Sprint 9: Event Management Enhancements (Week 9)

**Goal:** Event editing and publishing

### Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 2.6 | Edit Event | 3 | Pending |
| 2.7 | Publish Event | 2 | Pending |

**Total Points:** 5

### Key Deliverables

- [ ] Edit event page (pre-populated form)
- [ ] Event update validation
- [ ] Warning when tickets already sold
- [ ] Publish/unpublish toggle
- [ ] Publish validation (Stripe required for ticketed events)
- [ ] Confirmation modal before publishing

### Definition of Done

- [ ] Events editable after creation
- [ ] Changes saved successfully
- [ ] Warning shown if tickets sold
- [ ] Publish requires Stripe account (if ticketed)
- [ ] Published events visible publicly
- [ ] Unpublish hides events from public

---

## Sprint 10: Authentication Integration (Week 10)

**Goal:** Add authentication to all existing features

### Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 1.1 | User Registration | 3 | Pending |
| 1.2 | User Login | 2 | Pending |
| 1.3 | Google OAuth | 2 | Pending |
| 1.4 | User Profile | 2 | Pending |

**Total Points:** 9

### Key Deliverables

- [ ] User registration form
- [ ] Email/password login
- [ ] Google OAuth sign-in
- [ ] Email verification
- [ ] Password reset flow
- [ ] User profile page
- [ ] Profile picture upload
- [ ] Session management

### Authentication Integration Tasks

**Update All Existing Features:**

1. **Event Creation** - Require login, link events to user ID
2. **Event Dashboard** - Filter events by logged-in user
3. **Ticket Purchase** - Pre-fill user info if logged in
4. **My Tickets** - Show only logged-in user's tickets
5. **Scanner** - Restrict to event organizers/staff
6. **Profile** - Display user info, allow edits

### Technical Setup

```bash
# Install auth dependencies
npm install @convex-dev/auth@0.0.90

# Google OAuth setup
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

# Configure Convex auth
convex/auth.ts
```

### Definition of Done

- [ ] Registration working
- [ ] Login working
- [ ] Google OAuth working
- [ ] Sessions persist across refreshes
- [ ] Profile editable
- [ ] All existing features require auth where appropriate
- [ ] Guest checkout still works (optional login)
- [ ] Protected routes redirect to login
- [ ] Authorization enforced (users can't edit others' events)

---

## Sprint 11-12: Testing & Polish (Weeks 11-12)

**Goal:** E2E testing, bug fixes, performance optimization

### Deliverables

- [ ] E2E test suite (Playwright)
- [ ] Bug fixes from testing
- [ ] Performance optimization
- [ ] Mobile responsiveness review
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Documentation updates
- [ ] Deployment to production
- [ ] Monitoring setup (Sentry)

### E2E Test Scenarios

```typescript
// tests/e2e/complete-purchase-flow.spec.ts
test("user can purchase tickets end-to-end", async ({ page }) => {
  // 1. Browse events
  // 2. Select event
  // 3. Add tickets to cart
  // 4. Checkout
  // 5. Enter payment
  // 6. Receive confirmation
  // 7. Check email
  // 8. View tickets in dashboard
});

// tests/e2e/organizer-flow.spec.ts
test("organizer can create and publish event", async ({ page }) => {
  // 1. Login
  // 2. Create event
  // 3. Set up Stripe Connect
  // 4. Publish event
  // 5. Verify public visibility
});

// tests/e2e/scanner-flow.spec.ts
test("staff can scan tickets at event", async ({ page }) => {
  // 1. Login as staff
  // 2. Navigate to scanner
  // 3. Scan valid QR code
  // 4. Verify success feedback
  // 5. Attempt duplicate scan
  // 6. Verify error
});
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Page Load Time (p95) | <2s |
| Time to Interactive | <3s |
| Lighthouse Score | >85 |
| Mobile Performance | >80 |
| Largest Contentful Paint | <2.5s |
| First Input Delay | <100ms |
| Cumulative Layout Shift | <0.1 |

### Definition of Done

- [ ] All E2E tests passing
- [ ] All bugs from testing fixed
- [ ] Performance targets met
- [ ] Mobile responsive on all pages
- [ ] Accessibility score >90
- [ ] Documentation complete
- [ ] Production deployment successful
- [ ] Monitoring active (Sentry, analytics)
- [ ] User acceptance testing passed
- [ ] Ready for public launch

---

## Story Creation Sequence

### Order of Implementation

```
Week 1-2:
  ✅ Story 2.1: Save the Date Events
  □ Story 2.2: Free Events
  □ Story 2.3: Ticketed Events (basic)
  □ Story 2.5: Event Listing Dashboard

Week 3-4:
  □ Story 2.4: Stripe Connect
  □ Story 3.1: Public Event Pages
  □ Story 3.2: Real-Time Inventory
  □ Story 3.3: Checkout Flow
  □ Story 3.4: Payment Processing

Week 5:
  □ Story 3.5: QR Code Generation
  □ Story 3.6: Email Delivery

Week 6:
  □ Story 5.1: Scanner PWA
  □ Story 5.2: QR Scanning
  □ Story 5.3: Manual Lookup
  □ Story 5.4: Scan History

Week 7:
  □ Story 6.1: Event Listing
  □ Story 6.2: Category Filter
  □ Story 6.3: Search
  □ Story 6.4: Homepage

Week 8:
  □ Story 4.1: My Tickets
  □ Story 4.2: Ticket Detail
  □ Story 4.3: Order History

Week 9:
  □ Story 2.6: Edit Event
  □ Story 2.7: Publish Event

Week 10:
  □ Story 1.1: Registration
  □ Story 1.2: Login
  □ Story 1.3: Google OAuth
  □ Story 1.4: Profile

Week 11-12:
  □ E2E Testing
  □ Bug Fixes
  □ Performance Optimization
  □ Production Deployment
```

---

## Risk Management

### Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Stripe Connect delays | High | Medium | Start early, use test mode, have backup payment plan |
| Email deliverability | Medium | Low | Use reputable service (Resend), monitor bounce rates |
| QR scanning issues | High | Medium | Extensive mobile testing, manual lookup fallback |
| Performance degradation | Medium | Medium | Lazy loading, code splitting, CDN, monitoring |
| Authentication integration breaks existing features | High | Medium | Thorough testing, feature flags, gradual rollout |

---

## Success Metrics (Post-Launch)

### Business Metrics (First Month)

- [ ] 50+ events created
- [ ] 500+ tickets sold
- [ ] $5,000 GMV (Gross Merchandise Value)
- [ ] 80%+ checkout completion rate
- [ ] 95%+ payment success rate
- [ ] $125+ in platform fees

### Technical Metrics

- [ ] 99.5%+ uptime
- [ ] <2s page load time (p95)
- [ ] >98% QR scan success rate
- [ ] >99% email delivery rate
- [ ] <5% error rate

### User Satisfaction

- [ ] Net Promoter Score (NPS) >40
- [ ] User survey responses >50
- [ ] Support tickets <10/week
- [ ] Positive feedback >80%

---

## Phase 2+ Roadmap (Post-MVP)

### Phase 2 (Months 4-6)

- Multi-day events & bundles
- Multiple ticket tiers (Early Bird, VIP)
- Discount codes
- Queue system for high-demand events
- Ticket transfers

### Phase 3 (Months 7-9)

- Authorized seller network (cash payments)
- Payment splitting (group purchases)
- Advanced analytics dashboard
- Email marketing tools
- Waitlist for sold-out events

### Phase 4 (Months 10-12)

- Reserved seating (banquet tables)
- Social features (invites, groups)
- NFT integration (blockchain tickets)
- AI-powered recommendations
- Mobile apps (iOS, Android)

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Maintained By:** John (PM Agent)

**Next Review:** End of Sprint 2 (Week 2)

---

## Quick Reference

**Total Stories:** 28
**Total Sprints:** 12
**MVP Duration:** 10-12 weeks
**Authentication:** Week 10 (deferred to end)

**Current Status:** Sprint 1, Story 2.1 Ready for Development

**Next Story:** Story 2.2 - Create Free Event
