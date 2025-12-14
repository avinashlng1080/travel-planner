# Convex Auth Implementation

## Overview
Email/password authentication using Convex Auth with a Facebook-style onboarding flow. Unauthenticated users see a landing page with embedded login/signup forms. Authenticated users are taken directly to the trip planner app.

## Architecture

```
App.tsx (Auth Router)
├── isLoading → <LoadingScreen />
├── !isAuthenticated → <LandingPage />
└── isAuthenticated → <TripPlannerApp />
```

## Current Implementation

### Backend (Convex)
- `convex/auth.ts` - Password provider configured with `signIn`/`signOut` mutations
- `convex/auth.config.ts` - Auth configuration
- `convex/schema.ts` - Auth tables included via `...authTables`

### Frontend Structure

```
src/
├── App.tsx                           # Auth router (checks isAuthenticated)
├── pages/
│   ├── LandingPage.tsx              # Hero + embedded auth forms
│   └── TripPlannerApp.tsx           # Main app (authenticated users)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx            # Email/password login
│   │   └── SignupForm.tsx           # Registration with confirm password
│   ├── ui/
│   │   └── LoadingScreen.tsx        # Auth loading state
│   └── layout/
│       └── FloatingHeader.tsx       # User menu with sign-out
```

## Auth Flow

### Sign Up
1. User visits app → sees `<LandingPage />`
2. Fills out signup form (email, password, confirm)
3. `signIn("password", { email, password, flow: "signUp" })` called
4. On success, `isAuthenticated` becomes true
5. App renders `<TripPlannerApp />`

### Sign In
1. User visits app → sees `<LandingPage />`
2. Switches to login tab, enters credentials
3. `signIn("password", { email, password, flow: "signIn" })` called
4. On success, app renders `<TripPlannerApp />`

### Sign Out
1. User clicks avatar in header → dropdown menu
2. Clicks "Sign out"
3. `signOut()` called
4. `isAuthenticated` becomes false
5. App renders `<LandingPage />`

## Key Components

### LandingPage.tsx
- Split layout: 60% hero content, 40% auth form
- Tab switcher between Login/Signup
- Reuses existing `LoginForm` and `SignupForm` components
- Feature highlights and trust indicators
- Responsive design (stacks on mobile)

### TripPlannerApp.tsx
- Full trip planner UI (map, panels, chat)
- Only rendered for authenticated users
- Extracted from original App.tsx

### LoadingScreen.tsx
- Shown while auth state is being determined
- Animated logo and spinner
- Prevents flash of wrong content

### FloatingHeader.tsx
- User avatar with dropdown menu
- Sign-out functionality
- No sign-in button (users are always authenticated when viewing)

## Hooks Used

```typescript
// Check auth state
import { useConvexAuth } from 'convex/react';
const { isAuthenticated, isLoading } = useConvexAuth();

// Auth actions
import { useAuthActions } from '@convex-dev/auth/react';
const { signIn, signOut } = useAuthActions();

// Sign in/up
await signIn("password", { email, password, flow: "signIn" });
await signIn("password", { email, password, flow: "signUp" });

// Sign out
await signOut();
```

## Testing Checklist

- [x] Unauthenticated user sees landing page
- [x] Sign up creates account and shows app
- [x] Sign in authenticates and shows app
- [x] Authenticated user goes directly to app on refresh
- [x] Sign out returns user to landing page
- [x] Loading screen shows during auth check
- [x] Mobile responsive layout works
