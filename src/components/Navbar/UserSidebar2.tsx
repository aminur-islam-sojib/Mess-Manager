"use client";

import AppSidebar from "../Shared/AppSidebar";
import { SidebarProps } from "@/types/MessTypes";

export default function UserSidebar2(props: SidebarProps) {
  return <AppSidebar {...props} role="user" />;
}
