# 🎯 Comprehensive Ticketing System Test Guide

## Test Date: October 25, 2025
## Site: https://events.stepperslife.com

---

## 📊 Current System Status

✅ **System Health**
- Homepage: ONLINE (0.046s load time)
- My Tickets: ONLINE (0.035s load time)
- Event Creation Form: FUNCTIONAL
- Payment API: CONFIGURED (Square integration ready)

⚠️ **Current State**
- **0 Published Events** - Fresh system ready for testing
- All 3 event types available for creation
- No test data exists yet

---

## 🧪 TEST SEQUENCE (Follow in Order)

### TEST 1: CREATE SAVE_THE_DATE EVENT (10 min)

**Steps:**
1. Go to: https://events.stepperslife.com/organizer/events/create
2. Fill out Step 1 - Basic Information:
   - Event Name: `SteppersLife Spring Mixer 2026 - TEST`
   - Event Type: **Save the Date**
   - Description: `Get ready for our biggest stepping event of the year!  Save the date...`
   - Categories: Select `Set` and `Social`
   - Click **Next Step**

3. Fill out Step 2 - Date & Location:
   - Start Date: `March 15, 2026 7:00 PM`
   - End Date: `March 15, 2026 11:00 PM`
   - Venue: `The Grand Ballroom`
   - Address: `123 Dance Street`
   - City: `Chicago`
   - State: `Illinois`
   - Zip: `60601`
   - Click **Next Step**

4. Fill out Step 3 - Tickets:
   - Since this is SAVE_THE_DATE, no ticket setup needed
   - Click **Next Step**

5. Fill out Step 4 - Details & Images:
   - Upload an event image (optional)
   - Add organizer details
   - Click **Publish Event**

**✅ Expected Results:**
- Event creates successfully
- Redirects to event management page
- Event appears in organizer dashboard

**🔍 Verification Steps:**
1. Click "View Public Page" button
2. Verify public page shows:
   - Event name and details
   - Date, time, location
   - "Tickets coming soon!" message
   - NO ticket tiers or Buy button
   - Share button works

**📸 Screenshot:** Take screenshot of public page

**🐛 Issues Found:** _Document any bugs here_

---

### TEST 2: CREATE FREE_EVENT WITH DOOR PRICE (15 min)

**Steps:**
1. Go to: https://events.stepperslife.com/organizer/events/create
2. Fill out Step 1:
   - Event Name: `Community Dance Night - TEST FREE`
   - Event Type: **Free Event**
   - Description: `Join us for a free community dance night! All skill levels welcome.`
   - Categories: Select `Social` and `Workshop`
   - Click **Next Step**

3. Fill out Step 2:
   - Start Date: `November 10, 2025 8:00 PM`
   - End Date: `November 10, 2025 11:00 PM`
   - Venue: `Community Center`
   - Address: `456 Main Street`
   - City: `Atlanta`
   - State: `Georgia`
   - Zip: `30303`
   - Click **Next Step**

4. Fill out Step 3 - Tickets:
   - **Door Price Field:** Enter `$15 at the door`
   - Leave other fields empty
   - Click **Next Step**

5. Fill out Step 4:
   - Upload image (optional)
   - Click **Publish Event**

**✅ Expected Results:**
- Event publishes successfully
- Door price field saves

**🔍 Verification Steps:**
1. View public page
2. Check for **GREEN BOX** with door price:
   - Should say: "$15 at the door"
   - Should have green gradient background
   - Should say: "Payment accepted at venue"
3. Look for **"Register Free" button**
4. Click the button

**⚠️ EXPECTED BUG:**
- Clicking "Register Free" will give **404 ERROR**
- This is KNOWN ISSUE - registration page not built yet

**📝 Test Variations:**
Try these door price values:
- `$20 cash only`
- `Free admission, donations welcome`
- `$10-$15 sliding scale`

All should display correctly in the green box.

**📸 Screenshot:** Capture door price display

