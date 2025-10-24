# Deployment Guide - events.stepperslife.com

## Overview
This project has three deployment methods available:
1. **SFTP** - One-click manual file sync
2. **Remote-SSH** - Direct editing on production server
3. **GitHub Actions** - Automated CI/CD on git push

---

## Method 1: SFTP Deployment (Quick Manual Deploy)

### Setup
1. Install the SFTP extension: `natizyskunk.sftp`
2. Configuration is already set in `.vscode/sftp.json`

### Usage

**Deploy to Production:**
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
- Type: `SFTP: Sync Local -> Remote`
- Select the production server configuration

**Download from Production:**
- Press `Cmd+Shift+P`
- Type: `SFTP: Sync Remote -> Local`

**Deploy Single File:**
- Right-click any file
- Select `SFTP: Upload`

**Auto-upload on Save:**
- Edit `.vscode/sftp.json`
- Set `"uploadOnSave": true`

### VS Code Tasks
Run from Terminal menu → Run Task:
- `🚀 Deploy via SFTP` - Shows SFTP sync instructions

---

## Method 2: Remote-SSH (Direct Server Editing)

### Setup
1. Install Remote-SSH extension: `ms-vscode-remote.remote-ssh`
2. SSH config is already set in `~/.ssh/config`

### Usage

**Connect to Production:**
1. Click the green `><` icon in bottom-left corner
2. Select "Connect to Host"
3. Choose `events-production` or `events`
4. Enter password: `Bobby321&Gloria321Watkins?`
5. VS Code will reload connected to the server

**Edit Files Directly:**
- Once connected, File → Open Folder
- Navigate to `/root/websites/event.stepperslife.com`
- Edit files directly on production (changes are live!)

**Disconnect:**
- Click the green `><` icon
- Select "Close Remote Connection"

### VS Code Tasks
Run from Terminal menu → Run Task:
- `🔗 SSH to Production` - Opens SSH terminal
- `📊 Production Status` - Shows git & PM2 status
- `🔁 Restart Production App` - Restarts PM2 app
- `📜 View Production Logs` - Shows PM2 logs

---

## Method 3: GitHub Actions (Automated CI/CD)

### Setup

**One-time GitHub Configuration:**
1. Go to your GitHub repository
2. Click Settings → Secrets and variables → Actions
3. Add these secrets:
   - `SSH_HOST` = `72.60.28.175`
   - `SSH_USERNAME` = `root`
   - `SSH_PASSWORD` = `Bobby321&Gloria321Watkins?`

### Usage

**Automatic Deployment:**
1. Make your code changes locally
2. Commit: `git add . && git commit -m "Your message"`
3. Push: `git push origin main`
4. GitHub Actions automatically deploys to production

**Manual Deployment:**
1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Deploy to Production" workflow
4. Click "Run workflow" button

**Monitor Deployment:**
- Go to Actions tab in GitHub
- View deployment logs and status
- Green checkmark = successful deployment
- Red X = failed deployment

### Workflow Steps
The workflow automatically:
1. Checks out code
2. SSHs to production server
3. Pulls latest code from git
4. Runs `npm install`
5. Runs `npm run build`
6. Restarts PM2 app

### VS Code Tasks
Run from Terminal menu → Run Task:
- `📤 Git Push & Deploy` - Pushes to GitHub (triggers auto-deploy)

---

## Quick Reference: VS Code Tasks

Press `Cmd+Shift+P` → "Tasks: Run Task" → Select:

| Task | Description |
|------|-------------|
| 🚀 Deploy via SFTP | Shows SFTP sync instructions |
| 📤 Git Push & Deploy | Push to GitHub (auto-deploys) |
| 🔗 SSH to Production | Open SSH terminal |
| 📥 Pull from Production | Check production git status |
| 🔄 Sync Production → Local | Download from production |
| 📊 Production Status | View git & PM2 status |
| 🔁 Restart Production App | Restart PM2 application |
| 📜 View Production Logs | View PM2 logs |

---

## Which Method Should I Use?

### Use SFTP when:
- Quick fixes needed
- Testing small changes
- Want to deploy specific files only
- Don't want to commit to git yet

### Use Remote-SSH when:
- Emergency production fixes
- Need to debug live issues
- Want to edit directly on server
- Checking production environment

### Use GitHub Actions when:
- Production releases
- Team deployments
- Want automated testing
- Need deployment history
- Following best practices

---

## Production Server Info

- **Host:** 72.60.28.175
- **User:** root
- **Path:** /root/websites/event.stepperslife.com
- **PM2 App:** event-stepperslife
- **URL:** https://events.stepperslife.com

---

## Troubleshooting

### SFTP Connection Failed
- Check server is online: `ping 72.60.28.175`
- Verify password in `.vscode/sftp.json`
- Check SSH access: `ssh root@72.60.28.175`

### Remote-SSH Connection Failed
- Verify SSH config: `cat ~/.ssh/config`
- Test SSH manually: `ssh events-production`
- Check firewall/network settings

### GitHub Actions Failed
- Check GitHub Actions tab for error logs
- Verify GitHub Secrets are set correctly
- SSH to server and check git repository
- Check PM2 status: `pm2 list`

### PM2 App Not Running
- SSH to server
- Check status: `pm2 list`
- Restart: `pm2 restart event-stepperslife`
- View logs: `pm2 logs event-stepperslife`

---

## Emergency Rollback

If deployment breaks production:

1. **Quick Rollback via SSH:**
```bash
ssh root@72.60.28.175
cd /root/websites/event.stepperslife.com
git log -5  # Find last working commit
git reset --hard <commit-hash>
npm install
npm run build
pm2 restart event-stepperslife
```

2. **Or use VS Code Task:**
- Run task: `🔗 SSH to Production`
- Execute rollback commands above

---

## Security Notes

- Credentials are stored in `.vscode/sftp.json` (add to .gitignore)
- SSH password stored in `~/.ssh/config` (local only)
- GitHub Secrets are encrypted and secure
- Never commit credentials to git repository
- Consider using SSH keys instead of passwords for better security

---

## Need Help?

- Check server logs: `pm2 logs event-stepperslife`
- Check application health: Run task `📊 Production Status`
- Restart application: Run task `🔁 Restart Production App`
- SSH for manual debugging: Run task `🔗 SSH to Production`
