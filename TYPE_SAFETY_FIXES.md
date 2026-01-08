# Type Safety Fixes - Progress Report

## Overview
This document tracks the progress of fixing TypeScript type safety errors across the codebase. The goal is to eliminate all `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unsafe-*`, and `@typescript-eslint/restrict-template-expressions` errors.

## Initial State
- **Total errors**: ~383 when filtered, likely 786+ total
- **Primary issues**:
  1. `restrict-template-expressions`: Numbers/booleans used directly in template literals
  2. `no-explicit-any`: Explicit `any` type usage
  3. `no-unsafe-*`: Operations on `any` typed values

## Completed Fixes

### Convex Files (Server-side)
✅ **convex/checklists.ts** (4 errors fixed)
- Fixed: `any` type assertion → proper union type for category
- Fixed: Template expressions with `Date.now()` → wrapped with `String()`

✅ **convex/claude.ts** (~26 errors fixed)
- Added proper TypeScript interfaces for `TripContext`, `TripLocation`, and `Tool`
- Fixed: Request body typing → proper type assertion
- Fixed: Template expressions with numbers → wrapped with `String()`
- Fixed: Error handling → typed `unknown` with proper narrowing

✅ **convex/locations.ts** (2 errors fixed)
- Fixed: Category argument → full union type instead of `any` assertion

✅ **convex/parseItinerary.ts** (~45 errors fixed)
- Added comprehensive type interfaces:
  - `ParsedLocation`, `ParsedActivity`, `ParsedDay`, `ParsedResult`
  - `ClaudeContent`, `ClaudeResponse`
- Fixed: Request body typing
- Fixed: Response JSON parsing with proper types
- Fixed: Array mapping without `any` type assertions

✅ **convex/parseItineraryLocal.ts** (~10 errors fixed)
- Fixed: Template expressions with numbers
- Fixed: Geocoding response typing
- Fixed: Request body typing

## Remaining Work

### Pattern 1: Template Expressions (High Priority)
**Common Fix**: Wrap numeric/boolean values with `String()`

```typescript
// BEFORE
`Day ${day}` // ❌ Error: Invalid type "number" of template literal expression

// AFTER
`Day ${String(day)}` // ✅ Fixed
```

**Files affected**: Most src/ component files
**Estimated count**: ~200-300 occurrences

### Pattern 2: Explicit `any` Usage (Medium Priority)
**Common Fix**: Replace with proper types or `unknown`

```typescript
// BEFORE
function handler(data: any) { // ❌ Unsafe any
  return data.value;
}

// AFTER
interface HandlerData {
  value: string;
}
function handler(data: HandlerData) { // ✅ Typed
  return data.value;
}

// OR if type truly unknown:
function handler(data: unknown) { // ✅ Use unknown
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
}
```

**Files affected**: hooks, components with API calls
**Estimated count**: ~50-100 occurrences

### Pattern 3: Unsafe Operations (Medium Priority)
**Common Fix**: Add type guards or proper typing

```typescript
// BEFORE
const result = someAnyValue.map((item: any) => item.name); // ❌ Unsafe

// AFTER
interface Item {
  name: string;
}
const result = (someValue as Item[]).map((item) => item.name); // ✅ Typed
```

**Files affected**: Data transformation code, API responses
**Estimated count**: ~100-200 occurrences

## Automation Strategy

### Created Tools
1. **scripts/fix-type-safety.ts**: Automated fixer for template expressions
   - Uses regex to find common numeric variable patterns
   - Wraps them with `String()`
   - Can process entire src/ directory

2. **fix-types.sh**: Simple bash script for sed-based replacements

### Recommended Approach

#### Phase 1: Automated Fixes (1-2 hours)
Run the TypeScript fixer script to handle template expressions:
```bash
npx tsx scripts/fix-type-safety.ts
npm run lint -- --fix  # Let ESLint auto-fix what it can
```

#### Phase 2: Manual Review (2-4 hours)
Focus on remaining errors by priority:
1. Fix remaining convex files (server-side, highest impact)
2. Fix hooks (shared logic, medium impact)
3. Fix components (UI, lower impact but most numerous)

#### Phase 3: Type Definitions (1-2 hours)
Create proper TypeScript interfaces for:
- API response types
- Convex query/mutation return types
- Component prop types

## Quick Wins

### Template Expression Fixes
Search and replace patterns in your editor:

```regex
# Find: \$\{(count|index|i|day|step)\}
# Replace: ${String($1)}
```

### Common `any` Replacements
- Event handlers: `(e: any)` → `(e: React.FormEvent)`
- API responses: `: any` → Create interface or use `unknown`
- Array methods: `.map((item: any)` → Define item type

## Branch Strategy (Per CLAUDE.md)
```bash
git checkout -b fix/type-safety-errors
# Make fixes
git add .
git commit -m "fix: resolve TypeScript type safety errors

- Wrap template expression numbers with String()
- Replace any types with proper interfaces
- Add type guards for unsafe operations

Fixes ~786 type safety errors across convex/ and src/"
git push -u origin fix/type-safety-errors
gh pr create --title "Fix: TypeScript type safety errors" --body "..."
```

## Testing Strategy
After fixes:
1. Run `npm run lint` to verify all errors resolved
2. Run `npm run build` to ensure no build errors
3. Run `npm test` to verify functionality unchanged
4. Manual smoke test of key features

## Notes
- Convex files are highest priority (server-side safety)
- Many errors are repetitive patterns
- Automation can handle 60-70% of template expression errors
- The remaining 20-30% require manual type definitions

## Current Status
- **Convex files**: 5/18 complete (~28%)
- **Src files**: 0/100+ complete (~0%)
- **Total progress**: ~15% of all errors fixed

## Next Steps
1. Run automated fixer script
2. Fix remaining convex files manually
3. Create type definition files for common interfaces
4. Batch-fix src/ files by pattern
5. Create PR with all changes
