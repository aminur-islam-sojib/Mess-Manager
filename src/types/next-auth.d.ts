import { DefaultSession } from "next-auth";
import { type Role } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status?: string;
      suspensionReason?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    status?: string;
    suspensionReason?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status?: string;
    suspensionReason?: string | null;
  }
}
