import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isAuthPage) {
    if (req.nextUrl.pathname.startsWith("/login")) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
      }
      return NextResponse.next();
    }

    if (req.nextUrl.pathname.startsWith("/register")) {
      if (isAuth && userRole === "SUPER_ADMIN") {
        return NextResponse.next();
      }
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  if (!isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.nextUrl),
    );
  }

  // Role-based access control
  const pathname = req.nextUrl.pathname;

  // SUPER_ADMIN can access everything
  if (userRole === "SUPER_ADMIN") {
    return NextResponse.next();
  }

  // ADMIN1 and ADMIN2 can access all except /register and /users
  if (userRole === "ADMIN1" || userRole === "ADMIN2") {
    if (pathname.startsWith("/register") || pathname.startsWith("/users")) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // USER can only access dashboard, rekap-invest, investor-dashboard, and breakdowns
  if (userRole === "USER") {
    if (
      pathname !== "/" &&
      !pathname.startsWith("/rekap-invest") &&
      !pathname.startsWith("/investor-dashboard") &&
      !pathname.startsWith("/breakdowns")
    ) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Default deny for unknown roles
  return NextResponse.redirect(new URL("/login", req.nextUrl));
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
