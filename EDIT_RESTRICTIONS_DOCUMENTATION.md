# Event & Ticket Tier Edit Restrictions
**Implementation Date:** October 26, 2025
**Status:** ✅ DEPLOYED TO PRODUCTION

---

## Overview

This document outlines the safeguards implemented to prevent dangerous edits to events and ticket tiers after tickets have been sold. These restrictions protect customer trust and prevent operational issues.

---

## Business Problem Solved

**Issue:** Organizers could make changes after selling tickets that would:
- Change event date/time (affecting customer schedules)
- Reduce ticket prices (creating refund requests)
- Increase ticket prices (appearing dishonest)
- Reduce capacity below sold tickets (data integrity issue)
- Delete ticket tiers that customers purchased

**Solution:** Implemented smart edit restrictions that:
- Block dangerous changes after sales
- Allow safe edits at any time
- Provide clear, helpful error messages
- Follow industry best practices (Eventbrite, Ticketmaster patterns)

---

## Implementation Summary

### Files Modified:

1. **`/convex/events/mutations.ts`**
   - Updated `updateEvent` mutation (lines 282-334)
   - Added ticket sales counting
   - Implemented edit restrictions

2. **`/convex/tickets/mutations.ts`**
   - Created NEW `updateTicketTier` mutation (lines 104-178)
   - Added price change safeguards
   - Added quantity reduction safeguards

---

## Event Edit Restrictions

### Location: `/convex/events/mutations.ts` - `updateEvent` mutation

### Ticket Sales Check Logic:
```typescript
// Count total tickets sold across all tiers
const ticketTiers = await ctx.db
  .query("ticketTiers")
  .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
  .collect();

ticketsSold = ticketTiers.reduce((sum, tier) => sum + tier.sold, 0);
```

### Restrictions After Sales:

#### ❌ BLOCKED: Date/Time Changes
**When:** ANY tickets sold (even 1)
**Why:** Customers planned around the original date
**Error Message:**
```
Cannot change event date/time after X ticket(s) have been sold.
This would affect customers who already purchased tickets.
If you must reschedule, please cancel this event and create a new one.
```

**Code:** lines 296-303
```typescript
if (ticketsSold > 0 && (args.startDate || args.endDate)) {
  throw new Error(
    `Cannot change event date/time after ${ticketsSold} ticket${ticketsSold === 1 ? ' has' : 's have'} been sold. ` +
    `This would affect customers who already purchased tickets. ` +
    `If you must reschedule, please cancel this event and create a new one.`
  );
}
```

---

#### ❌ BLOCKED: Capacity Reduction Below Sold Count
**When:** Trying to set capacity < sold tickets
**Why:** Cannot unsell tickets that were already purchased
**Error Message:**
```
Cannot reduce capacity to X because Y tickets have already been sold.
Capacity must be at least Y.
```

**Code:** lines 321-329
```typescript
if (args.capacity) {
  if (ticketsSold > 0 && args.capacity < ticketsSold) {
    throw new Error(
      `Cannot reduce capacity to ${args.capacity} because ${ticketsSold} tickets have already been sold. ` +
      `Capacity must be at least ${ticketsSold}.`
    );
  }
  updates.capacity = args.capacity;
}
```

---

#### ✅ ALLOWED: Safe Edits (Even With Sales)
**Always Allowed:**
- Event name updates
- Description changes
- Category updates
- Location updates (venue name, address)
- Image changes
- Capacity increases (can never decrease below sold)

**Code:** lines 309-314
```typescript
// ALLOWED: Always allow these edits (even with sales)
if (args.name) updates.name = args.name;
if (args.description) updates.description = args.description;
if (args.categories) updates.categories = args.categories;
if (args.location) updates.location = args.location;
if (args.imageUrl) updates.imageUrl = args.imageUrl;
```

---

## Ticket Tier Edit Restrictions

### Location: `/convex/tickets/mutations.ts` - `updateTicketTier` mutation (NEW)

### Restrictions After Sales:

