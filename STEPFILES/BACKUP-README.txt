EVENTS.STEPPERSLIFE.COM - COMPLETE WEBSITE BACKUP
================================================

Backup Date: November 11, 2025 22:12:46 UTC
Backup File: events-stepperslife-backup-20251111-221246.tar.gz
File Size: 302MB
Location: /root/websites/events-stepperslife-backup-20251111-221246.tar.gz

WHAT'S INCLUDED
===============
✓ Complete Next.js 16 application source code
✓ All configuration files (.env.local, package.json, etc.)
✓ Convex backend functions and schema
✓ All components, pages, and API routes
✓ Public assets (images, logos, icons)
✓ Git repository (.git directory)
✓ Build artifacts (.next directory)
✓ Node modules (node_modules directory)
✓ Test files and Playwright tests
✓ Deployment scripts
✓ All recent commits including latest fixes

SYSTEM REQUIREMENTS
===================
- Node.js v22.19.0 or higher
- npm or yarn package manager
- Convex account (for backend)
- Square account (for payments)
- PayPal account (for payments)

IMPORTANT CONFIGURATION
=======================
The website requires the following environment variables:

REQUIRED:
- NEXT_PUBLIC_CONVEX_URL=https://fearless-dragon-613.convex.cloud
- NEXT_PUBLIC_SQUARE_APPLICATION_ID
- NEXT_PUBLIC_SQUARE_LOCATION_ID
- NEXT_PUBLIC_SQUARE_ENVIRONMENT (production/sandbox)
- NEXT_PUBLIC_PAYPAL_CLIENT_ID
- CONVEX_DEPLOYMENT
- JWT_SECRET (for authentication)

DEPLOYMENT NOTES:
- Current production runs on port 3004
- Uses PM2 for process management
- Nginx reverse proxy configuration required
- SSL certificates required for HTTPS

EXTRACTION INSTRUCTIONS
========================
1. Extract the archive:
   tar -xzf events-stepperslife-backup-20251111-221246.tar.gz

2. Navigate to the directory:
   cd events-stepperslife

3. Install dependencies:
   npm install --legacy-peer-deps

4. Configure environment variables:
   cp .env.local.example .env.local
   (Edit .env.local with your credentials)

5. Deploy Convex functions:
   npx convex deploy

6. Build the application:
   npm run build

7. Start the application:
   npm start
   (or use PM2: pm2 start npm --name "events" -- start)

GIT REPOSITORY
==============
Remote: git@github.com-events:iradwatkins/events.git
Branch: main
Latest Commit: fbb3aaa - "fix: Remove getCurrentUser dependencies"

RECENT CHANGES (in this backup)
================================
✓ Fixed infinite loading on Analytics page
✓ Fixed infinite loading on Settings page
✓ Fixed infinite loading on Tickets page
✓ Fixed infinite loading on Create Event page
✓ Fixed infinite loading on Credits page
✓ Updated authentication to use custom JWT
✓ Removed getCurrentUser dependencies
✓ Added comprehensive test coverage

DATABASE & BACKEND
==================
- Backend: Convex (https://fearless-dragon-613.convex.cloud)
- Authentication: Custom JWT with cookie-based sessions
- Payment Processing: Square & PayPal
- File Storage: Convex file storage

SUPPORT & DOCUMENTATION
========================
- Next.js: https://nextjs.org/docs
- Convex: https://docs.convex.dev
- Square: https://developer.squareup.com
- PayPal: https://developer.paypal.com

For questions or issues, refer to the project README.md file
or contact the development team.

BACKUP INTEGRITY
================
This is a complete, production-ready backup of the website
as of November 11, 2025. All tests were passing at the time
of backup creation.

Test Results:
✓ Analytics and Settings pages - PASSING
✓ Create Event and Credits pages - PASSING
✓ Tickets page - PASSING
✓ All authentication flows - WORKING
✓ PM2 process - ONLINE and STABLE
