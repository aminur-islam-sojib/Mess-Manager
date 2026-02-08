import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ----------------------------------------
   ROLE → BASE DASHBOARD ROUTE MAP
   (for /dashboard root redirect)
---------------------------------------- */
const ROLE_DASHBOARD_MAP: Record<string, string> = {
  admin: "/dashboard/admin",
  manager: "/dashboard/manager",
  user: "/dashboard/user",
};

/* ----------------------------------------
   ROLE → ALLOWED ROUTES MAP
   (allows all sub-routes under each role)
---------------------------------------- */
const ROLE_BASED_ROUTES: Record<string, string[]> = {
  admin: ["/dashboard/admin"],
  manager: ["/dashboard/manager", "/dashboard/create-mess"],
  user: ["/dashboard/user"],
};

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXT_AUTH_SECRET,
  });

  // 🔒 Not logged in
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const role = token.role as string | undefined;
  const { pathname } = req.nextUrl;

  // Debug log (remove in production)
  console.log("🔐 Middleware - Token:", { role, pathname });

  if (!role) {
    console.warn("⚠️ Middleware - No role found in token");
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // 🔄 Redirect /dashboard to role-specific dashboard
  if (pathname === "/dashboard") {
    const roleBaseDashboard = ROLE_DASHBOARD_MAP[role];
    if (roleBaseDashboard) {
      console.log(`📍 Redirecting /dashboard to ${roleBaseDashboard}`);
      return NextResponse.redirect(new URL(roleBaseDashboard, req.url));
    }
  }

  const allowedRoutes = ROLE_BASED_ROUTES[role] || [];
  const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!isAllowed) {
    console.warn(`⚠️ Middleware - Role '${role}' not allowed for ${pathname}`);
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
