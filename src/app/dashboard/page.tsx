import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ROLE_DASHBOARD_HOME, isGlobalRole } from "@/types/auth";

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

  const role = session.user.role;

  /**
   * Valid role → redirect to dashboard
   */
  if (isGlobalRole(role)) {
    redirect(ROLE_DASHBOARD_HOME[role]);
  }

  /**
   * Unknown / corrupted role
   * (defensive programming)
   */
  redirect("/auth/login");
}
