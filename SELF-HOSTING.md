# 🚀 Self-Hosting Deployment Guide - SteppersLife Events

## Current Status: Code Pushed to GitHub ✅
**Repository**: https://github.com/iradwatkins/event.stepperslife.com.git

---

## ⭐ RECOMMENDED: Dedicated IP / VPS Deployment

**If you have a dedicated IP address**, use the complete VPS deployment guide:

👉 **[DEPLOY-VPS.md](./DEPLOY-VPS.md)** - Full step-by-step VPS deployment guide

This comprehensive guide includes:
- ✅ Complete server setup (Ubuntu, Node.js, PM2, Nginx)
- ✅ SSL certificate setup with Let's Encrypt
- ✅ Automated deployment script
- ✅ Production monitoring and maintenance
- ✅ Troubleshooting guide
- ✅ Cost breakdown ($12-18/month)

**Quick Start for VPS**:
```bash
# 1. SSH into your server
ssh root@YOUR_DEDICATED_IP

# 2. Clone and set up
git clone https://github.com/iradwatkins/event.stepperslife.com.git
cd event.stepperslife.com

# 3. Follow DEPLOY-VPS.md for complete setup
```

---

## 🎯 Alternative Self-Hosting Options (Managed Platforms)

If you don't have a dedicated IP or prefer managed hosting:

### Option 1: DigitalOcean App Platform
**Best for**: Simple deployment, managed infrastructure
**Cost**: ~$12-25/month
**Setup Time**: 15 minutes

### Option 2: Railway (Easiest)
**Best for**: Developer-friendly, automatic deployments
**Cost**: ~$5-20/month
**Setup Time**: 10 minutes

### Option 3: Render
**Best for**: Free tier available, simple setup
**Cost**: Free tier available, then $7+/month
**Setup Time**: 15 minutes

### Option 4: VPS Manual Setup
**Best for**: Full control, advanced users
**Cost**: ~$6-20/month
**Setup Time**: 1-2 hours
**See**: [DEPLOY-VPS.md](./DEPLOY-VPS.md) for complete guide

---

## 🚀 Option 1: DigitalOcean App Platform (RECOMMENDED)

### Step 1: Create DigitalOcean Account
1. Go to https://www.digitalocean.com/
2. Sign up for an account
3. Add payment method

### Step 2: Create New App
1. Click "Create" → "Apps"
2. Connect GitHub repository:
   - Select "GitHub"
   - Authorize DigitalOcean
   - Choose repository: `iradwatkins/event.stepperslife.com`
   - Select branch: `main`

### Step 3: Configure App
1. **Resource Type**: Web Service
2. **Build Command**: `npm run build`
3. **Run Command**: `npm start`
4. **Environment**: Node.js
5. **HTTP Port**: 3004

### Step 4: Add Environment Variables
Click "Environment Variables" and add:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://combative-viper-389.convex.cloud
CONVEX_DEPLOYMENT=dev:combative-viper-389

# Square - PRODUCTION (get from Square Dashboard)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-YOUR_PRODUCTION_APP_ID
SQUARE_ACCESS_TOKEN=YOUR_PRODUCTION_ACCESS_TOKEN
NEXT_PUBLIC_SQUARE_LOCATION_ID=YOUR_PRODUCTION_LOCATION_ID
NEXT_PUBLIC_SQUARE_ENVIRONMENT=production

# Resend
RESEND_API_KEY=re_RJid1ide_12brJc6fbguPRU5WJzMDB6gQ
RESEND_FROM_EMAIL=events@stepperslife.com
NEXT_PUBLIC_APP_URL=https://event.stepperslife.com

