"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import MobileMenu from "./mobile-menu";
import LanguageSwitcher from "./language-switcher";

export default function Navbar() {
    const t = useTranslations("Navbar");
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split("/")[1] || "en";

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (token && userStr) {
            setIsLoggedIn(true);
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role || "");
            } catch (e) {}
        }
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        router.push(`/${locale}/login`);
    };

    const getDashboardLink = () => {
        if (userRole === "SUPER_ADMIN" || userRole === "HR_ADMIN") {
            return `/${locale}/dashboard`;
        } else if (userRole === "MANAGER") {
            return `/${locale}/manager/okr`;
        } else if (userRole === "RECRUITER") {
            return `/${locale}/recruiter/vacancies`;
        }
        return `/${locale}/profile`;
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-[#f8f8f8]">
            <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-[1400px] mx-auto relative">
                <div className="flex items-center gap-2">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="black" />
                        <path
                            d="M2 17L12 22L22 17"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M2 12L12 17L22 12"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <Link
                        href={`/${locale}`}
                        className="text-xl font-bold tracking-tight text-black"
                    >
                        HR Platform
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-8 text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-200/50 px-6 py-2 rounded-sm">
                    <Link
                        href={`/${locale}/okr`}
                        className="hover:text-black transition-colors"
                    >
                        {t("okr")}
                    </Link>
                    <Link
                        href={`/${locale}/grading`}
                        className="hover:text-black transition-colors"
                    >
                        {t("grading")}
                    </Link>
                    <Link
                        href={`/${locale}/disc`}
                        className="hover:text-black transition-colors"
                    >
                        {t("disc")}
                    </Link>
                    <Link
                        href={`/${locale}/feedback`}
                        className="hover:text-black transition-colors"
                    >
                        {t("feedback")}
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <LanguageSwitcher />

                    {isLoggedIn ? (
                        <div className="flex items-center gap-4">
                            <Link
                                href={getDashboardLink()}
                                className="text-[12px] font-bold uppercase tracking-wider text-black hover:opacity-70 flex items-center gap-1"
                            >
                                <span>&#9654;</span> Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2.5 bg-red-600 text-white text-[12px] font-bold uppercase tracking-wider rounded-sm hover:bg-red-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link
                            href={`/${locale}/login`}
                            className="px-6 py-2.5 bg-[#1a1a1a] text-white text-[12px] font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors flex items-center gap-1"
                        >
                            <span>&#9654;</span> {t("login")}
                        </Link>
                    )}
                </div>

                <MobileMenu />
            </div>
        </nav>
    );
}
