// Meal member data structure from server aggregation
export interface MealMember {
  _id: string; // userId as string
  name: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  totalMeals: number;
  entries?: number; // Only in date range reports
  email?: string;
}

// Error response type for all server actions
export interface ErrorResponse {
  success: false;
  message: string;
}

// Response from getTodayMeals - Success
export interface GetTodayMealsResponseSuccess {
  success: true;
  date: string; // "YYYY-MM-DD"
  messId: string;
  messName: string;
  data: MealMember[];
}

// Complete response from getTodayMeals
export type GetTodayMealsResponse =
  | GetTodayMealsResponseSuccess
  | ErrorResponse;

// Response from getMonthlyMeals - Success
export interface GetMonthlyMealsResponseSuccess {
  success: true;
  messId: string;
  messName: string;
  month: number;
  year: number;
  data: MealMember[];
}

// Complete response from getMonthlyMeals
export type GetMonthlyMealsResponse =
  | GetMonthlyMealsResponseSuccess
  | ErrorResponse;

// Response from getMealsByDateRange - Success
export interface GetMealsByDateRangeResponseSuccess {
  success: true;
  from: string; // "YYYY-MM-DD"
  to: string; // "YYYY-MM-DD"
  messId: string;
  messName: string;
  data: MealMember[];
}

// Complete response from getMealsByDateRange
export type GetMealsByDateRangeResponse =
  | GetMealsByDateRangeResponseSuccess
  | ErrorResponse;

// Calculated summary from meal data
export interface MealSummary {
  breakfast: number;
  lunch: number;
  dinner: number;
  totalMeals: number;
  entries: number;
}

// Props for DailyMealAttendance component
export interface DailyMealAttendanceProps {
  attendanceData?: GetTodayMealsResponse;
  costPerMeal?: number;
}

// Props for MonthlyMealTracingDashboard component
export interface MonthlyMealTracingDashboardProps {
  reportData?: GetMonthlyMealsResponse;
  costPerMeal?: number;
}

// Props for DateRangeReport component
export interface DateRangeReportProps {
  reportData?: GetMealsByDateRangeResponse;
}

interface CurrentMonthMealCost {
  totalMeals: number;
  totalExpenses: number;
  costPerMeal: number;
}

export interface CurrentMonthMealCostDetails {
  success?: boolean;
  data?: CurrentMonthMealCost;
}
