import { Home, Users, Receipt, Settings, type LucideIcon } from "lucide-react";

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
      label: "Members",
      href: "/dashboard/manager/members",
      icon: Users,
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
      label: "Expenses",
      href: "/dashboard/user/expenses",
      icon: Receipt,
      requiresMess: true,
    },
    {
      label: "Settings",
      href: "/dashboard/user/settings",
      icon: Settings,
      requiresMess: true,
    },
    {
      label: "Members",
      href: "/dashboard/user/manager/members",
      icon: Users,
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
      icon: Receipt,
    },
    {
      label: "Settings",
      href: "/dashboard/admin/settings",
      icon: Settings,
    },
  ],
};
