export type NotificationPreferences = {
  depositRequestNotifications: boolean;
  expenseNotifications: boolean;
  mealReminders: boolean;
};

export type ManagerSettingsUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  notifications: NotificationPreferences;
};

export type DepositApprovalMode = "manual" | "automatic";

export type DepositSettings = {
  minimumDeposit: number;
  approvalMode: DepositApprovalMode;
};

export type ExpenseRuleAccess = "managerOnly" | "membersAllowed";

export type MealCalculationMode = "daily" | "monthly";

export type MessMealSettings = {
  enabled: boolean;
  defaultMealCount: number;
  calculationMode: MealCalculationMode;
  deadline: string;
};

export type ManagerSettingsMess = {
  id: string;
  messName: string;
  messAddress: string;
  description: string;
  image: string | null;
  budget: number;
  depositSettings: DepositSettings;
  settings: {
    expenseRules: {
      whoCanAddExpenses: ExpenseRuleAccess;
    };
  };
  mealSettings: MessMealSettings;
};

export type SettingsMember = {
  id: string;
  name: string;
  email: string;
  role: "manager" | "member";
  joinDate: string;
  image: string | null;
};

export type PendingInvitation = {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  inviteLink: string;
};

export type ManagerSettingsData = {
  user: ManagerSettingsUser;
  mess: ManagerSettingsMess;
  members: SettingsMember[];
  pendingInvitations: PendingInvitation[];
};
