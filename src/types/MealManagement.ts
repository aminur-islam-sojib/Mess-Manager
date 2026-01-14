export type MessMember = {
  userId: string;
  name: string;
  email: string;
  role: "manager" | "member";
  status: string;
  joinDate?: string;
};

export type MessDataResponse = {
  success: boolean;
  messId?: string;
  messName?: string;
  members?: MessMember[];
  message?: string;
};

export type MealEntry = {
  breakfast: number;
  lunch: number;
  dinner: number;
};
