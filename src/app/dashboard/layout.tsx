import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/options";
import { getSingleMessForUser } from "@/actions/server/Mess";
import AppSidebar from "@/components/Shared/layout/AppSidebar";
import AppBottomNav from "@/components/Shared/layout/AppBottomNav";
import DashboardPageTransition from "@/components/Shared/DashboardPageTransition";
import DashboardNotificationTopBar from "@/components/Shared/layout/DashboardNotificationTopBar";
import {
  getRecentNotificationsForUserId,
  getUnreadNotificationCountForUserId,
} from "@/lib/notifications";
import type { NotificationSerialized } from "@/types/Notification";

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
  if (role !== "user" && role !== "manager" && role !== "admin") {
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

  let unreadNotificationCount = 0;
  let initialNotifications: NotificationSerialized[] = [];
  try {
    const [count, notifications] = await Promise.all([
      getUnreadNotificationCountForUserId(session.user.id),
      getRecentNotificationsForUserId(session.user.id, 8),
    ]);
    unreadNotificationCount = count;
    initialNotifications = notifications;
  } catch (error) {
    console.error("❌ Error fetching unread notifications:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        user={session.user}
        isMessExist={isMessExist}
        role={role}
        alertCount={unreadNotificationCount}
      />

      <div className="flex-1 lg:ml-72">
        <div className="sticky top-0 z-40 hidden border-b border-sidebar-border bg-background lg:block">
          <div className="px-6 py-4">
            <DashboardNotificationTopBar
              role={role}
              unreadCount={unreadNotificationCount}
              initialItems={initialNotifications}
            />
          </div>
        </div>

        <div className="p-4 pb-20 md:p-6 lg:pb-0 lg:pt-4">
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
