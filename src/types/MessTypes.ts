import type { LucideIcon } from "lucide-react";
import { SessionUser } from "./Model";

export type MessPayloadType = {
  managerId: string;
  messName: string;
  id?: string;
  managerEmail: string;
};

export type SerializableMess = {
  _id: string;
  messName: string;
  managerId: string;
  managerEmail?: string;
  members?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type MessResponseType = {
  success?: boolean;
  message?: string;
  mess?: SerializableMess;
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

// types/MessTypes.ts
export type CreateMessPayload = {
  managerId: string;
  messName: string;
  managerEmail: string;
};
