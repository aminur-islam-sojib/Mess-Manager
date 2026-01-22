# Meal Management Data Structure & Types Documentation

## Server Action Response Structures

### 1. getTodayMeals Response

```typescript
{
  success: true,
  date: "2026-01-23",           // ISO date string YYYY-MM-DD
  messId: "string",              // ObjectId as string
  messName: "string",            // Mess name
  data: MealMember[]             // Array of member meal records
}
```

### 2. getMonthlyMeals Response

```typescript
{
  success: true,
  messId: "string",
  messName: "string",
  month: number,                 // 1-12
  year: number,                  // 2026
  data: MealMember[]
}
```

### 3. getMealsByDateRange Response

```typescript
{
  success: true,
  from: "2026-01-15",            // Start date YYYY-MM-DD
  to: "2026-01-23",              // End date YYYY-MM-DD
  messId: "string",
  messName: "string",
  data: MealMember[]
}
```

## Core Data Types

### MealMember

Represents aggregated meal data for a member:

```typescript
{
  _id: string;                   // User ID as string
  name: string;                  // User name
  breakfast: number;             // Total breakfast meals in range
  lunch: number;                 // Total lunch meals in range
  dinner: number;                // Total dinner meals in range
  totalMeals: number;            // breakfast + lunch + dinner
  entries?: number;              // Optional, only in date range reports
}
```

### MealSummary

Calculated from MealMember array:

```typescript
{
  breakfast: number; // Sum of all member breakfast meals
  lunch: number; // Sum of all member lunch meals
  dinner: number; // Sum of all member dinner meals
  totalMeals: number; // Total meals across all members
  entries: number; // Number of members (data.length)
}
```

## Component Props

### DailyMealAttendance Props

```typescript
interface DailyMealAttendanceProps {
  attendanceData?: GetTodayMealsResponse | { success: false; message: string };
}
```

### MonthlyMealTracingDashboard Props

```typescript
interface MonthlyMealTracingDashboardProps {
  reportData?: GetMonthlyMealsResponse | { success: false; message: string };
  costPerMeal?: number; // Default: 50
}
```

### DateRangeReport Props

```typescript
interface DateRangeReportProps {
  reportData?:
    | GetMealsByDateRangeResponse
    | { success: false; message: string };
}
```

## Type Conversions in Components

All components follow this pattern:

1. Check if response is valid: `!reportData?.success || !reportData?.data || !Array.isArray(reportData.data)`
2. Cast to proper type: `const typedData = reportData as GetTodayMealsResponse;`
3. Calculate summary from data array:

```typescript
const summary: MealSummary = {
  breakfast: data.reduce((sum, m) => sum + (m.breakfast || 0), 0),
  lunch: data.reduce((sum, m) => sum + (m.lunch || 0), 0),
  dinner: data.reduce((sum, m) => sum + (m.dinner || 0), 0),
  totalMeals: data.reduce((sum, m) => sum + (m.totalMeals || 0), 0),
  entries: data.length,
};
```

## Files Updated

1. **Created**: `/src/types/MealManagementTypes.ts`
   - Central type definitions for all meal management

2. **Updated Components**:
   - `/src/components/ManagerComponents/Meal-Tracking/TodaysMealTracking.tsx`
   - `/src/components/ManagerComponents/Meal-Tracking/MonthlyMealTracingDashboard.tsx`
   - `/src/components/ManagerComponents/Meal-Tracking/CustomMealTrackPage/DateRangeReport.tsx`
   - `/src/components/ManagerComponents/Meal-Tracking/MealTrackingDashboard.tsx`

All components now use proper TypeScript types instead of `any`, providing:

- Better IDE autocomplete
- Type safety
- Clearer documentation
- Easier maintenance and refactoring
