"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Home, Menu, X } from "lucide-react";
import LogOutButton from "../Buttons/LogOutButton";
import UserProfile from "./UserProfile";
import NavigationMenu from "./NavigationMenu";
import { SidebarProps } from "@/types/MessTypes";
import { AppRole, ROLE_NAV_META } from "@/config/nav.config";
import NotificationBell from "@/components/Notifications/NotificationBell";

type AppSidebarProps = SidebarProps & {
  role: AppRole;
};

export default function AppSidebar({
  user,
  isMessExist,
  role,
}: AppSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const roleMeta = ROLE_NAV_META[role];

  return (
    <>
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-50 lg:w-72 lg:flex-col">
        <SidebarPanel
          user={user}
          isMessExist={isMessExist}
          role={role}
          title={roleMeta.sidebarTitle}
          subtitle={roleMeta.sidebarSubtitle}
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

          <motion.div whileTap={reduceMotion ? undefined : { scale: 0.96 }}>
            <NotificationBell
              buttonClassName="rounded-xl p-2 -mr-2"
              iconClassName="h-6 w-6"
            />
          </motion.div>
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
  onClose?: () => void;
};

function SidebarPanel({
  user,
  isMessExist,
  role,
  title,
  subtitle,
  onClose,
}: SidebarPanelProps) {
  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,252,250,0.98))] shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:bg-[linear-gradient(180deg,rgba(30,36,47,0.98),rgba(23,29,39,0.98))]">
      <div className="border-b border-sidebar-border/80 px-4 pb-4 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-sidebar-foreground">
                {title}
              </h2>
              <p className="text-xs font-medium text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-xl p-2 transition-colors hover:bg-sidebar-accent"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
          )}
        </div>
      </div>
      <UserProfile user={user} />

      <NavigationMenu role={role} isMessExist={isMessExist} />

      <LogOutButton />
    </div>
  );
}
