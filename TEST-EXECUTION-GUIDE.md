# Test Execution Guide - 3 Comprehensive Event Scenarios

**Date:** 2025-01-11
**Tester:** _____________
**Environment:** https://events.stepperslife.com
**Test Account:** organizer1@stepperslife.com / Bobby321!

---

## 🎯 TEST EVENT 1: SIMPLE TICKETED EVENT

### Pre-Test Checklist
- [ ] Browser cache cleared
- [ ] DevTools open (F12)
- [ ] Console tab visible
- [ ] Network tab recording
- [ ] Screenshot tool ready

### A. EVENT CREATION (Organizer Flow)

#### Step 1: Login
- [ ] Navigate to https://events.stepperslife.com/login
- [ ] Enter: `organizer1@stepperslife.com`
- [ ] Enter: `Bobby321!`
- [ ] Click "Login"
- [ ] **VERIFY:** Redirects to `/organizer/dashboard`
- [ ] **CHECK CONSOLE:** No errors (should be clean)

**Screenshot:** `test1-step1-login-success.png`

---

#### Step 2: Navigate to Create Event
- [ ] Click "Events" in sidebar OR navigate to `/organizer/events`
- [ ] **VERIFY:** Events list page loads
- [ ] Click "Create Event" button
- [ ] **VERIFY:** Create event form loads
- [ ] **CHECK:** All form fields visible

**Screenshot:** `test1-step2-create-form.png`

**Errors to watch for:**
- 404 on /organizer/events/create
- Form fields not rendering
- JavaScript errors in console

---

#### Step 3: Fill Event Details
```
Name: New Year's Eve Gala 2026
Event Type: TICKETED_EVENT (dropdown)
Description: Join us for an unforgettable celebration to ring in 2026!
             Live music, dancing, champagne toast at midnight, and more.

Categories: ["Party", "Celebration", "Holiday"] (checkboxes or multi-select)

Date/Time:
  Event Date: December 31, 2025
  Start Time: 9:00 PM
  End Time: 2:00 AM (next day)
  Timezone: America/Chicago

Location:
  Venue Name: The Grand Ballroom
  Address: 456 Michigan Avenue
  City: Chicago
  State: Illinois
  ZIP: 60611
  Country: United States

Capacity: 300
```

- [ ] Fill all fields above
- [ ] **VERIFY:** Date picker works
- [ ] **VERIFY:** Timezone dropdown has options
- [ ] **VERIFY:** No validation errors on capacity (should allow 300)
- [ ] Click "Next" or "Create Event"

**Screenshot:** `test1-step3-event-form-filled.png`

**Errors to watch for:**
- Required field validation not working
- Date picker broken
- Capacity field rejects valid number
- Form doesn't submit

---

#### Step 4: Create Ticket Tiers
Navigate to ticket management (should auto-redirect or click "Manage Tickets")

**Tier 1: Early Bird**
```
Name: Early Bird Special
Description: Limited time offer - save $20!
Price: $45.00
Quantity: 50
Early Bird Pricing: Yes
  - Early Bird Price: $45.00
  - Regular Price: $65.00
  - Available Until: November 30, 2025
```

- [ ] Click "Add Ticket Tier"
- [ ] Fill tier 1 details
- [ ] Enable early bird pricing toggle
- [ ] Set pricing tiers
- [ ] Click "Create Ticket Tier"
- [ ] **VERIFY:** Tier appears in list
- [ ] **CHECK:** Price displays correctly ($45.00 not $0.45)

**Screenshot:** `test1-step4a-early-bird-tier.png`

**Tier 2: General Admission**
```
Name: General Admission
Description: Standard entry ticket
Price: $65.00
Quantity: 150
```

- [ ] Add tier 2
- [ ] **VERIFY:** Capacity progress bar updates (50 + 150 = 200/300)

**Screenshot:** `test1-step4b-general-tier.png`

**Tier 3: VIP**
```
Name: VIP Access
Description: Premium seating, open bar, exclusive meet & greet with DJ
Price: $100.00
Quantity: 50
```

- [ ] Add tier 3
- [ ] **VERIFY:** Capacity shows 250/300

**Tier 4: Student**
```
Name: Student Discount
Description: Valid student ID required at entry
Price: $30.00
Quantity: 50
```

- [ ] Add tier 4
- [ ] **VERIFY:** Capacity shows 300/300 (full)
- [ ] **VERIFY:** Cannot add more tiers (should warn about capacity)

