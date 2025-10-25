# MVP Specification
**SteppersLife Event Ticketing Platform**

**Version:** 1.0
**Date:** October 25, 2025
**Status:** Build-Ready
**Timeline:** 10-12 Weeks

---

## Purpose

This document is the **single source of truth** for what to build in the MVP. It consolidates the PRD, epics, and roadmap into a clear list of features developers must implement.

**If it's not in this document, don't build it.**

---

## MVP Scope Summary

### What We're Building

A **simplified event ticketing platform** that allows:
1. Event organizers to create and publish events
2. Users to discover and purchase tickets
3. Staff to scan tickets at event entry
4. All without complex features (queues, multi-day, bundles, etc.)

### What We're NOT Building (Phase 2+)

❌ Multi-day events with bundled pricing
❌ Queue system for high-demand events
❌ Authorized seller network (cash payments)
❌ Payment splitting (group purchases)
❌ Ticket transfers/resale
❌ Multiple ticket tiers (Early Bird, VIP)
❌ Reserved/assigned seating
❌ Waitlists
❌ Discount codes
❌ Social features

---

## Core Features (Must Build)

### 1. Event Creation (Epic 2)

**Event Types (3):**

1. **Save the Date**
   - Image + basic info only
   - No ticketing
   - No payment processing
   - Status: DRAFT or PUBLISHED

2. **Free Event**
   - Full event details
   - Door price displayed (payment at venue)
   - No online ticketing
   - Status: DRAFT or PUBLISHED

3. **Ticketed Event (Single-Day Only)**
   - Full event details
   - Multiple ticket types (e.g., "General Admission", "VIP")
   - Online payment required (Stripe Connect)
   - Real-time inventory tracking
   - QR code generation
   - Status: DRAFT or PUBLISHED

**Required Fields (All Types):**
- Event name
- Organizer name
- Event date & time
- Location (address, city, state, zip)
- Categories (Set, Workshop, Cruise, Outdoors, Holiday, Weekend, Save the Date)
- Featured image (upload)
- Description (rich text)

**Organizer Dashboard:**
- View all events (grouped by status: Draft, Published)
- Create new event
- Edit existing event
- Publish/unpublish event
- View sales analytics (for ticketed events)

---

### 2. Payment Processing (Epic 2 & 3)

**Stripe Connect Integration:**
- Organizers create Stripe Express accounts
- Onboarding flow (KYC, bank account)
- Platform takes 2.5% fee
- Remaining 97.5% goes to organizer's account
- Automatic split on every transaction

**Checkout Flow:**
- Public event detail page
- Select ticket quantity
- Guest checkout (no login required initially)
- Stripe Elements for card input
- Real-time inventory reservation (10 minutes)
- Payment confirmation
- Order receipt

**Supported Payment Methods:**
- Credit/debit cards (via Stripe)
- Apple Pay / Google Pay (via Stripe)

---

### 3. Ticketing & QR Codes (Epic 3)

**Ticket Generation:**
- QR code with HMAC signature (tamper-proof)
- Unique ticket number per ticket
- Email delivery immediately after payment
- Includes event details + QR code + .ics calendar file

**Ticket Delivery:**
- Email via Resend
- HTML template with event details
- QR code embedded as image
- Calendar file attachment (.ics)
- Resend option in user dashboard

**Ticket Inventory:**
- Real-time availability display
- "X tickets remaining" indicator
- "Y people buying now" (reserved tickets)
- Sold out badge when inventory = 0
- Warning when <10% remaining

---

### 4. QR Scanning (Epic 5)

**Scanner PWA:**
- Mobile-friendly web app
- Installable as PWA (iOS, Android)
- Camera-based QR scanning
- Accessible at `/scan/[eventId]`

**Scan Validation:**
- HMAC signature verification
- Duplicate scan prevention
- Real-time database update (mark as SCANNED)
- Visual feedback: Green = valid, Red = invalid
- Audio feedback: Success beep, error beep
- Display attendee name on success

