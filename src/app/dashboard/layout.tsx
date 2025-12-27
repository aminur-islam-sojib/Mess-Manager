import BottomNav from "@/components/Navbar/BottomNav";
import UserSidebar from "../../components/Navbar/UserSidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/options";
import ManagerSidebar from "@/components/Navbar/ManagerSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user.role;
  console.log(session);
  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1">
        {role && role === "user" && <UserSidebar user={session.user} />}
        {role && role === "manager" && <ManagerSidebar user={session.user} />}
        {children}

        {/* Bottom Navigation - Mobile Only */}
        <BottomNav />
      </div>
    </div>
  );
}
