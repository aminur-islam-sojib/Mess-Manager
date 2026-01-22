# 👨‍💻 Mess Manager - Developer's Guide

## 🎓 For New Team Members

Welcome to the Mess Manager project! This guide will help you understand the codebase architecture and development workflows.

---

## 📚 Understanding the Architecture

### The Request Flow (End-to-End)

```
User Action (e.g., "Add Meal")
    ↓
React Component Form
    ↓
Server Action Call (RPC)
    ↓
TypeScript Type Validation
    ↓
MongoDB Query/Mutation
    ↓
Response (Discriminated Union)
    ↓
Component Re-render
```

### Example: Adding a Meal Entry

**File:** `src/components/ManagerComponents/Meals/AllMealEntry.tsx`

```tsx
// 1. Component state
const [selectedDate, setSelectedDate] = useState(new Date());
const [meals, setMeals] = useState({ breakfast: 0, lunch: 0, dinner: 0 });

// 2. Form submit handler
async function handleSubmit() {
  const response = await addMealEntry({
    date: selectedDate.toISOString().slice(0, 10),
    meals,
    mode: "all",
  });

  // 3. Type-safe response handling
  if (response.success) {
    toast.success("Meals added!");
  } else {
    toast.error(response.message);
  }
}
```

**File:** `src/actions/server/Meals.ts`

```typescript
// 4. Server Action (RPC endpoint)
export const addMealEntry = async (payload: MealPayload) => {
  // Validation, authentication check
  // MongoDB upsert operation
  // Response with discriminated union
  return { success: true as const, message: "..." };
  // or
  return { success: false as const, message: "Error..." };
};
```

---

## 🗂️ Key Files & Their Purposes

### Authentication

- `src/app/api/auth/[...nextauth]/options.ts` - NextAuth configuration
- `src/lib/user.service.ts` - User operations (CRUD)
- `middleware.ts` - Auth middleware (future)

### Database

- `src/lib/dbConnect.ts` - MongoDB connection & collection names
- `src/lib/dbIndexes.ts` - Schema indexes setup
- `src/lib/getUserMess.ts` - Helper to fetch user's mess

### Server Actions (Business Logic)

- `src/actions/server/Users.ts` - User registration, profile
- `src/actions/server/Mess.ts` - Mess creation, member management
- `src/actions/server/Meals.ts` - Meal tracking (NEW - fully typed)
- `src/actions/server/Invitations.ts` - Email invitations

### Type Definitions (Type Safety)

- `src/types/Model.ts` - Core data models (User, Session)
- `src/types/MessTypes.ts` - Mess-related types
- `src/types/MealManagement.ts` - Meal operation types
- `src/types/MealManagementTypes.ts` - Response types (discriminated unions)
- `src/types/next-auth.d.ts` - NextAuth type extensions

### Pages (Route Handlers)

- `src/app/page.tsx` - Landing/role selection
- `src/app/auth/login/page.tsx` - Authentication
- `src/app/dashboard/` - Main application routes

### Components

- `src/components/ManagerComponents/` - Manager-only UI
- `src/components/UserComponents/` - Member-only UI
- `src/components/Shared/` - Reusable across roles
- `src/components/ui/` - Base UI building blocks (Radix, Tailwind)

---

## 🔍 Code Quality Standards

### TypeScript Best Practices

✅ **Always use proper types, never `any`**

```typescript
// ❌ BAD
const data: any = await fetchData();

// ✅ GOOD
const data: GetTodayMealsResponseSuccess = await getTodayMeals();
if (!data.success) {
  return { error: data.message };
}
```

✅ **Use discriminated unions for error handling**

```typescript
// ❌ BAD
type Response = {
  success: boolean;
  data?: any;
  error?: string;
};

// ✅ GOOD
type Response =
  | { success: true; data: MealMember[] }
  | { success: false; message: string };
```

✅ **Validate data before use**

```typescript
// ❌ BAD
const { name, email } = user;

// ✅ GOOD
if (!user?.name || !user?.email) {
  return <ErrorState />;
}
const { name, email } = user;
```

