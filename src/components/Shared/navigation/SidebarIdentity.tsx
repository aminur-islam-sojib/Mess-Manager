"use client";

import { X, Settings, Wallet, User } from "lucide-react";
import { SessionUser } from "@/types/Model";
import { AppRole } from "@/config/nav.config";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

interface SidebarIdentityProps {
  user: SessionUser;
  role: AppRole;
  messName: string;
  subtitle: string;
  onClose?: () => void;
}

export default function SidebarIdentity({
  user,
  role,
  messName,
  onClose,
}: SidebarIdentityProps) {
  return (
    <div>
      <div className="flex flex-col p-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F6F68] text-white shadow-lg shadow-[#1F6F68]/20">
                <Wallet size={18} strokeWidth={2.5} />
              </div>
            </Link>
            <div className="flex flex-col min-w-0">
              <h2 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                {messName}
              </h2>
              <span className="text-[10px] font-bold text-[#1F6F68] uppercase tracking-widest">
                Manager System
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X size={18} className="text-zinc-400" />
            </button>
          )}
        </div>

        <div className="relative group">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/60 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-zinc-700/50 dark:bg-zinc-900/50">
            <div className="relative shrink-0">
              <div className="h-10 w-10 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#1F6F68]/5 text-[#1F6F68]">
                    <User size={18} />
                  </div>
                )}
              </div>
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1F6F68] text-[8px] font-bold text-white border-2 border-white dark:border-zinc-900">
                {role.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex flex-1 flex-col min-w-0">
              <div className="flex items-center justify-between">
                <p className="truncate text-[13px] font-bold text-zinc-800 dark:text-zinc-200">
                  {user?.name}
                </p>
                <Link
                  href={`/dashboard/${role.toLowerCase()}/settings`}
                  className="text-zinc-300 hover:text-[#1F6F68] transition-colors cursor-pointer"
                >
                  <Settings size={14} />
                </Link>
              </div>
              <p className="truncate text-[11px] font-medium text-zinc-500/80">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Separator />
    </div>
  );
}
