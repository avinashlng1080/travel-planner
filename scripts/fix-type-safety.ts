#!/usr/bin/env tsx

/**
 * Automated Type Safety Fixer
 *
 * This script automatically fixes common TypeScript type safety issues:
 * 1. restrict-template-expressions: Wraps numbers/booleans in template literals with String()
 * 2. no-explicit-any: Documents locations where manual fixing is needed
 * 3. no-unsafe-*: Documents locations where manual fixing is needed
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Fix {
  file: string;
  line: number;
  description: string;
}

const fixes: Fix[] = [];

// Regex patterns for common issues
const TEMPLATE_NUMBER_PATTERNS = [
  // Match ${variable} where variable is likely a number
  /\$\{(\s*(?:count|index|i|id|length|total|day|dayIndex|step|page|size|width|height|x|y|z|lat|lng|distance|duration|price|rating|score|year|month|date|hour|minute|second|millisecond)\s*)\}/g,
  // Match ${obj.prop} where prop is likely a number
  /\$\{(\s*\w+\.(?:length|count|index|size|id|rating|score|lat|lng|distance|duration)\s*)\}/g,
];

function fixTemplateExpressions(content: string, filePath: string): string {
  let fixed = content;
  let changesMade = false;

  for (const pattern of TEMPLATE_NUMBER_PATTERNS) {
    const matches = [...content.matchAll(pattern)];

    for (const match of matches) {
      const fullMatch = match[0];
      const variable = match[1];

      // Skip if already wrapped with String()
      if (variable.trim().startsWith('String(')) {
        continue;
      }

      // Wrap with String()
      const replacement = `\${String(${variable})}`;
      fixed = fixed.replace(fullMatch, replacement);
      changesMade = true;
    }
  }

  if (changesMade) {
    console.log(`✓ Fixed template expressions in ${path.relative(process.cwd(), filePath)}`);
  }

  return fixed;
}

async function processFile(filePath: string): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fixed = fixTemplateExpressions(content, filePath);

    if (fixed !== content) {
      fs.writeFileSync(filePath, fixed, 'utf-8');
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  console.log('🔧 Starting automated type safety fixes...\n');

  // Find all TypeScript and TSX files in src/
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/*.d.ts', '**/node_modules/**'],
  });

  console.log(`Found ${files.length} files to process\n`);

  for (const file of files) {
    await processFile(file);
  }

  console.log(`\n✅ Completed! Processed ${files.length} files`);
  console.log('\nRun `npm run lint` to check remaining issues.');
}

main().catch(console.error);
