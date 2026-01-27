# getTodaysExpenseSummary - Debug Guide

## What to Do

1. **Start the app and navigate to the component that calls `getTodaysExpenseSummary()`**
2. **Open browser console + server logs** to see the debug output
3. **Check the console for these debug logs:**

```
🔍 getTodaysExpenseSummary Debug: {
  userId: "...",
  messId: "...",
  role: "manager/member",
  todayStr: "2026-01-26",
  tomorrowStr: "2026-01-27"
}

📊 Total expenses for this mess: X
📊 Sample expenses: [...]  // View the actual structure
📊 Today's expenses: Y
📊 Sample today expenses: [...]
```

## Troubleshooting Based on Logs

### Case 1: Total expenses = 0, Sample expenses = []

**Problem:** No expenses exist at all for this mess
**Solution:**

- Add some test expenses first
- Check if the user is properly associated with the mess
- Verify messId is correct

### Case 2: Total expenses > 0, but Today's expenses = 0

**Problem:** Expenses exist but not for today
**Solution:**

- Check the `expenseDate` format in sample expenses
- Make sure you're adding expenses with today's date (2026-01-26)
- Verify the date string comparison is working

### Case 3: Sample expenses shows different format

**Problem:** expenseDate might be stored differently than expected
**Solution:**

- If stored as Date object instead of string: Modify the query to handle Date objects
- If stored in different format: Adjust the string comparison accordingly

## What We're Looking For

The `expenseDate` should be stored as a STRING in format `"2026-01-26"` (YYYY-MM-DD)

Example of correct data structure:

```javascript
{
  _id: ObjectId,
  messId: ObjectId,
  addedBy: ObjectId,
  paidBy: ObjectId,
  title: "Grocery",
  amount: 500,
  category: "grocery",
  expenseDate: "2026-01-26",  // ← String format
  status: "approved",
  createdAt: Date,
  updatedAt: Date
}
```

## Quick Fixes

If you find the issue, you can:

1. **If expenseDate is a Date object:** Modify the match stage to convert:

```typescript
{
  $match: {
    messId,
    expenseDate: {
      $gte: new Date(todayStr),
      $lt: new Date(tomorrowStr)
    }
  }
}
```

2. **If date format is different:** Check exactly how it's stored and adjust the string comparison.

## Debug Logs Location

Server logs will show in:

- Terminal where you ran `npm run dev`
- Look for lines starting with `🔍`, `📊`
