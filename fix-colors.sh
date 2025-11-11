#!/bin/bash

# Script to fix hardcoded colors and replace with theme tokens
# This script fixes common color patterns across the codebase

echo "Starting bulk color replacements..."

# Function to replace colors in a file
fix_file() {
  local file="$1"
  echo "Processing: $file"

  # Replace common blue color patterns with theme tokens
  sed -i 's/bg-blue-100/bg-accent/g' "$file"
  sed -i 's/text-blue-600/text-primary/g' "$file"
  sed -i 's/text-blue-700/text-primary/g' "$file"
  sed -i 's/text-blue-800/text-accent-foreground/g' "$file"
  sed -i 's/border-blue-200/border-border/g' "$file"
  sed -i 's/hover:bg-blue-50/hover:bg-accent\/50/g' "$file"
  sed -i 's/hover:bg-blue-100/hover:bg-accent/g' "$file"
  sed -i 's/bg-blue-50/bg-accent\/50/g' "$file"

  # Replace purple color patterns with theme tokens
  sed -i 's/bg-purple-50/bg-accent\/50/g' "$file"
  sed -i 's/bg-purple-100/bg-accent/g' "$file"
  sed -i 's/bg-purple-600/bg-primary/g' "$file"
  sed -i 's/bg-purple-700/bg-primary/g' "$file"
  sed -i 's/text-purple-600/text-primary/g' "$file"
  sed -i 's/text-purple-700/text-primary/g' "$file"
  sed -i 's/text-purple-800/text-accent-foreground/g' "$file"
  sed -i 's/border-purple-200/border-border/g' "$file"
  sed -i 's/hover:bg-purple-700/hover:bg-primary\/90/g' "$file"

  # Replace indigo color patterns
  sed -i 's/text-indigo-600/text-primary/g' "$file"
  sed -i 's/text-indigo-900/text-foreground/g' "$file"
}

# Files to process (checkout and shop components)
FILES=(
  "components/checkout/PaymentSuccess.tsx"
  "components/checkout/PaymentMethodSelector.tsx"
  "components/checkout/ContactForm.tsx"
  "app/shop/checkout/page.tsx"
  "app/shop/[productId]/page.tsx"
  "components/admin/ProductOptionsManager.tsx"
  "components/template-builder/Toolbar.tsx"
  "app/staff/dashboard/page.tsx"
)

# Process each file if it exists
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    fix_file "$file"
  else
    echo "Skipping (not found): $file"
  fi
done

echo "Bulk replacements complete!"
echo "Note: Seating components need manual review due to complex color usage"
