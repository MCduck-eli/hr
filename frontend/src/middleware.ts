import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;

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
        const locale = pathname.split("/")[1] || "uz";
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }



    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
    ],
};
