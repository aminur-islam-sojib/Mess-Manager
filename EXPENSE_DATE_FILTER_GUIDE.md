# Expense Date Filter - Data Flow Guide

## 📊 Complete Data Flow

### 1️⃣ **Calendar Component (Client-Side)**

- **Input:** User selects date range
- **Output Format:** `DateRange` type from `react-day-picker`
  ```typescript
  {
    from: Date,  // Start date as JS Date object
    to?: Date    // End date as JS Date object (optional)
  }
  ```
- **Example:** User selects Jan 1 - Jan 31, 2026
  ```typescript
  {
    from: Date(2026-01-01),
    to: Date(2026-01-31)
  }
  ```

---

### 2️⃣ **Handler Function (Client-Side Component)**

**File:** `FinancialRecords.tsx` → `handleDateChange()`

```typescript
const handleDateChange = async (newDate: DateRange | undefined) => {
  setDate(newDate);
  if (newDate?.from) {
    startTransition(async () => {
      // Pass Date objects to server action
      const res = await getAllExpenses(newDate.from, newDate.to);
      if (res.success) {
        // Update expenses state with filtered data
        setExpenses(mappedExpenses);
      }
    });
  }
};
```

**Flow:**

- User picks dates → `handleDateChange()` called
- Date objects passed to `getAllExpenses(from, to)`
- Server processes and returns filtered data
- Component updates local state with new expenses

---

### 3️⃣ **Server Action (Backend)**

**File:** `Expense.ts` → `getAllExpenses(fromDate?: Date, toDate?: Date)`

**Input Format Received:**

```typescript
// From client (JS Date objects)
getAllExpenses(
  fromDate: Date(2026-01-01),  // JavaScript Date object
  toDate: Date(2026-01-31)     // JavaScript Date object
)
```

**Conversion Process:**

```typescript
// Step 1: Convert JS Date → YYYY-MM-DD string
const startDateStr = startDate.toISOString().split("T")[0];
// Result: "2026-01-01"

const endDateStr = endDate.toISOString().split("T")[0];
// Result: "2026-01-31"

// Step 2: Query database (expenseDate is stored as string)
const query = {
  messId: ObjectId,
  expenseDate: {
    $gte: "2026-01-01", // Greater than or equal
    $lt: "2026-02-01", // Less than (next month)
  },
};

// Step 3: Fetch from MongoDB
const expenses = await collection.find(query).toArray();
```

---

### 4️⃣ **Database Storage**

**File:** MongoDB Collection `expenses`

**Stored Format:**

```javascript
{
  _id: ObjectId,
  messId: ObjectId,
  title: "Grocery Shopping",
  expenseDate: "2026-01-15",  // ⚠️ STORED AS STRING (YYYY-MM-DD)
  amount: 2500,
  status: "approved",
  createdAt: ISODate("2026-01-15T10:30:00Z"),
  updatedAt: ISODate("2026-01-15T10:30:00Z")
}
```

**⚠️ Critical:** `expenseDate` is **string format** `"YYYY-MM-DD"`, NOT Date object!

---

### 5️⃣ **Response Format (Server → Client)**

**File:** `ExpenseType.ts` → `GetExpensesSerializedResponse`

```typescript
{
  success: true,
  from: "2026-01-01T00:00:00.000Z",  // ISO string
  to: "2026-02-01T00:00:00.000Z",    // ISO string
  expenses: [
    {
      id: "...",
      expenseDate: "2026-01-15",      // String format
      title: "Grocery Shopping",
      amount: 2500,
      status: "approved",
      ...
    }
  ]
}
```

---

## 🔄 Date Format Conversions

| Stage               | Format     | Example                  | File                 |
| ------------------- | ---------- | ------------------------ | -------------------- |
| **Calendar**        | JS Date    | `Date(2026-01-01)`       | FinancialRecords.tsx |
| **Server Input**    | JS Date    | `Date(2026-01-01)`       | Expense.ts           |
| **DB Query**        | String     | `"2026-01-01"`           | Expense.ts           |
| **DB Storage**      | String     | `"2026-01-15"`           | MongoDB              |
| **Server Response** | ISO String | `"2026-01-01T00:00:00Z"` | Expense.ts           |
| **Client Display**  | String     | `"2026-01-15"`           | FinancialRecords.tsx |

---

## ✅ Features Implemented

### Date Range Filtering

- ✅ User selects date range from calendar
- ✅ Component calls `getAllExpenses(from, to)`
- ✅ Server converts dates to string format
- ✅ MongoDB queries expenses within date range
- ✅ Server returns filtered data with `from` and `to`
- ✅ Component displays filtered expenses

### Combined Filters

- ✅ Category filter
- ✅ Status filter (approved/pending)
- ✅ Date range filter
- ✅ All filters work together (AND logic)

### Data Return

- ✅ `from` field: Start date of range (ISO string)
- ✅ `to` field: End date of range (ISO string)
- ✅ `expenses`: Array of filtered expenses
- ✅ Expenses sorted by date (newest first)

---

## 🧪 Test Case Examples

### Test 1: Select Jan 1-15, 2026

```
Input:  from: Date(2026-01-01), to: Date(2026-01-15)
Query:  expenseDate >= "2026-01-01" AND expenseDate < "2026-01-16"
Result: Shows all expenses between Jan 1-15, 2026
```

### Test 2: Select current month (default)

```
Input:  fromDate and toDate not provided
Query:  Defaults to current month
Result: Shows all expenses from this month
```

### Test 3: Combine filters

```
Input:  Date range: Jan 1-31 + Category: "grocery" + Status: "approved"
Result: Only approved grocery expenses from January
```

---

## 📝 Code Locations

| Component       | File                            | Responsibility             |
| --------------- | ------------------------------- | -------------------------- |
| Calendar UI     | `FinancialRecords.tsx` L235-250 | Captures date range        |
| Date Handler    | `FinancialRecords.tsx` L199-218 | Calls server with dates    |
| Server Action   | `Expense.ts` L121-191           | Filters expenses by date   |
| Type Definition | `ExpenseType.ts` L76-84         | Defines response structure |
| Database Query  | `Expense.ts` L165-176           | MongoDB query logic        |

---

## 🐛 Debug Tips

1. **Check Calendar Output:**

   ```typescript
   console.log("Selected date:", date);
   // Should show: { from: Date, to?: Date }
   ```

2. **Check Server Input:**

   ```typescript
   console.log("Received dates:", fromDate, toDate);
   // Should show: Date objects
   ```

3. **Check String Conversion:**

   ```typescript
   console.log("String format:", startDate.toISOString().split("T")[0]);
   // Should show: "YYYY-MM-DD"
   ```

4. **Check MongoDB Query:**

   ```typescript
   console.log("Query:", query);
   // Should match dates as strings
   ```

5. **Check Response:**
   ```typescript
   console.log("Response from/to:", response.from, response.to);
   // Should show ISO strings
   ```
