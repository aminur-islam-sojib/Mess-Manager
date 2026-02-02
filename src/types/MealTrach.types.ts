import { MealMember } from "./MealManagementTypes";

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export interface MealCardProps {
  icon: React.ReactNode;
  color: "orange" | "yellow" | "blue";
  label: string;
  count: number;
  pct: number;
}

export interface CostRowProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
}

export interface MiniStatProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  color: "orange" | "yellow" | "blue";
}

export interface MemberRowProps {
  member: MealMember;
  rank: number;
  costPerMeal: number;
}

export interface MemberMealStatProps {
  icon: React.ReactNode;
  val: number;
  label: string;
  color: "orange" | "yellow" | "blue";
}
