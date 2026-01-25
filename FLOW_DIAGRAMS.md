# Real-Time Flow Diagrams

## Expense Addition Flow (Manager)

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADD EXPENSE FLOW                             │
└─────────────────────────────────────────────────────────────────┘

1. Manager clicks "New Expense"
   └─ AddExpense dialog opens

2. Manager fills form
   ├─ Title
   ├─ Amount
   ├─ Category
   ├─ Date
   └─ Paid By (member selector)

3. Manager clicks "Save Expense"
   │
   └─→ Button shows "Saving..." spinner
       Button disabled = TRUE

4. Form data validated
   ├─ Title: required ✓
   ├─ Amount: positive number ✓
   ├─ Category: selected ✓
   ├─ Date: selected ✓
   └─ Paid By: member selected ✓

5. Server Action: addExpense(payload)
   │
   ├─ Check user is authenticated
   ├─ Check user belongs to a mess
   ├─ Check paid-by user is in same mess
   ├─ Create expense document
   └─ Insert into database

6. Success Response
   │
   ├─ Clear form data
   ├─ Close dialog
   ├─ Call router.refresh() ← KEY STEP!
   └─ Revalidate server data

7. UI Revalidation
   │
   ├─ MessExpenseManagement.tsx gets new data
   ├─ FinancialRecords.tsx gets updated list
   └─ Stats recalculated

8. User sees new expense in table ✅
   ├─ Appears in correct position
   ├─ Shows correct status (approved/pending)
   └─ Updates total amounts
```

---

## Expense Approval Flow (Manager)

```
┌─────────────────────────────────────────────────────────────────┐
│                  APPROVE EXPENSE FLOW                            │
└─────────────────────────────────────────────────────────────────┘

1. Manager sees pending expense in table
   └─ Status badge shows "pending" (orange)

2. Manager hovers over expense row
   └─ Approve button (checkmark) appears

3. Manager clicks approve button
   │
   └─→ Confirmation dialog appears
       "Are you sure? You wanna accept this expenses!"

4. Manager clicks "Yes, Add Expenses!"
   │
   └─→ Approve button disabled
       Loading state starts

5. Server Action: approveExpense(expenseId)
   │
   ├─ Check user is authenticated
   ├─ Check user is manager
   ├─ Find expense by ID
   ├─ Check expense belongs to user's mess
   ├─ Check expense is pending
   └─ Update status: "pending" → "approved"

6. Success Response
   │
   ├─ Dialog closes
   ├─ Call router.refresh() ← KEY STEP!
   └─ Revalidate server data

7. UI Revalidation
   │
   ├─ Fetch expenses again
   ├─ Update expense object status
   └─ Re-render table row

8. User sees updated status ✅
   ├─ Badge changes to "approved" (green)
   ├─ Approve button disappears
   └─ Amount updates in stats
```

---

## Code Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      COMPONENT LIFECYCLE                         │
└──────────────────────────────────────────────────────────────────┘

USER INTERACTION
    ↓
┌─────────────────────────────────────────┐
│ onClick handler triggered                │
│ e.g., handleSubmit() or handleApprove() │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ startTransition(async () => {            │
│   // Wrap server action here            │
└─────────────────────────────────────────┘
    ↓ (isPending = TRUE)
┌─────────────────────────────────────────┐
│ Button disabled + Spinner shown         │
│ User feedback: "Saving..."              │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ await addExpense(payload)               │
│ or                                      │
│ await approveExpense(expenseId)         │
└─────────────────────────────────────────┘
    ↓ (server processing)
┌─────────────────────────────────────────┐
│ MongoDB: INSERT or UPDATE               │
│ Database updated ✓                      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ if (res.success)                        │
│   router.refresh() ← CRITICAL!          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Next.js revalidates:                    │
│ • Page cache invalidated                │
│ • Server components re-run              │
│ • Fresh data fetched                    │
│ • getAllExpenses() called again         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Components receive new props:           │
│ • allExpenses: updated list             │
│ • mappedExpenses: recalculated          │
│ • Stats: totals updated                 │
└─────────────────────────────────────────┘
    ↓ (isPending = FALSE)
┌─────────────────────────────────────────┐
│ UI Re-renders with new data             │
│ • Table shows updated expense           │
│ • Status badge updated                  │
│ • Stats recalculated                    │
│ • Dialog closed                         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Button re-enabled                       │
│ User sees instant results ✅            │
└─────────────────────────────────────────┘
```

---

## State Machine