### Component Best Practices

✅ **Server vs Client Components**

```typescript
// ✅ Server Component (fetch data once)
export default async function Dashboard() {
  const data = await getSingleMessForUser(userId);
  return <Content initialData={data} />;
}

// ✅ Client Component (interactive)
"use client";
export default function Form({ initialData }) {
  const [state, setState] = useState(initialData);
  return <input value={state} onChange={e => setState(e.target.value)} />;
}
```

✅ **Props typing for components**

```typescript
interface ComponentProps {
  data: MealMember[];
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export default function Component({ data, onSelect, isLoading = false }: ComponentProps) {
  return <div>...</div>;
}
```

---

## 🔐 Security Checklist

Before submitting PR:

- [ ] No `console.log` with sensitive data
- [ ] Server actions validate user session
- [ ] API calls check user permissions
- [ ] Passwords never exposed in responses
- [ ] Environment variables used for secrets
- [ ] Input validation on both client & server
- [ ] No hardcoded URLs or IPs
- [ ] Error messages don't leak system details

---

## 🧪 Testing Workflow

### Manual Testing Checklist

**For Meal Entry:**

```
☐ Add meals as manager (all members)
☐ Add meals as manager (individual member)
☐ Verify data persists after refresh
☐ Check aggregation in reports
☐ Test invalid inputs (negative numbers, etc)
```

**For Invitations:**

```
☐ Send invitation email
☐ Click link in email
☐ Accept invitation as new member
☐ Verify user added to mess_members
☐ Test expired invitation (wait 24h or manually set)
☐ Test already-used invitation
```

**For Authentication:**

```
☐ Register new user
☐ Login with credentials
☐ Verify session persists
☐ Logout clears session
☐ Redirect to login for unauthenticated access
```

### TypeScript Validation

```bash
# Check for compilation errors
npm run build

# Run ESLint
npm run lint

# Check specific file
npx tsc --noEmit src/types/MealManagementTypes.ts
```

---

## 📊 Database Operations Guide

### Adding a New Collection

1. **Add to collections map** (`src/lib/dbConnect.ts`)

```typescript
export const collections = {
  // ... existing collections
  EXPENSES: "expenses", // NEW
};
```

2. **Create indexes** (`src/lib/dbIndexes.ts`)

```typescript
if (isFirstRun) {
  await expensesCollection.createIndex({ messId: 1 });
  await expensesCollection.createIndex({ createdBy: 1 });
}
```

3. **Define types** (`src/types/ExpenseTypes.ts`)

```typescript
export interface Expense {
  _id: ObjectId;
  messId: ObjectId;
  amount: number;
  // ...
}
```

4. **Create server action** (`src/actions/server/Expenses.ts`)

```typescript
export const createExpense = async (payload: ExpensePayload) => {
  // Validation → Mutation → Response
};
```

### MongoDB Aggregation Pattern

```typescript
// Used for complex queries (daily/monthly reports)
const data = await collection
  .aggregate([
    // Stage 1: Filter
    { $match: { messId, date: { $gte: from, $lte: to } } },

    // Stage 2: Join with user details
    { $lookup: { from: "users", localField: "userId", foreignField: "_id" } },
    { $unwind: "$user" },

    // Stage 3: Group and aggregate
    {
      $group: {
        _id: "$userId",
        totalMeals: { $sum: "$meals" },
        entries: { $sum: 1 },
      },
    },

    // Stage 4: Sort
    { $sort: { totalMeals: -1 } },
  ])
  .toArray();
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All TypeScript errors resolved (`npm run build` passes)
- [ ] ESLint checks pass (`npm run lint`)
- [ ] Environment variables configured
- [ ] MongoDB connection verified
- [ ] Email service tested
- [ ] Session secrets updated
- [ ] HTTPS enabled
- [ ] CORS configured if needed
- [ ] Database backups scheduled
- [ ] Error monitoring setup (Sentry, etc)

### Pre-Deployment Commands

```bash
# 1. Test build
npm run build

# 2. Check for vulnerabilities
npm audit

