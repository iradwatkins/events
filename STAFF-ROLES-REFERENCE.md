# Staff Roles & Hierarchy Reference

**Last Updated:** 2025-01-12
**Platform:** https://events.stepperslife.com

---

## Role Hierarchy Overview

The platform supports a 3-tier staff hierarchy for event ticket sales:

```
ORGANIZER (Event Owner)
    │
    ├─► STAFF (Door Staff / Scanners)
    │       - Primary role: Scan tickets at door
    │       - Can sell tickets if organizer permits
    │       - Cannot assign sub-sellers
    │
    ├─► TEAM_MEMBERS (Team Members / Sellers)
    │       - Primary role: Sell tickets
    │       - Can scan if organizer permits
    │       - Can assign ASSOCIATES (sub-sellers)
    │       - Earn commission on own sales
    │       - Earn commission split on associate sales
    │       │
    │       └─► ASSOCIATES (Sub-sellers)
    │               - Assigned by TEAM_MEMBERS
    │               - Sell tickets under their parent
    │               - Earn commission on their sales
    │               - Parent team member also earns commission
    │
    └─► TEAM_MEMBERS (can also assign more TEAM_MEMBERS as peers)
```

---

## Role Definitions

### 1. STAFF (Door Staff)
**Role Code:** `"STAFF"`
**Display Name:** "Door Staff"
**Former Names:** `SCANNER` (legacy, deprecated)

**Capabilities:**
- ✅ Scan and validate tickets at event entrance
- ✅ View ticket details and attendance
- ✅ Can sell tickets IF organizer grants permission (`canScan: true`)
- ❌ Cannot assign sub-sellers
- ❌ No commission structure (unless organizer manually enables)

**Use Case:** Door security, ticket validation staff, ushers

---

### 2. TEAM_MEMBERS (Team Members / Sellers)
**Role Code:** `"TEAM_MEMBERS"`
**Display Name:** "Team Member"
**Former Names:** `SELLER`, `SUPPORT_STAFF` (legacy, deprecated)

**Capabilities:**
- ✅ Sell tickets and earn commission
- ✅ Can scan tickets IF organizer grants permission (`canScan: true`)
- ✅ Can assign ASSOCIATES (sub-sellers) if enabled
- ✅ Earn commission on own ticket sales
- ✅ Earn commission split on associate sales
- ✅ Can accept cash in-person payments (`acceptCashInPerson`)
- ✅ Access staff portal with sales dashboard
- ✅ View their sub-sellers and commissions

**Commission Types:**
- **PERCENTAGE:** Earn % of ticket price (e.g., 10%)
- **FIXED:** Earn fixed amount per ticket (e.g., $5.00)

**Hierarchy Features:**
- **Can assign ASSOCIATES:** Create sub-seller hierarchy
- **Parent Commission:** Keep % of associate sales (e.g., 5%)
- **Sub-seller Commission:** Associates get their % (e.g., 5%)
- **Example:** $100 sale by associate with 5% split:
  - Associate earns: $5
  - Team Member (parent) earns: $5
  - Net to organizer: $90

**Use Case:** Trusted sellers, promotional partners, marketing teams

---

### 3. ASSOCIATES (Sub-sellers)
**Role Code:** `"ASSOCIATES"`
**Display Name:** "Associate"
**Former Names:** `SUB_RESELLER` (legacy, deprecated)

**Capabilities:**
- ✅ Sell tickets assigned by their parent TEAM_MEMBER
- ✅ Earn commission on ticket sales
- ✅ Can accept cash in-person payments (`acceptCashInPerson`)
- ✅ Access staff portal (limited view)
- ❌ Cannot scan tickets (unless organizer manually enables)
- ❌ Cannot assign their own sub-sellers

**Assignment:**
- Assigned BY: TEAM_MEMBERS only
- Reports TO: Their parent team member
- Commission: Shared with parent team member

**Use Case:** Independent sellers, affiliates, street teams, promoters

---

## User Roles (Account Level)

These are separate from staff roles and apply at the account level:

### ADMIN
**Role Code:** `"admin"`
**Display Name:** "Administrator"

**Capabilities:**
- ✅ Full system access
- ✅ Manage all users, events, and data
- ✅ Access admin panel
- ✅ System configuration

---

### ORGANIZER
**Role Code:** `"organizer"`
**Display Name:** "Event Organizer"

**Capabilities:**
- ✅ Create and manage events
- ✅ Configure ticket tiers and pricing
- ✅ Assign and manage staff members
- ✅ View analytics and sales reports
- ✅ Process settlements with staff
- ✅ Configure payment methods
- ✅ Access organizer dashboard

