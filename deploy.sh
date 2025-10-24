#!/bin/bash

###############################################################################
# SteppersLife Events - Automated Deployment Script
#
# This script automates the deployment process from GitHub to your VPS.
#
# Usage:
#   1. Make executable: chmod +x deploy.sh
#   2. Run on VPS: ./deploy.sh
#   3. Or run locally to deploy to VPS: ./deploy.sh remote YOUR_IP
#
# What it does:
#   - Pulls latest code from GitHub
#   - Installs dependencies
#   - Builds Next.js app
#   - Restarts PM2 process
#   - Shows deployment status
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/root/websites/events-stepperslife"
APP_NAME="events-stepperslife"
BRANCH="main"

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        exit 1
    fi
}

# Remote deployment function
deploy_remote() {
    local SERVER_IP=$1
    print_header "Deploying to Remote Server: $SERVER_IP"

    print_info "Connecting to server and running deployment..."
    ssh root@$SERVER_IP "cd $APP_DIR && ./deploy.sh"

    print_success "Remote deployment completed!"
    exit 0
}

###############################################################################
# Main Deployment Process
###############################################################################

# Check if running in remote mode
if [ "$1" == "remote" ] && [ -n "$2" ]; then
    deploy_remote $2
fi

print_header "SteppersLife Events - Deployment Script"

# Check if running on server
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory not found: $APP_DIR"
    print_info "Please run this script on your VPS or create the application directory"
    exit 1
fi

# Navigate to app directory
cd $APP_DIR

# 1. Check dependencies
print_header "Step 1: Checking Dependencies"
check_command git
check_command node
check_command npm
check_command pm2
print_success "All dependencies are installed"

# 2. Check for uncommitted changes
print_header "Step 2: Checking Git Status"
if [[ -n $(git status -s) ]]; then
    print_info "You have uncommitted changes:"
    git status -s
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi
print_success "Git status OK"

# 3. Fetch latest code
print_header "Step 3: Fetching Latest Code"
print_info "Fetching from origin..."
git fetch origin

print_info "Current branch: $(git branch --show-current)"
print_info "Pulling latest changes from $BRANCH..."
git pull origin $BRANCH

print_success "Code updated successfully"

# 4. Install dependencies
print_header "Step 4: Installing Dependencies"
print_info "Running npm install..."
npm install --production=false

print_success "Dependencies installed"

# 5. Build application
print_header "Step 5: Building Application"
print_info "Running npm run build..."
npm run build

print_success "Build completed successfully"

# 6. Create logs directory if it doesn't exist
print_header "Step 6: Setting up Logging"
mkdir -p $APP_DIR/logs
print_success "Logs directory ready"

# 7. Restart PM2 process
print_header "Step 7: Restarting Application"
if pm2 list | grep -q $APP_NAME; then
    print_info "Restarting existing PM2 process..."
    pm2 restart $APP_NAME
else
    print_info "Starting new PM2 process..."
    pm2 start ecosystem.config.js --env production
fi

# Save PM2 process list
pm2 save

print_success "Application restarted successfully"

# 8. Show deployment info
print_header "Step 8: Deployment Status"

echo -e "\n${GREEN}Deployment Information:${NC}"
echo "─────────────────────────────────────────"
echo "App Name:       $APP_NAME"
echo "Directory:      $APP_DIR"
echo "Branch:         $BRANCH"
echo "Node Version:   $(node --version)"
echo "NPM Version:    $(npm --version)"
echo "Git Commit:     $(git rev-parse --short HEAD)"
echo "Deployed At:    $(date '+%Y-%m-%d %H:%M:%S')"
echo "─────────────────────────────────────────"

# 9. Show PM2 status
print_header "PM2 Process Status"
pm2 list

print_info "\nUseful PM2 commands:"
echo "  pm2 logs $APP_NAME          # View logs"
echo "  pm2 monit                   # Monitor resources"
echo "  pm2 restart $APP_NAME       # Restart app"
echo "  pm2 stop $APP_NAME          # Stop app"
echo "  pm2 delete $APP_NAME        # Remove from PM2"

# 10. Test application
print_header "Testing Application"
print_info "Waiting for app to start..."
sleep 3

if curl -f http://localhost:3004 > /dev/null 2>&1; then
    print_success "Application is responding on port 3004"
else
    print_error "Application is not responding on port 3004"
    print_info "Check PM2 logs: pm2 logs $APP_NAME"
fi

# 11. Final success message
print_header "Deployment Complete! 🚀"
echo -e "${GREEN}Your application is now live at:${NC}"
echo -e "${BLUE}  → http://event.stepperslife.com${NC}"
echo -e "${BLUE}  → https://event.stepperslife.com${NC} (if SSL is configured)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the live site in your browser"
echo "  2. Check PM2 logs: pm2 logs $APP_NAME"
echo "  3. Monitor with: pm2 monit"
echo ""
