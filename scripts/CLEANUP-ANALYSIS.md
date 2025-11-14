# Scripts Cleanup Analysis

**Total Scripts:** 94 files in `/scripts/`

## Categories

### ✅ KEEP - Production/Maintenance (10 scripts)
These are genuinely useful for production maintenance:

1. `seed-admin.mjs` - Create admin accounts (KEEP)
2. `reset-admin-password.mjs` - Password recovery (KEEP)
3. `generate-icons.js` - Icon generation utility (KEEP)
4. `generate-png-icons.js` - PNG icon generation (KEEP)
5. `migrate-seller-to-team-members.mjs` - Data migration (KEEP)
6. `update-organizer-credits.mjs` - Credit management (KEEP)
7. `remove-console-logs.mjs` - Just created (KEEP)
8. `remove-console-logs.sh` - Backup cleanup script (KEEP)
9. `replace-colors.sh` - Theme maintenance (KEEP)
10. `remove-testing-mode.sh` - Production cleanup (KEEP)

### 🗑️ DELETE - Test/Debug Scripts (84 scripts)
These were one-time use, development, or debugging scripts:

#### Test Account Creation (~12)
- `create-test-account.mjs`
- `create-test-accounts-and-events.mjs`
- `create-steppers-account.mjs`
- `seed-test-accounts.mjs`
- `setup-restricted-organizer.mjs`
- `set-test-password.mjs`
- `assign-staff-to-test-user.mjs`
- `verify-bobby-admin.mjs`
- `update-admin-to-organizer.mjs`
- `fix-user-role.mjs`
- `audit-all-users.mjs`
- `simple-user-audit.mjs`

#### Test Event Creation (~15)
- `create-test-tickets.mjs`
- `create-ticketed-events.mjs`
- `create-3-test-events.mjs`
- `create-5-test-events.mjs`
- `create-3-complete-test-events.mjs`
- `create-complete-test-event.mjs`
- `create-real-test-events.mjs`
- `create-ballroom-event.mjs`
- `create-bundle-test-events.mjs`
- `create-hierarchy-test-event.mjs`
- `create-table-seating.mjs`
- `activate-all-organizer-events.mjs`
- `activate-test-event-tickets.mjs`
- `activate-all-tickets.mjs`
- `make-event-current.mjs`

#### Test Event Fixes/Debugging (~18)
- `add-boom-shaka-tickets.mjs`
- `fix-boom-shaka-event.mjs`
- `add-event-image.mjs`
- `add-product-images.mjs`
- `fix-event-images.mjs`
- `fix-image-properly.mjs`
- `get-correct-image-url.mjs`
- `fix-payment-configs.mjs`
- `fix-test-event-visibility.mjs`
- `switch-to-prepay-model.mjs`
- `allocate-tickets-to-existing-events.mjs`
- `update-early-bird-dates.mjs`
- `remove-door-price-tier.mjs`
- `enable-cash-for-all-staff.mjs`
- `fix-all-issues.mjs`
- `fix-all-accounts.mjs`
- `comprehensive-audit.mjs`
- `check-event-details.mjs`

#### Test Data Cleanup/Reset (~17)
- `cleanup-test-data.mjs`
- `cleanup-test-events.mjs`
- `cleanup-products.mjs`
- `cleanup-bundle-events.mjs`
- `delete-all-test-events.mjs`
- `reset-all-data-except-products.mjs`
- `reset-all-events.mjs`
- `reset-all-events-tickets.mjs`
- `reset-all-events-comprehensive.mjs`
- `reset-all-users.mjs`
- `reset-to-ira-only.mjs`
- `reset-to-two-admins.mjs`
- `complete-system-reset.mjs`
- `verify-reset.mjs`
- `verify-user-reset.mjs`
- `verify-events.mjs`
- `verify-test-events.mjs`

#### Test Verification (~10)
- `check-events.mjs`
- `check-all-events.mjs`
- `check-credits.mjs`
- `verify-event-setup.mjs`
- `verify-credits-and-sell-tickets.mjs`
- `verify-price-variations.mjs`
- `list-staff-members.mjs`

#### Test Products/Sales (~6)
- `create-test-products.mjs`
- `test-products.mjs`
- `test-product-lifecycle.mjs`
- `test-price-variations.mjs`
- `create-sample-ticket-purchases.mjs`

#### Test Staff/Hierarchy (~4)
- `create-staff-hierarchy-test.mjs`
- `test-staff-dashboard.mjs`
- `test-ticket-sales-and-transfers.mjs`

#### Test Bundles/E2E (~4)
- `test-3day-bundle-flow.mjs`
- `test-copy-roster.mjs`
- `test-copy-roster-errors.mjs`
- `comprehensive-e2e-test.mjs`
- `test-credit-system.mjs`

## Recommendation

**Move 84 obsolete scripts to `scripts/archived/` for historical reference**
**Keep 10 production/maintenance scripts in `scripts/`**

This will:
- Reduce clutter from 94 to 10 scripts
- Preserve historical scripts if ever needed
- Make it clear which scripts are production-ready
- Improve maintainability
