# 🚀 VPS Deployment Guide - SteppersLife Events

Complete guide for deploying to your dedicated IP address / VPS server.

---

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 22.04 LTS (recommended) or similar Linux distribution
- **RAM**: Minimum 1GB, recommended 2GB+
- **Storage**: Minimum 10GB free space
- **Node.js**: Version 20 or higher
- **Dedicated IP**: Your server's public IP address
- **Root/sudo access**: Required for installation

### Local Requirements
- SSH access to your VPS
- Git configured on your local machine
- GitHub repository access: https://github.com/iradwatkins/event.stepperslife.com

---

## 🔧 Part 1: Initial Server Setup

### Step 1: Connect to Your VPS

```bash
ssh root@YOUR_DEDICATED_IP
```

Replace `YOUR_DEDICATED_IP` with your actual server IP address.

### Step 2: Update System Packages

```bash
apt update && apt upgrade -y
```

### Step 3: Install Node.js 20

```bash
# Install Node.js repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x or higher
```

### Step 4: Install PM2 Process Manager

```bash
npm install -g pm2

# Verify installation
pm2 --version
```

### Step 5: Install Nginx Web Server

```bash
# Install Nginx
apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Verify Nginx is running
systemctl status nginx
```

### Step 6: Install Certbot for SSL

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 7: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## 📦 Part 2: Application Deployment

### Step 1: Create Application Directory

```bash
# Create directory structure
mkdir -p /root/websites/events-stepperslife
cd /root/websites/events-stepperslife
```

### Step 2: Clone Repository from GitHub

```bash
# Clone the repository
git clone https://github.com/iradwatkins/event.stepperslife.com.git .

# Verify files
ls -la
```

### Step 3: Create Environment Variables File

```bash
# Create .env.local file
nano .env.local
```

Add the following content (update with your actual values):

```bash
# Convex (Database)
NEXT_PUBLIC_CONVEX_URL=https://combative-viper-389.convex.cloud
CONVEX_DEPLOYMENT=dev:combative-viper-389

# Square (Payments) - PRODUCTION
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-YOUR_PRODUCTION_APP_ID
SQUARE_ACCESS_TOKEN=YOUR_PRODUCTION_ACCESS_TOKEN
NEXT_PUBLIC_SQUARE_LOCATION_ID=YOUR_PRODUCTION_LOCATION_ID
NEXT_PUBLIC_SQUARE_ENVIRONMENT=production

# Resend (Emails)
RESEND_API_KEY=re_RJid1ide_12brJc6fbguPRU5WJzMDB6gQ
RESEND_FROM_EMAIL=events@stepperslife.com

# Application
NEXT_PUBLIC_APP_URL=https://event.stepperslife.com
NODE_ENV=production
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Build the Application

```bash
npm run build
```

This will create the optimized production build.

### Step 6: Create Logs Directory

```bash
mkdir -p /root/websites/events-stepperslife/logs
```

### Step 7: Start Application with PM2

```bash
# Start the app using ecosystem config
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Set up PM2 to start on server reboot
pm2 startup
# Run the command that PM2 outputs

# Check app status
pm2 list
pm2 logs events-stepperslife
```

---

## 🌐 Part 3: Nginx Configuration

### Step 1: Copy Nginx Configuration

```bash
# Copy the nginx config from repository
cp /root/websites/events-stepperslife/nginx-site.conf /etc/nginx/sites-available/event.stepperslife.com
```

### Step 2: Enable the Site

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/event.stepperslife.com /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Should output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 3: Reload Nginx

```bash
systemctl reload nginx
```

### Step 4: Test Application

```bash
# Test local connection
curl http://localhost:3004

# Should return HTML from your Next.js app
```

---

## 🔒 Part 4: SSL Certificate Setup

### Step 1: Configure DNS

Before setting up SSL, ensure your DNS is configured:

**At your domain registrar** (GoDaddy, Cloudflare, Namecheap, etc.):

```
Type: A
Name: event (or @)
Value: YOUR_DEDICATED_IP
TTL: 3600
```

**Wait 15-30 minutes** for DNS propagation.

**Verify DNS**:
```bash
dig event.stepperslife.com +short
# Should return YOUR_DEDICATED_IP
```

### Step 2: Obtain SSL Certificate

```bash
# Run Certbot
certbot --nginx -d event.stepperslife.com

# Follow the prompts:
# 1. Enter your email address
# 2. Agree to terms of service
# 3. Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Step 3: Test SSL Certificate

```bash
# Test SSL
curl https://event.stepperslife.com

# Visit in browser
# https://event.stepperslife.com
```

### Step 4: Set Up Auto-Renewal

```bash
# Test renewal process
certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
# Check it with:
systemctl status certbot.timer
```

---

## 🔄 Part 5: Automated Deployments

### Method 1: Using the Deployment Script

```bash
# On your VPS, run:
cd /root/websites/events-stepperslife
./deploy.sh
```

The script will:
1. Pull latest code from GitHub
2. Install dependencies
3. Build the app
4. Restart PM2
5. Show deployment status

### Method 2: Deploy from Local Machine

```bash
# From your local computer:
cd /path/to/event.stepperslife.com
./deploy.sh remote YOUR_DEDICATED_IP
```

### Method 3: Manual Deployment

```bash
# SSH into server
ssh root@YOUR_DEDICATED_IP

# Navigate to app directory
cd /root/websites/events-stepperslife

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart events-stepperslife

# Check status
pm2 logs events-stepperslife --lines 50
```

---

## 📧 Part 6: Configure Email Domain

### Step 1: Add Domain to Resend

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `stepperslife.com`