**🐛 Issues Found:** _Document any bugs here_

---

### TEST 3: CREATE TICKETED_EVENT - SIMPLE (20 min)

**Steps:**
1. Go to: https://events.stepperslife.com/organizer/events/create
2. Fill out Step 1:
   - Event Name: `SteppersLife Annual Gala - TEST PAID`
   - Event Type: **Ticketed Event**
   - Description: `Black tie optional stepping gala with live DJ and appetizers.`
   - Categories: Select `Set` and `Fundraiser`
   - Click **Next Step**

3. Fill out Step 2:
   - Start Date: `December 31, 2025 9:00 PM`
   - End Date: `January 1, 2026 2:00 AM`
   - Venue: `The Ritz Ballroom`
   - Address: `789 Elegance Ave`
   - City: `Houston`
   - State: `Texas`
   - Zip: `77002`
   - Click **Next Step**

4. Fill out Step 3 - **CRITICAL STEP** (Ticket Tiers):

   **Add Tier 1:**
   - Name: `Early Bird`
   - Description: `Save $20 with early registration`
   - Price: `45.00`
   - Quantity: `50`
   - Click **Add Tier** button

   **Add Tier 2:**
   - Name: `General Admission`
   - Description: `Standard ticket price`
   - Price: `65.00`
   - Quantity: `100`
   - Click **Add Tier** button

   **Add Tier 3:**
   - Name: `VIP`
   - Description: `Premium seating and meet & greet`
   - Price: `125.00`
   - Quantity: `20`
   - Click **Add Tier** button

   **Add Tier 4:**
   - Name: `Student`
   - Description: `Valid student ID required`
   - Price: `25.00`
   - Quantity: `30`
   - Click **Add Tier** button

   **Verify Tier Display:**
   - All 4 tiers should show in order
   - Each should have edit/delete buttons
   - Drag handles should allow reordering
   - Click **Next Step**

5. Fill out Step 4:
   - Upload a nice event image
   - Click **Publish Event**

**✅ Expected Results:**
- Event creates with all 4 tiers
- Tiers save in correct order
- Inventory set correctly

**🔍 Verification Steps:**
1. View public page
2. Scroll down to **"Available Tickets"** section
3. Verify each tier displays:
   - ✅ Tier name in bold
   - ✅ Description in smaller text
   - ✅ Price: $45.00, $65.00, $125.00, $25.00
   - ✅ Availability: "50 tickets available" etc.
   - ✅ Gradient background (blue)
   - ✅ Hover effect (shadow increase)
   - ✅ Animated entrance (stagger effect)

4. Check "Buy Tickets" button:
   - Should be BLUE and PROMINENT
   - Should be above the fold

**📸 Screenshots:**
- Full page view
- Ticket tiers section closeup

**🐛 Issues Found:** _Document any bugs here_

---

### TEST 4: CHECKOUT FLOW - COMPLETE PURCHASE (30 min)

**⚠️ IMPORTANT: Use the ticketed event created in TEST 3**

**Steps:**

**STEP 4A: Initiate Checkout**
1. From public event page, click **"Buy Tickets"**
2. Verify URL changes to: `/events/[eventId]/checkout`

**STEP 4B: Select Tier (Step 1 of Checkout)**
1. Verify all 4 tiers display
2. Click on **"General Admission"** ($65.00)
3. Verify it highlights/selects

**STEP 4C: Choose Quantity (Step 2)**
1. Quantity picker appears
2. Test changing quantity:
   - Try 1 ticket
   - Try 2 tickets
   - Try 5 tickets
   - Try 10 tickets (test max)
3. Select **2 tickets**
4. Verify subtotal updates: $65 × 2 = $130.00
5. Click **Continue**

**STEP 4D: Enter Buyer Info (Step 3)**
1. Fill out form:
   - Name: `John Test Buyer`
   - Email: `john.test@example.com`
   - Phone: `(555) 123-4567`
2. Verify email validation (try invalid email)
3. Verify required field validation
4. Click **Continue to Payment**

