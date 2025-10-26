# Seating Chart System - Comprehensive Test Guide
**Date:** October 26, 2025
**Site:** https://events.stepperslife.com
**Status:** READY FOR TESTING

---

## System Overview

The seating chart system includes:
- **Visual Canvas Editor** - Drag-drop section positioning on venue images
- **Template Library** - 6 pre-built layouts (Theater, Stadium, Concert, Conference, Outdoor, Custom)
- **Three Editing Modes** - Visual, List, Preview
- **Customer Seat Selection** - Interactive seat picker during checkout
- **Seat Reservation System** - Automatic seat status management
- **QR Code Integration** - Seat assignments displayed on tickets

---

## Test Sequence (Follow in Order)

### TEST 1: Template Application (10 min)
**Goal:** Verify pre-built templates load correctly with positioned sections

**Steps:**
1. Navigate to: `https://events.stepperslife.com/organizer/events/create`
2. Create a new TICKETED_EVENT:
   - Name: `SEATING TEST - Theater Layout`
   - Type: TICKETED_EVENT
   - Date: Future date
   - Add 2 ticket tiers:
     - "Orchestra" - $50 - 100 tickets
     - "Balcony" - $30 - 100 tickets
3. Save and publish event
4. Navigate to: `/organizer/events/[eventId]/seating`
5. Click **"Choose Template"** button
6. Select **"Small Theater"** template

**✅ Expected Results:**
- Template modal opens with 6 template options
- Click selects template and closes modal
- Canvas displays 2 pre-positioned sections:
  - "Left Orchestra" (blue, positioned left)
  - "Right Orchestra" (blue, positioned right)
- Each section has 10 rows (A-J) with 10 seats per row
- Total: 200 seats across both sections
- Sections should have x/y coordinates set (not at 0,0)

**🔍 Verification Steps:**
1. Switch to "List" mode - verify both sections appear
2. Expand a section - verify rows A-J exist
3. Expand a row - verify 10 seats numbered 1-10
4. Switch to "Preview" mode - verify customer view shows sections
5. Check console for errors

**📸 Screenshot:** Template selection modal, canvas with sections

**🐛 Test Variations:**
- Try "Stadium Section" template (should create 1 section with 15 rows, 20 seats/row = 300 seats)
- Try "Blank Canvas" (should create 0 sections)
- Try "Concert GA" (should create VIP + Standing sections)

---

### TEST 2: Visual Editor Operations (20 min)
**Goal:** Test drag-drop, resize, rotate, and persistence

**Prerequisites:** Complete TEST 1 (have a seating chart with sections)

#### TEST 2A: Venue Image Upload
1. Click "Upload Venue Image" button
2. Upload a floor plan image (or any image file)
3. Verify image displays in canvas background
4. Verify sections overlay on top of image

**Expected:** Image loads, sections visible on top

#### TEST 2B: Drag Section
1. Click and drag "Left Orchestra" section
2. Move it to different position on canvas
3. Release mouse
4. Verify section stays in new position
5. Check coordinates updated (should not be original x/y)

**Expected:** Section moves smoothly, stays where dropped

#### TEST 2C: Resize Section
1. Click on "Left Orchestra" to select it
2. Verify selection indicators appear:
   - Blue ring around section
   - 4 corner resize handles (blue dots)
   - Rotate button above section
3. Drag **bottom-right corner handle**
4. Verify section resizes
5. Release mouse

**Expected:** Section resizes from corner, minimum size enforced (100px width, 80px height)

#### TEST 2D: Rotate Section
1. With section selected, click **Rotate button** (purple circle above section)
2. Verify section rotates 15 degrees
3. Click again - rotates to 30 degrees
4. Click 24 times total - should return to 0 degrees (360° = 0°)

**Expected:** Section rotates in 15° increments

#### TEST 2E: Zoom and Pan
1. **Scroll wheel up** - verify canvas zooms in
2. **Scroll wheel down** - verify canvas zooms out
3. Click **Reset View** button (expand icon) - verify returns to default zoom
4. Click **Zoom In** button (+) - verify zooms in
5. Click **Zoom Out** button (-) - verify zooms out
6. Drag canvas background - verify pans

**Expected:** All zoom/pan controls work smoothly

