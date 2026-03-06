"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/ui/confirmation-modal";

export default function LogOutButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = () => {
    setConfirmOpen(false);
    signOut({ callbackUrl: "/auth/login" });
    toast.success("Log Out Success!");
  };

  return (
    <>
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Logout from this account?"
        description="You will be signed out of the current session and redirected to the login page."
        confirmText="Logout"
        cancelText="Stay Logged In"
        variant="warning"
      />
    </>
  );
}
