#!/bin/bash

# Script to fix common TypeScript type safety errors

# Fix restrict-template-expressions: wrap numbers in String()
echo "Fixing restrict-template-expressions (number in templates)..."

# Find all TypeScript/TSX files and fix common template expression patterns
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/`\([^`]*\)\${count}`/`\1${String(count)}`/g' \
  -e 's/`\([^`]*\)\${index}`/`\1${String(index)}`/g' \
  -e 's/`\([^`]*\)\${i}`/`\1${String(i)}`/g' \
  -e 's/`\([^`]*\)\${id}`/`\1${String(id)}`/g' \
  -e 's/`\([^`]*\)\${length}`/`\1${String(length)}`/g' \
  -e 's/`\([^`]*\)\${total}`/`\1${String(total)}`/g' \
  -e 's/`\([^`]*\)\${day}`/`\1${String(day)}`/g' \
  {} \;

echo "Fixed template expression errors"
echo "Note: This script handles common cases. You may need to manually fix remaining errors."
echo "Run 'npm run lint' to check remaining issues."
