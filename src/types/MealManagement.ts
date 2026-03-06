import type { MessMember } from "./MessMember";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export type MessDataResponse = {
  currentUser?: CurrentUser;
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
