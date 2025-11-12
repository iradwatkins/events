# Comprehensive End-to-End Test Documentation

## Overview

This document describes the comprehensive end-to-end test script that simulates a complete event lifecycle with organizer, staff hierarchy, ticket sales, transfers, and scanning.

**Script Location:** `/root/websites/events-stepperslife/scripts/comprehensive-e2e-test.mjs`

## Test Scenario

The test creates a realistic event scenario that includes:

- 1 Organizer account
- 1 Event (Annual Gala Night 2025)
- 14 Staff members across hierarchy levels
- Multiple ticket sales (online and cash)
- 5 Transfer scenarios (approved, rejected, cancelled)
- Door scanning with error cases
- Comprehensive reporting

## Test Structure

### Phase 1: Organizer & Event Setup

**Creates:**
- Organizer account with unique email (`test-organizer-{timestamp}@e2etest.com`)
- Password: `TestPass123!` (bcrypt hashed)
- Allocates 300 free tickets (first-time organizer bonus)
- Creates event:
  - **Name:** Annual Gala Night 2025
  - **Type:** TICKETED_EVENT
  - **Capacity:** 500 people
  - **Date:** 2 weeks from test execution
  - **Location:** Grand Ballroom, Test City, TS
  - **Duration:** 4 hours

**Ticket Tiers:**
1. General Admission: $25.00 × 300 tickets
2. VIP: $50.00 × 150 tickets
3. Table Package: $400.00 × 10 tables (8 seats each)

### Phase 2: Staff Hierarchy Setup

Creates 14 staff members across 3 hierarchy levels:

#### Level 1: Door Scanners (2 staff)
- **Alice Scanner**
  - Email: alice.scanner@e2etest.com
  - Role: STAFF
  - Permissions: Can scan, cannot sell
  - Allocated tickets: 0

- **Bob Scanner**
  - Email: bob.scanner@e2etest.com
  - Role: STAFF
  - Permissions: Can scan, cannot sell
  - Allocated tickets: 0

#### Level 1: Staff Support (2 staff)
- **Charlie Support**
  - Email: charlie.support@e2etest.com
  - Role: TEAM_MEMBERS
  - Commission: 5% (PERCENTAGE)
  - Allocated tickets: 100
  - Can assign sub-sellers: Yes (max 3)

- **Diana Support**
  - Email: diana.support@e2etest.com
  - Role: TEAM_MEMBERS
  - Commission: 4% (PERCENTAGE)
  - Allocated tickets: 80
  - Can assign sub-sellers: Yes (max 3)

#### Level 1: Resellers (3 staff)
- **Eve Reseller**
  - Email: eve.reseller@e2etest.com
  - Role: TEAM_MEMBERS
  - Commission: 10% (PERCENTAGE)
  - Allocated tickets: 150
  - Can assign sub-sellers: Yes (max 5)

- **Frank Reseller**
  - Email: frank.reseller@e2etest.com
  - Role: TEAM_MEMBERS
  - Commission: 8% (PERCENTAGE)
  - Allocated tickets: 120
  - Can assign sub-sellers: Yes (max 5)

- **Grace Reseller**
  - Email: grace.reseller@e2etest.com
  - Role: TEAM_MEMBERS
  - Commission: 12% (PERCENTAGE)
  - Allocated tickets: 100
  - Can assign sub-sellers: Yes (max 5)

#### Level 2: Associates (7 sub-sellers)

**Under Charlie Support:**
- Henry Associate: 30 tickets
- Ivy Associate: 30 tickets

**Under Eve Reseller:**
- Jack Associate: 20 tickets
- Karen Associate: 25 tickets
- Leo Associate: 30 tickets

**Under Frank Reseller:**
- Mia Associate: 25 tickets
- Noah Associate: 25 tickets

All associates have:
- Role: ASSOCIATES
- Commission: 5% (PERCENTAGE)
- Payment method: CASH (default for sales)

### Phase 3: Ticket Sales Simulation

#### Online Sales (10 tickets)
- 5× General Admission → Customer One
- 3× VIP → Customer Two
- 2× Table Packages → Customer Three

**Revenue:** ~$1,200 (exact: 5×$25 + 3×$50 + 2×$400 = $975 + $150 + $800 = $1,925)

#### Staff Cash Sales (110 tickets)
| Staff Member | Tier | Quantity | Payment Method | Commission |
|--------------|------|----------|----------------|------------|
| Charlie Support | GA | 15 | CASH | 5% ($18.75) |
| Diana Support | VIP | 10 | CASH_APP | 4% ($20.00) |
| Eve Reseller | GA | 25 | SQUARE | 10% ($62.50) |
| Frank Reseller | GA | 20 | CASH | 8% ($40.00) |
| Frank Reseller | VIP | 10 | CASH | 8% ($40.00) |
| Grace Reseller | GA | 30 | CASH | 12% ($90.00) |