**Screenshot:** `test1-step4c-all-tiers.png`

**Errors to watch for:**
- Tier creation fails silently
- Price formatting wrong (cents vs dollars)
- Capacity calculation incorrect
- Early bird pricing doesn't save
- Cannot create multiple tiers

---

#### Step 5: Payment Configuration
- [ ] Navigate to "Payment Setup" or "Payment Methods"
- [ ] **VERIFY:** Page loads successfully
- [ ] Select payment model: "PREPAY" (uses credits from organizer balance)
- [ ] **VERIFY:** Shows credit balance (should have ~300 credits)
- [ ] **CHECK:** Warns if insufficient credits
- [ ] Save payment configuration

**Screenshot:** `test1-step5-payment-setup.png`

**Errors to watch for:**
- Payment config page 404
- Credit balance not showing
- Cannot select payment model
- Save button doesn't work

---

#### Step 6: Publish Event
- [ ] Navigate back to event dashboard or edit page
- [ ] Find "Publish" button or toggle
- [ ] Change status from DRAFT to PUBLISHED
- [ ] **VERIFY:** Success message appears
- [ ] **VERIFY:** Event status shows "Published"
- [ ] Copy event URL or ID for next steps

**Screenshot:** `test1-step6-published.png`

**Errors to watch for:**
- Publish button missing
- Publish fails without error message
- Status doesn't update

---

### B. PUBLIC BROWSING (Customer Flow)

#### Step 7: Browse as Public User
- [ ] Open NEW incognito window (Ctrl+Shift+N)
- [ ] Navigate to https://events.stepperslife.com
- [ ] **VERIFY:** Homepage loads
- [ ] **VERIFY:** "New Year's Eve Gala 2026" appears in event grid
- [ ] **CHECK:** Event image displays (or placeholder if no image)
- [ ] **CHECK:** Price shows correctly
- [ ] **CHECK:** Date shows "Dec 31, 2025"

**Screenshot:** `test1-step7-homepage.png`

**Errors to watch for:**
- Event doesn't appear (check if published)
- Broken image links
- Wrong date/time displayed
- Event card layout broken on mobile

---

#### Step 8: View Event Detail
- [ ] Click on event card
- [ ] **VERIFY:** Redirects to `/events/[eventId]`
- [ ] **VERIFY:** Event detail page loads
- [ ] **CHECK ALL ELEMENTS:**
  - [ ] Event name displays
  - [ ] Date/time displays
  - [ ] Location displays
  - [ ] Description shows
  - [ ] All 4 ticket tiers visible
  - [ ] Prices correct for each tier
  - [ ] Quantities show (e.g., "50 available")
  - [ ] "Buy Tickets" button visible
- [ ] **CHECK CONSOLE:** No 404s for images, no JS errors

**Screenshot:** `test1-step8-event-detail.png`

**Errors to watch for:**
- 404 on event detail page
- Missing ticket tiers
- Incorrect pricing
- Buy Tickets button missing
- Images broken

---

### C. CHECKOUT FLOW (Critical Path)

#### Step 9: Add Tickets to Cart
- [ ] Click "Buy Tickets" button
- [ ] **VERIFY:** Redirects to `/events/[eventId]/checkout`
- [ ] **VERIFY:** Ticket selection interface loads
- [ ] Select tickets:
  - [ ] General Admission: Quantity 2
  - [ ] VIP Access: Quantity 1
- [ ] **VERIFY:** Subtotal calculates: (2 × $65) + (1 × $100) = $230
- [ ] **VERIFY:** Platform fee shows (e.g., 3% = $6.90)
- [ ] **VERIFY:** Processing fee shows (e.g., 2.9% + $0.30 = ~$7.00)
- [ ] **VERIFY:** Total shows: ~$244
- [ ] Click "Continue to Checkout" or "Next"

**Screenshot:** `test1-step9-ticket-selection.png`

**Errors to watch for:**
- Checkout page 404
- Quantity selector doesn't work
- Price calculation wrong
- Fees not displaying
- Cannot proceed to next step

---

#### Step 10: Contact Information
- [ ] **VERIFY:** Contact form displays
- [ ] Fill form:
  ```
  First Name: Test
  Last Name: Buyer
  Email: testbuyer@example.com
  Phone: (555) 123-4567
  ```
- [ ] **VERIFY:** Email validation works
- [ ] **VERIFY:** Phone formatting works (if applicable)
- [ ] Click "Continue" or "Next"

