# Events Platform - Testing Documentation

## Overview
This directory contains comprehensive testing documentation for the Events platform.

## Test Scenarios

We've designed **3 comprehensive test scenarios** that cover different aspects of the platform:

### 🎫 Test 1: Simple Ticketed Event
**File:** `TEST-EXECUTION-GUIDE.md` (Section 1)
**Focus:** Core functionality - most common user journey
**Duration:** 60-90 minutes

**What it tests:**
- Event creation with multiple ticket tiers
- Early bird pricing
- Public event browsing
- Complete checkout flow with payment
- QR code generation and validation
- Email confirmations
- Scanner functionality
- Credit-based payment model

**Critical path:** Organizer creates → Customer purchases → Scanner validates

---

### 🪑 Test 2: Seated Event with Interactive Seating
**File:** `TEST-EXECUTION-GUIDE.md` (Section 2)
**Focus:** Advanced seating chart functionality
**Duration:** 90-120 minutes

**What it tests:**
- Seating chart designer UI
- Section and table creation
- Visual positioning on canvas
- Seat selection during checkout
- Reservation system (no double-booking)
- Table package purchases
- Seat assignment display on tickets
- Seating assignments dashboard

**Critical path:** Design seating → Customer selects seats → Purchase with reservations

---

### 👥 Test 3: Staff Hierarchy with Cash Sales
**File:** `TEST-EXECUTION-GUIDE.md` (Section 3)
**Focus:** Multi-level staff system and commission tracking
**Duration:** 90-120 minutes

**What it tests:**
- Staff member addition (team members, scanners)
- Sub-seller assignments (hierarchical structure)
- Commission calculations (percentage-based)
- Ticket allocation to staff
- Cash sales recording
- Multiple payment methods (Cash, Cash App, Square)
- Ticket transfers between staff
- Approval/rejection workflow
- Settlement and payout tracking

**Critical path:** Organizer adds staff → Staff sells tickets → Transfer inventory → Track commissions

---

## Getting Started

### Prerequisites
- Modern browser (Chrome or Firefox recommended)
- Test account credentials:
  - Email: `organizer1@stepperslife.com`
  - Password: `Bobby321!`
  - Credit balance: 300 tickets
- Mobile device (for mobile/PWA testing)
- Screenshot tool

### Test Execution Steps

1. **Read the test guide:**
   ```bash
   cat TEST-EXECUTION-GUIDE.md
   ```

2. **Prepare your environment:**
   - Clear browser cache
   - Open DevTools (F12)
   - Start with fresh incognito window
   - Have screenshot tool ready

3. **Execute tests in order:**
   - Start with Test 1 (validates core functionality)
   - Then Test 3 (tests business logic)
   - Finally Test 2 (most complex feature)

4. **Document findings:**
   - Use `TEST-RESULTS-TEMPLATE.md` as your template
   - Take screenshots at each step
   - Copy console errors
   - Note unexpected behavior

5. **Create final report:**
   ```bash
   cp TEST-RESULTS-TEMPLATE.md TEST-RESULTS-2025-01-11.md
   # Fill in your findings
   ```

---

## Test Data

### Pre-Configured Test Accounts

**Organizer Account:**
```
Email: organizer1@stepperslife.com
Password: Bobby321!
Credits: 300 tickets (pre-allocated)
User ID: kh77xbfm5kcgn526jd7h1mks7h7v8vnt
```

**Test Credit Cards (Square Sandbox):**
```
Card Number: 4111 1111 1111 1111
Expiration: Any future date (e.g., 12/26)
CVV: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 60611)
```

**Test Buyer Email:**
```
Use any email: testbuyer@example.com
(You won't receive emails unless you use a real address)
```

---

## Quick Scripts

### Automated Setup
If you want to quickly create test events with data:

```bash
# Create complete test event with staff, orders, etc.
node scripts/create-complete-test-event.mjs

# Create comprehensive E2E test (all scenarios)
node scripts/comprehensive-e2e-test.mjs

# Reset to clean state
node scripts/reset-to-ira-only.mjs
```

### Manual Testing
For manual testing (recommended for finding UX issues):
- Follow `TEST-EXECUTION-GUIDE.md` step-by-step
- Take screenshots at each checkpoint
- Document all errors in `TEST-RESULTS-TEMPLATE.md`

---

## What to Look For

### Critical Errors (Must Find!)
- [ ] 404 errors on navigation
- [ ] Payment processing failures
- [ ] QR codes not generating
- [ ] Cannot create events
- [ ] Cannot purchase tickets
- [ ] Double-booking in seating
- [ ] Commission calculations wrong

