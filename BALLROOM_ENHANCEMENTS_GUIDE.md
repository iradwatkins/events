# 🎯 Ballroom Seating Enhancements - Implementation Guide

## ✅ COMPLETED (Already Live in Production)

### Core Ballroom System
- ✓ BALLROOM_EVENT type with event creation flow
- ✓ Seating designer with professional tools
- ✓ InteractiveSeatingChart with visual seat selection
- ✓ Real-time session management (15-min holds)
- ✓ Table package pricing in TicketTierEditor
- ✓ Mobile-responsive design
- ✓ Color-coded seat status (green/yellow/blue/grey)

### Components Created (Ready to Integrate)
- ✓ `BuyTableButton.tsx` - One-click table purchase
- ✓ `TableCapacityIndicator.tsx` - Visual capacity warnings
- ✓ `AccessibilityFilters.tsx` - Filter by seat type

---

## 🚀 REMAINING ENHANCEMENTS (12 Features)

### Phase 1: Core Enhancements (1h 30min remaining)

#### 1.1 Buy Entire Table Button ✓ (Component Created)
**Status**: Component ready, needs integration
**File**: `components/seating/BuyTableButton.tsx`
**Integration needed in**: `InteractiveSeatingChart.tsx`
**What it does**:
- Shows "Buy Entire Table X - $XXX" button on each table
- One-click selection of all available seats
- Calculates bulk pricing automatically

#### 1.2 Table Capacity Warnings ✓ (Component Created)
**Status**: Component ready, needs integration
**File**: `components/seating/TableCapacityIndicator.tsx`
**Integration needed in**: `InteractiveSeatingChart.tsx`
**What it does**:
- Shows "X/Y seats filled" on each table
- Color indicators: Green (empty), Yellow (half), Red (almost full)
- "Only 2 left!" urgency message

#### 1.3 Seat Assignment View (20 min)
**Status**: Not started
**New file**: `app/organizer/events/[eventId]/seating-assignments/page.tsx`
**What it does**:
- List view: "Table 5, Seat 3 → John Smith (Order #123)"
- Search by name/order
- Export to CSV for place cards
- Print-friendly format

**Implementation**:
```typescript
// Query needed in convex/seating/queries.ts
export const getEventSeatAssignments = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    // Get all reservations with customer info
    // Join with orders and tickets tables
    // Return formatted list
  }
});
```

#### 1.4 Accessibility Filters ✓ (Component Created)
**Status**: Component ready, needs integration
**File**: `components/seating/AccessibilityFilters.tsx`
**Integration needed in**: `InteractiveSeatingChart.tsx`
**What it does**:
- "Show only wheelchair accessible" toggle
- Filter VIP/Standard/Accessible seats
- Highlight accessible seats in purple

#### 1.5 Dynamic Pricing by Location (30 min)
**Status**: Not started
**Schema change needed**: Add `pricingZone` to table objects
**What it does**:
- Front tables = premium pricing (+$20)
- Near stage = VIP pricing (+$30)
- Back tables = standard pricing
- Visual heat map overlay

**Implementation**:
```typescript
// In seating designer, add zone selector
zones: {
  FRONT: { multiplier: 1.5, color: "#FFC107" },
  STAGE: { multiplier: 1.8, color: "#EF4444" },
  STANDARD: { multiplier: 1.0, color: "#10B981" },
  BACK: { multiplier: 0.8, color: "#6B7280" }
}
```

### Phase 2: Social & Templates (1h 10min)

#### 2.1 Seating Templates Library (25 min)
**Status**: Not started
**New files**:
- `components/seating/TemplateLibrary.tsx`
- `convex/seating/templates.ts`

**What it does**:
- Save current layout as template
- Gallery with thumbnails
- One-click apply to new event
- Pre-built templates: "Wedding 150", "Gala 300"

**Schema addition**:
```typescript
seatingTemplates: defineTable({
  name: v.string(),
  description: v.string(),
  organizerId: v.id("users"),
  thumbnail: v.optional(v.string()),
  layout: v.object({
    sections: v.array(/* same structure as seatingCharts */),
    totalCapacity: v.number(),
  }),
  isPublic: v.boolean(), // Share with other organizers
  usageCount: v.number(),
  createdAt: v.number(),
})
```

#### 2.2 Social Seating - "Sit With Friends" (45 min)
**Status**: Not started
**New files**:
- `components/seating/ShareSeatingLink.tsx`
- `app/events/[eventId]/seating/[shareToken]/page.tsx`

**What it does**:
- Generate unique share link
- Friends click link → auto-selects adjacent seats
- "Join [Name]'s Table" button
- Group coordination

**Implementation**:
```typescript
// New table for seating shares
seatingShares: defineTable({
  eventId: v.id("events"),
  shareToken: v.string(), // unique token
  initiatorName: v.string(),
  tableId: v.string(),
  selectedSeats: v.array(v.string()),
  expiresAt: v.number(),
}).index("by_token", ["shareToken"])
```