**STEP 4E: Payment Page (Step 4) - CRITICAL**
1. Verify page loads showing:
   - **Order Summary** sidebar (right side)
     - 2× General Admission: $130.00
     - Platform Fee: $[amount]
     - Processing Fee: $[amount]
     - **Total: $[calculated total]**

2. Verify **Two Payment Method Buttons** display:
   - "Credit/Debit Card" (blue background)
   - "Cash App Pay" (green background)

3. Test Payment Method Toggle:
   - Click "Cash App Pay" button
   - Verify Cash App UI loads
   - Click "Credit/Debit Card" button
   - Verify card form loads

**STEP 4F: Complete Payment - CARD METHOD**
1. Ensure "Credit/Debit Card" is selected
2. Wait for Square payment form to load (10-15 seconds)
3. Verify Square form appears with fields for:
   - Card number
   - Expiration date
   - CVV
   - Zip code

4. **Enter Test Card:**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: `12/26` (or any future date)
   - CVV: `123`
   - Zip: `12345`

5. Click **"Pay $[Total]"** button

6. Wait for processing (may take 5-10 seconds)

**✅ Expected Success Screen:**
- 🎉 Confetti animation
- ✅ Green checkmark
- "Payment Successful!" message
- Order number displayed
- "View My Tickets" button

**🔍 Verification Steps:**
1. Click **"View My Tickets"** button
2. Should redirect to `/my-tickets`
3. Verify purchase appears (proceed to TEST 5)

**⚠️ Test Failure Scenarios:**

**Test Declined Card:**
- Use card: `4000 0000 0000 0002`
- Should see error: "Your card was declined"
- Error message should be helpful
- Can try again with valid card

**Test Validation:**
- Try invalid card number (wrong length)
- Try past expiry date
- Try empty CVV
- All should show appropriate errors

**📸 Screenshots:**
- Order summary
- Payment form
- Success screen
- Error screens (if any)

**⏱️ Performance Notes:**
- Time from click "Pay" to success screen: ____ seconds
- Page load times: ____ seconds

**🐛 Issues Found:** _Document any bugs here_

---

### TEST 5: MY TICKETS DASHBOARD (20 min)

**Prerequisites:** Must have completed TEST 4 (purchased tickets)

**Steps:**

**STEP 5A: Navigate to My Tickets**
1. Go to: https://events.stepperslife.com/my-tickets
2. OR click "My Tickets" from navigation

**STEP 5B: Verify Tickets Display**
1. Check **"Upcoming Events"** section
2. Verify your test event displays:
   - Event image (or gradient placeholder)
   - Event name: "SteppersLife Annual Gala - TEST PAID"
   - Date: "Monday, December 31, 2025 at 9:00 PM"
   - Location: "The Ritz Ballroom, Houston, Texas"

3. Check **"Your Tickets (2)"** section
4. Verify 2 ticket cards display

**STEP 5C: Expand Ticket (QR Code Test) - CRITICAL**
1. Click on the **first ticket card**
2. Verify expansion animation (smooth slide down)
3. Check left side shows:
   - **QR CODE** - 180×180 pixels
   - Clear black and white squares
   - Text: "Scan this QR code at event entrance"

4. Check right side shows:
   - **Ticket Details** section
   - Ticket Code: `TKT-[timestamp]-[random]` (e.g., TKT-1729891234-ABC123)
   - Tier: "General Admission"
   - Price: "$65.00"
   - Status: **"VALID"** (green text)
   - Purchased: Date and time

5. Verify action buttons:
   - **"Print Ticket"** button (blue)
   - **"Share"** button (gray)

**STEP 5D: Test Print Functionality**
1. Click **"Print Ticket"** button
2. Verify browser print dialog opens
3. **DO NOT** actually print - just verify it works
4. Cancel print dialog

