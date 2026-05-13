import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { auth } from "./lib/auth";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = ["/dashboard", "/booking"];
const adminRoutes = ["/admin"];
const superAdminRoutes = ["/super-admin"];

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Strip locale prefix for route checking
  const pathnameWithoutLocale = pathname.replace(
    /^\/(ar|en|es|tr|zh|ja)/,
    ""
  );

  // Check if route needs auth
  const isProtected = protectedRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );
  const isAdmin = adminRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );
  const isSuperAdmin = superAdminRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );

  if (isProtected || isAdmin || isSuperAdmin) {
    const session = await auth();

    if (!session) {
      const locale = pathname.split("/")[1] || "ar";
      return NextResponse.redirect(
        new URL(`/${locale}/login`, req.url)
      );
    }

    if (isAdmin && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      const locale = pathname.split("/")[1] || "ar";
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }

    if (isSuperAdmin && session.user.role !== "SUPER_ADMIN") {
      const locale = pathname.split("/")[1] || "ar";
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
