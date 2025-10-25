#!/bin/bash

# Quick Deploy Script - Manual SSH deployment
# Run this in your terminal

set -e

VPS_HOST="root@72.60.28.175"
LOCAL_PATH="/Users/irawatkins/Desktop/event.stepperslife.com"

echo "🚀 Quick Deploy to Production"
echo ""
echo "This will:"
echo "  1. Sync your files to the VPS"
echo "  2. Install dependencies"
echo "  3. Build the application"
echo "  4. Restart the server"
echo ""
echo "⚠️  You'll need to enter the password a few times:"
echo "   Password: Bobby321&Gloria321Watkins?"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "📦 Step 1/4: Syncing files to VPS..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'STEPFILES' \
  --exclude 'DEPLOY_FILES' \
  --exclude '*.backup.*' \
  "$LOCAL_PATH/" "$VPS_HOST:/root/websites/events-stepperslife/"

echo ""
echo "🔧 Step 2/4: Installing dependencies..."
ssh -t "$VPS_HOST" "cd /root/websites/events-stepperslife && npm install"

echo ""
echo "🏗️  Step 3/4: Building application..."
ssh -t "$VPS_HOST" "cd /root/websites/events-stepperslife && npm run build"

echo ""
echo "🔄 Step 4/4: Restarting PM2..."
ssh -t "$VPS_HOST" "cd /root/websites/events-stepperslife && pm2 restart events-stepperslife || pm2 start npm --name 'events-stepperslife' -- start"

echo ""
echo "📊 Checking deployment status..."
ssh -t "$VPS_HOST" "pm2 status && pm2 logs events-stepperslife --lines 20 --nostream"

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your site: https://event.stepperslife.com"
echo "📋 Check organizer dashboard: https://event.stepperslife.com/organizer/events"
echo ""
