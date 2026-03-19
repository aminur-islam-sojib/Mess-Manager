"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/types/auth";
import type { NotificationSerialized } from "@/types/Notification";
import NotificationBellMenu from "@/components/Shared/notifications/NotificationBellMenu";

type DashboardHeaderProps = {
  role: AppRole;
  unreadCount: number;
  initialItems: NotificationSerialized[];
};

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Manager",
  user: "Member",
};

const segmentToLabel = (segment: string) =>
  segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function DashboardHeader({
  role,
  unreadCount,
  initialItems,
}: DashboardHeaderProps) {
  const pathname = usePathname();

  const pageTitle = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const tail = segments[segments.length - 1] || "dashboard";

    if (tail === role || tail === "dashboard") {
      return `${ROLE_LABEL[role]} Dashboard`;
    }

    return segmentToLabel(tail);
  }, [pathname, role]);

  return (
    <header className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm sm:mb-6 sm:px-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="text-lg font-semibold text-foreground sm:text-xl">
          {pageTitle}
        </h1>
      </div>

      <NotificationBellMenu
        role={role}
        initialUnreadCount={unreadCount}
        initialItems={initialItems}
      />
    </header>
  );
}