#### TEST 2F: Grid and Labels Toggle
1. Click **Grid button** (grid icon) - verify grid overlay disappears
2. Click again - grid reappears
3. Click **Eye button** - verify section labels hide
4. Click again - labels reappear

**Expected:** Toggles work, visual changes apply

#### TEST 2G: Save and Reload Persistence
1. Make several changes:
   - Move sections to different positions
   - Resize one section
   - Rotate one section to 45 degrees
2. Click **"Save Seating Chart"** button
3. Wait for success message
4. **Refresh the page** (F5 or Cmd+R)
5. Wait for page to reload

**✅ Expected Results:**
- All sections return to SAVED positions
- Sizes preserved
- Rotations preserved
- Venue image still loaded

**❌ CRITICAL FAILURE if:**
- Sections reset to default positions (0,0)
- Sizes reset to defaults
- Rotations reset to 0°

---

### TEST 3: List Mode Bulk Operations (15 min)
**Goal:** Test row duplication and seat management

**Steps:**

#### TEST 3A: Switch to List Mode
1. Click "List" mode tab
2. Verify all sections display as expandable cards
3. Expand "Left Orchestra" section

**Expected:** Section shows rows A-J, each with 10 seats

#### TEST 3B: Add Row
1. Click **"+ Add Row"** button in Left Orchestra
2. Verify new row K appears with 0 seats
3. Click **"+ Add Seats"** dropdown
4. Select "Add 5 Seats"
5. Verify row K now has 5 seats (numbered 1-5)

**Expected:** Row added successfully

#### TEST 3C: Duplicate Row
1. Find Row A in Left Orchestra
2. Click **"Copy Row"** button (duplicate icon)
3. Verify new row L appears
4. Verify row L is identical to row A (same seat count, types)
5. Verify row L has different seat IDs (not same as row A)

**Expected:** Row duplicated with new IDs

#### TEST 3D: Change Seat Type
1. In row A, click on **seat #1**
2. Change type from "STANDARD" to "WHEELCHAIR"
3. Verify seat icon/color changes
4. Save seating chart
5. Switch to Preview mode
6. Verify seat #1 shows wheelchair icon

**Expected:** Seat type changes persist

#### TEST 3E: Add New Section
1. Click **"+ Add Section"** button
2. Enter name: "VIP Box"
3. Select color: Purple
4. Click "Add"
5. Verify new section appears in list
6. Add 1 row with 10 VIP seats

**Expected:** New section created successfully

---

### TEST 4: Link Sections to Ticket Tiers (10 min)
**Goal:** Assign pricing to seating sections

**Steps:**
1. In List mode, expand "Left Orchestra" section
2. Find **"Ticket Tier"** dropdown at section level
3. Select **"Orchestra - $50"** tier
4. Verify selection saved
5. Expand "VIP Box" section
6. Select **"Orchestra - $50"** tier (same tier, different section)
7. Save seating chart

**✅ Expected Results:**
- Each section can link to a ticket tier
- Multiple sections can share same tier
- When customer selects "Orchestra" tier in checkout, they should see seats from BOTH "Left Orchestra" AND "VIP Box"

**🔍 Verification:**
- Check database: sections should have `ticketTierId` field set
- Later in TEST 6, verify only linked sections appear for tier

---

### TEST 5: Preview Mode (5 min)
**Goal:** Verify customer-facing view

**Steps:**
1. Click **"Preview"** mode tab
2. Verify displays customer seat selection interface

**✅ Expected Results:**
- Shows all sections with available seat counts
- Sections organized by tier
- Seat map displays with color coding:
  - Available seats: Blue outline
  - Wheelchair seats: Blue background with icon
  - VIP seats: Purple background with crown
  - Reserved seats: Grey (should be none yet)
- Legend displays at bottom
- Seat selection disabled (preview only, not interactive)

---

### TEST 6: Customer Seat Selection in Checkout (25 min)
**Goal:** Test complete seat reservation flow

**Prerequisites:**
- Event with seating chart created
- Ticket tiers linked to sections
- Event published

**Steps:**

#### TEST 6A: Navigate to Event
1. Open event public page: `/events/[eventId]`
2. Verify event displays with "Buy Tickets" button
3. Click **"Buy Tickets"**
4. Verify redirects to `/events/[eventId]/checkout`

