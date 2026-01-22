import {
  Home,
  Users,
  Receipt,
  Settings,
  UserPlus,
  type LucideIcon,
  UtensilsCrossed,
  BarChartHorizontalBig,
  TrendingDown,
} from "lucide-react";

export type Role = "manager" | "user" | "admin";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiresMess?: boolean;
};

export const NAV_CONFIG: Record<Role, NavItem[]> = {
  manager: [
    {
      label: "Overview",
      href: "/dashboard/manager",
      icon: Home,
    },
    {
      label: "Add Meals",
      href: "/dashboard/manager/meals",
      icon: UtensilsCrossed,
      requiresMess: true,
    },
    {
      label: "Meals Reports",
      href: "/dashboard/manager/meals-report",
      icon: BarChartHorizontalBig,
      requiresMess: true,
    },
    {
      label: "Invite Member",
      href: "/dashboard/manager/invite",
      icon: UserPlus,
      requiresMess: true,
    },
    {
      label: "Expenses",
      href: "/dashboard/manager/expenses",
      icon: Receipt,
      requiresMess: true,
    },
    {
      label: "Settings",
      href: "/dashboard/manager/settings",
      icon: Settings,
      requiresMess: true,
    },
  ],

  user: [
    {
      label: "Home",
      href: "/dashboard/user",
      icon: Home,
    },
    {
      label: "Meal Report",
      href: "/dashboard/user/meals-report",
      icon: BarChartHorizontalBig,
      requiresMess: true,
    },
    {
      label: "Invitation",
      href: "/dashboard/user/invite",
      icon: UserPlus,
    },
    {
      label: "Expenses",
      href: "/dashboard/user/expenses",
      icon: TrendingDown,
      requiresMess: true,
    },
    {
      label: "Settings",
      href: "/dashboard/user/settings",
      icon: Settings,
      requiresMess: true,
    },
  ],
  admin: [
    {
      label: "Home",
      href: "/dashboard/admin",
      icon: Home,
    },
    {
      label: "Expenses",
      href: "/dashboard/admin/expenses",
      icon: TrendingDown,
    },
    {
      label: "Settings",
      href: "/dashboard/admin/settings",
      icon: Settings,
    },
  ],
};
