# Code Reference Guide

## Key Patterns Used

### Pattern 1: useTransition + router.refresh()

```typescript
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { someServerAction } from "@/actions/server/...";

export default function MyComponent() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = async () => {
    startTransition(async () => {
      const result = await someServerAction();
      if (result.success) {
        router.refresh();  // ← Revalidates server data
        // Dialog close, form reset, etc.
      }
    });
  };

  return (
    <button
      onClick={handleAction}
      disabled={isPending}  // ← Shows disabled during transition
    >
      {isPending ? "Loading..." : "Click Me"}
    </button>
  );
}
```

---

## Before & After Code Comparison

### BEFORE: Manual Refresh Approach ❌

```typescript
const handleSubmit = async () => {
  const res = await addExpense(payload);

  if (res.success) {
    // Problem: This doesn't refresh the parent data!
    await getAllExpensesData(); // ← Doesn't update UI
    setIsAddModalOpen(false);
  }
};
```

**Issues:**

- ❌ `getAllExpensesData()` doesn't update parent component
- ❌ UI doesn't refresh automatically
- ❌ User needs manual page reload
- ❌ Bad user experience

---

### AFTER: Auto-Refresh Approach ✅

```typescript
const router = useRouter();
const [isPending, startTransition] = useTransition();

const handleSubmit = async () => {
  startTransition(async () => {
    const res = await addExpense(payload);

    if (res.success) {
      setIsAddModalOpen(false);
      router.refresh(); // ← Revalidates ALL server data!
    }
  });
};
```

**Benefits:**

- ✅ `router.refresh()` re-runs server components
- ✅ All cached data revalidated
- ✅ UI updates automatically
- ✅ No manual refresh needed
- ✅ Better user experience

---

## Complete AddExpense Implementation

```typescript
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addExpense } from "@/actions/server/Expense";
import { Button } from "@/components/ui/button";

type AddExpenseProps = {
  messData: MessDataResponse;
  setIsAddModalOpen: (value: boolean) => void;
};

export default function AddExpense({
  setIsAddModalOpen,
  messData,
}: AddExpenseProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "",
    date: "",
    paidBy: "",
  });

  const handleSubmit = async () => {
    setIsLoading(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category.toLowerCase() as "grocery" | "utility" | "rent" | "others",
      expenseDate: formData.date,
      paidBy: formData.paidBy,
    };

    // Wrap server action in startTransition
    startTransition(async () => {
      const res = await addExpense(payload);

      if (res.success) {
        // Reset form
        setFormData({
          title: "",
          description: "",
          amount: "",
          category: "",
          date: "",
          paidBy: "",
        });

        // Close dialog
        setIsAddModalOpen(false);

        // 🔑 KEY STEP: Refresh server data
        router.refresh();
      } else {
        alert(res.message);
      }

      setIsLoading(false);
    });
  };

  return (
    <Dialog open={true} onOpenChange={() => setIsAddModalOpen(false)}>
      <DialogContent>
        {/* Form fields... */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || isPending}  // ← Both states
        >
          {isLoading || isPending ? "Saving..." : "Save Expense"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Complete FinancialRecords Implementation

```typescript
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveExpense } from "@/actions/server/Expense";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";

type FinancialRecordsProps = {
  allExpenses: GetExpensesSerializedResponse;
  messData: MessDataResponse;
  role: string;
};

