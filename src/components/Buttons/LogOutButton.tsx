"use client";
import { LogOut } from "lucide-react";

export default function LogOutButton() {
  const handleLogout = () => {
    console.log("Logging out...");
    // signOut({ callbackUrl: '/auth/login' });
  };
  return (
    <div className="p-4 border-t border-sidebar-border">
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  );
}
