import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/options";
import { getSingleMessForUser } from "@/actions/server/Mess";
import DesktopTopBar from "@/components/Navbar/DesktopTopBar";
import NotificationProvider from "@/components/Notifications/NotificationProvider";
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
      <NotificationProvider>
        <div className="flex-1">
          {(role === "user" || role === "manager") && (
            <AppSidebar
              user={session.user}
              isMessExist={isMessExist}
              role={role}
            />
          )}

          <DesktopTopBar user={session.user} />

          <div className="p-4 pb-20 md:p-6 lg:ml-72 lg:pb-0 lg:pt-24">
            <DashboardPageTransition>{children}</DashboardPageTransition>
          </div>

          {(role === "user" || role === "manager") && (
            <AppBottomNav role={role} isMessExist={isMessExist} />
          )}
        </div>
      </NotificationProvider>
    </div>
  );
}