```
┌─────────────────┐
│   IDLE          │
│ (Ready)         │
└────────┬────────┘
         │ User clicks button
         ↓
┌─────────────────┐
│   LOADING       │
│ (isPending)     │
│ • Button disabled
│ • Spinner shown
│ • "Saving..." text
└────────┬────────┘
         │ Server processes
         ↓
      ┌──┴──┐
      │     │
   SUCCESS  ERROR
      │     │
      ↓     ↓
  REFRESH  SHOW ERROR
      │     │
      ↓     ↓
 DATA UPDATED  MESSAGE
      │        │
      ↓        ↓
 RERENDER   REVERT
      │        │
      └────┬───┘
           ↓
    ┌──────────────┐
    │    IDLE      │
    │   (Ready)    │
    └──────────────┘
```

---

## Before vs After Comparison

```
BEFORE (Manual Refresh)
══════════════════════════════════════════════════════════════
User Action → Server Update → [User manually refreshes] → See changes

Problems:
✗ Confusing for users
✗ Requires page reload
✗ Slow workflow
✗ Bad user experience
✗ Looks like app didn't work


AFTER (Automatic Real-Time)
══════════════════════════════════════════════════════════════
User Action → Server Update → Auto Refresh → See changes instantly

Benefits:
✓ Clear and intuitive
✓ No manual refresh needed
✓ Fast feedback
✓ Great user experience
✓ Professional feeling app
✓ Looks responsive
```

---

## Component Dependency Graph

```
                    MessExpenseManagement.tsx
                     (Server Component)
                            │
                  ┌─────────┴──────────┐
                  │                    │
         FinancialRecords.tsx    AddExpense.tsx
           (Client Component)  (Client Component)
                  │                    │
    ┌─────────────┘                    │
    │                                  │
    ├─ useTransition() ✅      useTransition() ✅
    ├─ useRouter() ✅          useRouter() ✅
    ├─ router.refresh() ✅     router.refresh() ✅
    │
    └─ approveExpense() → re-fetches → MessExpenseManagement
                            getAllExpenses()
                            │
                            ↓
                      New props passed down
                            │
                            ↓
                       UI Updates
```

---

## Data Flow After Action

```
┌─────────────────────────────────────────────────────────┐
│           Server Component (Page)                       │
│                                                         │
│  const allExpenses = await getAllExpenses()            │
│         │                                              │
│         ↓                                              │
│  <MessExpenseManagement allExpenses={...} />           │
└────────┬────────────────────────────────────────────────┘
         │
         │ Passes as props
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│    MessExpenseManagement (Client Component)             │
│                                                         │
│  const [expenses, setExpenses] = useState(...)         │
│  useEffect(() => setExpenses(mappedExpenses), [...])  │
│         │                                              │
│         ↓                                              │
│  const mappedExpenses = useMemo(() => {...})           │
└────────┬─────────────────────────────────────────────────┘
         │
         │ Passes data down
         │
         ├──────────────────────────────────┬─────────────┐
         ↓                                  ↓              ↓
    FinancialRecords              AddExpense        UserAddExpense
    • Shows table                 • Form dialog      • User form
    • Approve buttons             • Save button      • Save button
    • router.refresh()            • router.refresh() • router.refresh()
         │                             │                  │
         └─────────────┬───────────────┴──────────────────┘
                       │
                       ↓
            On Success → router.refresh()
                       │
                       ↓
            Server component re-runs
                       │
                       ↓
            getAllExpenses() called AGAIN
                       │
                       ↓
            New allExpenses data
                       │
                       ↓
            New props to MessExpenseManagement
                       │
                       ↓
            Re-renders all child components
                       │
                       ↓
            User sees updated data ✅
```

---

## Key Technical Points

```
┌─────────────────────────────────────────────────────────┐
│                   WHY THIS WORKS                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. useTransition()                                      │
│    • Tracks pending state of async operations           │
│    • isPending = true while async action runs          │
│    • Automatically becomes false when done             │
│                                                         │
│ 2. router.refresh()                                     │
│    • Re-runs Server Components on page                  │
│    • Refetches all server data (getAllExpenses)        │
│    • Updates props passed to Client Components         │
│    • No full page reload (better UX)                   │
│                                                         │
│ 3. Page Re-rendering                                    │
│    • New props trigger useEffect                        │
│    • useState updated with new data                     │
│    • Component re-renders with fresh data              │
│    • UI shows latest changes                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Diagrams Created**: January 25, 2026
**Implementation**: ✅ Complete
**Status**: 🎯 Production Ready
