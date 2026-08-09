import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import {
  canAccessAdminApiPath,
  canAccessClientDashboardPath,
} from "@/lib/client-area";

export default withAuth(
  function middleware(request) {
    const pathname = request.nextUrl.pathname;
    const role = request.nextauth.token?.role as string | undefined;

    if (
      (pathname.startsWith("/api/admin") || pathname === "/api/v1") &&
      !canAccessAdminApiPath(role, pathname, request.method)
    ) {
      return NextResponse.json(
        { error: "Acesso administrativo não permitido para este perfil." },
        { status: 403 },
      );
    }

    if (
      pathname.startsWith("/dashboard") &&
      !canAccessClientDashboardPath(role, pathname)
    ) {
      return new NextResponse("Acesso negado.", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*", "/api/v1"],
};
