"use client";

import AppSidebar from "../Shared/AppSidebar";
import { SidebarProps } from "@/types/MessTypes";

export default function ManagerSidebar(props: SidebarProps) {
  return <AppSidebar {...props} role="manager" />;
}