**Screenshot:** `test1-step10-contact-form.png`

**Errors to watch for:**
- Form doesn't validate
- Required fields not marked
- Cannot submit form
- Wrong fields required

---

#### Step 11: Payment Method Selection
- [ ] **VERIFY:** Payment method page loads
- [ ] **VERIFY:** Payment options display:
  - [ ] Square (credit card)
  - [ ] PayPal (if enabled)
  - [ ] Cash App (if enabled)
- [ ] Select "Square" (credit card)
- [ ] **VERIFY:** Square payment form loads
- [ ] **CHECK:** Card input fields visible:
  - [ ] Card number
  - [ ] Expiration
  - [ ] CVV
  - [ ] ZIP code

**Screenshot:** `test1-step11-payment-selection.png`

**Errors to watch for:**
- Payment form doesn't load
- Square SDK not loading (console error)
- No payment options available
- Infinite loading spinner

---

#### Step 12: Complete Payment
Enter Square test card:
```
Card Number: 4111 1111 1111 1111
Expiration: 12/26
CVV: 123
ZIP: 60611
```

- [ ] Fill payment form
- [ ] **VERIFY:** Card validation works (green checkmark)
- [ ] Click "Complete Purchase" or "Pay Now"
- [ ] **WAIT:** Payment processing (spinner should show)
- [ ] **VERIFY:** Success! Redirects to confirmation page

**Screenshot:** `test1-step12-payment-success.png`

**Critical Errors to watch for:**
- Payment fails with error
- Infinite loading, no response
- Error: "Payment method not configured"
- Redirect fails after payment
- Money charged but no order created

---

#### Step 13: Order Confirmation
- [ ] **VERIFY:** On confirmation page (`/events/[eventId]/checkout/success` or similar)
- [ ] **CHECK ALL ELEMENTS:**
  - [ ] "Order Confirmed" message
  - [ ] Order number/ID displays
  - [ ] Summary shows:
    - 2× General Admission ($130)
    - 1× VIP Access ($100)
    - Total: $244 (with fees)
  - [ ] "Download Tickets" button
  - [ ] "View in My Tickets" link
- [ ] **VERIFY:** QR codes visible (3 tickets = 3 QR codes)
- [ ] Click "Download Tickets" (should download PDF or images)

**Screenshot:** `test1-step13-confirmation.png`

**Errors to watch for:**
- Confirmation page doesn't show order details
- QR codes missing
- Download doesn't work
- Wrong number of tickets

---

### D. POST-PURCHASE VERIFICATION

#### Step 14: My Tickets Page
- [ ] Click "View in My Tickets" OR navigate to `/my-tickets`
- [ ] **VERIFY:** Page loads
- [ ] **VERIFY:** New Year's Eve Gala tickets appear
- [ ] **CHECK:** 3 tickets listed
- [ ] **CHECK:** Each ticket shows:
  - [ ] Event name
  - [ ] Date/time
  - [ ] Ticket tier name
  - [ ] QR code
  - [ ] Status: "Valid"
- [ ] Click on a ticket to view details
- [ ] **VERIFY:** Full ticket details display

**Screenshot:** `test1-step14-my-tickets.png`

**Errors to watch for:**
- My Tickets page 404 or requires login
- Tickets don't appear
- QR codes not generating
- Ticket details incomplete

---

#### Step 15: Email Confirmation
- [ ] Check email: testbuyer@example.com
- [ ] **VERIFY:** Confirmation email received (check spam)
- [ ] **CHECK EMAIL CONTAINS:**
  - [ ] Order confirmation subject
  - [ ] Event name and details
  - [ ] Ticket tier names and quantities
  - [ ] Total amount paid
  - [ ] QR codes or link to view tickets
  - [ ] Venue information
- [ ] **VERIFY:** Links in email work

**Screenshot:** `test1-step15-email.png` (screenshot of email)

**Errors to watch for:**
- No email received (check Resend API key)
- Email has broken images
- Links in email 404
- Missing critical information

---

### E. SCANNER VALIDATION (Staff/Scanner Flow)

#### Step 16: Access Scanner
- [ ] On mobile device OR desktop, navigate to `/scan/[eventId]`
  - Replace [eventId] with your event's ID