**Manual Lookup (Fallback):**
- Search by name, email, or ticket number
- Manual check-in option
- Logs manual check-ins

**Scan History:**
- View all scans for an event
- Export as CSV
- Real-time updates

---

### 5. Search & Discovery (Epic 6)

**Public Event Listing:**
- Grid layout at `/events`
- Shows all published events
- Sorted by start date (soonest first)
- Pagination (20 events per page)
- Event cards show: image, name, date, location, price/free badge

**Category Filtering:**
- Filter by categories (multi-select)
- Real-time filtering (no page reload)
- Show event count per category

**Search:**
- Search by event name, organizer, location
- Autocomplete dropdown
- Debounced search (300ms)
- Show top 10 results

**Homepage:**
- Hero section with CTA
- Featured upcoming events (6 events)
- Category links
- Footer

---

### 6. User Dashboard (Epic 4)

**My Tickets:**
- View all purchased tickets
- Grouped: Upcoming, Past
- Click to view full ticket detail
- Large QR code display
- Download QR as PNG
- Resend email button

**Order History:**
- View all orders
- Filter by status (Completed, Pending, Failed)
- Order details: event, date, quantity, total
- Link to tickets

**User Profile (Basic):**
- Name, email, phone
- Profile picture upload
- Edit profile

---

### 7. Authentication (Epic 1 - DEFERRED TO WEEK 10)

**Note:** Build all features above WITHOUT authentication first. Add auth in final phase.

**When Auth is Added:**

**Registration:**
- Email/password signup
- Email verification required
- Google OAuth option

**Login:**
- Email/password
- Google OAuth
- "Remember me" checkbox
- Password reset flow

**Session Management:**
- JWT tokens via @convex-dev/auth
- HTTP-only cookies
- 7-day session expiry
- Logout

**Protected Routes:**
- `/organizer/*` - Organizer dashboard (auth required)
- `/dashboard/*` - User dashboard (auth required)
- `/scan/*` - Scanner (auth required, organizer/staff only)

**Guest Checkout:**
- Allow ticket purchase without login
- Optional: Create account after purchase

---

## Database Schema (Simplified)

### Tables Required

1. **users** - User accounts (deferred to Week 10)
2. **events** - All event data
3. **tickets** - Ticket types for ticketed events
4. **orders** - Purchase orders
5. **ticketInstances** - Individual tickets with QR codes
6. **scans** - Scan log for event entry

**See [database-schema.md](./architecture/database-schema.md) for complete schema.**

---

## API Endpoints (Convex Functions)

### Queries (Read Operations)
- `events.getPublicEvents` - List published events
- `events.getEvent` - Get single event
- `events.getOrganizerEvents` - Organizer's events (auth required)
- `events.searchEvents` - Search events
- `tickets.getTicketAvailability` - Real-time inventory
- `orders.getUserOrders` - User's orders
- `users.getUserTickets` - User's tickets
- `scanning.canScanEvent` - Check scan permissions

### Mutations (Write Operations)
- `events.createSaveTheDateEvent` - Create Save the Date
- `events.createFreeEvent` - Create Free Event
- `events.createTicketedEvent` - Create Ticketed Event
- `events.updateEvent` - Edit event
- `events.publishEvent` - Publish event
- `orders.createOrder` - Create order (reserve inventory)
- `orders.confirmOrder` - Confirm after payment
- `scanning.scanTicket` - Validate and mark ticket scanned

### Actions (Node Environment)
- `payments.createPaymentIntent` - Create Stripe payment
- `payments.createConnectAccount` - Stripe Connect onboarding
- `tickets.generateTicketQR` - Generate QR code
- `email.sendTicketEmail` - Send ticket email

**See [api-contracts.md](./architecture/api-contracts.md) for complete API documentation.**

---

## User Flows

