import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { routing } from "./i18n/routing";
import { isStaff } from "./lib/roles";

const intl = createIntlMiddleware(routing);
const { auth } = NextAuth(authConfig);

const localeRe = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const locale = pathname.match(localeRe)?.[1] ?? routing.defaultLocale;
  const rest = pathname.replace(localeRe, "") || "/";
  const role = req.auth?.user?.role;

  const needsStaff = rest.startsWith("/admin");
  const needsLogin = needsStaff || rest.startsWith("/panel");

  if (needsLogin && !req.auth) {
    const url = new URL(`/${locale}/login`, req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (needsStaff && !isStaff(role)) {
    return NextResponse.redirect(new URL(`/${locale}/panel`, req.nextUrl));
  }

  return intl(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
