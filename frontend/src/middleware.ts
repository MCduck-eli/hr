import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["ru", "uz", "en"];
const defaultLocale = "ru";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;

    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (!pathnameHasLocale) {
        const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
        const locale = (localeCookie && locales.includes(localeCookie)) ? localeCookie : defaultLocale;
        const targetPath = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
        return NextResponse.redirect(new URL(targetPath, request.url));
    }

    const isProtectedRoute = [
        "/dashboard",
        "/hr",
        "/profile",
        "/manager",
        "/recruiter",
        "/super-admin",
        "/superadmin",
        "/admin",
    ].some((route) => pathname.includes(route));

    if (isProtectedRoute && !token) {
        const locale = pathname.split("/")[1] || defaultLocale;
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
    ],
};
