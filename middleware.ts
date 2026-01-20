import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_BASED_ROUTES: Record<string, string[]> = {
  admin: ["/dashboard/admin"],
  manager: ["/dashboard/manager"],
  user: ["/dashboard/user"],
};

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 🔒 Not logged in
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const role = token.role as string | undefined;
  const { pathname } = req.nextUrl;

  if (!role) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const allowedRoutes = ROLE_BASED_ROUTES[role] || [];
  const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!isAllowed) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
