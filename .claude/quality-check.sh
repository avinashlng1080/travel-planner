#!/bin/bash
# Quality check script - run before commits

echo "🔍 Running TypeScript type checking..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found!"
  exit 1
fi

echo "✅ TypeScript check passed"

echo "🏗️  Running build..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build passed"
echo "🎉 All quality checks passed!"