**STEP 5E: Test Share Functionality**
1. Click **"Share"** button
2. If on mobile: Native share sheet should appear
3. If on desktop: Should see "Ticket code copied to clipboard!" message
4. Verify ticket code was copied

**STEP 5F: Test Second Ticket**
1. Collapse first ticket (click again)
2. Click **second ticket card**
3. Verify:
   - Different QR code displays
   - Different ticket code (unique)
   - Same tier and price
   - Same status: VALID

**STEP 5G: QR Code Validation**
1. Use phone camera or QR scanner app
2. Scan the QR code from screen
3. Should read: The ticket code value
4. Code should match what's displayed

**✅ Expected Results:**
- ✅ All 2 tickets display correctly
- ✅ QR codes are scannable
- ✅ Each ticket has unique code
- ✅ Print/share buttons work
- ✅ Animations smooth
- ✅ Mobile responsive

**📸 Screenshots:**
- Dashboard with all tickets
- Expanded ticket with QR code
- Both tickets side by side

**🔍 Edge Cases to Test:**
1. Refresh page - tickets persist
2. Open in new tab - tickets still show
3. View on mobile device
4. Long event names - check text wrap
5. Past event - check "Past Events" section

**⏱️ Performance:**
- Page load time: ____ seconds
- QR code generation time: ____ seconds

**🐛 Issues Found:** _Document any bugs here_

---

### TEST 6: INVENTORY MANAGEMENT (15 min)

**Goal:** Verify sold count updates and availability tracking

**Steps:**

**STEP 6A: Check Initial State**
1. Go to public event page (Annual Gala)
2. Note current availability:
   - Early Bird: "50 tickets available"
   - General Admission: **"98 tickets available"** (100 - 2 purchased)
   - VIP: "20 tickets available"
   - Student: "30 tickets available"

**STEP 6B: Purchase More Tickets**
1. Buy 3 more General Admission tickets
2. Complete purchase
3. Return to public event page
4. Verify: **"95 tickets available"** (100 - 2 - 3)

**STEP 6C: Test Sold Out Scenario**
Using Convex dashboard (organizer view):
1. Manually set Early Bird: sold = 50
2. Refresh public page
3. Verify shows: **"Sold out"** (red text)
4. Try to purchase - should be prevented

**STEP 6D: Test Last Ticket**
1. Set tier to: quantity = 5, sold = 4
2. Try to purchase 1 ticket - should work
3. Try to purchase 2 tickets - should fail/warn

**✅ Expected Results:**
- Inventory decrements accurately
- Sold out displays correctly
- Can't purchase unavailable tickets
- Real-time updates

**🐛 Issues Found:** _Document any bugs here_

---

### TEST 7: EDGE CASES & ERROR SCENARIOS (20 min)

**Test 7A: Empty States**
- [ ] Homepage with 0 events: Shows "0 events found"
- [ ] My Tickets with 0 purchases: Shows "No Tickets Yet"
- [ ] Event with no image: Gradient placeholder appears

**Test 7B: Validation Errors**
- [ ] Empty event name: Shows error
- [ ] Invalid email in checkout: Shows error
- [ ] Quantity = 0: Prevents checkout
- [ ] Past event date: Warns or prevents

**Test 7C: Long Content**
- [ ] Very long event name (100+ chars): Truncates/wraps properly
- [ ] Very long description (5000 chars): Displays fully
- [ ] Special characters in name: Handles correctly
- [ ] Emoji in description: Displays correctly

**Test 7D: Invalid URLs**
- [ ] `/events/invalid-id`: 404 page
- [ ] `/events/[unpublished-event-id]`: Access denied
- [ ] `/my-tickets` (no auth): Shows empty state

**Test 7E: Payment Errors**
- [ ] Card declined (4000 0000 0000 0002): Shows error
- [ ] Invalid CVV: Shows validation error
- [ ] Network timeout: Shows retry option
- [ ] Insufficient funds card: Shows helpful message

**🐛 Issues Found:** _Document any bugs here_

---

### TEST 8: MOBILE RESPONSIVENESS (15 min)

