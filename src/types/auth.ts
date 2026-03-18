export const GLOBAL_ROLES = ["user", "manager", "admin"] as const;
export type Role = (typeof GLOBAL_ROLES)[number];

export const APP_ROLES = ["user", "manager"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_DASHBOARD_HOME: Record<Role, string> = {
  user: "/dashboard/user",
  manager: "/dashboard/manager",
  admin: "/dashboard/admin",
};

export const ROLE_ALLOWED_DASHBOARD_PREFIXES: Record<Role, readonly string[]> =
  {
    user: ["/dashboard/user"],
    manager: ["/dashboard/manager", "/dashboard/create-mess"],
    admin: ["/dashboard/admin"],
  };

export const SHARED_DASHBOARD_PREFIXES = ["/dashboard/profile"] as const;

export function isGlobalRole(role: string | null | undefined): role is Role {
  return !!role && (GLOBAL_ROLES as readonly string[]).includes(role);
}

export function isAppRole(role: string | null | undefined): role is AppRole {
  return !!role && (APP_ROLES as readonly string[]).includes(role);
}

export function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
