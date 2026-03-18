import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

/* ----------------------------------------
   TYPES
---------------------------------------- */
type UserRole = "user" | "manager" | "admin"; // Extend as needed

/* ----------------------------------------
   ROLE → ROUTE MAP
   (single source of truth)
---------------------------------------- */
const DASHBOARD_ROUTE_BY_ROLE: Record<UserRole, string> = {
  user: "/dashboard/user",
  manager: "/dashboard/manager",
  admin: "/dashboard/admin",
};

/* ----------------------------------------
   DASHBOARD PROXY (SERVER)
---------------------------------------- */
export default async function Dashboard(): Promise<never> {
  const session = await getServerSession(authOptions);

  /**
   * Extra safety (middleware already checked,
   * but server must NEVER trust client)
   */
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const role = session.user.role as UserRole | undefined;

  /**
   * Valid role → redirect to dashboard
   */
  if (role && role in DASHBOARD_ROUTE_BY_ROLE) {
    redirect(DASHBOARD_ROUTE_BY_ROLE[role]);
  }

  /**
   * Unknown / corrupted role
   * (defensive programming)
   */
  redirect("/auth/login");
}