### Flow 1: Organizer Creates Event

```
1. Navigate to /organizer/events
2. Click "Create Event"
3. Select event type (Save the Date / Free Event / Ticketed Event)
4. Fill in event details
   - Name, date, time, location
   - Upload image
   - Select categories
   - Add description (rich text)
5. If Ticketed Event:
   - Add ticket types (name, price, quantity)
   - Set sales period
6. Click "Create Event" (saves as DRAFT)
7. Complete Stripe Connect onboarding (if ticketed)
8. Click "Publish Event"
9. Event now visible publicly at /events
```

---

### Flow 2: User Purchases Tickets

```
1. Browse events at /events
2. Click event card → Navigate to /events/[eventId]
3. Select ticket type and quantity
4. Click "Buy Tickets" → Navigate to /checkout
5. Enter name, email, phone
6. Enter payment info (Stripe Elements)
7. Click "Complete Purchase"
8. Payment processes → Webhook confirms
9. QR codes generated
10. Email sent with tickets
11. Redirect to /checkout/success
12. View tickets in /dashboard/tickets (if logged in)
```

---

### Flow 3: Staff Scans Tickets

```
1. Navigate to /scan/[eventId]
2. Grant camera permissions
3. Point camera at QR code
4. Scanner auto-detects QR code
5. Backend validates:
   - HMAC signature
   - Ticket not already scanned
   - Ticket belongs to this event
6. If valid:
   - Green screen + success beep
   - Show attendee name
   - Mark ticket as SCANNED
7. If invalid:
   - Red screen + error beep
   - Show error message
8. Return to scanning automatically (3 seconds)
```

---

## Technical Constraints

### Performance
- Page load time: <2 seconds (p95)
- Time to interactive: <3 seconds
- API response time: <200ms (p95)
- QR scan validation: <1 second

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

### Mobile
- Responsive design (320px to 2560px)
- Touch-friendly (minimum 44px tap targets)
- Installable PWA for scanner

### Security
- HTTPS required (TLS 1.3)
- HMAC signatures on QR codes (SHA-256)
- Input validation (Zod schemas)
- XSS prevention (React auto-escaping)
- CSRF protection (SameSite cookies)
- Rate limiting (prevent abuse)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus indicators
- Semantic HTML

---

## Success Criteria (Definition of Done)

### For MVP Launch

**Functional:**
- [ ] All 3 event types can be created
- [ ] Ticketed events accept payments via Stripe
- [ ] QR codes generated and emailed
- [ ] Scanner validates tickets correctly
- [ ] Search and discovery working
- [ ] User dashboard shows tickets

**Quality:**
- [ ] All E2E tests passing
- [ ] No critical bugs
- [ ] Performance targets met
- [ ] Mobile responsive
- [ ] Accessibility score >85

**Operational:**
- [ ] Deployed to production
- [ ] Monitoring active (Sentry)
- [ ] Logs aggregated
- [ ] Backup strategy in place
- [ ] Documentation complete

---

## Phase 2 Features (Future)

**Not in MVP, but planned:**

### Month 4-6
- Multi-day events with bundled pricing
- Multiple ticket tiers (Early Bird, VIP, Regular)
- Discount codes
- Queue system for high-demand events
- Ticket transfers

### Month 7-9
- Authorized seller network (cash payments)
- Payment splitting (group purchases)
- Advanced analytics dashboard
- Email marketing tools
- Waitlist for sold-out events

### Month 10-12
- Reserved/assigned seating (banquet tables)
- Social features (invites, groups)
- NFT integration (blockchain tickets)
- AI-powered recommendations
- Native mobile apps (iOS, Android)

---

## Stories to Implement (In Order)

### Sprint 1-2: Events (Week 1-2)
- ✅ Story 2.1: Save the Date Event
- Story 2.2: Free Event
- Story 2.3: Ticketed Event (Basic, No Stripe)
- Story 2.5: Event Listing Dashboard

