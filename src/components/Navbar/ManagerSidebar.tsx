"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Receipt,
  Settings,
  Menu,
  X,
  Bell,
  Utensils,
  BarChart3,
  FileText,
} from "lucide-react";
import LogOutButton from "../Buttons/LogOutButton";
import { SessionUser } from "@/types/Model";
import UserProfile from "../Shared/UserProfile";

/* ----------------------------------------
   MANAGER NAV CONFIG (ROUTE-BASED)
---------------------------------------- */
const managerNav = [
  { label: "Overview", href: "/dashboard/manager", icon: Home },
  { label: "Members", href: "/dashboard/manager/members", icon: Users },
  { label: "Meals", href: "/dashboard/manager/meals", icon: Utensils },
  {
    label: "Expenses",
    href: "/dashboard/manager/expenses",
    icon: Receipt,
  },
  {
    label: "Reports",
    href: "/dashboard/manager/reports",
    icon: BarChart3,
  },
  {
    label: "Bills",
    href: "/dashboard/manager/bills",
    icon: FileText,
  },
  { label: "Settings", href: "/dashboard/manager/settings", icon: Settings },
];

const pendingAlerts = 3;

export default function ManagerSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

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
            <h2 className="font-semibold text-sidebar-foreground">Manager</h2>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>

        {/* Profile */}
        <UserProfile user={user} />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {managerNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

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

          <h1 className="text-lg font-semibold text-foreground">
            Manager Dashboard
          </h1>

          <button className="p-2 -mr-2 rounded-lg hover:bg-accent transition-colors relative">
            <Bell className="w-6 h-6 text-foreground" />
            {pendingAlerts > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-destructive text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {pendingAlerts}
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
                    Manager
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
            <UserProfile user={user} />

            {/* Nav */}
            <nav className="p-4 space-y-2">
              {managerNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Log Out */}
            <LogOutButton />
          </div>
        </div>
      )}
    </>
  );
}