# 3. Update dependencies (optional)
npm update

# 4. Run linter
npm run lint

# 5. Run local production build
npm run build && npm run start
```

---

## 🐛 Debugging Techniques

### Server Action Debugging

```typescript
export const addMealEntry = async (payload: MealPayload) => {
  console.log("🔍 Incoming payload:", payload);

  try {
    const session = await getServerSession(authOptions);
    console.log("🔑 Session user:", session?.user?.id);

    // ... operation

    console.log("✅ Success");
    return { success: true as const, message: "..." };
  } catch (error) {
    console.error("❌ Error:", error); // Full error stack
    return { success: false as const, message: "Failed to add meal" };
  }
};
```

### MongoDB Debugging

```bash
# Connect to MongoDB shell
mongosh "your_connection_string"

# Check collections
use mess_manager_db
show collections

# Query data
db.meals.find({ messId: ObjectId("...") })

# Check indexes
db.meals.getIndexes()

# Analyze query performance
db.meals.find({ messId: ObjectId("...") }).explain("executionStats")
```

### Browser DevTools

```javascript
// Check session in console
// NextAuth stores session in IndexedDB
// Open: Application → IndexedDB → next-auth.js-cache

// Monitor network requests
// Check XHR calls to server actions
// Look for response payloads
```

---

## 📖 Code Review Checklist

When reviewing PRs:

### Functionality

- [ ] Feature works as described
- [ ] Handles edge cases (empty data, errors, etc)
- [ ] No console errors/warnings
- [ ] Data persists correctly

### Code Quality

- [ ] TypeScript strict mode compliant
- [ ] No `any` types without justification
- [ ] Props are properly typed
- [ ] Error handling is comprehensive

### Security

- [ ] User authorization checked
- [ ] No sensitive data in logs
- [ ] Input validation present
- [ ] No hardcoded secrets

### Performance

- [ ] No N+1 queries (use aggregation)
- [ ] Appropriate use of caching
- [ ] No unnecessary re-renders
- [ ] Database indexes are used

---

## 🎯 Common Tasks

### Adding a New Feature

1. **Create types** - `src/types/NewFeatureTypes.ts`
2. **Create server action** - `src/actions/server/NewFeature.ts`
3. **Create component** - `src/components/.../NewFeatureComponent.tsx`
4. **Add route** - `src/app/dashboard/.../page.tsx`
5. **Update navigation** - `src/config/nav.config.ts`
6. **Test end-to-end**
7. **Create PR with description**

### Fixing a Bug

1. **Reproduce issue** locally
2. **Add `console.error` to identify source**
3. **Write fix in minimal change**
4. **Test all related flows**
5. **Update types if needed**
6. **Create PR with "Fix: ..." commit message**

### Refactoring Code

1. **Identify improvement** (readability, performance, etc)
2. **Make changes incrementally**
3. **Verify TypeScript still passes**
4. **Test functionality unchanged**
5. **Create PR with clear description**

---

## 📚 Learning Resources

### For Next.js

- [App Router Guide](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

### For TypeScript

- [Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions)

### For MongoDB

- [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/)
- [Query Optimization](https://docs.mongodb.com/manual/core/query-optimization/)

---

## ❓ FAQ

**Q: How do I add a new user role?**
A: Update `session.user.role` in NextAuth config, create new dashboard page, add permission checks in server actions.

**Q: How do I handle errors better?**
A: Use discriminated unions, return detailed error messages, add client-side validation before server calls.

**Q: How do I optimize slow queries?**
A: Check indexes with `.explain()`, use aggregation pipelines, batch operations.

**Q: When should I use SSR vs SSG?**
A: Use SSR for dynamic data (user-specific), SSG for static content.

---

## 🎓 Next Steps

1. Read [README.md](./README.md) for architecture overview
2. Check [QUICK_START.md](./QUICK_START.md) for development setup
3. Explore `src/types/` to understand data models
4. Read a server action to understand request flow
5. Pick a small bug/feature and contribute!

---

**Happy coding! 🚀**

For questions, open an issue or join our discussion forum.