### Sprint 3-4: Payments (Week 3-4)
- Story 2.4: Stripe Connect Onboarding
- Story 3.1: Public Event Detail Page
- Story 3.2: Real-Time Inventory
- Story 3.3: Ticket Checkout
- Story 3.4: Stripe Payment Processing

### Sprint 5: Tickets (Week 5)
- Story 3.5: QR Code Generation
- Story 3.6: Email Delivery

### Sprint 6: Scanner (Week 6)
- Story 5.1: Scanner PWA Setup
- Story 5.2: QR Code Scanning
- Story 5.3: Manual Lookup
- Story 5.4: Scan History

### Sprint 7: Discovery (Week 7)
- Story 6.1: Event Listing Page
- Story 6.2: Category Filtering
- Story 6.3: Event Search
- Story 6.4: Homepage

### Sprint 8: User Dashboard (Week 8)
- Story 4.1: My Tickets Dashboard
- Story 4.2: Ticket Detail View
- Story 4.3: Order History

### Sprint 9: Event Management (Week 9)
- Story 2.6: Edit Event
- Story 2.7: Publish Event

### Sprint 10: Authentication (Week 10)
- Story 1.1: User Registration
- Story 1.2: User Login
- Story 1.3: Google OAuth
- Story 1.4: User Profile

### Sprint 11-12: Testing & Launch (Week 11-12)
- E2E tests, bug fixes, performance optimization, production deployment

---

## Deployment

**Environment:** Production VPS
**Port:** 3004
**Domain:** events.stepperslife.com
**Process Manager:** PM2 (cluster mode)
**Server:** Next.js 16 standalone build

**Required Environment Variables:**
```bash
# App
NEXT_PUBLIC_APP_URL=https://events.stepperslife.com
NODE_ENV=production

# Convex
CONVEX_DEPLOYMENT=expert-vulture-775
NEXT_PUBLIC_CONVEX_URL=https://expert-vulture-775.convex.cloud

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=tickets@stepperslife.com

# QR Security
QR_CODE_SECRET_KEY=your_secret_key
```

**See [deployment-guide.md](./architecture/deployment-guide.md) for complete deployment instructions.**

---

## Monitoring & Alerts

**Metrics to Track:**
- Page load times (p50, p95, p99)
- API response times
- Payment success rate
- Email delivery rate
- QR scan success rate
- Error rates by endpoint
- Active users
- Events created
- Tickets sold

**Alerts:**
- Error rate >5% (critical)
- Page load >3s (warning)
- Payment failure >10% (critical)
- Email delivery <95% (warning)
- Server down (critical)

**Tools:**
- Sentry (error tracking)
- Convex dashboard (database metrics)
- PM2 logs (server logs)
- Stripe dashboard (payment metrics)

---

## Support & Maintenance

**Support Channels:**
- Email: support@stepperslife.com
- Response time: <24 hours

**Maintenance Windows:**
- Deployments: Tuesdays/Thursdays 2-4 AM EST
- Downtime: <5 minutes per deployment

**Backup Strategy:**
- Convex automatic backups (daily)
- Code in GitHub (version controlled)
- Environment variables in secure storage

---

## Document Control

**Version:** 1.0
**Last Updated:** October 25, 2025
**Owner:** John (PM Agent)
**Status:** Approved for Development

**Next Review:** End of Sprint 2 (Week 2)

---

## Quick Reference

| Metric | Value |
|--------|-------|
| Total Stories | 28 |
| MVP Duration | 10-12 weeks |
| Event Types | 3 (Save the Date, Free, Ticketed) |
| Payment Processor | Stripe Connect |
| Platform Fee | 2.5% |
| Scanner Type | PWA (mobile web) |
| Auth Provider | @convex-dev/auth |
| Deployment | PM2 on VPS, Port 3004 |

**If you have questions about MVP scope, reference this document first.**
