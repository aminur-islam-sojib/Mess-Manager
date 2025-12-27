"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_CONFIG, Role } from "@/config/nav.config";

export default function UserBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const navItems = NAV_CONFIG[role] ?? [];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border lg:hidden z-30">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                active
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
