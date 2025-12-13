# Convex Auth Implementation Plan

## Overview
Implement email/password sign-up and sign-in functionality using the existing Convex Auth backend. The UI will be a modal triggered from the FloatingHeader user button.

## Current State

### What's Already Set Up
- `@convex-dev/auth` package installed
- `convex/auth.ts` - Password provider configured with `signIn`/`signOut` mutations
- `convex/auth.config.ts` - Basic auth config
- `convex/schema.ts` - Auth tables included via `...authTables`
- `src/main.tsx` - ConvexAuthProvider wrapping app
- Data model: Tables have `userId` fields ready for user association

### What's Missing
1. No Login/Signup UI components
2. Auth state not used to control app access
3. No logout functionality in UI

---

## Implementation Steps

### 1. Create Auth UI Components

**Files to create:**
- `src/components/auth/AuthModal.tsx` - Modal container with backdrop
- `src/components/auth/LoginForm.tsx` - Email/password login form
- `src/components/auth/SignupForm.tsx` - Registration form

**Design approach:**
- Use existing `GlassPanel`, `GlassButton`, `GlassInput` components
- Match glassmorphic style: `bg-white/90 backdrop-blur-xl border-slate-200/50`
- Pink-to-purple gradient for primary actions
- Framer Motion animations for enter/exit

### 2. Add Auth State to UI Store

**File to modify:** `src/stores/uiStore.ts`

Add:
```typescript
authModalOpen: boolean
authMode: 'login' | 'signup'
setAuthModalOpen: (open: boolean) => void
setAuthMode: (mode: 'login' | 'signup') => void
```

### 3. Update FloatingHeader

**File to modify:** `src/components/Layout/FloatingHeader.tsx`

- Import `useConvexAuth` to check auth state
- Show user email or "Sign In" based on auth status
- Click handler opens auth modal (unauthenticated) or shows dropdown (authenticated)
- Add sign-out option for authenticated users

### 4. Integrate Modal into App

**File to modify:** `src/App.tsx`

- Import and render `AuthModal` component
- Modal renders based on `authModalOpen` state from uiStore

### 5. Wire Up Convex Auth Actions

**In LoginForm.tsx and SignupForm.tsx:**
```typescript
import { useAuthActions } from "@convex-dev/auth/react";

const { signIn } = useAuthActions();

// For login:
await signIn("password", { email, password, flow: "signIn" });

// For signup:
await signIn("password", { email, password, flow: "signUp" });
```

---

## File Structure

```
src/components/auth/
├── AuthModal.tsx      # Modal wrapper with backdrop, tabs for login/signup
├── LoginForm.tsx      # Email + password form, submit calls signIn
└── SignupForm.tsx     # Email + password + confirm, submit calls signUp
```

## Component Details

### AuthModal.tsx
- Fixed overlay with backdrop blur
- Centered GlassPanel container
- Tab switcher between Login/Signup
- Close button (X)
- AnimatePresence for smooth transitions

### LoginForm.tsx
- Email input (GlassInput)
- Password input (GlassInput, type="password")
- Submit button (GlassButton variant="primary")
- Error message display
- Loading state during auth

### SignupForm.tsx
- Email input
- Password input
- Confirm password input
- Submit button
- Validation (passwords match, email format)
- Error message display

### FloatingHeader Changes
- Check `isAuthenticated` from `useConvexAuth()`
- If authenticated: show user indicator + sign-out dropdown
- If not: show "Sign In" button that opens modal

---

## Critical Files to Modify

1. `src/stores/uiStore.ts` - Add auth modal state
2. `src/components/Layout/FloatingHeader.tsx` - Add auth trigger
3. `src/App.tsx` - Render AuthModal

---

## Testing Checklist

- [ ] Sign up with new email/password
- [ ] Sign in with existing credentials
- [ ] Sign out clears session
- [ ] Error handling for invalid credentials
- [ ] Modal closes on successful auth
- [ ] Header updates to show authenticated state

---

## Notes

### Password Provider Flow
Convex Auth Password provider supports:
- `signIn("password", { email, password, flow: "signIn" })` - Login
- `signIn("password", { email, password, flow: "signUp" })` - Register
- `signOut()` - Logout
