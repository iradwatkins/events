#!/bin/bash

###############################################################################
# Remote Deployment Script for SteppersLife Events
# Server: 72.60.28.175
# Target: /root/websites/events-stepperslife
###############################################################################

SERVER="root@72.60.28.175"
APP_DIR="/root/websites/events-stepperslife"
APP_NAME="events-stepperslife"

echo "========================================="
echo "SteppersLife Events - Remote Deployment"
echo "========================================="
echo ""
echo "Server: $SERVER"
echo "Directory: $APP_DIR"
echo ""

# Create deployment commands
DEPLOY_COMMANDS=$(cat <<'EOF'
# Navigate to app directory or create it
if [ -d "/root/websites/events-stepperslife" ]; then
  cd /root/websites/events-stepperslife
  echo "✓ Found existing directory"
else
  echo "Creating new directory..."
  mkdir -p /root/websites
  cd /root/websites
  git clone https://github.com/iradwatkins/event.stepperslife.com.git events-stepperslife
  cd events-stepperslife
  echo "✓ Cloned repository"
fi

echo ""
echo "Current directory: $(pwd)"
echo ""

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git fetch origin
git pull origin main
echo "✓ Code updated"
echo ""

# Show latest commit
echo "Latest commit:"
git log -1 --oneline
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false
echo "✓ Dependencies installed"
echo ""

# Build application
echo "🔨 Building application..."
npm run build
echo "✓ Build complete"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    npm install -g pm2
    echo "✓ PM2 installed"
fi

# Create logs directory
mkdir -p logs

# Check if app is already running
if pm2 list | grep -q "events-stepperslife"; then
    echo "🔄 Restarting application with PM2..."
    pm2 restart events-stepperslife
    echo "✓ Application restarted"
else
    echo "🚀 Starting application with PM2..."
    pm2 start ecosystem.config.js --env production
    echo "✓ Application started"
fi

# Save PM2 process list
pm2 save

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Application Status:"
pm2 list

echo ""
echo "Recent Logs:"
pm2 logs events-stepperslife --lines 10 --nostream

echo ""
echo "🌐 Your site should be live at:"
echo "   https://events.stepperslife.com"
echo ""
echo "Useful commands:"
echo "  pm2 logs events-stepperslife    # View logs"
echo "  pm2 monit                       # Monitor app"
echo "  pm2 restart events-stepperslife # Restart"
echo ""
EOF
)

# Execute deployment via SSH
echo "Connecting to server..."
echo "You will be prompted for the password: Bobby321&Gloria321Watkins!"
echo ""

ssh -t $SERVER "$DEPLOY_COMMANDS"

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "🎉 Deployment Successful!"
    echo "========================================="
    echo ""
    echo "Check your site: https://events.stepperslife.com"
else
    echo ""
    echo "========================================="
    echo "❌ Deployment Failed"
    echo "========================================="
    echo ""
    echo "Please check the error messages above"
fi
