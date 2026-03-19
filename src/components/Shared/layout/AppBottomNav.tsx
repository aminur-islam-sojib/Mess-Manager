"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppRole,
  getVisibleNavItems,
  isNavItemActive,
} from "@/config/nav.config";
import { MessResponseType } from "@/types/MessTypes";

type AppBottomNavProps = {
  role: AppRole;
  isMessExist?: MessResponseType;
};

export default function AppBottomNav({ role, isMessExist }: AppBottomNavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const navItems = getVisibleNavItems(role, isMessExist?.success).slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-2 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[2rem] border border-border/50 bg-card/80 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex flex-col items-center justify-center rounded-2xl py-2 transition-all duration-200 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* Active Background Surface */}
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-surface"
                  className="absolute inset-0 z-0 rounded-2xl bg-primary/8"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <motion.div
                animate={
                  reduceMotion ? undefined : active ? { y: -2 } : { y: 0 }
                }
                className="relative z-10 flex h-9 w-9 items-center justify-center"
              >
                <Icon
                  className={`h-5.5 w-5.5 transition-transform ${active ? "scale-110" : "scale-100"}`}
                />
              </motion.div>

              <span
                className={`relative z-10 text-[10px] font-bold uppercase tracking-wider ${
                  active ? "opacity-100" : "opacity-80"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