export default function FinancialRecords({
  allExpenses,
  messData,
  role,
}: FinancialRecordsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Sync expenses when props change
  useEffect(() => {
    setExpenses(/* mapped expenses */);
  }, [allExpenses]);

  const handleApprove = (id: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You wanna accept this expenses!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#88be89",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Add Expenses!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Wrap approval action in startTransition
        startTransition(async () => {
          const res = await approveExpense(id);

          if (res.success) {
            // 🔑 KEY STEP: Refresh server data
            router.refresh();
          }
        });
      }
    });
  };

  return (
    <Card>
      <Table>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              {/* Table cells... */}
              <TableCell>
                {role === "manager" &&
                  expense.status === "pending" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-emerald-600"
                      onClick={() => handleApprove(expense.id)}
                      disabled={isPending}  // ← Disabled while pending
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
```

---

## Hook Usage Explanation

### `useTransition` Hook

```typescript
const [isPending, startTransition] = useTransition();

// isPending: boolean
// - true while async action is running
// - false when completed or errored

// startTransition: function
// - Wraps async function
// - Automatically manages isPending state
// - Call: startTransition(async () => { ... })
```

**Usage Example:**

```typescript
startTransition(async () => {
  // This runs asynchronously
  const result = await someServerAction();

  // After completion, isPending becomes false
  // UI automatically re-renders
});

// While above is running:
// isPending = true
// After completion:
// isPending = false
```

---

### `useRouter` Hook

```typescript
const router = useRouter();

// Available methods:
router.push(href); // Navigate to URL
router.replace(href); // Replace history
router.refresh(); // ← THIS ONE!
router.back(); // Go back
router.forward(); // Go forward
router.prefetch(href); // Prefetch page
```

**What `router.refresh()` does:**

```typescript
router.refresh();
// 1. Re-runs all Server Components on current page
// 2. Re-fetches all server data
// 3. Updates props sent to Client Components
// 4. Client Components re-render with new data
// 5. NO full page reload (better than window.location.reload())
```

---

## Error Handling Example

```typescript
const handleAction = async () => {
  startTransition(async () => {
    try {
      const res = await addExpense(payload);

      if (res.success) {
        router.refresh();
        setIsAddModalOpen(false);
      } else {
        // Handle API error
        alert(`Error: ${res.message}`);
      }
    } catch (error) {
      // Handle network/unexpected error
      console.error("Action failed:", error);
      alert("Something went wrong");
    }
  });
};
```

---

## Testing Utilities

### Test Helper: Wait for Transition

```typescript
// In your test file
import { waitFor } from "@testing-library/react";

describe("AddExpense", () => {
  it("should add expense and refresh UI", async () => {
    const { getByText, getByRole } = render(<AddExpense />);

    // Fill form
    const titleInput = getByRole("textbox", { name: /title/i });
    fireEvent.change(titleInput, { target: { value: "Test" } });

    // Click save
    const saveButton = getByText("Save Expense");
    fireEvent.click(saveButton);

    // Wait for transition to complete
    await waitFor(() => {
      expect(saveButton).not.toHaveAttribute("disabled");
    });

    // Verify refresh was called
    expect(router.refresh).toHaveBeenCalled();
  });
});
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Not using startTransition

```typescript
// WRONG - Button won't show loading state
const handleSubmit = async () => {
  const res = await addExpense(payload);
  router.refresh();
};

// CORRECT - Button shows loading state
const handleSubmit = async () => {
  startTransition(async () => {
    const res = await addExpense(payload);
    router.refresh();
  });
};
```

---

### ❌ Mistake 2: Forgetting to update button disabled

```typescript
// WRONG - Button stays enabled during request
<Button onClick={handleSubmit}>Save</Button>

// CORRECT - Button disabled during transition
<Button
  onClick={handleSubmit}
  disabled={isPending}  // ← This is important!
>
  Save
</Button>
```

---

### ❌ Mistake 3: Using setExpenses instead of router.refresh

```typescript
// WRONG - Parent component doesn't update
const handleSubmit = async () => {
  const res = await addExpense(payload);
  setExpenses([...expenses, newExpense]); // ← Only local state
};

// CORRECT - Revalidates all server data
const handleSubmit = async () => {
  const res = await addExpense(payload);
  router.refresh(); // ← Fetches fresh data from server
};
```

---

### ❌ Mistake 4: Not importing from correct packages

```typescript
// WRONG - These won't work in Next.js 13+
import { useTransition } from "react-dom"; // ❌ Old
import { useRouter } from "next/router"; // ❌ Old Router

// CORRECT
import { useTransition } from "react"; // ✅ React 18+
import { useRouter } from "next/navigation"; // ✅ App Router
```

---

## Performance Tips

### 1. Use isPending State Efficiently

```typescript
// Good: Only disable button while pending
<Button disabled={isPending}>Save</Button>

// Bad: Disable button for both loading and pending
<Button disabled={isLoading || isPending}>Save</Button>
// (Remove isLoading if using startTransition)
```

### 2. Minimize router.refresh() Scope

```typescript
// Good: Only refresh when you need updated data
if (res.success) {
  router.refresh();
}

// Bad: Always refresh, even on errors
const res = await addExpense();
router.refresh(); // Unnecessary if failed
```

### 3. Avoid Multiple Transitions

```typescript
// Good: One transition per action
startTransition(async () => {
  const res = await addExpense();
  router.refresh();
});

// Bad: Multiple nested transitions
startTransition(async () => {
  startTransition(async () => {
    await addExpense();
  });
});
```

---

## Debugging Tips

### Check if router.refresh() is called:

```typescript
const router = useRouter();

const handleAction = () => {
  startTransition(async () => {
    console.log("Before refresh");
    router.refresh();
    console.log("After refresh"); // Logs immediately
  });
};
```

### Monitor isPending state:

```typescript
useEffect(() => {
  console.log("isPending:", isPending);
}, [isPending]);

// Output:
// isPending: false (initial)
// isPending: true (when action starts)
// isPending: false (when action completes)
```

### Check server action success:

```typescript
startTransition(async () => {
  const res = await addExpense(payload);
  console.log("Server response:", res);

  if (res.success) {
    console.log("Success! Refreshing...");
    router.refresh();
  } else {
    console.log("Error:", res.message);
  }
});
```

---

## FAQ

**Q: Why use router.refresh() instead of setExpenses()?**
A: `router.refresh()` revalidates data from the server, ensuring you always have fresh data. `setExpenses()` is client-side only.

**Q: Will router.refresh() cause a full page reload?**
A: No! It re-runs Server Components without a full page reload, maintaining better UX.

**Q: Can I use startTransition for multiple server actions?**
A: Yes, but use separate transitions for different actions to avoid confusion.

**Q: What if the server action fails?**
A: `isPending` still becomes false. Check `res.success` and show error message.

**Q: Do I need both isLoading and isPending?**
A: No, if using `startTransition`, you can remove `setIsLoading` entirely.

---

**Reference Guide Created**: January 25, 2026
**Status**: ✅ COMPLETE
**Type**: Developer Reference
