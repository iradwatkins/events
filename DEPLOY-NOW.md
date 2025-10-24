# 🚀 Deploy to Production NOW - Quick Steps

Your server: **72.60.28.175**
Target directory: `/root/websites/events-stepperslife`
Domain: `https://events.stepperslife.com`

---

## ⚡ Quick Deploy (5 Minutes)

### Step 1: SSH into Your Server

Open your terminal and run:

```bash
ssh root@72.60.28.175
# Enter password: Bobby321&Gloria321Watkins!
```

### Step 2: Check if App Directory Exists

```bash
ls -la /root/websites/
```

**If directory exists**, skip to Step 3.
**If directory doesn't exist**, create it:

```bash
mkdir -p /root/websites
cd /root/websites
git clone https://github.com/iradwatkins/event.stepperslife.com.git events-stepperslife
cd events-stepperslife
```

### Step 3: Navigate to App Directory

```bash
cd /root/websites/events-stepperslife
```

### Step 4: Pull Latest Code (with logos!)

```bash
git pull origin main
```

You should see:
```
dbd8cf8 Replace placeholder Calendar icon with official SteppersLife logos and icons
```

### Step 5: Create Environment Variables

```bash
nano .env.local
```

Paste this content (update the Square production credentials):

```bash
# Convex (Database)
NEXT_PUBLIC_CONVEX_URL=https://combative-viper-389.convex.cloud
CONVEX_DEPLOYMENT=dev:combative-viper-389

# Square (Payments) - PRODUCTION
NEXT_PUBLIC_SQUARE_APPLICATION_ID=YOUR_PRODUCTION_APP_ID
SQUARE_ACCESS_TOKEN=YOUR_PRODUCTION_ACCESS_TOKEN
NEXT_PUBLIC_SQUARE_LOCATION_ID=YOUR_PRODUCTION_LOCATION_ID
NEXT_PUBLIC_SQUARE_ENVIRONMENT=production

# Resend (Emails)
RESEND_API_KEY=re_RJid1ide_12brJc6fbguPRU5WJzMDB6gQ
RESEND_FROM_EMAIL=events@stepperslife.com

# Application
NEXT_PUBLIC_APP_URL=https://events.stepperslife.com
NODE_ENV=production
```

Save with: `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Install Dependencies

```bash
npm install
```

### Step 7: Build the Application

```bash
npm run build
```

This takes 1-2 minutes. You should see:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
```

### Step 8: Check if Node.js & PM2 are Installed

```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
pm2 --version   # Should show PM2 version
```

**If PM2 not installed**:
```bash
npm install -g pm2
```

### Step 9: Start with PM2

```bash
# If first time:
pm2 start ecosystem.config.js --env production

# If already running:
pm2 restart events-stepperslife

# Save PM2 list
pm2 save

# Enable auto-start on reboot
pm2 startup
# Copy and run the command PM2 outputs
```

### Step 10: Check Application Status

```bash
pm2 list
pm2 logs events-stepperslife --lines 50
```

You should see:
```
✓ Ready in 1.2s
✓ Local: http://localhost:3004
```

### Step 11: Test Local Connection

```bash
curl http://localhost:3004
```

Should return HTML from your app.

---

## 🌐 Configure Nginx (if not done yet)

### Check if Nginx is installed:

```bash
nginx -v
```

**If not installed**:
```bash
apt update
apt install -y nginx
```

### Copy Nginx Configuration

```bash
cp /root/websites/events-stepperslife/nginx-site.conf /etc/nginx/sites-available/events.stepperslife.com
```

### Enable Site

```bash
ln -s /etc/nginx/sites-available/events.stepperslife.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔒 Set Up SSL Certificate

### Install Certbot (if not installed)

```bash
apt install -y certbot python3-certbot-nginx
```

### Get SSL Certificate

```bash
certbot --nginx -d events.stepperslife.com
```

Follow prompts:
1. Enter email: `thestepperslife@gmail.com`
2. Agree to terms: `Y`
3. Redirect HTTP to HTTPS: `Yes` (recommended)

---

## ✅ Verify Deployment

### Check from Server

```bash
curl https://events.stepperslife.com
```

### Check from Browser

Visit: https://events.stepperslife.com

You should see:
- ✅ SteppersLife logo in the header
- ✅ "SteppersLife Events" title
- ✅ HTTPS padlock icon
- ✅ Event listings (if any exist)

---

## 🐛 Troubleshooting

### App Not Starting

```bash
pm2 logs events-stepperslife --lines 100
```

### Port 3004 Not Responding

```bash
netstat -tulpn | grep 3004
pm2 restart events-stepperslife
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 list

# Restart both
pm2 restart events-stepperslife
systemctl restart nginx
```

### Domain Not Resolving

```bash
# Check DNS
dig events.stepperslife.com +short

# Should return: 72.60.28.175
```

If not, update DNS at your domain registrar:
```
Type: A
Name: events (or @)
Value: 72.60.28.175
TTL: 3600
```

---

## 🎉 You're Live!

Once complete, your site will be live at:
**https://events.stepperslife.com**

With your new SteppersLife logos! 🎨

---

## 📞 Quick Commands Reference

```bash
# View logs
pm2 logs events-stepperslife

# Restart app
pm2 restart events-stepperslife

# Stop app
pm2 stop events-stepperslife

# Check status
pm2 monit

# Pull latest code and redeploy
cd /root/websites/events-stepperslife
git pull origin main
npm install
npm run build
pm2 restart events-stepperslife
```

---

## ⚠️ Important Notes

1. **Square Production Credentials**: Make sure to update with real production credentials in `.env.local`
2. **DNS**: Ensure `events.stepperslife.com` points to `72.60.28.175`
3. **Email Domain**: Verify `stepperslife.com` in Resend dashboard for unlimited emails

---

**Need help?** Check the full guide: `DEPLOY-VPS.md`
