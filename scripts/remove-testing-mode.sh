#!/bin/bash

# Script to identify and document remaining testing mode code
# This helps track what still needs to be fixed

echo "========================================="
echo "TESTING MODE CODE AUDIT"
echo "========================================="
echo ""

echo "Searching for remaining testing mode patterns..."
echo ""

# Search for TESTING MODE comments
echo "1. Files with 'TESTING MODE' comments:"
grep -r "TESTING MODE" --include="*.ts" --include="*.tsx" convex/ app/ | grep -v "node_modules" | wc -l
echo ""

# Search for hardcoded test email
echo "2. Files with hardcoded test email (iradwatkins@gmail.com):"
grep -r "iradwatkins@gmail.com" --include="*.ts" --include="*.tsx" convex/ app/ | grep -v "node_modules" | wc -l
echo ""

# Search for authentication bypass patterns
echo "3. Files with authentication bypass patterns:"
grep -r "if (!identity" --include="*.ts" convex/ | grep -v "node_modules" | wc -l
echo ""

echo "========================================="
echo "DETAILED LIST OF FILES TO FIX:"
echo "========================================="
grep -l "TESTING MODE\|iradwatkins@gmail.com\|TESTING:" --include="*.ts" --include="*.tsx" convex/ app/ 2>/dev/null | grep -v "node_modules" | sort | uniq

echo ""
echo "========================================="
echo "Run this script after each fix to track progress"
echo "========================================="