**Total Staff Sales:** 110 tickets
**Total Commission:** ~$271.25

#### Associate Sales (91 tickets)
| Associate | Parent | Tier | Quantity | Commission |
|-----------|--------|------|----------|------------|
| Henry (Charlie) | Charlie Support | GA | 15 | 5% ($18.75) |
| Ivy (Charlie) | Charlie Support | GA | 15 | 5% ($18.75) |
| Jack (Eve) | Eve Reseller | GA | 10 | 5% ($12.50) |
| Karen (Eve) | Eve Reseller | GA | 15 | 5% ($18.75) |
| Leo (Eve) | Eve Reseller | VIP | 12 | 5% ($30.00) |
| Mia (Frank) | Frank Reseller | GA | 12 | 5% ($15.00) |
| Noah (Frank) | Frank Reseller | GA | 12 | 5% ($15.00) |

**Total Associate Sales:** 91 tickets
**Total Commission:** $128.75

**Note:** Parent staff members (Charlie, Eve, Frank) also earn commission on their associates' sales based on `parentCommissionPercent` configuration.

### Phase 4: Ticket Transfer Scenarios

#### Transfer #1: Frank → Eve (ACCEPTED)
- **Quantity:** 30 tickets
- **Reason:** "Frank is running low on inventory"
- **Status:** ACCEPTED
- **Result:** Frank's balance -30, Eve's balance +30

#### Transfer #2: Charlie → Diana (ACCEPTED)
- **Quantity:** 20 tickets
- **Reason:** "Diana is outselling Charlie - reallocating to high performer"
- **Status:** ACCEPTED
- **Result:** Charlie's balance -20, Diana's balance +20

#### Transfer #3: Eve → Jack Associate (ACCEPTED)
- **Quantity:** 15 tickets
- **Reason:** "High demand in Jack's area - needs more inventory"
- **Status:** ACCEPTED
- **Result:** Eve's balance -15, Jack's balance +15

#### Transfer #4: Grace → Frank (REJECTED)
- **Quantity:** 25 tickets
- **Reason:** "Helping Frank replenish inventory"
- **Rejection Reason:** "Already have enough inventory, thanks anyway!"
- **Status:** REJECTED
- **Result:** No balance changes

#### Transfer #5: Diana → Charlie (CANCELLED)
- **Quantity:** 10 tickets
- **Reason:** "Helping Charlie replenish"
- **Status:** CANCELLED (by sender)
- **Result:** No balance changes

**Transfer Summary:**
- Total transfers: 5
- Accepted: 3 (65 tickets transferred)
- Rejected: 1
- Cancelled: 1

### Phase 5: Door Scanning Simulation

#### Scanner 1 (Alice Scanner)
**Valid Scans:** 15 tickets
- Mix of General Admission and VIP tickets
- All scans successful

**Error Cases:**
- Already scanned ticket (ERROR_ALREADY_SCANNED)
- Invalid/fake ticket code (ERROR_NOT_FOUND)

**Total Operations:** 17 (15 valid + 2 errors)

#### Scanner 2 (Bob Scanner)
**Valid Scans:** 20 tickets
- Mix of General Admission and VIP tickets
- All scans successful

**Error Cases:**
- Wrong event ticket (ERROR_WRONG_EVENT)

**Undo Operations:** 2 scans undone (mistake correction)

**Total Operations:** 23 (20 valid + 1 error + 2 undos)

**Scanning Summary:**
- Total scan operations: 40
- Successful scans: 35
- Error cases: 3
- Undos: 2
- Net scanned tickets: 33 (35 - 2 undos)

### Phase 6: Reports & Verification

#### Staff Performance Report

Shows for each staff member:
- Name
- Role
- Tickets allocated
- Tickets sold
- Tickets remaining
- Commission earned

#### Transfer Audit Log

Lists all transfers with:
- From staff member
- To staff member
- Quantity transferred
- Status (ACCEPTED/REJECTED/CANCELLED)

#### Scanning Statistics

Per-scanner breakdown:
- Successful scans
- Error scans
- Undo operations

#### Hierarchy Tree Visualization

ASCII tree showing:
- Organizer at root
- Door scanners (2)
- Staff support (2) with their associates
- Resellers (3) with their associates

#### Verification Checks

✓ Total sales transactions match ticket count
✓ Commission calculations are correct
✓ Parent commission flows validated
✓ Transfer balances updated correctly
✓ Scan counts match ticket status
✓ Net payouts calculated accurately

## Usage

### Run the Test

```bash
cd /root/websites/events-stepperslife

# Run the test
node scripts/comprehensive-e2e-test.mjs

# Run with cleanup (removes test data after completion)
node scripts/comprehensive-e2e-test.mjs --cleanup
```

### Add to package.json

```json
{
  "scripts": {
    "test:e2e": "node scripts/comprehensive-e2e-test.mjs",
    "test:e2e:clean": "node scripts/comprehensive-e2e-test.mjs --cleanup"
  }
}
```