#### TEST 6B: Select Tier and Quantity
1. Select **"Orchestra - $50"** tier
2. Set quantity to **2 tickets**
3. Click **"Continue"**

**Expected:** Proceeds to seat selection step

#### TEST 6C: Select Seats
1. Verify seat selection interface appears
2. Verify shows sections linked to "Orchestra" tier:
   - "Left Orchestra" (100 available)
   - "VIP Box" (10 available if created in TEST 3E)
3. Verify selection progress bar shows: "Select 2 seats - 0 / 2 selected"
4. Click on seat "Row A, Seat 1" in Left Orchestra
5. Verify:
   - Seat highlights GREEN
   - Progress updates: "1 / 2 selected"
   - Selected seat chip appears: "Left Orchestra - Row A, Seat 1"
6. Click on seat "Row A, Seat 2"
7. Verify:
   - Second seat highlights GREEN
   - Progress updates: "2 / 2 selected"
   - Second chip appears
8. Try clicking a third seat
9. Verify: Cannot select (already have 2/2 required)
10. Click on Seat 1 again (deselect)
11. Verify:
    - Seat 1 unhighlights
    - Progress: "1 / 2 selected"
    - First chip removed
12. Reselect Seat 1

**✅ Expected Results:**
- Can select exactly required number of seats
- Cannot select more than required
- Can deselect and reselect
- Selected seats clearly highlighted
- Progress bar accurate

#### TEST 6D: Proceed Through Checkout
1. With 2 seats selected, verify "Continue" button enabled
2. Click **"Continue"**
3. Fill out buyer info:
   - Name: Test Buyer
   - Email: test@example.com
   - Phone: 555-123-4567
4. Click **"Continue to Payment"**
5. Verify order summary shows:
   - "2× Orchestra - $50.00" = $100.00
   - Platform Fee
   - Processing Fee
   - **Total:** $XXX.XX
6. Complete test payment (use Square test card: 4242 4242 4242 4242)
7. Verify payment success screen

**Expected:** Payment processes successfully

---

### TEST 7: Verify Seat Assignments on Tickets (20 min)
**Goal:** Confirm seats appear on tickets and QR codes

**Prerequisites:** Complete TEST 6 (purchased tickets with seat selection)

**Steps:**

#### TEST 7A: Navigate to My Tickets
1. From success screen, click **"View My Tickets"**
2. OR navigate to: `/my-tickets`
3. Verify event appears: "SEATING TEST - Theater Layout"
4. Verify shows: "Your Tickets (2)"

#### TEST 7B: Expand First Ticket
1. Click on first ticket card to expand
2. Verify displays:
   - **QR Code** (left side, 180×180px)
   - **Ticket Details** (right side)
3. Check ticket details include:
   - Ticket Code: `TKT-XXXXX`
   - Tier: "Orchestra"
   - Price: "$50.00"
   - Status: "VALID" (green)
   - **SEAT ASSIGNMENT:** "Section: Left Orchestra, Row: A, Seat: 1"

**✅ CRITICAL:** Seat assignment must appear on ticket

#### TEST 7C: Verify Second Ticket Has Different Seat
1. Collapse first ticket
2. Expand second ticket
3. Verify shows: "Section: Left Orchestra, Row: A, Seat: 2"
4. Verify QR code is different from first ticket

**Expected:** Each ticket shows unique seat assignment

#### TEST 7D: Test QR Code Scan
1. Use phone camera to scan QR code
2. Verify opens: `/ticket/[ticketCode]`
3. Verify validation page displays:
   - Event name
   - Event date/time/location
   - Event image
   - Ticket status: VALID
   - **Seat assignment:** "Section: Left Orchestra, Row A, Seat 1"
4. Verify attendee info shows:
   - Name: Test Buyer
   - Email: test@example.com

**✅ CRITICAL:** Seat assignment must appear on QR validation page

---

### TEST 8: Verify Seat Reservation Status (15 min)
**Goal:** Confirm seats show as RESERVED after purchase

**Steps:**

#### TEST 8A: Check Public Event Page
1. Navigate to event public page
2. Click "Buy Tickets"
3. Select "Orchestra" tier, quantity 1
4. Proceed to seat selection
5. Verify "Left Orchestra" section shows:
   - Total: 100 seats
   - **Available: 98 seats** (100 - 2 reserved)