# Node Environment
NODE_ENV=production
```

### Step 5: Configure Domain
1. In App settings, go to "Domains"
2. Click "Add Domain"
3. Enter: `event.stepperslife.com`
4. DigitalOcean will provide DNS records

### Step 6: Update DNS
Go to your domain registrar and add:

```
Type: CNAME
Name: event
Value: [provided by DigitalOcean]
TTL: 3600
```

### Step 7: Deploy
1. Click "Create Resources"
2. Wait for deployment (5-10 minutes)
3. DigitalOcean will automatically:
   - Build your app
   - Deploy to production
   - Set up SSL certificate
   - Configure load balancing

**Cost**: ~$12/month for basic tier

---

## 🚀 Option 2: Railway

### Step 1: Create Railway Account
1. Go to https://railway.app/
2. Sign up with GitHub
3. Add payment method (required after trial)

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: `iradwatkins/event.stepperslife.com`

### Step 3: Configure Service
Railway auto-detects Next.js. If not:

1. **Build Command**: `npm run build`
2. **Start Command**: `npm start`
3. **Port**: 3004

### Step 4: Add Environment Variables
Click "Variables" tab and add all environment variables (same as DigitalOcean list above)

### Step 5: Configure Domain
1. Go to "Settings" → "Domains"
2. Click "Generate Domain" (gets railway.app domain)
3. Click "Custom Domain"
4. Enter: `event.stepperslife.com`
5. Add provided CNAME to your DNS

### Step 6: Deploy
- Railway auto-deploys on every GitHub push
- First deployment takes ~5 minutes

**Cost**: $5/month usage-based (free $5 credit monthly)

---

## 🚀 Option 3: Render

### Step 1: Create Render Account
1. Go to https://render.com/
2. Sign up with GitHub

### Step 2: Create New Web Service
1. Click "New" → "Web Service"
2. Connect GitHub repository: `iradwatkins/event.stepperslife.com`

### Step 3: Configure Service
```
Name: stepperslife-events
Environment: Node
Region: Oregon (US West) or closest to users
Branch: main
Build Command: npm install && npm run build
Start Command: npm start
```

### Step 4: Add Environment Variables
Same as above (DigitalOcean list)

### Step 5: Configure Custom Domain
1. In service settings, go to "Custom Domains"
2. Add: `event.stepperslife.com`
3. Add provided CNAME to DNS

### Step 6: Deploy
- Click "Create Web Service"
- First deploy takes ~5-10 minutes

**Cost**: Free tier available (limited), paid plans start at $7/month

---

## 🚀 Option 4: VPS (Advanced)

### Requirements
- Ubuntu 22.04 LTS server
- Root or sudo access
- Basic Linux knowledge

### Step 1: Set Up Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 process manager
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Clone Repository
```bash
# Create app directory
sudo mkdir -p /var/www/stepperslife-events
cd /var/www/stepperslife-events

# Clone from GitHub
git clone https://github.com/iradwatkins/event.stepperslife.com.git .

# Install dependencies
npm install
```

### Step 3: Create Environment File
```bash
sudo nano .env.local
```

Add all environment variables (same as above)

### Step 4: Build Application
```bash
npm run build
```

### Step 5: Configure PM2
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'stepperslife-events',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/stepperslife-events',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3004
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### Step 6: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/stepperslife-events
```

Add:
```nginx
server {
    listen 80;
    server_name event.stepperslife.com;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/stepperslife-events /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Set Up SSL
```bash
sudo certbot --nginx -d event.stepperslife.com
```

### Step 8: Configure Auto-Deployment (Optional)
Create webhook listener or use GitHub Actions for automatic deployments.

**Cost**: ~$6-20/month for VPS

---

## 📧 Step: Configure Resend Domain

**Required for sending emails to all users (not just test email)**

### 1. Add Domain to Resend
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `stepperslife.com`

### 2. Add DNS Records
Add these to your domain DNS:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

**DKIM Records** (Resend provides these):
```
Type: CNAME
Name: [resend-provided]
Value: [resend-provided]
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@stepperslife.com
```

### 3. Verify Domain
- Wait 15-30 minutes for DNS propagation
- Click "Verify" in Resend dashboard
- Status should change to "Verified"

### 4. Update Environment Variable
```bash
RESEND_FROM_EMAIL=events@stepperslife.com
```

---

## 💳 Step: Switch to Square Production

### 1. Get Production Credentials
1. Go to https://developer.squareup.com/apps
2. Switch to "Production" mode (toggle in top right)
3. Copy credentials:
   - Application ID
   - Access Token
   - Location ID

### 2. Update Environment Variables
```bash
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-YOUR_PRODUCTION_APP_ID
SQUARE_ACCESS_TOKEN=YOUR_PRODUCTION_ACCESS_TOKEN
NEXT_PUBLIC_SQUARE_LOCATION_ID=YOUR_PRODUCTION_LOCATION_ID
NEXT_PUBLIC_SQUARE_ENVIRONMENT=production
```

### 3. Important Notes
- Production mode processes REAL money
- Test with small amounts first
- Sandbox test cards will NOT work
- Use real cards for testing

---

## 🗂️ Step: Configure Convex for Production (Optional)

### Current Setup
Your Convex deployment `dev:combative-viper-389` works fine for production.

### For Better Organization (Optional)
```bash
# Create production deployment
cd "/Users/irawatkins/Desktop/File Cabinet/event.stepperslife.com"
npx convex deploy --prod

# This will give you a new deployment URL like:
# https://combative-viper-389.convex.cloud (same URL, different deployment)

