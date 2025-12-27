import { Home, Users, Receipt, Settings } from "lucide-react";

export type Role = "manager" | "user" | "admin";

export type NavItem = {
  label: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
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
    },
    {
      label: "Expenses",
      href: "/dashboard/manager/expenses",
      icon: Receipt,
    },
    {
      label: "Settings",
      href: "/dashboard/manager/settings",
      icon: Settings,
    },
  ],

  user: [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Expenses",
      href: "/dashboard/expenses",
      icon: Receipt,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      label: "Members",
      href: "/dashboard/manager/members",
      icon: Users,
    },
  ],
  admin: [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Expenses",
      href: "/dashboard/expenses",
      icon: Receipt,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ],
};
