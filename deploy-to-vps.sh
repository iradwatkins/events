#!/bin/bash

# Deploy to VPS Script
# Syncs local changes to production server

set -e

VPS_HOST="events-vps"
VPS_PATH="/root/websites/events-stepperslife"
LOCAL_PATH="/Users/irawatkins/Desktop/event.stepperslife.com"

echo "🚀 Deploying to VPS: $VPS_HOST (72.60.28.175)"
echo "📁 Local: $LOCAL_PATH"
echo "📁 Remote: $VPS_PATH"
echo ""

# Sync the entire project excluding node_modules and build artifacts
echo "📦 Syncing project files..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'STEPFILES' \
  --exclude 'DEPLOY_FILES' \
  --exclude '*.backup.*' \
  "$LOCAL_PATH/" "$VPS_HOST:$VPS_PATH/"

echo ""
echo "🔧 Running deployment commands on VPS..."
echo ""

ssh -t "$VPS_HOST" << 'ENDSSH'
cd /root/websites/events-stepperslife

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🏗️  Building application..."
npm run build

echo ""
echo "🔄 Restarting PM2..."
pm2 restart events-stepperslife || pm2 start npm --name "events-stepperslife" -- start

echo ""
echo "✅ Deployment complete!"
pm2 status

ENDSSH

echo ""
echo "✅ Deployment to VPS complete!"
echo "🌐 Visit: https://event.stepperslife.com"
