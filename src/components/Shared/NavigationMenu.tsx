"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_CONFIG, type Role } from "@/config/nav.config";
import { MessResponseType } from "@/types/MessTypes";

type NavigationMenuProps = {
  role: Role;
  isMessExist?: MessResponseType;
  createHref?: string;
};

export default function NavigationMenu({
  role,
  isMessExist,
}: NavigationMenuProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  const navItems = NAV_CONFIG[role];
  const canAccessMess = isMessExist?.success;

  return (
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
      {navItems
        .filter((item) => !item.requiresMess || canAccessMess)
        .map((item) => {
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
  );
}
