# User Roles & What They See

## Complete Guide to SteppersLife Events Platform

---

## 🎭 User Roles Overview

The platform has 4 main user roles:

1. **Event Organizers** - Create and manage events
2. **Customers/Buyers** - Purchase and manage tickets
3. **Affiliates/Resellers** - Sell tickets and earn commission
4. **Door Staff/Scanners** - Check-in attendees at events

---

## 1. 👤 CUSTOMERS / BUYERS

### What They See:

#### **Homepage** (`/`)
- ✅ Browse all PUBLISHED events
- ✅ Event cards with images, dates, locations
- ✅ Search and filter events by category
- ✅ View toggle (grid, list, masonry)
- ✅ "Sign In" or Profile dropdown (if logged in)
- ✅ "Create" button (to become an organizer)

#### **Event Detail Page** (`/events/[eventId]`)
- ✅ Full event information
- ✅ Event image/flyer
- ✅ Date, time, location details
- ✅ Description
- ✅ Ticket tiers (if tickets are visible)
- ✅ "Buy Tickets" button → Stripe checkout
- ✅ Payment options: Credit Card, Cash App
- ✅ Social sharing buttons

#### **My Tickets Page** (`/my-tickets`)
Requires login - shows:
- ✅ All purchased tickets
- ✅ Upcoming events
- ✅ Past events
- ✅ Ticket QR codes
- ✅ "Transfer Ticket" button (if allowed)
- ✅ Order details
- ✅ Download/print ticket

#### **Ticket Transfer** (`/transfer/accept/[token]`)
- ✅ Accept ticket transfer from another user
- ✅ View transfer details
- ✅ Confirm acceptance
- ✅ Ticket now appears in "My Tickets"

### Customer Flow:
```
1. Browse events on homepage
2. Click event → View details
3. Click "Buy Tickets"
4. Choose payment method (Card or Cash App)
5. Complete Stripe checkout
6. Receive ticket email
7. View ticket in "My Tickets"
8. Show QR code at event door
```

---

## 2. 🎪 EVENT ORGANIZERS

### What They See:

#### **My Events Page** (`/organizer/events`)
Requires login - shows:
- ✅ List of all their events (DRAFT, PUBLISHED, CANCELLED)
- ✅ Event status badges
- ✅ "Create Event" button
- ✅ Quick actions per event:
  - View Public Page
  - Setup Payment
  - Manage Tickets
  - Manage Staff
  - View Sales

#### **Create Event** (`/organizer/events/create`)
4-step form:

**Step 1 - Basic Information:**
- Event Name *
- Event Type (Ticketed, Free, Save the Date)
- Description *
- Categories (Steppers Set, Workshop, Social, etc.)

**Step 2 - Date & Time:**
- Start Date & Time *
- End Date & Time
- Auto-detected timezone

**Step 3 - Location:**
- Venue Name
- Street Address
- City *
- State *
- ZIP Code
- Country

**Step 4 - Additional Details:**
- Event Capacity
- Event Image upload

**Result:** Event created with status "DRAFT"

#### **Event Dashboard** (`/organizer/events/[eventId]`)
Shows:
- ✅ **Event Status** badge (DRAFT/PUBLISHED/CANCELLED)
- ✅ **"Publish Event" Button** (green, only for DRAFT events)
- ✅ Share, View Public Page, Edit buttons
- ✅ **Overview Tab:**
  - Total Revenue
  - Tickets Sold progress bar
  - Total Orders (completed, pending)
  - Total Attendees
  - Ticket Tiers Performance
  - Recent Orders list
- ✅ **Orders Tab:**
  - All orders table (Order ID, Customer, Tickets, Amount, Status, Date)
  - Export CSV button
- ✅ **Attendees Tab:**
  - All ticket holders (Ticket Code, Name, Email, Tier, Status, Purchase Date)
  - Export CSV button

#### **Payment Setup** (`/organizer/events/[eventId]/payment-setup`)
- ✅ Choose payment model:
  - **Pre-Purchase** - Buy tickets upfront, sell later
  - **Pay-As-Sell** - Connect Stripe, get paid as tickets sell
- ✅ Configure fees and pricing

#### **Ticket Management** (`/organizer/events/[eventId]/tickets`)
- ✅ Create ticket tiers (Early Bird, Regular, VIP)
- ✅ Set prices per tier
- ✅ Set quantity per tier
- ✅ Set tier expiration dates (Early Bird pricing)
- ✅ Enable/disable tiers

#### **Staff Management** (`/organizer/events/[eventId]/staff`)
- ✅ Add door staff by email
- ✅ Assign roles (Scanner, Manager)
- ✅ View staff list
- ✅ Remove staff access

