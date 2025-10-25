#!/bin/bash

# Diagnose SSH Connection Issues

VPS_IP="72.60.28.175"

echo "🔍 Diagnosing SSH connection to $VPS_IP"
echo ""

echo "1️⃣ Testing common SSH ports..."
echo ""

# Test default port 22
echo "Testing port 22 (default)..."
nc -zv -w 5 $VPS_IP 22 2>&1

echo ""
echo "Testing port 2222 (common alternative)..."
nc -zv -w 5 $VPS_IP 2222 2>&1

echo ""
echo "Testing port 22222 (another common alternative)..."
nc -zv -w 5 $VPS_IP 22222 2>&1

echo ""
echo "2️⃣ Trying to detect open ports (this may take a moment)..."
nmap -p 20-30,2222,22222 $VPS_IP 2>/dev/null || echo "⚠️  nmap not installed, skipping port scan"

echo ""
echo "3️⃣ Checking if host is reachable..."
ping -c 3 $VPS_IP

echo ""
echo "📋 Next Steps:"
echo "   1. Check with your VPS provider what SSH port they use"
echo "   2. Check if SSH access might be restricted to certain IPs"
echo "   3. Verify the server is actually running"
