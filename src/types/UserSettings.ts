import type { DepositMethod, DepositRequestStatus } from "@/types/Deposit";

export type UserNotificationSettings = {
  mealReminder: boolean;
  depositUpdate: boolean;
  expenseAlert: boolean;
};

export type UserMealPreferences = {
  defaultMealCount: number;
  reminderEnabled: boolean;
};

export type UserSettingsUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  canChangePassword: boolean;
  notificationSettings: UserNotificationSettings;
  mealPreferences: UserMealPreferences;
};

export type UserMessInfo = {
  id: string;
  messName: string;
  messAddress: string;
  description: string;
  image: string | null;
  managerName: string;
  managerEmail: string;
  managerImage: string | null;
  totalMembers: number;
  joinedDate: string;
  mealTrackingEnabled: boolean;
  messDefaultMealCount: number;
  minimumDeposit: number;
};

export type UserMessMember = {
  id: string;
  name: string;
  email: string;
  role: "manager" | "member";
  joinDate: string;
  image: string | null;
};

export type UserDepositRecord = {
  id: string;
  amount: number;
  method: DepositMethod;
  note: string | null;
  date: string;
  status: "approved";
  createdAt: string;
};

export type UserDepositRequest = {
  id: string;
  amount: number;
  method: DepositMethod;
  note: string | null;
  date: string;
  status: DepositRequestStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvalNote?: string;
};

export type UserSettingsData = {
  user: UserSettingsUser;
  mess: UserMessInfo;
  members: UserMessMember[];
  deposits: UserDepositRecord[];
  depositRequests: UserDepositRequest[];
};