Then run:
```bash
npm run test:e2e
```

## Expected Output

The test produces colored, formatted output with progress indicators:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 COMPREHENSIVE END-TO-END TEST STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PHASE 1: Setup Organizer & Event
✓ Organizer created: test-organizer-1234567890@e2etest.com
✓ Credits allocated: 300 tickets (first event free)
✓ Event created: Annual Gala Night 2025
  - Capacity: 500 seats
  - Ticket tiers: 3 created

📋 PHASE 2: Staff Hierarchy Setup
✓ Door scanners: 2 created
✓ Staff support: 2 created
✓ Resellers: 3 created
✓ Associates: 7 created
  Total staff members: 14

📋 PHASE 3: Ticket Sales Simulation
✓ Online sales: 10 tickets ($1,925.00 revenue)
✓ Staff cash sales: 110 tickets
✓ Associate sales: 91 tickets
  Total tickets sold: 211
  Total commission: ~$400.00

📋 PHASE 4: Ticket Transfers
✓ Transfer #1: Frank → Eve (30 tickets) [ACCEPTED]
✓ Transfer #2: Charlie → Diana (20 tickets) [ACCEPTED]
✓ Transfer #3: Eve → Jack (15 tickets) [ACCEPTED]
✗ Transfer #4: Grace → Frank (25 tickets) [REJECTED]
✗ Transfer #5: Diana → Charlie (10 tickets) [CANCELLED]
  Transfers: 5 total (3 accepted, 1 rejected, 1 cancelled)

📋 PHASE 5: Door Scanning
✓ Alice Scanner: 17 operations (15 valid, 2 errors)
✓ Bob Scanner: 23 operations (20 valid, 1 error, 2 undos)
  Total scanned: 33 tickets net

📋 PHASE 6: Reports & Verification
[Detailed tables with staff performance, commissions, transfers]

✅ ALL TESTS PASSED - COMPREHENSIVE E2E TEST COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## What This Tests

### ✅ User Management
- Creating organizer accounts with hashed passwords
- Credit allocation for first-time organizers
- User role assignment

### ✅ Event Management
- Event creation with all required fields
- Ticket tier setup (individual tickets and table packages)
- Event capacity management

### ✅ Staff Hierarchy
- Creating staff at different levels (STAFF, TEAM_MEMBERS, ASSOCIATES)
- Assigning sub-sellers to parent staff
- Permission management (scanning, selling, sub-seller assignment)
- Commission structures (percentage and fixed)

### ✅ Ticket Sales
- Online ticket purchases
- Staff cash sales (various payment methods)
- Associate sales with hierarchical commission
- Order creation and completion
- Ticket generation with QR codes

### ✅ Ticket Transfers
- Transfer request creation
- Transfer acceptance workflow
- Transfer rejection handling
- Transfer cancellation by sender
- Atomic balance updates
- 48-hour expiration logic

### ✅ Door Scanning
- Valid ticket scanning
- Duplicate scan prevention
- Wrong event detection
- Invalid ticket handling
- Scan undo functionality

### ✅ Reporting & Analytics
- Staff performance summaries
- Commission calculations
- Transfer audit logs
- Hierarchy tree visualization
- Verification of data integrity

## Dependencies

```json
{
  "convex": "^1.x",
  "bcryptjs": "^2.4.3"
}
```

## Known Limitations

1. **Cleanup not implemented yet** - The `--cleanup` flag is accepted but cleanup logic needs to be added
2. **No authentication context** - Tests run in TESTING MODE without actual auth tokens
3. **Limited error recovery** - If a phase fails, subsequent phases don't run
4. **Sequential execution** - Each phase waits for previous phase to complete

## Future Enhancements

- [ ] Implement cleanup functionality
- [ ] Add Playwright browser automation for UI testing
- [ ] Test webhook integrations (Square, PayPal, Stripe)
- [ ] Test email notifications
- [ ] Add performance metrics (response times, throughput)
- [ ] Parallel test execution for different scenarios
- [ ] Screenshot capture for visual regression testing
- [ ] Database snapshot/restore for repeatable tests

## Troubleshooting

### Error: "User with this email already exists"
Run with a fresh database or the script will auto-generate unique timestamps.

### Error: "Insufficient credits"
The organizer only gets 300 free tickets. Reduce ticket allocations or purchase more credits.

### Error: "Could not find public function"
Run `npx convex deploy` to ensure all mutations are deployed.

### Error: "Module type not specified"
Add `"type": "module"` to package.json or ignore the warning.

## Contact

For questions or issues with this test:
- Review mutation signatures in `/convex/` directory
- Check schema definitions in `/convex/schema.ts`
- Consult existing test scripts in `/scripts/` directory

---

**Last Updated:** 2025-01-11
**Version:** 1.0.0
**Status:** ✅ Ready for use
