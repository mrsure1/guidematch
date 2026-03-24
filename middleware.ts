import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  detectLocaleFromAcceptLanguage,
  isSupportedLocale,
} from "@/lib/i18n/config";
import { getLocaleFromPathname, localizePath, stripLocalePrefix } from "@/lib/i18n/routing";

function copyCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathLocale = getLocaleFromPathname(pathname);
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const browserLocale = detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));

  const resolvedLocale =
    pathLocale ?? (isSupportedLocale(cookieLocale) ? cookieLocale : browserLocale ?? DEFAULT_LOCALE);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-guidematch-locale", resolvedLocale);
  console.info(`[Middleware] Path: ${pathname}, Resolved Locale: ${resolvedLocale}`);
  requestHeaders.set("x-guidematch-path", stripLocalePrefix(pathname));

  const sessionResponse = await updateSession(request, requestHeaders);

  /** 로케일 리다이렉트 대상에서 제외: API·크론·fetch가 /api/... 로 직접 호출해야 함 */
  if (pathname.startsWith("/api/")) {
    const apiResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    copyCookies(sessionResponse, apiResponse);
    return apiResponse;
  }

  const redirectTarget = localizePath(resolvedLocale, `${request.nextUrl.pathname}${request.nextUrl.search}`);

  if (pathname === "/auth/callback") {
    sessionResponse.cookies.set(LOCALE_COOKIE_NAME, resolvedLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return sessionResponse;
  }

  if (pathLocale) {
    const internalPath = stripLocalePrefix(pathname);
    console.info(`[Middleware] Rewriting ${pathname} -> ${internalPath}`);
    const rewriteResponse = NextResponse.rewrite(new URL(`${internalPath}${request.nextUrl.search}`, request.url), {
      request: {
        headers: requestHeaders,
      },
    });

    copyCookies(sessionResponse, rewriteResponse);
    rewriteResponse.cookies.set(LOCALE_COOKIE_NAME, resolvedLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return rewriteResponse;
  }

  const redirectResponse = NextResponse.redirect(new URL(redirectTarget, request.url));
  copyCookies(sessionResponse, redirectResponse);
  redirectResponse.cookies.set(LOCALE_COOKIE_NAME, resolvedLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return redirectResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