6. Expand Row A
7. Verify:
   - Seat 1: GREY (Reserved)
   - Seat 2: GREY (Reserved)
   - Seat 3: BLUE (Available)

**✅ Expected:** Previously purchased seats show as RESERVED and cannot be selected

#### TEST 8B: Try to Select Reserved Seat
1. Click on Seat 1 (reserved)
2. Verify:
   - Seat does NOT highlight
   - Cannot select
   - Shows "Reserved" tooltip
3. Click on Seat 3 (available)
4. Verify:
   - Seat DOES highlight green
   - Can select successfully

**Expected:** Reserved seats are blocked from selection

---

### TEST 9: Multiple Tier Seating (15 min)
**Goal:** Verify tier filtering works correctly

**Prerequisites:** Create sections for different tiers

**Steps:**

#### TEST 9A: Create Balcony Section
1. Go back to seating chart editor: `/organizer/events/[eventId]/seating`
2. Switch to List mode
3. Add new section: "Balcony"
4. Add 5 rows (A-E), 20 seats per row (100 total seats)
5. Link to **"Balcony - $30"** tier
6. Save seating chart

#### TEST 9B: Test Tier Filtering on Checkout
1. Go to public event page
2. Click "Buy Tickets"
3. Select **"Balcony - $30"** tier, quantity 1
4. Proceed to seat selection
5. Verify ONLY "Balcony" section appears (NOT Orchestra)
6. Verify 100 seats available
7. Select a balcony seat
8. Complete purchase

**Expected:** Seat selection filtered by tier

#### TEST 9C: Verify Mixed Tier Bookings
1. Go to My Tickets
2. Verify shows 3 tickets total:
   - 2× Orchestra tickets (with Orchestra seats)
   - 1× Balcony ticket (with Balcony seat)

**Expected:** Different tiers manage separate seat pools

---

### TEST 10: Organizer Seat Reservation View (10 min)
**Goal:** View sold seats as organizer

**Steps:**

1. Navigate to: `/organizer/events/[eventId]/seating`
2. Switch to **Preview** mode
3. Verify shows:
   - Total seats: 300 (200 Orchestra + 100 Balcony)
   - Reserved: 3 seats
   - Available: 297 seats
4. Verify sold seats highlighted differently:
   - Orchestra Row A Seats 1-2: RESERVED status
   - Balcony Row A Seat 1: RESERVED status
5. Click on reserved seat
6. Verify shows tooltip with reservation details:
   - Ticket holder name
   - Order number
   - Purchase date

**Expected:** Organizer can see which seats are sold

---

## Edge Cases & Error Scenarios

### Edge Case 1: Seat Hold Timer (MISSING FEATURE)
**Status:** ⚠️ NOT IMPLEMENTED

**Expected Behavior:**
- When customer selects seats, they should be held for 15 minutes
- If checkout not completed, seats released
- Other customers see "Held" status during hold period

**Current Behavior:**
- Seats immediately available until payment completes
- Risk of double-booking if two customers select same seats simultaneously

**Recommendation:** Implement seat hold timer in future update

---

### Edge Case 2: Concurrent Seat Selection
**Test:**
1. Open event checkout in two different browsers
2. Both select "Orchestra" tier, 2 tickets each
3. Browser 1: Select Row A, Seats 3-4
4. Browser 2: Select Row A, Seats 3-4 (same seats)
5. Browser 1: Complete payment first
6. Browser 2: Try to complete payment

**Expected:** Browser 2 should get error: "Seats no longer available"

**Status:** ⚠️ NEEDS TESTING

---

### Edge Case 3: Sold Out Section
**Test:**
1. Manually reserve all 100 seats in Balcony section
2. Try to purchase Balcony tier ticket
3. Verify shows: "No seats available for this tier"

**Expected:** Gracefully handle sold out sections

---

### Edge Case 4: Wheelchair Accessibility Count
**Test:**
1. Create section with 5 wheelchair seats
2. In public view, verify ADA notice:
   - "5 wheelchair-accessible seats available"
3. Purchase 2 wheelchair seats
4. Verify updates: "3 wheelchair-accessible seats available"

**Expected:** Wheelchair seat count tracked separately

---