#### ❌ BLOCKED: Price Changes
**When:** ANY tickets sold for this tier
**Why:** Creates pricing inconsistency and refund demands
**Error Message:**
```
Cannot change ticket price after X ticket(s) have been sold.
This would create pricing inconsistency for customers who already purchased at $Y.YY.
If you need different pricing, please create a new ticket tier.
```

**Code:** lines 143-151
```typescript
if (tier.sold > 0) {
  if (args.price !== undefined && args.price !== tier.price) {
    throw new Error(
      `Cannot change ticket price after ${tier.sold} ticket${tier.sold === 1 ? ' has' : 's have'} been sold. ` +
      `This would create pricing inconsistency for customers who already purchased at $${(tier.price / 100).toFixed(2)}. ` +
      `If you need different pricing, please create a new ticket tier.`
    );
  }
}
```

---

#### ❌ BLOCKED: Quantity Reduction Below Sold Count
**When:** Trying to set quantity < tier.sold
**Why:** Cannot unsell tickets already purchased
**Error Message:**
```
Cannot reduce quantity to X because Y ticket(s) have already been sold.
Quantity must be at least Y.
```

**Code:** lines 153-160
```typescript
if (args.quantity !== undefined && args.quantity < tier.sold) {
  throw new Error(
    `Cannot reduce quantity to ${args.quantity} because ${tier.sold} ticket${tier.sold === 1 ? ' has' : 's have'} already been sold. ` +
    `Quantity must be at least ${tier.sold}.`
  );
}
```

---

#### ✅ ALLOWED: Safe Edits (Even With Sales)
**Always Allowed:**
- Tier name updates
- Description changes
- Quantity increases (can never decrease below sold)
- Sale start/end date changes

**Code:** lines 167-172
```typescript
if (args.name !== undefined) updates.name = args.name;
if (args.description !== undefined) updates.description = args.description;
if (args.price !== undefined) updates.price = args.price; // Only if no sales
if (args.quantity !== undefined) updates.quantity = args.quantity; // Only if >= sold
if (args.saleStart !== undefined) updates.saleStart = args.saleStart;
if (args.saleEnd !== undefined) updates.saleEnd = args.saleEnd;
```

---

## Existing Safeguards (Already Implemented)

### Ticket Tier Deletion
**Location:** `/convex/tickets/mutations.ts` - `deleteTicketTier` mutation
**Lines:** 76-78

```typescript
// Check if any tickets have been sold
if (tier.sold > 0) {
  throw new Error("Cannot delete ticket tier with sold tickets");
}
```

**Protection:** Prevents deleting ticket tiers that customers purchased

---

## Testing Scenarios

### Test 1: Try to Change Event Date After Sales
**Steps:**
1. Create ticketed event
2. Sell at least 1 ticket
3. Go to Edit Event
4. Try to change start date or end date
5. Click Save

**Expected Result:**
❌ Error: "Cannot change event date/time after 1 ticket has been sold..."

---

### Test 2: Try to Reduce Capacity Below Sold Count
**Steps:**
1. Create event with capacity 100
2. Sell 10 tickets
3. Go to Edit Event
4. Try to set capacity to 5
5. Click Save

**Expected Result:**
❌ Error: "Cannot reduce capacity to 5 because 10 tickets have already been sold..."

---

### Test 3: Try to Change Ticket Price After Sales
**Steps:**
1. Create ticket tier at $50
2. Sell at least 1 ticket
3. Go to Edit Ticket Tier (needs UI implementation)
4. Try to change price to $60
5. Click Save

**Expected Result:**
❌ Error: "Cannot change ticket price after 1 ticket has been sold..."

---

### Test 4: Try to Reduce Ticket Quantity Below Sold
**Steps:**
1. Create ticket tier with quantity 100
2. Sell 20 tickets
3. Go to Edit Ticket Tier
4. Try to set quantity to 10
5. Click Save

**Expected Result:**
❌ Error: "Cannot reduce quantity to 10 because 20 tickets have already been sold..."

---