### Step 2: Add DNS Records

Add these records to your DNS:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

**DKIM Records** (Resend provides these):
```
Type: CNAME
Name: [from Resend dashboard]
Value: [from Resend dashboard]
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@stepperslife.com
```

### Step 3: Verify Domain

Wait 15-30 minutes, then click "Verify" in Resend dashboard.

---

## ✅ Part 7: Production Checklist

After deployment, verify these:

### Application Tests
- [ ] Website loads at `https://event.stepperslife.com`
- [ ] SSL certificate is valid (padlock in browser)
- [ ] Homepage displays correctly
- [ ] Login page works
- [ ] Magic link emails are sent successfully
- [ ] Can create an event as organizer
- [ ] Can configure ticket tiers
- [ ] Can purchase tickets with real card (test with $1)
- [ ] Confirmation emails arrive
- [ ] Dashboard shows correct analytics

### Server Health
- [ ] PM2 process is running: `pm2 list`
- [ ] No errors in logs: `pm2 logs events-stepperslife --lines 100`
- [ ] Nginx is running: `systemctl status nginx`
- [ ] SSL certificate valid for 90 days: `certbot certificates`
- [ ] Firewall is enabled: `ufw status`
- [ ] PM2 starts on reboot: `pm2 startup`

### Security
- [ ] `.env.local` has production credentials
- [ ] Square production mode enabled
- [ ] Firewall only allows ports 22, 80, 443
- [ ] SSH key authentication enabled (optional but recommended)
- [ ] Regular security updates enabled

---

## 📊 Part 8: Monitoring & Maintenance

### PM2 Commands

```bash
# View process status
pm2 list

# View logs (real-time)
pm2 logs events-stepperslife

# View last 100 lines
pm2 logs events-stepperslife --lines 100

# Monitor CPU/Memory
pm2 monit

# Restart app
pm2 restart events-stepperslife

# Stop app
pm2 stop events-stepperslife

# Delete from PM2
pm2 delete events-stepperslife

# Show detailed info
pm2 show events-stepperslife
```

### Nginx Commands

```bash
# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# Restart Nginx
systemctl restart nginx

# View error logs
tail -f /var/log/nginx/error.log

# View access logs
tail -f /var/log/nginx/access.log
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check CPU usage
top

# Check running processes
ps aux | grep node

# Check port 3004
netstat -tulpn | grep 3004
```

### Log Files

```bash
# PM2 logs
ls -la /root/websites/events-stepperslife/logs/

# View PM2 error log
tail -f /root/websites/events-stepperslife/logs/pm2-error.log

# View PM2 output log
tail -f /root/websites/events-stepperslife/logs/pm2-out.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🐛 Troubleshooting

### Issue: Application Won't Start

```bash
# Check PM2 logs
pm2 logs events-stepperslife --lines 100

# Check if port 3004 is in use
netstat -tulpn | grep 3004

# Try rebuilding
cd /root/websites/events-stepperslife
npm run build
pm2 restart events-stepperslife
```

### Issue: 502 Bad Gateway

```bash
# Check if app is running
pm2 list

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Restart both services
pm2 restart events-stepperslife
systemctl restart nginx
```

### Issue: SSL Certificate Error

```bash
# Check certificate status
certbot certificates

# Renew certificate
certbot renew

# Restart Nginx
systemctl restart nginx
```

### Issue: Database Connection Error

```bash
# Check environment variables
cat /root/websites/events-stepperslife/.env.local

# Verify Convex deployment URL is correct
# Check Convex dashboard: https://dashboard.convex.dev
```

### Issue: Memory Limit Exceeded

```bash
# Check memory usage
pm2 monit

# Increase memory limit in ecosystem.config.js
nano /root/websites/events-stepperslife/ecosystem.config.js
# Change: max_memory_restart: '2G'

# Restart
pm2 restart events-stepperslife
```

---

## 🔄 Updates & Maintenance

### Weekly Tasks
- Check PM2 logs for errors
- Monitor disk space
- Review Nginx access logs

### Monthly Tasks
- Update system packages: `apt update && apt upgrade`
- Review SSL certificate expiry
- Check PM2 process health

### As Needed
- Deploy new features from GitHub
- Update environment variables
- Scale resources if traffic increases

---

## 💰 Cost Estimate

### VPS Server
- **DigitalOcean Droplet**: $6-12/month
- **Linode**: $5-10/month
- **Vultr**: $6-12/month
- **AWS Lightsail**: $5-10/month

### Services (Same as managed hosting)
- **Domain**: ~$12/year (~$1/month)
- **Convex**: Free (up to 1M reads/month)
- **Resend**: Free (up to 100 emails/day)
- **Square**: 2.9% + $0.30 per transaction

### Total Monthly Cost
**$12-18/month** for server + payment processing fees

---

## 📞 Support Resources

### Official Documentation
- **Next.js**: https://nextjs.org/docs
- **PM2**: https://pm2.keymetrics.io/docs
- **Nginx**: https://nginx.org/en/docs
- **Certbot**: https://certbot.eff.org/docs

### Service Dashboards
- **Convex**: https://dashboard.convex.dev
- **Square**: https://squareup.com/dashboard
- **Resend**: https://resend.com/emails

---

## 🎉 Success!

Your SteppersLife Events platform is now deployed on your dedicated IP!

**Live URL**: https://event.stepperslife.com

**Next Steps**:
1. Create your first event
2. Test the complete flow (signup → create event → purchase ticket)
3. Monitor PM2 logs for the first few hours
4. Share with users and start selling tickets!

For questions or issues, refer to the troubleshooting section or check the service dashboards for errors.
