#!/bin/bash

# Script to remove console.log statements from production code
# Preserves console.error in API routes and all console statements in test files

echo "🧹 Removing console.log statements from production code..."

# Files to process (exclude test files and scripts)
CONVEX_FILES=$(find convex -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -name "*.spec.ts" \
  ! -name "*.test.ts" \
  ! -name "test*.ts" \
  ! -name "debug.ts" \
  ! -path "*/testing/*")

APP_FILES=$(find app -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -name "*.spec.ts" \
  ! -name "*.test.ts" \
  ! -name "test*.ts")

COMPONENT_FILES=$(find components -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -name "*.spec.ts" \
  ! -name "*.test.ts")

LIB_FILES=$(find lib -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -name "*.spec.ts" \
  ! -name "*.test.ts")

HOOKS_FILES=$(find hooks -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null || true)

CONTEXTS_FILES=$(find contexts -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null || true)

ALL_FILES="$CONVEX_FILES $APP_FILES $COMPONENT_FILES $LIB_FILES $HOOKS_FILES $CONTEXTS_FILES"

# Count before
BEFORE_COUNT=$(echo "$ALL_FILES" | xargs grep -l "console\.log" 2>/dev/null | wc -l)

# Remove console.log statements (but not console.error, console.warn)
for file in $ALL_FILES; do
  if [ -f "$file" ]; then
    # Remove standalone console.log lines
    sed -i '/^\s*console\.log(/d' "$file"

    # Remove console.log lines with semicolons
    sed -i '/^\s*console\.log(.*;$/d' "$file"

    # Remove multiline console.log statements (opening line)
    sed -i '/^\s*console\.log($/,/);$/d' "$file"
  fi
done

# Count after
AFTER_COUNT=$(echo "$ALL_FILES" | xargs grep -l "console\.log" 2>/dev/null | wc -l)

echo "✅ Removed console.log from $((BEFORE_COUNT - AFTER_COUNT)) files"
echo "📊 Files with console.log before: $BEFORE_COUNT"
echo "📊 Files with console.log after: $AFTER_COUNT"
echo ""
echo "Note: console.error and console.warn statements were preserved"
