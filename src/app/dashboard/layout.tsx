import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/options";
import UserSidebar from "@/components/Navbar/UserSidebar";
import ManagerSidebar from "@/components/Navbar/ManagerSidebar";
import UserBottomNav from "@/components/Shared/UserBottomBar";
import { getSingleMessForUser } from "@/actions/server/Mess";
import ManagerBottomNav from "@/components/Shared/ManagerBottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // ❌ Not logged in → kick out
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const role = session.user.role;

  // ❌ Unknown role → show 404 (safety)
  if (role !== "user" && role !== "manager") {
    notFound();
  }

  const messData = await getSingleMessForUser(session.user.id);
  const isMessExist =
    !messData || !messData.success
      ? { success: false, message: "No mess found" }
      : messData;

  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1">
        {role === "user" && (
          <UserSidebar user={session.user} isMessExist={isMessExist} />
        )}
        {role === "manager" && (
          <ManagerSidebar user={session.user} isMessExist={isMessExist} />
        )}

        <div className="lg:ml-72 pb-20 lg:pb-0">{children}</div>

        {/* Bottom Navigation - Mobile Only */}
        {role === "user" && <UserBottomNav role={role} />}
        {role === "manager" && <ManagerBottomNav role={role} />}
      </div>
    </div>
  );
}