---

### USER
**Role Code:** `"user"`
**Display Name:** "User"

**Capabilities:**
- ✅ Browse events
- ✅ Purchase tickets
- ✅ View order history
- ✅ Transfer tickets
- ❌ Cannot create events
- ❌ Cannot manage staff

---

## Schema Definition

```typescript
// User roles (account-level)
role: v.union(
  v.literal("admin"),
  v.literal("organizer"),
  v.literal("user")
)

// Staff roles (event-level)
eventStaff.role: v.union(
  v.literal("STAFF"),         // Door staff / scanners
  v.literal("TEAM_MEMBERS"),  // Team members / sellers
  v.literal("ASSOCIATES")     // Sub-sellers
)
```

---

## Legacy Role Migration

The platform migrated from old role names to new names:

| Old Role | New Role | Migration Date |
|----------|----------|----------------|
| `SCANNER` | `STAFF` | 2024 Q4 |
| `SELLER` | `TEAM_MEMBERS` | 2024 Q4 |
| `SUPPORT_STAFF` | `TEAM_MEMBERS` | 2024 Q4 |
| `SUB_RESELLER` | `ASSOCIATES` | 2024 Q4 |

**Note:** Legacy role names may still appear in old data but are no longer used in new records.

---

## Permission Matrix

| Action | STAFF | TEAM_MEMBERS | ASSOCIATES |
|--------|-------|--------------|------------|
| Scan tickets | ✅ Always | ✅ If permitted | ❌ No |
| Sell tickets | ✅ If permitted | ✅ Always | ✅ Always |
| Assign sub-sellers | ❌ No | ✅ If enabled | ❌ No |
| Accept cash | ✅ If enabled | ✅ If enabled | ✅ If enabled |
| View sales dashboard | ✅ Yes | ✅ Yes | ✅ Yes (limited) |
| View sub-seller sales | ❌ No | ✅ Yes | ❌ No |
| Earn commission | ❌ Usually no | ✅ Yes | ✅ Yes |

---

## Code References

**Role Definitions:** `/root/websites/events-stepperslife/convex/lib/roles.ts:25-32`
```typescript
export const STAFF_ROLES = {
  STAFF: "STAFF",              // Door staff
  TEAM_MEMBERS: "TEAM_MEMBERS", // Team members/partners
  ASSOCIATES: "ASSOCIATES",     // Associates/sub-sellers
} as const;
```

**Schema Definition:** `/root/websites/events-stepperslife/convex/schema.ts:421`
```typescript
role: v.union(v.literal("STAFF"), v.literal("TEAM_MEMBERS"), v.literal("ASSOCIATES")),
```

**Permissions:** `/root/websites/events-stepperslife/convex/lib/permissions.ts:156-199`

**Display Names:** `/root/websites/events-stepperslife/convex/lib/roles.ts:123-125`
```typescript
[STAFF_ROLES.STAFF]: "Door Staff",
[STAFF_ROLES.TEAM_MEMBERS]: "Team Member",
[STAFF_ROLES.ASSOCIATES]: "Associate",
```

---

## Common Confusion Points

### ❌ INCORRECT Terminology:
- ~~SELLER~~ (old name, use TEAM_MEMBERS)
- ~~SCANNER~~ (old name, use STAFF)
- ~~SUB_RESELLER~~ (old name, use ASSOCIATES)
- ~~SUPPORT_STAFF~~ (old name, use TEAM_MEMBERS)

### ✅ CORRECT Terminology:
- **STAFF** - Door staff/scanners
- **TEAM_MEMBERS** - Sellers/team members
- **ASSOCIATES** - Sub-sellers under team members

### Default Sub-sellers Issue:
You mentioned seeing "seller and scanners under default sub sellers" - this is a UI bug or legacy data display issue. The correct hierarchy is:
- STAFF (scanners) are NOT sub-sellers
- TEAM_MEMBERS (sellers) are NOT sub-sellers
- ASSOCIATES are the only true sub-sellers

---

## Quick Reference Card

| You Want To... | Use This Role |
|----------------|---------------|
| Have someone scan tickets at the door | **STAFF** |
| Have someone sell tickets with commission | **TEAM_MEMBERS** |
| Have a seller assign their own sub-sellers | **TEAM_MEMBERS** (enable `canAssignSubSellers`) |
| Create a sub-seller under a team member | **ASSOCIATES** |
| Give scanning permission to a seller | **TEAM_MEMBERS** with `canScan: true` |
| Enable cash payments | Any role with `acceptCashInPerson: true` |

---

**End of Reference**