# Update environment variable:
CONVEX_DEPLOYMENT=prod:combative-viper-389
```

---

## ✅ Post-Deployment Checklist

After deployment, test these:

1. [ ] Visit `https://event.stepperslife.com` - Homepage loads
2. [ ] Login works - Magic link emails arrive (check spam)
3. [ ] Create event as organizer
4. [ ] Configure ticket tiers
5. [ ] Purchase ticket with real card (small amount for testing)
6. [ ] Receive confirmation email
7. [ ] View tickets in dashboard
8. [ ] Check organizer dashboard analytics
9. [ ] Test on mobile device
10. [ ] SSL certificate is valid (HTTPS works)

---

## 🐛 Troubleshooting

### Domain Not Working
- Check DNS with: https://dnschecker.org/
- DNS can take up to 24 hours to propagate
- Try incognito mode to clear cache

### Build Fails
- Check environment variables are set
- Verify Node.js version is 20+
- Check build logs for errors

### Emails Not Sending
- Verify domain in Resend dashboard
- Check DNS records are correct
- Wait 15 minutes after DNS changes
- Check spam folder

### Payments Failing
- Verify production credentials are correct
- Check Square dashboard for errors
- Ensure HTTPS is enabled
- Test with different cards

### Database Errors
- Check Convex deployment URL is correct
- Verify environment variables
- Check Convex dashboard logs at https://dashboard.convex.dev

---

## 📊 Monitoring

### Application Monitoring
- **Logs**: Check your platform's logs dashboard
- **Uptime**: Set up monitoring with UptimeRobot (free)
- **Errors**: Consider Sentry for error tracking

### Service Dashboards
- **Convex**: https://dashboard.convex.dev
- **Square**: https://squareup.com/dashboard
- **Resend**: https://resend.com/emails

---

## 🔒 Security Checklist

- [ ] HTTPS enabled (automatic with most platforms)
- [ ] Environment variables are secure (not in git)
- [ ] `.env.local` is in `.gitignore`
- [ ] Square webhook signatures verified (if using webhooks)
- [ ] CORS configured properly
- [ ] Production API keys are different from sandbox

---

## 💰 Cost Breakdown

### Platform Costs (Choose One)
- **DigitalOcean**: ~$12-25/month
- **Railway**: ~$5-20/month (usage-based)
- **Render**: Free tier or $7+/month
- **VPS**: ~$6-20/month

### Service Costs (All Options)
- **Domain**: ~$12/year (~$1/month)
- **Convex**: Free up to 1M reads/month
- **Resend**: Free up to 100 emails/day
- **Square**: 2.9% + $0.30 per transaction

### Example Monthly Cost for 1,000 Tickets/Month
- Platform: $12
- Domain: $1
- Convex: $0 (within free tier)
- Resend: $0 (within free tier)
- Square fees: ~$35 (on $1,000 in sales)
- **Total**: ~$48/month

---

## 🎉 Quick Start Commands

### For DigitalOcean/Railway/Render
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### For VPS
```bash
# 1. Set up server (run once)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# 2. Clone and build
cd /var/www
git clone https://github.com/iradwatkins/event.stepperslife.com.git
cd event.stepperslife.com
npm install
# Add .env.local with environment variables
npm run build

# 3. Start with PM2
pm2 start npm --name "stepperslife-events" -- start
pm2 save
pm2 startup

# 4. Configure Nginx and SSL
# (Follow VPS steps above)
```

---

## 📞 Support

### Platform Support
- **DigitalOcean**: support@digitalocean.com
- **Railway**: support@railway.app
- **Render**: support@render.com

### Service Support
- **Convex**: support@convex.dev
- **Square**: developers@squareup.com
- **Resend**: support@resend.com

---

## 🚀 Recommended Deployment Path

For most users, I recommend:

1. **Start with Railway** - Easiest and cheapest to start
2. **Connect GitHub repository** - Auto-deploy on push
3. **Add environment variables** - Copy from this guide
4. **Configure custom domain** - Add CNAME to DNS
5. **Deploy** - Automatic on first setup
6. **Test thoroughly** - Use checklist above
7. **Switch to production Square** - After testing
8. **Verify Resend domain** - For unlimited emails

**Total time to production**: ~30 minutes

---

## 📝 Next Steps After Deployment

1. **Monitor first transactions** - Watch Square dashboard
2. **Test email delivery** - Send test magic links
3. **Set up analytics** - Google Analytics or similar
4. **Plan marketing** - Announce to users
5. **Scale as needed** - Upgrade plan when traffic grows

---

**Your platform is production-ready!** 🎉
