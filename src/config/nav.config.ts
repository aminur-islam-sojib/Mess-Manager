import {
  Home,
  Receipt,
  Settings,
  UserPlus,
  type LucideIcon,
  UtensilsCrossed,
  BarChartHorizontalBig,
  TrendingDown,
  UsersIcon,
  WalletMinimalIcon,
} from "lucide-react";

export type Role = "manager" | "user" | "admin";
export type AppRole = Extract<Role, "manager" | "user">;

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiresMess?: boolean;
};

export type RoleNavigationMeta = {
  sidebarTitle: string;
  sidebarSubtitle: string;
  mobileTitle: string;
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
      label: "Members",
      href: "/dashboard/manager/members",
      icon: UsersIcon,
      requiresMess: true,
    },
    {
      label: "Deposits",
      href: "/dashboard/manager/deposits",
      icon: WalletMinimalIcon,
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
      label: "Members",
      href: "/dashboard/user/members",
      icon: UsersIcon,
      requiresMess: true,
    },
    {
      label: "Deposits",
      href: "/dashboard/user/deposits",
      icon: WalletMinimalIcon,
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
      label: "Members",
      href: "/dashboard/admin/members",
      icon: UsersIcon,
      requiresMess: true,
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

export const ROLE_NAV_META: Record<AppRole, RoleNavigationMeta> = {
  manager: {
    sidebarTitle: "Manager",
    sidebarSubtitle: "Dashboard",
    mobileTitle: "Manager Dashboard",
  },
  user: {
    sidebarTitle: "Member",
    sidebarSubtitle: "Dashboard",
    mobileTitle: "Dashboard",
  },
};

export function getVisibleNavItems(
  role: Role,
  hasMessAccess?: boolean,
): NavItem[] {
  return (NAV_CONFIG[role] ?? []).filter(
    (item) => !item.requiresMess || hasMessAccess,
  );
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }

  const hrefDepth = href.split("/").filter(Boolean).length;

  if (hrefDepth <= 2) {
    return false;
  }

  return pathname.startsWith(`${href}/`);
}
