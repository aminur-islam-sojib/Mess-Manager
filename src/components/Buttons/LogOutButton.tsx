"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import Swal from "sweetalert2";

export default function LogOutButton() {
  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You wanna logout this account!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        signOut({ callbackUrl: "/auth/login" });
        toast.success("Log Out Success!");
      }
    });
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