#### **Affiliate Program** (if enabled)
- ✅ Add affiliates/resellers
- ✅ Set commission per ticket
- ✅ Set ticket allocation limit
- ✅ View affiliate performance
- ✅ Track sales by affiliate

### Organizer Flow:
```
1. Click "Create" → Fill 4-step form
2. Event created as DRAFT
3. Go to event dashboard
4. Click "Publish Event" → Now PUBLIC
5. Event appears on homepage
6. Setup payment (if ticketed)
7. Create ticket tiers
8. Share event link
9. Monitor sales in dashboard
10. Assign door staff before event
11. Check real-time attendance on event day
```

---

## 3. 💰 AFFILIATES / RESELLERS

### What They See:

#### **Affiliate Dashboard** (`/affiliate/[eventId]`)
Shows:
- ✅ Unique referral link
- ✅ Unique QR code for sharing
- ✅ Sales statistics:
  - Total tickets sold
  - Commission earned
  - Tickets remaining (if allocation set)
  - Breakdown by payment method (Card, Cash App, Cash)
- ✅ "Record Cash Sale" button
- ✅ Sales history table
- ✅ Earnings summary

#### **Referral Link**
Format: `/events/[eventId]?ref=AFFILIATE-CODE`
- ✅ When customer buys via this link → affiliate gets credited
- ✅ Works with Card and Cash App payments
- ✅ Automatic tracking, no manual entry needed

#### **Record Manual Sale**
- ✅ For cash sales at events
- ✅ Enter ticket details
- ✅ Commission added to total
- ✅ Ticket marked as sold

### Affiliate Flow:
```
1. Event organizer adds you as affiliate
2. Receive email with dashboard link
3. Get unique referral link + QR code
4. Share link on social media / with friends
5. Track sales in real-time
6. Record any cash sales manually
7. View total earnings
8. Get paid by organizer (offline arrangement)
```

### Key Rules for Affiliates:
- ❌ **CANNOT change ticket prices**
- ✅ **CAN sell via**: Online (card/Cash App) OR in-person (cash)
- ✅ **Commission**: Fixed dollar amount per ticket (set by organizer)
- ✅ **Allocation**: May have ticket limit (e.g., max 50 tickets)
- ✅ **Tracking**: Real-time sales dashboard

---

## 4. 🚪 DOOR STAFF / SCANNERS

### What They See:

#### **Scanner Page** (`/scan/[eventId]`)
Mobile-optimized interface shows:
- ✅ Event name and date
- ✅ QR code scanner (uses phone camera)
- ✅ Manual code entry option
- ✅ Real-time validation results:
  - ✅ **VALID** - Green, admit person
  - ❌ **ALREADY SCANNED** - Orange, duplicate
  - ❌ **INVALID** - Red, wrong event or cancelled

#### **Scan Results**
After scanning, shows:
- Ticket holder name
- Ticket type/tier
- Purchase date
- Payment method
- Scan status

#### **Staff Dashboard**
- ✅ Total scans for the event
- ✅ Remaining attendees
- ✅ Scan history
- ✅ Error logs (failed scans)

### Door Staff Flow:
```
1. Event organizer assigns you as staff
2. Log in on phone
3. Open scanner page for event
4. Scan attendee QR codes OR enter manually
5. See instant validation (Valid/Invalid/Already Used)
6. Admit valid attendees
7. Flag duplicates/issues to manager
```

### Key Rules for Staff:
- ✅ **Only assigned staff** can scan for an event
- ✅ **Each ticket scans once** (prevents re-entry fraud)
- ✅ **All scans logged** (immutable audit trail)
- ✅ **Manual override available** (with manager approval)
- ✅ **Works offline** (coming soon - stores scans locally)

---

## 🔐 PERMISSION MATRIX

| Feature | Customer | Organizer | Affiliate | Door Staff |
|---------|----------|-----------|-----------|------------|
| Browse Events | ✅ | ✅ | ✅ | ✅ |
| Buy Tickets | ✅ | ✅ | ✅ | ✅ |
| Create Events | ❌ | ✅ | ❌ | ❌ |
| Publish Events | ❌ | ✅ (own only) | ❌ | ❌ |
| View Sales Dashboard | ❌ | ✅ (own only) | ❌ | ❌ |
| Manage Tickets/Tiers | ❌ | ✅ (own only) | ❌ | ❌ |
| Add Affiliates | ❌ | ✅ (own only) | ❌ | ❌ |
| Sell via Referral | ❌ | ❌ | ✅ (assigned) | ❌ |
| Record Cash Sales | ❌ | ❌ | ✅ (assigned) | ❌ |
| Scan Tickets | ❌ | ✅ (own only) | ❌ | ✅ (assigned) |
| Transfer Tickets | ✅ (own only) | ✅ | ✅ | ✅ |

