import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/options";
import { getSingleMessForUser } from "@/actions/server/Mess";
import AppSidebar from "@/components/Shared/AppSidebar";
import AppBottomNav from "@/components/Shared/AppBottomNav";
import DashboardPageTransition from "@/components/Shared/DashboardPageTransition";

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

  let messData;
  try {
    messData = await getSingleMessForUser(session.user.id);
  } catch (error) {
    console.error("❌ Error fetching mess data:", error);
    // Don't block the UI - let children handle missing mess
    messData = { success: false, message: "Failed to fetch mess data" };
  }

  const isMessExist =
    !messData || !messData.success
      ? { success: false, message: "No mess found" }
      : messData;

  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1">
        {role === "user" && (
          <AppSidebar
            user={session.user}
            isMessExist={isMessExist}
            role={role}
            alertCount={1}
          />
        )}
        {role === "manager" && (
          <AppSidebar
            user={session.user}
            isMessExist={isMessExist}
            role={role}
            alertCount={3}
          />
        )}

        <div className="p-4 pb-20 md:p-6 lg:ml-72 lg:pb-0">
          <DashboardPageTransition>{children}</DashboardPageTransition>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        {(role === "user" || role === "manager") && (
          <AppBottomNav role={role} isMessExist={isMessExist} />
        )}
      </div>
    </div>
  );
}
