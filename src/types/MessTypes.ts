import type { LucideIcon } from "lucide-react";
import { SessionUser } from "./Model";

export type MessPayloadType = {
  managerId: string;
  messName: string;
  id: string;
  managerEmail: string;
};

export type MessResponseType = {
  success?: boolean;
  message?: string;
  mess?: Record<string, unknown>;
  messId?: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiresMess?: boolean;
};

export type SidebarProps = {
  user: SessionUser;
  isMessExist?: MessResponseType;
};
