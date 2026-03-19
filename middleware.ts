import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ROLE_ALLOWED_DASHBOARD_PREFIXES,
  ROLE_DASHBOARD_HOME,
  SHARED_DASHBOARD_PREFIXES,
  isGlobalRole,
  matchesRoutePrefix,
} from "@/types/auth";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Keep legacy invitation links working by routing them to the public invite entrypoint.
  if (pathname === "/dashboard/user/invite") {
    return NextResponse.redirect(new URL(`/invite${search}`, req.url));
  }

  const authSecret =
    process.env.NEXTAUTH_SECRET ?? process.env.NEXT_AUTH_SECRET;
  const authUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_AUTH_URL;
  const isHttps =
    authUrl?.startsWith("https://") ?? req.nextUrl.protocol === "https:";

  // Try default + explicit secure/non-secure cookie modes.
  // This prevents production redirects if NEXTAUTH_URL is misnamed or missing.
  const token =
    (await getToken({
      req,
      secret: authSecret,
      secureCookie: isHttps,
    })) ??
    (await getToken({
      req,
      secret: authSecret,
      secureCookie: true,
    })) ??
    (await getToken({
      req,
      secret: authSecret,
      secureCookie: false,
    }));

  // 🔒 Not logged in
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const role = token.role as string | undefined;
  const status = token.status as string | undefined;

  if (status === "suspended") {
    const allowWhileSuspended =
      pathname.startsWith("/dashboard/profile") ||
      pathname.endsWith("/notifications") ||
      pathname.includes("/notifications/");

    if (allowWhileSuspended) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/auth/suspended", req.url));
  }

  if (!isGlobalRole(role)) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // 🔄 Redirect /dashboard to role-specific dashboard
  if (pathname === "/dashboard") {
    const roleBaseDashboard = ROLE_DASHBOARD_HOME[role];
    if (roleBaseDashboard) {
      return NextResponse.redirect(new URL(roleBaseDashboard, req.url));
    }
  }

  const allowedRoutes = [
    ...ROLE_ALLOWED_DASHBOARD_PREFIXES[role],
    ...SHARED_DASHBOARD_PREFIXES,
  ];
  const isAllowed = allowedRoutes.some((route) =>
    matchesRoutePrefix(pathname, route),
  );

  if (!isAllowed) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
