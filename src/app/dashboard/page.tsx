import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // here code changes — server-side role routing
  if (session.user.role === "manager") {
    redirect("/dashboard/manager");
  }

  if (session.user.role === "user") {
    redirect("/dashboard/user");
  }

  redirect("/auth/login");
}
