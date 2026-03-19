"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import LogOutButton from "../../Buttons/LogOutButton";
import { SidebarProps } from "@/types/MessTypes";
import { AppRole, ROLE_NAV_META } from "@/config/nav.config";
import NavigationMenu from "@/components/Shared/navigation/NavigationMenu";
import SidebarIdentity from "@/components/Shared/navigation/SidebarIdentity";

type AppSidebarProps = SidebarProps & {
  role: AppRole;
  alertCount?: number;
};

export default function AppSidebar({
  user,
  isMessExist,
  role,
  alertCount = 0,
}: AppSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveAlertCount, setLiveAlertCount] = useState(alertCount);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const roleMeta = ROLE_NAV_META[role];
  const messName = getMessName(isMessExist);
  const notificationsHref = `/dashboard/${role}/notifications`;

  useEffect(() => {
    setLiveAlertCount(alertCount);
  }, [alertCount]);

  useEffect(() => {
    let isMounted = true;

    const refreshUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications/unread", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          success?: boolean;
          unreadCount?: number;
        };

        if (isMounted && data.success && typeof data.unreadCount === "number") {
          setLiveAlertCount(data.unreadCount);
        }
      } catch {
        // silent fail to avoid noisy UI errors
      }
    };

    const eventSource = new EventSource("/api/notifications/stream");
    eventSource.addEventListener("message", refreshUnreadCount);
    refreshUnreadCount();

    return () => {
      isMounted = false;
      eventSource.removeEventListener("message", refreshUnreadCount);
      eventSource.close();
    };
  }, []);

  return (
    <>
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-50 lg:w-72 lg:flex-col">
        <SidebarPanel
          user={user}
          isMessExist={isMessExist}
          role={role}
          title={roleMeta.sidebarTitle}
          subtitle={roleMeta.sidebarSubtitle}
          messName={messName}
        />
      </aside>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            onClick={() => setSidebarOpen(true)}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            className="rounded-xl p-2 -ml-2 transition-colors hover:bg-accent"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6 text-foreground" />
          </motion.button>

          <h1 className="text-base font-semibold tracking-[-0.02em] text-foreground">
            {roleMeta.mobileTitle}
          </h1>

          <motion.button
            onClick={() => router.push(notificationsHref)}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            className="relative rounded-xl p-2 -mr-2 transition-colors hover:bg-accent"
            aria-label="Open notifications"
          >
            <Bell className="h-6 w-6 text-foreground" />
            {liveAlertCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-primary-foreground">
                {liveAlertCount}
              </span>
            )}
          </motion.button>
        </div>
      </header>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed inset-0 z-50 bg-slate-950/28 backdrop-blur-[2px] lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={reduceMotion ? false : { x: -32, opacity: 0.94 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { x: -20, opacity: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 34,
                mass: 0.85,
              }}
              className="fixed inset-y-0 left-0 z-50 w-78 lg:hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarPanel
                user={user}
                isMessExist={isMessExist}
                role={role}
                title={roleMeta.sidebarTitle}
                subtitle={roleMeta.sidebarSubtitle}
                messName={messName}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

type SidebarPanelProps = SidebarProps & {
  role: AppRole;
  title: string;
  subtitle: string;
  messName: string;
  onClose?: () => void;
};

function SidebarPanel({
  user,
  isMessExist,
  role,
  subtitle,

  onClose,
}: SidebarPanelProps) {
  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,252,250,0.98))] shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:bg-[linear-gradient(180deg,rgba(30,36,47,0.98),rgba(23,29,39,0.98))]">
      <SidebarIdentity
        user={user}
        role={role}
        messName={getMessName(isMessExist)}
        subtitle={subtitle}
        onClose={onClose}
      />

      <NavigationMenu role={role} isMessExist={isMessExist} />

      <LogOutButton />
    </div>
  );
}

function getMessName(isMessExist?: SidebarProps["isMessExist"]) {
  const name = isMessExist?.mess?.messName?.trim();
  if (!name) return "No Mess Assigned";
  return name;
}
