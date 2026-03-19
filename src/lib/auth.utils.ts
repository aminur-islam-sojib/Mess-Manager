import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { type Role } from "@/types/auth";

export class AuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export async function requireAuthSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AuthorizationError("Unauthorized", 401);
  }

  return session;
}

export async function requireRole(allowedRoles: readonly Role[]) {
  const session = await requireAuthSession();

  if (!allowedRoles.includes(session.user.role as Role)) {
    throw new AuthorizationError("Forbidden", 403);
  }

  return session;
}

export async function requireAdminRole() {
  return requireRole(["admin"]);
}

export async function requireManagerRole() {
  return requireRole(["manager"]);
}