### Test 5: Allowed Edits With Sales
**Steps:**
1. Create event and sell tickets
2. Update event name ✅
3. Update description ✅
4. Update location ✅
5. Increase capacity ✅
6. Update ticket tier name ✅
7. Update ticket tier description ✅
8. Increase ticket quantity ✅

**Expected Result:**
✅ All changes save successfully without errors

---

## Industry Best Practices Followed

### Eventbrite Pattern:
- Blocks date changes after first sale
- Blocks price changes after first sale
- Allows capacity increases
- Allows description/name updates

### Ticketmaster Pattern:
- Immutable core details after sales
- "Create new event" recommendation for major changes
- Clear error messages explaining why change is blocked

### Brown Paper Tickets Pattern:
- Soft lock on pricing after sales
- Quantity increases allowed
- Venue/description updates allowed

---

## Frontend Integration Required

The backend mutations are now protected, but frontend UI needs updates:

### 1. Edit Event Page (`/app/organizer/events/[eventId]/edit/page.tsx`)
**Needs:**
- Disable date/time inputs if `ticketsSold > 0`
- Show info message: "Cannot change date after tickets sold"
- Disable capacity reduction below sold count
- Handle error messages gracefully

### 2. Ticket Tier Editor (NEW - needs creation)
**Needs:**
- Create UI for editing ticket tiers
- Disable price input if `tier.sold > 0`
- Show info message: "Cannot change price after sales"
- Disable quantity reduction below sold count
- Call `api.tickets.mutations.updateTicketTier`

### 3. Error Display
**Needs:**
- Toast notifications for error messages
- Clear, user-friendly formatting
- Link to "Create New Event/Tier" actions

---

## Database Fields Used

### Events Table:
- `status` - DRAFT | PUBLISHED
- `eventType` - TICKETED_EVENT | FREE_EVENT | SAVE_THE_DATE

### Ticket Tiers Table:
- `sold` - Count of tickets sold for this tier
- `quantity` - Total tickets available for this tier

### Orders Table:
- `status` - COMPLETED | PENDING | CANCELLED
- Used to count tickets sold

---

## Error Message Patterns

All error messages follow this pattern:
1. **What was blocked:** "Cannot change ticket price"
2. **Why it's blocked:** "after X tickets have been sold"
3. **Impact explanation:** "This would create pricing inconsistency..."
4. **Recommended action:** "If you need different pricing, please create a new ticket tier"

**Example:**
```
Cannot change event date/time after 5 tickets have been sold.
This would affect customers who already purchased tickets.
If you must reschedule, please cancel this event and create a new one.
```

---

## Future Enhancements

### 1. Soft Lock Mode
Allow admins to override restrictions with confirmation:
- "I understand this will affect X customers"
- Logs override action for audit trail

### 2. Edit History
Track all changes to events and tiers:
- Who made the change
- When it was made
- Before/after values
- Whether customers were notified

### 3. Customer Notifications
Auto-email customers when allowed changes are made:
- "Event description updated"
- "Event location updated"
- "Event capacity increased"

### 4. Refund Workflow
If organizer must reschedule/cancel:
- Automated refund processing
- Customer notification emails
- Option to transfer to new event date

---

## Deployment Information

**Deployed:** October 26, 2025
**Convex Deployment:** https://fearless-dragon-613.convex.cloud
**Production URL:** https://events.stepperslife.com

**Files Modified:**
1. `/convex/events/mutations.ts` - Updated `updateEvent`
2. `/convex/tickets/mutations.ts` - Created `updateTicketTier`

**Deployment Command:**
```bash
npx convex deploy
```

**Status:** ✅ LIVE IN PRODUCTION

---

## Summary

Edit restrictions are now active in production. The system prevents:
- Date/time changes after ticket sales
- Price changes after ticket sales
- Capacity/quantity reduction below sold count
- Deletion of tiers with sales

Organizers can still safely edit:
- Names and descriptions
- Locations and images
- Capacity/quantity increases
- Sale start/end dates

All restrictions include helpful error messages guiding organizers to correct actions.

---

**Document Version:** 1.0
**Last Updated:** October 26, 2025
**Maintained By:** Development Team
