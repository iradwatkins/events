# Archived Scripts

This directory contains 82 development and testing scripts that are no longer actively used in production.

**Archived:** 2025-11-14
**Reason:** Code cleanup - Phase 1 of comprehensive refactor

## Why These Were Archived

These scripts were created during development for:
- Creating test accounts and events
- Debugging specific issues (Boom Shaka event, image uploads, etc.)
- Data resets and cleanups during development
- Verifying features during testing
- One-time data migrations

## Categories

### Test Account Creation (12 scripts)
Scripts for creating and managing test user accounts.

### Test Event Creation (15 scripts)
Scripts for generating test events with various configurations.

### Debugging & Fixes (18 scripts)
One-time scripts created to fix specific issues during development.

### Data Cleanup/Reset (17 scripts)
Scripts for resetting data during development phases.

### Verification Scripts (10 scripts)
Scripts for verifying system state during testing.

### Test Products/Sales (6 scripts)
Scripts for testing product and ticket sales features.

### Test Staff/Hierarchy (4 scripts)
Scripts for testing staff hierarchy and commission features.

## Production Scripts (Still Active)

The following scripts remain in the parent `/scripts/` directory for production use:
1. `seed-admin.mjs` - Create admin accounts
2. `reset-admin-password.mjs` - Password recovery
3. `generate-icons.js` - Icon generation
4. `generate-png-icons.js` - PNG icon generation
5. `migrate-seller-to-team-members.mjs` - Data migration
6. `update-organizer-credits.mjs` - Credit management
7. `remove-console-logs.mjs` - Code cleanup utility
8. `remove-console-logs.sh` - Backup cleanup script
9. `replace-colors.sh` - Theme maintenance
10. `remove-testing-mode.sh` - Production cleanup

## Can I Delete These?

**No** - Keep them archived for historical reference. They may provide useful context for:
- Understanding how specific features were developed
- Recreating test scenarios if needed
- Reference for writing future maintenance scripts

## Restoration

If you need to restore a specific script:
```bash
cp scripts/archived/<script-name> scripts/
chmod +x scripts/<script-name>
```
