export type MessMemberRole = "manager" | "member";

export interface MessMember {
  userId: string;
  name: string;
  email: string;
  role: MessMemberRole;
  status: string;
  joinDate: string;
  monthlyMeals: number;
  monthlyMealCost: number;
  totalDeposit: number;
  currentBalance: number;
}

export interface MessMembersCurrentMonthSummary {
  month: number;
  year: number;
  totalMessExpense: number;
  totalMessMealCount: number;
  costPerMeal: number;
}

export interface GetMessMembersSuccess {
  success: true;
  messId: string;
  messName: string;
  currentMonth: MessMembersCurrentMonthSummary;
  members: MessMember[];
}

export interface GetMessMembersFailure {
  success: false;
  message: string;
}

export type GetMessMembersResponse =
  | GetMessMembersSuccess
  | GetMessMembersFailure;