---

## 📱 NAVIGATION STRUCTURE

### Public (Not Logged In)
```
Homepage (/)
  ├── Event Detail (/events/[id])
  ├── Login (/login)
  └── Sign Up (/signup)
```

### Logged In Customer
```
Homepage (/)
  ├── My Tickets (/my-tickets)
  ├── Event Detail (/events/[id])
  │   └── Checkout (Stripe)
  └── Profile Menu
      ├── My Tickets
      ├── My Events (if organizer)
      └── Sign Out
```

### Event Organizer
```
Homepage (/)
  ├── My Events (/organizer/events)
  │   ├── Create Event (/organizer/events/create)
  │   └── Event Dashboard (/organizer/events/[id])
  │       ├── Overview Tab
  │       ├── Orders Tab
  │       ├── Attendees Tab
  │       ├── Payment Setup (/organizer/events/[id]/payment-setup)
  │       ├── Tickets (/organizer/events/[id]/tickets)
  │       └── Staff (/organizer/events/[id]/staff)
  └── My Tickets (/my-tickets)
```

### Affiliate
```
Affiliate Dashboard (/affiliate/[eventId])
  ├── Sales Stats
  ├── Referral Link/QR
  ├── Record Cash Sale
  └── Earnings History
```

### Door Staff
```
Scanner Page (/scan/[eventId])
  ├── QR Scanner
  ├── Manual Entry
  ├── Scan History
  └── Stats
```

---

## 🎨 VISUAL INDICATORS

### Event Status Badges:
- **DRAFT** - Yellow badge - Only organizer can see
- **PUBLISHED** - Green badge - Public on homepage
- **CANCELLED** - Red badge - Not shown publicly

### Ticket Status:
- **VALID** - Green - Ready to scan
- **SCANNED** - Blue - Already checked in
- **TRANSFERRED** - Purple - Ownership changed
- **CANCELLED** - Red - Refunded/invalid

### Payment Methods:
- **💳 Card** - Credit/Debit
- **📱 Cash App** - Instant bank transfer
- **💵 Cash** - Manual entry by affiliate

---

## 🔔 NOTIFICATIONS

### Customers Receive:
- ✅ Order confirmation email (with ticket PDF)
- ✅ Ticket transfer notifications
- ✅ Event reminders (24 hours before)
- ✅ Event updates from organizer

### Organizers Receive:
- ✅ New ticket sale notifications
- ✅ Affiliate signup confirmations
- ✅ Staff assignment confirmations
- ✅ Daily sales summary

### Affiliates Receive:
- ✅ New sale notifications
- ✅ Commission earned alerts
- ✅ Allocation limit warnings

### Door Staff Receive:
- ✅ Staff assignment confirmation
- ✅ Event day reminders
- ✅ Scanner access link

---

## ✨ KEY FEATURES BY ROLE

### Customers Get:
- Multiple payment options
- Digital tickets with QR codes
- Ticket transfer ability
- Order history

### Organizers Get:
- Complete event management
- Real-time sales dashboard
- Multiple ticket tiers
- Early bird pricing
- Affiliate management
- Door staff assignments
- Revenue analytics

### Affiliates Get:
- Unique referral tracking
- Commission earnings
- Multiple selling channels
- Real-time stats

### Door Staff Get:
- Mobile-friendly scanner
- Instant validation
- Scan history
- Offline mode (coming soon)

---

## 🚀 CURRENT STATUS

### ✅ Live & Working:
- Customer ticket purchasing
- Event creation & management
- Event publishing
- Image uploads & display
- Basic organizer dashboard
- Test login credentials

### 🚧 Coming Soon (UI Needed):
- Affiliate dashboard pages
- Door scanner interface
- Early bird pricing UI
- Ticket transfer workflow
- Staff management pages
- Bundle packages

### ✅ Backend Ready:
- All payment processing
- Affiliate tracking
- Scan logging
- Transfer system
- Early bird pricing logic

---

## 📞 SUPPORT

For questions about each role:

**Customers:** Help page (/help)
**Organizers:** Documentation (/organizer/docs)
**Affiliates:** Affiliate FAQ (/affiliate/faq)
**Staff:** Scanner Guide (/scan/guide)

---

**Last Updated:** 2025-10-24
**Platform:** events.stepperslife.com
