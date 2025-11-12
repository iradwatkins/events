#!/bin/bash

# Color Token Replacement Script
# Replaces hardcoded blue/purple/violet/indigo colors with theme tokens
# This ensures consistent theming and proper dark mode support

echo "🎨 Starting color token replacement..."

# Find all TSX, JSX, and TS files (excluding node_modules, .next, and scripts)
FILES=$(find app components -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" \) 2>/dev/null)

if [ -z "$FILES" ]; then
    echo "❌ No files found to process"
    exit 1
fi

TOTAL_FILES=0
MODIFIED_FILES=0

for file in $FILES; do
    TOTAL_FILES=$((TOTAL_FILES + 1))
    ORIGINAL_CONTENT=$(cat "$file")
    MODIFIED_CONTENT="$ORIGINAL_CONTENT"

    # Primary color replacements (blue-600, blue-700, etc.)
    MODIFIED_CONTENT=$(echo "$MODIFIED_CONTENT" | sed -E '
        s/\bbg-blue-600\b/bg-primary/g
        s/\bbg-blue-700\b/bg-primary\/90/g
        s/\bbg-blue-500\b/bg-primary/g
        s/\bbg-blue-50\b/bg-accent/g
        s/\bbg-blue-100\b/bg-accent/g
        s/\bbg-blue-200\b/bg-primary\/20/g

        s/\btext-blue-600\b/text-primary/g
        s/\btext-blue-700\b/text-primary/g
        s/\btext-blue-500\b/text-primary/g
        s/\btext-blue-900\b/text-foreground/g
        s/\btext-blue-800\b/text-foreground/g
        s/\btext-blue-400\b/text-primary\/80/g

        s/\bborder-blue-600\b/border-primary/g
        s/\bborder-blue-500\b/border-primary/g
        s/\bborder-blue-200\b/border-primary\/30/g
        s/\bborder-blue-300\b/border-primary\/40/g

        s/\bhover:bg-blue-700\b/hover:bg-primary\/90/g
        s/\bhover:bg-blue-600\b/hover:bg-primary/g
        s/\bhover:bg-blue-50\b/hover:bg-accent/g
        s/\bhover:bg-blue-100\b/hover:bg-accent/g

        s/\bhover:text-blue-700\b/hover:text-primary/g
        s/\bhover:text-blue-600\b/hover:text-primary/g

        s/\bring-blue-600\b/ring-primary/g
        s/\bring-blue-500\b/ring-primary/g

        s/\bfocus:ring-blue-600\b/focus:ring-primary/g
        s/\bfocus:ring-blue-500\b/focus:ring-primary/g
        s/\bfocus:border-blue-600\b/focus:border-primary/g
    ')

    # Purple/Violet replacements (should use primary for main actions)
    MODIFIED_CONTENT=$(echo "$MODIFIED_CONTENT" | sed -E '
        s/\bbg-purple-600\b/bg-primary/g
        s/\bbg-purple-700\b/bg-primary\/90/g
        s/\bbg-purple-500\b/bg-primary/g
        s/\bbg-purple-50\b/bg-accent/g
        s/\bbg-purple-100\b/bg-accent/g

        s/\btext-purple-600\b/text-primary/g
        s/\btext-purple-700\b/text-primary/g
        s/\btext-purple-900\b/text-foreground/g

        s/\bborder-purple-600\b/border-primary/g
        s/\bborder-purple-500\b/border-primary/g

        s/\bviolet-600\b/primary/g
        s/\bviolet-500\b/primary/g
    ')

    # Indigo replacements
    MODIFIED_CONTENT=$(echo "$MODIFIED_CONTENT" | sed -E '
        s/\bbg-indigo-600\b/bg-primary/g
        s/\bbg-indigo-500\b/bg-primary/g
        s/\bbg-indigo-50\b/bg-accent/g

        s/\btext-indigo-600\b/text-primary/g
        s/\btext-indigo-700\b/text-primary/g
    ')

    # Check if file was modified
    if [ "$ORIGINAL_CONTENT" != "$MODIFIED_CONTENT" ]; then
        echo "$MODIFIED_CONTENT" > "$file"
        echo "✅ Modified: $file"
        MODIFIED_FILES=$((MODIFIED_FILES + 1))
    fi
done

echo ""
echo "📊 Summary:"
echo "   Total files scanned: $TOTAL_FILES"
echo "   Files modified: $MODIFIED_FILES"
echo "   Files unchanged: $((TOTAL_FILES - MODIFIED_FILES))"
echo ""
echo "✨ Color token replacement complete!"
