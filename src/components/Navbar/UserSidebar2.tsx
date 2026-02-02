"use client";

import { useState, useEffect } from "react";
import { Home, Menu, X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LogOutButton from "../Buttons/LogOutButton";
import UserProfile from "../Shared/UserProfile";
import NavigationMenu from "../Shared/NavigationMenu";
import { SidebarProps } from "@/types/MessTypes";

const pendingPayments = 1;

// --- Sub-components for DRYness ---
const SidebarHeader = ({ onClose }: { onClose?: () => void }) => (
  <div className="flex items-center justify-between p-6 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-md sticky top-0 z-10">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
        <Home className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h2 className="font-semibold text-sidebar-foreground tracking-tight">
          Member
        </h2>
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
          Dashboard
        </p>
      </div>
    </div>
    {onClose && (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
      >
        <X className="w-5 h-5 text-sidebar-foreground" />
      </motion.button>
    )}
  </div>
);

interface SidebarContentProps {
  user: SidebarProps["user"];
  isMessExist: SidebarProps["isMessExist"];
  onClose?: () => void;
}

const SidebarContent = ({
  user,
  isMessExist,
  onClose,
}: SidebarContentProps) => (
  <div className="flex flex-col h-full overflow-hidden">
    <SidebarHeader onClose={onClose} />

    {/* Scrollable Area */}
    <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2 space-y-2">
      <UserProfile user={user} />
      {user.role && (
        <NavigationMenu role={user.role} isMessExist={isMessExist} />
      )}
    </div>

    {/* Fixed Bottom Section */}
    <div className="p-4 border-t border-sidebar-border bg-sidebar/50 backdrop-blur-md">
      <LogOutButton />
    </div>
  </div>
);

export default function UserSidebar2({ user, isMessExist }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle Escape key to close sidebar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-50 bg-sidebar border-r border-sidebar-border shadow-sm">
        <SidebarContent user={user} isMessExist={isMessExist} />
      </aside>

      {/* ================= MOBILE HEADER ================= */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors text-foreground"
            aria-label="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </motion.button>

          <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Dashboard
          </h1>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2 -mr-2 rounded-lg hover:bg-accent transition-colors relative"
          >
            <Bell className="w-6 h-6 text-foreground" />
            {pendingPayments > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-background" />
            )}
          </motion.button>
        </div>
      </header>

      {/* ================= MOBILE SIDEBAR (Framer Motion) ================= */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border shadow-2xl lg:hidden"
            >
              <SidebarContent
                user={user}
                isMessExist={isMessExist}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