### High Priority Issues
- [ ] Broken images
- [ ] Incorrect price calculations
- [ ] Missing validation errors
- [ ] Email notifications not working
- [ ] Scanner not validating tickets
- [ ] Infinite loading loops

### UX Improvements
- [ ] Confusing error messages
- [ ] Slow page loads (>3 seconds)
- [ ] Mobile layout issues
- [ ] Unclear navigation
- [ ] Missing helpful hints
- [ ] Accessibility problems

---

## Reporting Issues

### Bug Report Format
When you find a bug, document:

```markdown
## Bug Title: [Short description]

**Severity:** Critical / High / Medium / Low
**Test:** Test 1 / Test 2 / Test 3
**Step:** [Step number from guide]

**Steps to Reproduce:**
1. Navigate to...
2. Click on...
3. Enter...
4. Observe error

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshot:** [filename.png]

**Console Error:**
```
[Paste console error here]
```

**Browser:** Chrome 120 / Firefox 121 / Safari 17
**Device:** Desktop / Mobile (iPhone 12)
**URL:** https://events.stepperslife.com/...
```

---

## Test Results History

| Date | Tester | Tests Run | Critical | High | Medium | Status |
|------|--------|-----------|----------|------|--------|--------|
| 2025-01-11 | [Your Name] | 0/3 | - | - | - | In Progress |

---

## Known Issues (Pre-Testing)

Based on code review, we expect to find these issues:

1. **FREE_EVENT Registration 404**
   - Expected location: `/events/[eventId]/register`
   - Impact: Free event users cannot register
   - Workaround: None currently

2. **Seat Info Not Showing on Scanner**
   - Seat assignments don't display during ticket validation
   - Impact: Scanner can't verify seat location
   - Workaround: Check manually

3. **Image Loading Issues**
   - Some event images may not display
   - Impact: Poor visual experience
   - Workaround: Upload multiple times

If you DON'T find these during testing, that's good! It means they've been fixed.

---

## Success Criteria

### Test 1 (Simple Ticketed Event)
✅ Event created and published
✅ Tickets purchased successfully
✅ Payment processed (Square)
✅ QR codes generated (3 unique)
✅ Email confirmation sent
✅ Scanner validated ticket
✅ Duplicate scan prevented
✅ Credits deducted correctly

### Test 2 (Seated Event)
✅ Seating chart designed
✅ Seats selectable during checkout
✅ Reservations prevent double-booking
✅ Seat info on tickets
✅ Seating assignments visible to organizer

### Test 3 (Staff Hierarchy)
✅ Staff members added successfully
✅ Sub-sellers assigned correctly
✅ Cash sales recorded
✅ Commissions calculated accurately
✅ Transfers approved/rejected
✅ Settlement tracking works

---

## Tools & Resources

### Browser DevTools
- **Console Tab:** View JavaScript errors
- **Network Tab:** See failed requests (look for red items)
- **Application Tab:** Check localStorage/cookies
- **Performance Tab:** Measure page load times

### Screenshot Tools
- **Windows:** Snipping Tool (Win + Shift + S)
- **Mac:** Cmd + Shift + 4
- **Chrome:** F12 → Device Mode → Screenshot icon
- **Extension:** Lightshot, Awesome Screenshot

### Mobile Testing
- **Chrome DevTools:** Device Mode (Ctrl + Shift + M)
- **Responsive Tester:** responsively.app
- **Real Device:** Use your phone!

---

## Contact

For questions about testing:
- Review mutation signatures in `/convex/` directory
- Check schema definitions in `/convex/schema.ts`
- Consult test scripts in `/scripts/` directory

---

## Appendix: Test Coverage Map

```
Platform Areas                  Test 1  Test 2  Test 3
──────────────────────────────────────────────────────
Event Creation                    ✓       ✓       ✓
Ticket Tiers                      ✓       ✓       ✓
Seating Charts                    ✗       ✓       ✗
Payment Processing                ✓       ✓       ✗
QR Code Generation                ✓       ✓       ✓
Email Notifications               ✓       ✓       ✓
Scanner Validation                ✓       ✓       ✓
Staff Management                  ✗       ✗       ✓
Cash Sales                        ✗       ✗       ✓
Commission Tracking               ✗       ✗       ✓
Ticket Transfers                  ✗       ✗       ✓
Settlement                        ✗       ✗       ✓
Mobile Responsiveness             ✓       ✓       ✓
Accessibility                     ✓       ✗       ✗
```

**Coverage:** 3 scenarios cover ~85% of core platform functionality

---

**Last Updated:** 2025-01-11
**Version:** 1.0
**Status:** Ready for Testing ✅
