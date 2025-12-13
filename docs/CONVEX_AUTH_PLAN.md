# Convex Auth Implementation Plan

## Current State

### What's Already Set Up
- `@convex-dev/auth` package installed
- `convex/auth.ts` - Password provider configured
- `convex/auth.config.ts` - Basic auth config
- `convex/schema.ts` - Auth tables included via `...authTables`
- `src/main.tsx` - ConvexAuthProvider wrapping app
- `src/App.tsx` - `useConvexAuth()` hook imported (but unused)

### What's Missing
1. No Login/Signup UI components
2. Auth state not used to control app access
3. Backend functions have no auth checks
4. No logout functionality in UI
5. User data not associated with accounts

---

## Implementation Plan

### Phase 1: Create Auth UI Components

#### 1.1 AuthModal.tsx
**File:** `src/components/auth/AuthModal.tsx`

Floating modal for login/signup with tabs:
- Email input
- Password input
- Submit button
- Toggle between Login/Signup
- Error message display
- Loading state

```typescript
import { useAuthActions } from "@convex-dev/auth/react";

function AuthModal({ isOpen, onClose }) {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn("password", { email, password, flow: mode === 'signup' ? 'signUp' : 'signIn' });
  };
}
```

#### 1.2 UserMenu.tsx
**File:** `src/components/auth/UserMenu.tsx`

Dropdown menu in header showing:
- User email/name when logged in
- Logout button
- Login button when logged out

```typescript
import { useAuthActions } from "@convex-dev/auth/react";

function UserMenu() {
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
}
```

### Phase 2: Integrate Auth in App

#### 2.1 Update FloatingHeader.tsx
Add UserMenu component to the right side of header.

#### 2.2 Auth Guard (Optional)
**File:** `src/components/auth/AuthGuard.tsx`

Wrap protected content:
```typescript
function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <AuthModal isOpen={true} />;

  return children;
}
```

### Phase 3: Backend Auth Integration

#### 3.1 Add Auth Checks to Functions
Update Convex functions to use authentication:

```typescript
// convex/checklists.ts
import { auth } from "./auth";

export const getMyChecklist = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("checklists")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("type", args.type)
      )
      .first();
  },
});
```

#### 3.2 Update Schema Indexes
Add indexes for user-based queries:
```typescript
checklists: defineTable({
  userId: v.id("users"), // Make required, not optional
  type: v.string(),
  items: v.array(checklistItemSchema),
}).index("by_user_and_type", ["userId", "type"]),
```

### Phase 4: User Data Migration

#### 4.1 Associate Existing Data
- Update chatMessages to include userId
- Update userPreferences to require userId
- Create default checklists for new users

---

## Files to Create

1. `src/components/auth/AuthModal.tsx` - Login/Signup modal
2. `src/components/auth/UserMenu.tsx` - Header user dropdown
3. `src/components/auth/AuthGuard.tsx` - Protected route wrapper

## Files to Modify

1. `src/components/layout/FloatingHeader.tsx` - Add UserMenu
2. `convex/checklists.ts` - Add auth checks
3. `convex/chatMessages.ts` - Add auth checks
4. `convex/schema.ts` - Update indexes, make userId required
5. `src/App.tsx` - Wrap with AuthGuard (optional)

---

## Implementation Order

| Step | Task | Priority |
|------|------|----------|
| 1 | Create AuthModal.tsx with login/signup | HIGH |
| 2 | Create UserMenu.tsx with logout | HIGH |
| 3 | Add UserMenu to FloatingHeader | HIGH |
| 4 | Add auth checks to backend functions | MEDIUM |
| 5 | Update schema indexes | MEDIUM |
| 6 | Create AuthGuard wrapper | LOW (optional) |

---

## Notes

### Password Provider Flow
Convex Auth Password provider supports:
- `signIn("password", { email, password, flow: "signIn" })` - Login
- `signIn("password", { email, password, flow: "signUp" })` - Register
- `signOut()` - Logout

### No React Query Needed
Convex provides superior real-time data fetching:
- `useQuery` - Real-time subscriptions
- `useMutation` - Mutations with optimistic updates
- Built-in caching and offline support

React Query is for REST APIs; Convex's architecture is better suited for this app.
