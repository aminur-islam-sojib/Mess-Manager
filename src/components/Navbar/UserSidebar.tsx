"use client";

import { useState } from "react";
import { Home, Menu, X, Bell } from "lucide-react";
import LogOutButton from "../Buttons/LogOutButton";
import UserProfile from "../Shared/UserProfile";
import NavigationMenu from "../Shared/NavigationMenu";
import { SidebarProps } from "@/types/MessTypes";

const pendingPayments = 1;

export default function UserSidebar({ user, isMessExist }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-50 bg-sidebar border-r border-sidebar-border">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">Member</h2>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>

        {/* Profile */}
        <UserProfile user={user} />

        {/* Navigation */}
        {user.role && (
          <NavigationMenu role={user.role} isMessExist={isMessExist} />
        )}

        {/* Logout */}
        <LogOutButton />
      </aside>

      {/* ================= MOBILE HEADER ================= */}
      <header className="sticky top-0 z-40 bg-card border-b border-border lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </button>

          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>

          <button className="p-2 -mr-2 rounded-lg hover:bg-accent transition-colors relative">
            <Bell className="w-6 h-6 text-foreground" />
            {pendingPayments > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-destructive text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {pendingPayments}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ================= MOBILE SIDEBAR ================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sidebar-foreground">
                    Member
                  </h2>
                  <p className="text-xs text-muted-foreground">Dashboard</p>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-sidebar-accent"
              >
                <X className="w-5 h-5 text-sidebar-foreground" />
              </button>
            </div>
            {/* Navigation */}
            {user.role && (
              <NavigationMenu role={user.role} isMessExist={isMessExist} />
            )}

            {/* LogOut Button */}
            <LogOutButton />
          </div>
        </div>
      )}
    </>
  );
}
