# SSH Key Authentication Setup

## Step 1: Run the SSH Key Setup Script

Open your Mac Terminal and run:

```bash
cd /Users/irawatkins/Desktop/event.stepperslife.com
chmod +x setup-ssh-key.sh
./setup-ssh-key.sh
```

**You will be prompted for the password ONCE:**
```
Bobby321&Gloria321Watkins?
```

This will copy your SSH public key to the VPS server.

## Step 2: Test SSH Connection

After the setup completes, test it:

```bash
ssh events-vps
```

You should connect **without being prompted for a password**. If it works, type `exit` to disconnect.

## Step 3: Deploy to Production

Now you can deploy with zero password prompts:

```bash
./deploy-to-vps.sh
```

The deployment will run completely automatically!

---

## What We Did

1. ✅ Added SSH config entry for `events-vps` in `~/.ssh/config`
2. ✅ Created `setup-ssh-key.sh` to copy your public key to the server
3. ✅ Updated `deploy-to-vps.sh` to use SSH key authentication

## SSH Config Added

```
Host events-vps
    HostName 72.60.28.175
    User root
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    PreferredAuthentications publickey
```

## Troubleshooting

If SSH key authentication doesn't work:

1. Make sure the setup script ran successfully
2. Check server permissions:
   ```bash
   ssh root@72.60.28.175 "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
   ```
3. Try connecting manually:
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@72.60.28.175
   ```

## Benefits

- 🔒 More secure than password authentication
- ⚡ Faster deployment (no password prompts)
- 🤖 Can be automated completely
- 🔑 Uses your existing SSH key
