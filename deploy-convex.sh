#!/bin/bash

# Convex Production Deployment Script
# This will deploy all Convex mutations and functions to production

set -e

echo "🚀 Deploying Convex to Production"
echo ""
echo "Deployment: prod:combative-viper-389"
echo "Project: event.stepperslife.com"
echo ""

# Check if we're in the right directory
if [ ! -d "convex" ]; then
    echo "❌ Error: convex directory not found"
    echo "Please run this script from the project root"
    exit 1
fi

echo "📁 Convex functions to deploy:"
echo "  ✓ events/mutations.ts (createEvent - TESTING MODE)"
echo "  ✓ files/mutations.ts (generateUploadUrl, saveImageMetadata)"
echo "  ✓ events/queries.ts (getOrganizerEvents - no auth)"
echo ""

# Deploy with confirmation
echo "⚠️  This will deploy to PRODUCTION"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Deploying..."
npx convex deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Convex deployment successful!"
    echo ""
    echo "Next steps:"
    echo "1. Test image upload at: https://event.stepperslife.com/organizer/events/create"
    echo "2. Create a test event with an image"
    echo "3. Verify event appears in dashboard"
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you're authenticated: npx convex login"
    echo "2. Check you have access to the project"
    echo "3. Try running: npx convex dev (for development)"
    echo ""
    exit 1
fi
