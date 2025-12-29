import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/options";
import UserSidebar from "@/components/Navbar/UserSidebar";
import ManagerSidebar from "@/components/Navbar/ManagerSidebar";
import UserBottomNav from "@/components/Shared/UserBottomBar";

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

  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1">
        {role === "user" && <UserSidebar user={session.user} />}
        {role === "manager" && <ManagerSidebar user={session.user} />}

        {children}

        {/* Bottom Navigation - Mobile Only */}
        {role === "user" && <UserBottomNav role={role} />}
      </div>
    </div>
  );
}
