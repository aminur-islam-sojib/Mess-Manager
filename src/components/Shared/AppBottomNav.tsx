"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppRole, getVisibleNavItems } from "@/config/nav.config";
import { MessResponseType } from "@/types/MessTypes";

type AppBottomNavProps = {
  role: AppRole;
  isMessExist?: MessResponseType;
};

export default function AppBottomNav({ role, isMessExist }: AppBottomNavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const navItems = getVisibleNavItems(role, isMessExist?.success).slice(0, 4);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 pt-2 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[1.75rem] border border-border/70 bg-card/92 p-2 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl px-2 py-2.5 text-center ${
                active
                  ? "text-primary"
                  : "text-muted-foreground transition-colors duration-200 hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-surface"
                  className="absolute inset-0 rounded-2xl bg-primary/9"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 34,
                    mass: 0.7,
                  }}
                />
              )}
              <motion.span
                animate={
                  reduceMotion
                    ? undefined
                    : active
                      ? { y: -1, scale: 1.02 }
                      : { y: 0, scale: 1 }
                }
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 28,
                  mass: 0.55,
                }}
                className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border ${
                  active
                    ? "border-primary/15 bg-primary/10"
                    : "border-transparent bg-transparent group-hover:border-border/80 group-hover:bg-accent/75"
                }`}
              >
                <Icon className="h-5 w-5" />
              </motion.span>
              <span className="relative z-10 text-[11px] font-semibold tracking-[0.01em]">
                {item.label}
              </span>
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-dot"
                  className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 38,
                    mass: 0.55,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
