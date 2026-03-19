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

export interface MessMembersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  q: string;
  sortBy: MessMemberSortBy;
  sortDir: MessMemberSortDir;
  role: MessMemberFilterRole;
}

export type MessMemberSortBy =
  | "name"
  | "email"
  | "role"
  | "joinDate"
  | "monthlyMeals"
  | "monthlyMealCost"
  | "currentBalance";

export type MessMemberSortDir = "asc" | "desc";

export type MessMemberFilterRole = "all" | "manager" | "member";

export interface GetMessMembersParams {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: MessMemberSortBy;
  sortDir?: MessMemberSortDir;
  role?: MessMemberFilterRole;
}

export interface GetMessMembersSuccess {
  success: true;
  messId: string;
  messName: string;
  state: "ok" | "empty";
  currentMonth: MessMembersCurrentMonthSummary;
  members: MessMember[];
  pagination?: MessMembersPagination;
}

export interface GetMessMembersFailure {
  success: false;
  state: "no-mess" | "error" | "unauthorized";
  message: string;
}

export type GetMessMembersResponse =
  | GetMessMembersSuccess
  | GetMessMembersFailure;
