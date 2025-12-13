# Remaining Tasks - Malaysia Travel Planner

## Completed
- [x] All component files created (Phases 2-7)
- [x] Dev server running at http://localhost:3000
- [x] TypeScript compilation passes
- [x] Removed node_modules from git tracking
- [x] Created .gitignore
- [x] Created .env file with placeholder API key
- [x] Installed Playwright and created visual tests
- [x] Created playwright.config.ts

## In Progress / Remaining

### 1. Fix Chatbox Visibility Issue
**Problem**: The chatbox may not appear on page load due to localStorage persistence.

**Root Cause**: The Zustand store uses `persist` middleware saving to `malaysia-trip-storage` in localStorage. If a user previously closed the chat, `chatOpen: false` persists across sessions.

**Solution Options**:
- Clear localStorage: Open browser DevTools > Application > Local Storage > Delete `malaysia-trip-storage`
- Or modify `src/stores/tripStore.ts` to not persist `chatOpen` state

### 2. Configure Claude API Key
**File**: `.env`

Replace the placeholder with your actual API key:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

Get your API key from: https://console.anthropic.com/

### 3. Fix Playwright Test
**File**: `tests/visual.spec.ts` line 41-42

The test has a strict mode violation - change:
```typescript
const chatHeader = page.locator('text=Malaysia Travel AI');
```
To:
```typescript
const chatHeader = page.locator('h3:has-text("Malaysia Travel AI")').first();
```

### 4. Git Push to GitHub
Authentication failed previously. Options:
- Use GitHub CLI: `gh auth login`
- Set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- Use Personal Access Token with HTTPS

### 5. Screenshots Generated
Visual test screenshots saved to:
- `tests/screenshots/homepage.png`
- `tests/screenshots/chatbox-visible.png`
- `tests/screenshots/map-loaded.png`
- `tests/screenshots/sidebar.png`

## Quick Resume Commands

```bash
# Start dev server
npm run dev

# Run Playwright tests
npx playwright test

# View Playwright report
npx playwright show-report

# Clear localStorage (run in browser console)
localStorage.removeItem('malaysia-trip-storage')
```

## Dev Server
Currently running at: http://localhost:3000