### Edge Case 5: Section Without Tier Link
**Test:**
1. Create section "Unassigned Area"
2. Don't link to any tier
3. Add 50 seats
4. Save chart
5. Try to purchase any tier
6. Verify "Unassigned Area" does NOT appear in seat selection

**Expected:** Only tier-linked sections visible to customers

---

## Known Issues & Future Enhancements

### MISSING: Scanning with Seat Validation
**Current:** QR code validation page shows seat assignment
**Missing:** Scanner app doesn't verify correct seat location
**Future:** Scanning app should show: "Row A, Seat 5 - MATCH" or "WRONG SEAT"

### MISSING: Seat Transfer
**Current:** Can transfer whole ticket
**Missing:** New ticket holder doesn't see seat assignment
**Future:** Transferred tickets should show seat assignment to new holder

### MISSING: Section Capacity Warnings
**Current:** Can create 1000-seat section with only 10 tier tickets available
**Missing:** No warning that section exceeds tier inventory
**Future:** Show warning: "Section has 1000 seats but tier only has 10 tickets"

### MISSING: Visual Seat Status on Canvas
**Current:** Visual editor shows static section boxes
**Missing:** Can't see which individual seats are sold in visual mode
**Future:** Color-code section boxes based on occupancy (green = 0-25%, yellow = 26-75%, red = 76-100%)

### MISSING: Export Seating Chart
**Current:** Can only view in browser
**Missing:** No PDF or image export
**Future:** "Download PDF" button to print seating chart

### MISSING: Print Tickets with Seat Map
**Current:** Printed ticket shows seat number
**Missing:** No mini-map showing where seat is located
**Future:** Print ticket includes venue diagram with seat highlighted

---

## Test Completion Checklist

### Core Functionality
- [ ] Templates load with correct seat counts
- [ ] Sections appear at correct x/y positions
- [ ] Drag-drop works smoothly
- [ ] Resize handles work correctly
- [ ] Rotation works (15° increments)
- [ ] Zoom/pan controls functional
- [ ] Save/reload preserves positions
- [ ] Can link sections to tiers
- [ ] Customer can select required seats
- [ ] Selected seats show on tickets
- [ ] QR code displays seat assignment
- [ ] Reserved seats blocked from re-selection
- [ ] Tier filtering works correctly

### Data Integrity
- [ ] Seat reservations save to database
- [ ] Reserved seats count increments
- [ ] Multiple tickets show unique seats
- [ ] Seat status persists after refresh
- [ ] Can view sold seats as organizer

### User Experience
- [ ] Visual editor intuitive
- [ ] Seat selection UI clear
- [ ] Progress bar accurate
- [ ] Error messages helpful
- [ ] Mobile responsive
- [ ] No console errors

---

## Test Summary Template

```
SEATING CHART SYSTEM TEST RESULTS
==================================
Test Date: [DATE]
Tester: [NAME]
Duration: [TIME]

TEMPLATES TESTED:
- Small Theater: [PASS/FAIL]
- Stadium Section: [PASS/FAIL]
- Concert GA: [PASS/FAIL]
- Blank Canvas: [PASS/FAIL]

VISUAL EDITOR:
- Drag-drop: [PASS/FAIL]
- Resize: [PASS/FAIL]
- Rotate: [PASS/FAIL]
- Zoom/Pan: [PASS/FAIL]
- Save/Reload: [PASS/FAIL]

SEAT SELECTION:
- Select required seats: [PASS/FAIL]
- Deselect seats: [PASS/FAIL]
- Cannot over-select: [PASS/FAIL]
- Reserved seats blocked: [PASS/FAIL]

TICKET DISPLAY:
- Seat on ticket: [PASS/FAIL]
- Seat on QR validation: [PASS/FAIL]
- Multiple tickets unique: [PASS/FAIL]

CRITICAL BUGS FOUND:
1. [Description]
2. [Description]

MINOR ISSUES:
1. [Description]
2. [Description]

OVERALL STATUS: [PASS/FAIL]
READY FOR PRODUCTION: [YES/NO]

NEXT STEPS:
1. [Action]
2. [Action]
```

---

## Ready to Test!

**Estimated Total Time:** 2-3 hours for complete testing

Start with TEST 1 and work sequentially. Document all findings and take screenshots at each step.

**Important:** If any CRITICAL test fails, stop testing and fix issue before proceeding.

Good luck! 🎭
