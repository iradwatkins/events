# Test Data Seeding Plan

## Manual Testing Checklist

### 1. Event Creation (All 3 Types)
**Test via:** https://events.stepperslife.com/organizer/events/create

#### Test A: Save the Date Event
- Event name: "Summer Stepping Workshop 2026"
- Type: Save the Date
- Date: 3 months from now
- Location: Chicago, IL
- Category: Workshop
- Upload test image

#### Test B: Free Event
- Event name: "Community Stepping Practice Night"
- Type: Free Event
- Door Price: "$10 at the door"
- Date: 2 weeks from now
- Location: Atlanta, GA
- Category: Social

#### Test C: Ticketed Event
- Event name: "Annual Stepping Championship"
- Type: Ticketed Event
- Date: 1 month from now
- Location: Detroit, MI
- Category: Competition
- Ticket Tiers:
  - General Admission: $50, 100 tickets
  - VIP: $100, 25 tickets

---

### 2. Checkout Flow Testing
**After creating ticketed event:**
- Go to event detail page
- Add tickets to cart
- Test Square payment in sandbox mode
- Verify QR code generation
- Check order confirmation

---

### 3. Seating Chart Testing
**Test via:** `/organizer/events/[eventId]/seating`
- Create seating chart
- Add sections and rows
- Reserve seats for tickets
- Test interactive selection

---

### 4. Staff Management Testing
**Test via:** `/organizer/events/[eventId]/staff`
- Add staff member
- Set commission rate
- Generate referral code
- Test referral link

---

### 5. Scanner Testing
**Test via:** `/scan/[eventId]`
- Open scanner page
- Test camera permissions
- Scan test QR code
- Verify ticket validation

---

### 6. Admin Panel Testing
**Test via:** `/admin`
- View platform analytics
- Test user management
- Test event management
- Test refund processing

---

### 7. Discount Codes
- Create discount code
- Test percentage discount
- Test fixed amount discount
- Verify applies at checkout

---

## Expected Behavior Summary

✅ Events appear on homepage after creation
✅ Images display correctly
✅ Checkout processes Square payments
✅ Tickets generate QR codes
✅ Scanner validates tickets
✅ Seating charts allow seat selection
✅ Staff can track sales
✅ Admin panel shows analytics
✅ Discounts apply correctly

---

## Testing URLs

- Homepage: https://events.stepperslife.com/
- Create Event: https://events.stepperslife.com/organizer/events/create
- Dashboard: https://events.stepperslife.com/organizer/events
- My Tickets: https://events.stepperslife.com/my-tickets
- Admin: https://events.stepperslife.com/admin

---

**Created:** October 26, 2025
**Status:** Ready for manual testing
