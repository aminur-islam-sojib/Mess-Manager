"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getVisibleNavItems,
  isNavItemActive,
  type Role,
} from "@/config/nav.config";
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
  const reduceMotion = useReducedMotion();
  const navItems = getVisibleNavItems(role, isMessExist?.success);

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item.href);

        return (
          <motion.div
            key={item.href}
            initial={false}
            whileHover={reduceMotion ? undefined : { x: 4 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 28,
              mass: 0.55,
            }}
          >
            <Link
              href={item.href}
              className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 ${
                active
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/78 transition-colors duration-200 hover:text-sidebar-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-surface"
                  className="absolute inset-0 rounded-2xl border border-primary/10 bg-primary/8.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 34,
                    mass: 0.7,
                  }}
                />
              )}
              {active && (
                <motion.span
                  layoutId="sidebar-active-rail"
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary"
                  transition={{
                    type: "spring",
                    stiffness: 480,
                    damping: 36,
                    mass: 0.6,
                  }}
                />
              )}

              <span
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-200 ${
                  active
                    ? "border-primary/15 bg-primary/12 text-primary"
                    : "border-transparent bg-transparent text-sidebar-foreground/70 group-hover:border-sidebar-border group-hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>

              <span className="relative z-10 flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="truncate text-[0.95rem] font-semibold tracking-[-0.01em]">
                  {item.label}
                </span>
                <motion.span
                  animate={
                    active || reduceMotion
                      ? { opacity: active ? 1 : 0, x: 0 }
                      : { opacity: 0, x: -6 }
                  }
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                />
              </span>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}
