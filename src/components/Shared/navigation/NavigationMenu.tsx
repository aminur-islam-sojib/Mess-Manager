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
    // Reduced padding and spacing between items
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item.href);

        return (
          <motion.div
            key={item.href}
            initial={false}
            whileHover={reduceMotion ? undefined : { x: 2 }} // Subtle hover nudge
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Link
              href={item.href}
              className={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-2.5 py-2 transition-all duration-200 ${
                active
                  ? "text-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              {/* Background Highlight */}
              {active && (
                <motion.span
                  layoutId="sidebar-active-surface"
                  className="absolute inset-0 z-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <div className="relative flex items-center justify-center">
                {/* Active Rail - Now positioned immediately to the left of the icon */}
                {active && (
                  <motion.span
                    layoutId="sidebar-active-rail"
                    className="absolute -left-1 h-6 w-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}

                <span
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 ${
                    active
                      ? "text-primary"
                      : "group-hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <span className="relative z-10 flex min-w-0 flex-1 items-center justify-between">
                <span
                  className={`truncate text-sm font-medium tracking-tight ${active ? "font-semibold" : ""}`}
                >
                  {item.label}
                </span>

                {/* Small indicator dot on the right */}
                {active && (
                  <motion.span
                    layoutId="active-dot"
                    className="h-1 w-1 rounded-full bg-primary mr-1"
                  />
                )}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}