**Test on Mobile Device or Browser DevTools (iPhone 12 Pro)**

**Pages to Test:**
1. Homepage
   - [ ] Navigation menu works
   - [ ] Event cards stack vertically
   - [ ] Filters accessible
   - [ ] All text readable

2. Event Detail Page
   - [ ] Hero image scales properly
   - [ ] Sidebar moves below content
   - [ ] Buy button easily tappable (44px min)
   - [ ] Date/time/location readable

3. Checkout Page
   - [ ] Forms easy to fill on mobile
   - [ ] Payment form optimized
   - [ ] Order summary accessible
   - [ ] Buttons thumb-friendly

4. My Tickets
   - [ ] Ticket cards readable
   - [ ] QR codes display large enough
   - [ ] Expand/collapse works smoothly
   - [ ] Action buttons accessible

**📸 Screenshots:** Mobile views of each page

**🐛 Issues Found:** _Document any bugs here_

---

### TEST 9: PERFORMANCE & LOAD TIMES (10 min)

**Use Browser DevTools > Network Tab**

**Measure:**
1. Homepage: ____ ms
2. Event Detail: ____ ms
3. Checkout: ____ ms
4. My Tickets: ____ ms
5. Payment Success: ____ ms

**Goals:**
- < 2000ms initial load
- < 500ms for subsequent navigation
- Images lazy load
- No console errors

**Check:**
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals green
- [ ] No 404 errors
- [ ] No console warnings

**🐛 Issues Found:** _Document any bugs here_

---

## 📋 FINAL CHECKLIST

### Core Functionality
- [ ] Can create SAVE_THE_DATE events
- [ ] Can create FREE_EVENT events
- [ ] Can create TICKETED_EVENT events
- [ ] Ticket tiers save correctly
- [ ] Can purchase tickets successfully
- [ ] Tickets appear in My Tickets
- [ ] QR codes generate and scan
- [ ] Inventory management accurate
- [ ] Payment processing works (test mode)

### User Experience
- [ ] All forms validate properly
- [ ] Error messages helpful
- [ ] Success states clear
- [ ] Loading states present
- [ ] Animations smooth
- [ ] Mobile responsive
- [ ] Accessible (keyboard nav, screen readers)

### Data Integrity
- [ ] Orders save correctly
- [ ] Tickets link to events
- [ ] Sold count accurate
- [ ] Dates format properly
- [ ] Images load correctly

### Known Issues
1. ⚠️ FREE_EVENT registration page doesn't exist (404)
2. ⚠️ No email notifications sent
3. ⚠️ No QR code validation/check-in system
4. ⚠️ Square credentials not in production

---

## 🎯 TEST SUMMARY TEMPLATE

```
COMPREHENSIVE TICKETING SYSTEM TEST RESULTS
============================================
Test Date: [DATE]
Tester: [NAME]
Duration: [TIME]

EVENTS CREATED:
- SAVE_THE_DATE: [Event Name]
- FREE_EVENT: [Event Name]
- TICKETED_EVENT: [Event Name]

TICKETS PURCHASED:
- Event: [Name]
- Tier: [Tier Name]
- Quantity: [#]
- Total: $[Amount]
- Order ID: [ID]

CRITICAL BUGS FOUND:
1. [Description]
2. [Description]

MINOR ISSUES FOUND:
1. [Description]
2. [Description]

SUGGESTED IMPROVEMENTS:
1. [Description]
2. [Description]

OVERALL ASSESSMENT:
✅ System Status: [PASS/FAIL]
✅ Ready for Launch: [YES/NO]
✅ Blocker Issues: [#]
✅ Nice-to-Have Issues: [#]

NEXT STEPS:
1. [Action Item]
2. [Action Item]
```

---

## 🚀 READY TO TEST!

**Estimated Total Time: 2.5-3 hours**

Start with TEST 1 and work through sequentially. Take screenshots at each step and document all findings.

Good luck! 🎉
