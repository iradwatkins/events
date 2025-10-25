#!/bin/bash

# Setup SSH Key Authentication for VPS
# This will copy your public SSH key to the VPS server

set -e

VPS_HOST="root@72.60.28.175"
SSH_KEY="$HOME/.ssh/id_ed25519.pub"

echo "🔑 Setting up SSH key authentication for VPS"
echo "📍 Host: $VPS_HOST"
echo "🔐 Using key: $SSH_KEY"
echo ""
echo "⚠️  You will be prompted for the SSH password ONE time"
echo "   Password: Bobby321&Gloria321Watkins?"
echo ""

# Check if key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

# Display the public key that will be copied
echo "📄 Your public key:"
cat "$SSH_KEY"
echo ""

# Use ssh-copy-id to copy the key to the server
echo "📤 Copying SSH key to VPS..."
ssh-copy-id -i "$SSH_KEY" "$VPS_HOST"

echo ""
echo "✅ SSH key setup complete!"
echo ""
echo "🧪 Testing SSH connection without password..."
if ssh -o BatchMode=yes -o ConnectTimeout=5 "$VPS_HOST" "echo '✅ SSH key authentication working!'" 2>/dev/null; then
    echo "✅ Success! You can now SSH without a password."
else
    echo "⚠️  Test failed. You may need to enter password once more."
fi

echo ""
echo "🚀 You can now run: ./deploy-to-vps.sh"
echo "   (No password will be required!)"
