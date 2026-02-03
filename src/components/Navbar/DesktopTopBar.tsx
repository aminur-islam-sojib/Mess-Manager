/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Bell } from "lucide-react";
import { SessionUser } from "@/types/Model";

interface DesktopTopBarProps {
  user: SessionUser;
}

export default function DesktopTopBar({ user }: DesktopTopBarProps) {
  return (
    <header className="hidden lg:flex fixed top-0 left-72 right-0 h-16 bg-card border-b border-border z-40 px-6 items-center justify-end">
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-accent">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            {user.name?.charAt(0)}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