### Phase 3: Advanced Organizer Tools (3h)

#### 3.1 Table Reservation Holds (1h)
**Status**: Not started
**What it does**:
- Organizers can hold tables for VIPs
- "Reserved - Do Not Sell" status
- Manual release controls
- Comp ticket tracking

**UI additions**:
- Right-click table → "Reserve for VIP"
- Reserved tables show lock icon
- Admin panel to manage holds

#### 3.2 Multi-Tier Seating Zones (1h)
**Status**: Not started
**What it does**:
- Link sections to ticket tiers
- VIP ticket buyers only see VIP sections
- General admission filtered view
- Prevents tier confusion

**Schema change**:
```typescript
// Add to section object
allowedTierIds: v.optional(v.array(v.id("ticketTiers")))
```

#### 3.3 Drag-to-Assign After Purchase (1h)
**Status**: Not started
**What it does**:
- Organizer dashboard showing all assignments
- Drag "John Smith" from Table 5 to Table 8
- Email notification of change
- Change history log

**New file**: `app/organizer/events/[eventId]/seat-management/page.tsx`

### Phase 4: Quality of Life (50 min)

#### 4.1 Quick Improvements (10 min each)
**Status**: Not started

**a) Undo Last Selection**
- Add undo button above seating chart
- Track selection history
- Keyboard shortcut: Ctrl+Z

**b) Zoom Controls**
- +/- buttons on chart
- Reset zoom button
- Keyboard: +/- keys

**c) Seat Numbering Options**
- Clockwise from top (default)
- Left-to-right
- Custom starting position

**d) Table Notes**
- Organizer can add notes to tables
- "Near kitchen", "Best view", "By bar"
- Shows in admin view only

**e) Print Seating Chart**
- Print-friendly CSS
- Black & white mode
- Labels only, no colors

#### 4.2 Guest List / Will-Call Integration (30 min)
**Status**: Not started
**New file**: `app/organizer/events/[eventId]/guest-list/page.tsx`

**What it does**:
- Upload CSV: Name, Email, Table, Seat
- Auto-assign seats to pre-registered guests
- Check-in interface
- "Reserved for [Name]" labels

**Schema**:
```typescript
guestList: defineTable({
  eventId: v.id("events"),
  name: v.string(),
  email: v.string(),
  assignedTableId: v.optional(v.string()),
  assignedSeatNumber: v.optional(v.string()),
  checkedIn: v.boolean(),
  checkedInAt: v.optional(v.number()),
})
```

---

## 📊 IMPLEMENTATION PRIORITY

### Must-Have (High Value, Quick)
1. ✅ Buy Entire Table Button (component ready)
2. ✅ Table Capacity Warnings (component ready)
3. ✅ Accessibility Filters (component ready)
4. ⏳ Seat Assignment View (20 min)

### Should-Have (Medium Value)
5. ⏳ Dynamic Pricing Zones (30 min)
6. ⏳ Seating Templates (25 min)
7. ⏳ Quick Improvements (50 min)

### Nice-to-Have (Advanced)
8. ⏳ Social Seating (45 min)
9. ⏳ Table Holds (1h)
10. ⏳ Multi-Tier Zones (1h)
11. ⏳ Drag-to-Assign (1h)
12. ⏳ Guest List Integration (30 min)

---

## 🎯 RECOMMENDED NEXT STEPS

### Option A: Quick Wins (1 hour)
Integrate the 3 completed components + add seat assignment view
- Immediate visible impact
- Core features working
- Test with users

### Option B: Complete Phase 1 (1.5 hours)
Finish all core enhancements
- Full customer-facing features
- Organizer management tools
- Production-ready experience

### Option C: Full Implementation (6.5 hours)
Complete all 12 features
- World-class ballroom system
- Every feature requested
- Industry-leading platform

---

## 📁 FILES CREATED SO FAR

### New Components (Ready)
1. ✅ `components/seating/BuyTableButton.tsx` (42 lines)
2. ✅ `components/seating/TableCapacityIndicator.tsx` (78 lines)
3. ✅ `components/seating/AccessibilityFilters.tsx` (115 lines)

### Existing Files (Need Updates)
- `components/seating/InteractiveSeatingChart.tsx` - Integrate new components
- `convex/schema.ts` - Add new tables/fields as needed

---

## 💡 DECISION POINT

**Current Status**: 3 components built, ready to integrate

**Choose path forward**:
- **Fast Track**: Integrate 3 components now (15 min) → Test → Decide on rest
- **Balanced**: Complete Phase 1 (1.5h) → Deploy → Continue if needed
- **Complete**: Implement all 12 features (6.5h) → Ultimate ballroom system

**My Recommendation**: Start with Fast Track to see immediate results, then decide based on user feedback which advanced features are most valuable.