- [ ] **VERIFY:** Scanner page loads
- [ ] **VERIFY:** Camera permission request (on mobile)
- [ ] **VERIFY:** Scanner UI shows:
  - [ ] Camera viewfinder
  - [ ] Event name at top
  - [ ] Instructions
  - [ ] Manual code entry option

**Screenshot:** `test1-step16-scanner-interface.png`

**Errors to watch for:**
- Scanner page 404
- Camera doesn't request permission
- Black screen (camera not working)
- Event name wrong or missing

---

#### Step 17: Scan Valid Ticket
- [ ] Using phone camera, scan one of the 3 QR codes from "My Tickets"
- [ ] **VERIFY:** Scanner recognizes QR code
- [ ] **VERIFY:** Success screen shows:
  - [ ] Green checkmark or "Valid Ticket"
  - [ ] Attendee name: "Test Buyer"
  - [ ] Ticket tier: "General Admission" or "VIP Access"
  - [ ] Scanned time displays
- [ ] **CHECK:** Ticket status changes to "SCANNED"

**Screenshot:** `test1-step17-scan-success.png`

**Errors to watch for:**
- QR code not recognized
- Error: "Invalid ticket"
- Scanner doesn't respond
- Success message doesn't show attendee info

---

#### Step 18: Test Duplicate Scan
- [ ] Scan the SAME QR code again
- [ ] **VERIFY:** Error message displays:
  - "Already Scanned"
  - Shows original scan time
  - Shows who scanned it
- [ ] **VERIFY:** Ticket status remains "SCANNED"

**Screenshot:** `test1-step18-duplicate-scan-error.png`

**Errors to watch for:**
- No error on duplicate scan (security issue!)
- Wrong error message
- Scanner allows re-entry

---

### F. ORGANIZER VERIFICATION

#### Step 19: Check Organizer Dashboard
- [ ] Return to organizer account (login if needed)
- [ ] Navigate to `/organizer/events`
- [ ] Click on "New Year's Eve Gala 2026"
- [ ] **VERIFY:** Dashboard shows:
  - [ ] Total tickets sold: 3
  - [ ] Revenue: $244 (or $230 if fees go to platform)
  - [ ] Tickets scanned: 1
  - [ ] Remaining capacity: 297/300
- [ ] Navigate to "Orders" tab
- [ ] **VERIFY:** Test Buyer's order appears
- [ ] **CHECK ORDER DETAILS:**
  - [ ] Buyer name and email
  - [ ] Order date/time
  - [ ] Payment status: "COMPLETED"
  - [ ] Payment method: "SQUARE"

**Screenshot:** `test1-step19-organizer-dashboard.png`

**Errors to watch for:**
- Order doesn't appear
- Numbers don't add up
- Revenue calculation wrong
- Payment status incorrect

---

#### Step 20: Credit Deduction Check
- [ ] Navigate to `/organizer/credits`
- [ ] **VERIFY:** Credit balance shows:
  - Started with: 300 credits
  - Used: 3 tickets
  - Remaining: 297 credits
- [ ] **CHECK:** Transaction log shows deduction

**Screenshot:** `test1-step20-credits.png`

**Errors to watch for:**
- Credits not deducted
- Wrong amount deducted
- No transaction record

---

## ✅ TEST 1 COMPLETION CHECKLIST

### Critical Path Success:
- [ ] Event created successfully
- [ ] All 4 ticket tiers created
- [ ] Event published and visible publicly
- [ ] Tickets purchased successfully
- [ ] Payment processed without errors
- [ ] QR codes generated (3 unique codes)
- [ ] Email confirmation sent
- [ ] Scanner validated ticket
- [ ] Duplicate scan prevented
- [ ] Order appears in organizer dashboard
- [ ] Credits deducted correctly

### Issues Found:
**Critical (Blocking):**
1. _______________________________________
2. _______________________________________

**High Priority:**
1. _______________________________________
2. _______________________________________

**Medium Priority:**
1. _______________________________________
2. _______________________________________

**Improvements:**
1. _______________________________________
2. _______________________________________

### Console Errors:
```
[Copy/paste any console errors here]
```

### Network Errors:
```
[Copy/paste failed requests here]
```

---

**Test 1 Duration:** _______ minutes
**Overall Status:** ⭐ PASS / ❌ FAIL
**Next Steps:** Proceed to Test 2 if PASS, fix critical issues if FAIL

---
---

# 🎯 TEST EVENT 2: SEATED EVENT WITH INTERACTIVE SEATING

[Test 2 continues in next section...]
