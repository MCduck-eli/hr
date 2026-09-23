import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["ru", "uz", "en"];
const defaultLocale = "uz";

function getRoleFromToken(token: string): string | undefined {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return undefined;
        const payloadBase64 = parts[1];
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        const payload = JSON.parse(jsonPayload);
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            return undefined;
        }
        return payload.role;
    } catch {
        return undefined;
    }
}

function getRoleDashboardPath(locale: string, role?: string) {
    if (role === "SUPER_ADMIN") {
        return `/${locale}/dashboard`;
    } else if (role === "DIRECTOR") {
        return `/${locale}/director/dashboard`;
    } else if (role === "HR_ADMIN") {
        return `/${locale}/hr/dashboard`;
    } else if (role === "ACCOUNTANT") {
        return `/${locale}/profile?tab=payroll`;
    } else if (role === "MANAGER" || role === "DEPARTMENT_HEAD") {
        return `/${locale}/manager/okr`;
    } else if (role === "RECRUITER") {
        return `/${locale}/recruiter/vacancies`;
    }
    return `/${locale}/profile`;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;
    const userRoleCookie = request.cookies.get("user_role")?.value;

    let role: string | undefined = userRoleCookie;
    if (token) {
        const extractedRole = getRoleFromToken(token);
        if (extractedRole) {
            role = extractedRole;
        } else if (!userRoleCookie) {
            role = undefined;
        }
    } else {
        role = undefined;
    }

    const isAuthenticated = Boolean(token && role);

    const pathnameHasLocale = locales.some(
        (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
    );

    if (!pathnameHasLocale) {
        const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
        const locale = (localeCookie && locales.includes(localeCookie)) ? localeCookie : defaultLocale;
        if (pathname === "/") {
            if (isAuthenticated) {
                const targetPath = getRoleDashboardPath(locale, role);
                return NextResponse.redirect(new URL(targetPath, request.url));
            }
            return NextResponse.redirect(new URL(`/${locale}`, request.url));
        }
        const targetPath = `/${locale}${pathname}`;
        return NextResponse.redirect(new URL(targetPath, request.url));
    }

    const segments = pathname.split("/").filter(Boolean);
    const locale = segments[0] || defaultLocale;
    const routeAfterLocale = "/" + segments.slice(1).join("/");

    if (pathname === `/${locale}` || pathname === `/${locale}/`) {
        if (isAuthenticated) {
            const targetPath = getRoleDashboardPath(locale, role);
            return NextResponse.redirect(new URL(targetPath, request.url));
        }
        return NextResponse.next();
    }

    if (routeAfterLocale === "/login" || routeAfterLocale.startsWith("/login/")) {
        if (isAuthenticated) {
            const targetPath = getRoleDashboardPath(locale, role);
            return NextResponse.redirect(new URL(targetPath, request.url));
        }
        return NextResponse.next();
    }

    const isProtectedRoute = [
        "/dashboard",
        "/director",
        "/hr",
        "/profile",
        "/manager",
        "/recruiter",
        "/super-admin",
        "/superadmin",
        "/grading",
        "/disc",
        "/evaluate",
        "/regulations",
        "/academy",
    ].some((route) => routeAfterLocale.startsWith(route));

    if (isProtectedRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)",
    ],
};
