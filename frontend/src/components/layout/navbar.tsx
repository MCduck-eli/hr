"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import MobileMenu from "./mobile-menu";
import LanguageSwitcher from "./language-switcher";
import NotificationBell from "./notification-bell";

export default function Navbar() {
    const t = useTranslations("Navbar");
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split("/")[1] || "uz";

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState("");
    const [userName, setUserName] = useState("");
    const [userInitials, setUserInitials] = useState("");
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [hasOriginalAdmin, setHasOriginalAdmin] = useState(false);

    useEffect(() => {
        setIsLoadingUser(true);
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const originalAdminUser = localStorage.getItem("originalAdminUser");

        if (originalAdminUser) {
            setHasOriginalAdmin(true);
        } else {
            setHasOriginalAdmin(false);
        }

        if (token && userStr) {
            setIsLoggedIn(true);
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role || "");
                const fName = user.employee?.firstName || user.firstName || "";
                const lName = user.employee?.lastName || user.lastName || "";
                const full = `${fName} ${lName}`.trim();
                const display = full || user.companyName || user.email?.split("@")[0] || "User";
                setUserName(display);

                if (fName && lName) {
                    setUserInitials(`${fName[0]}${lName[0]}`.toUpperCase());
                } else if (display) {
                    const parts = display.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        setUserInitials(`${parts[0][0]}${parts[1][0]}`.toUpperCase());
                    } else {
                        setUserInitials(display.slice(0, 2).toUpperCase());
                    }
                } else {
                    setUserInitials("U");
                }
            } catch (e) {
                setIsLoggedIn(false);
                setUserRole("");
                setUserName("");
                setUserInitials("");
            }
        } else {
            setIsLoggedIn(false);
            setUserRole("");
            setUserName("");
            setUserInitials("");
        }
        setIsLoadingUser(false);
    }, [pathname]);

    const handleReturnToAdmin = () => {
        const originalAdminUser = localStorage.getItem("originalAdminUser");
        if (originalAdminUser) {
            localStorage.setItem("user", originalAdminUser);
            localStorage.removeItem("originalAdminUser");
            setHasOriginalAdmin(false);
            try {
                const parsed = JSON.parse(originalAdminUser);
                const role = parsed.role || "";
                document.cookie = `user_role=${role}; path=/; max-age=86400; SameSite=Lax`;
                if (role === "DIRECTOR") {
                    router.push(`/${locale}/director/dashboard`);
                    return;
                }
                if (role === "HR_ADMIN") {
                    router.push(`/${locale}/hr/dashboard`);
                    return;
                }
                if (role === "SUPER_ADMIN") {
                    router.push(`/${locale}/dashboard`);
                    return;
                }
            } catch (e) { }
            router.push(`/${locale}/dashboard`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("originalAdminUser");
        document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax";
        setIsLoggedIn(false);
        setUserRole("");
        setHasOriginalAdmin(false);
        router.push(`/${locale}`);
    };

    const getDashboardLink = () => {
        if (userRole === "SUPER_ADMIN") {
            return `/${locale}/dashboard`;
        } else if (userRole === "DIRECTOR") {
            return `/${locale}/director/dashboard`;
        } else if (userRole === "HR_ADMIN") {
            return `/${locale}/hr/dashboard`;
        } else if (userRole === "ACCOUNTANT") {
            return `/${locale}/profile?tab=payroll`;
        } else if (userRole === "MANAGER" || userRole === "DEPARTMENT_HEAD") {
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

                {(userRole === "DIRECTOR" || userRole === "HR_ADMIN" || userRole === "ACCOUNTANT") && (
                    <div className="hidden md:flex items-center gap-8 text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-200/50 px-6 py-2 rounded-sm">
                        {userRole === "ACCOUNTANT" ? (
                            <>
                                <Link
                                    href={`/${locale}/profile`}
                                    className="hover:text-black text-black font-black transition-colors"
                                >
                                    👤 {t("myProfile") || "Profilim"}
                                </Link>
                                <Link
                                    href={`/${locale}/profile?tab=payroll`}
                                    className="hover:text-black text-black font-black transition-colors"
                                >
                                    💵 {t("payroll") || "Oylik & Moliya"}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href={`/${locale}/profile`}
                                    className="hover:text-black font-black text-black transition-colors flex items-center gap-1"
                                >
                                    <span>👤</span>
                                    <span>{t("myProfile") || "Profilim"}</span>
                                </Link>
                                <Link
                                    href={`/${locale}/hr/okr`}
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
                                    href={`/${locale}/hr/feedback360`}
                                    className="hover:text-black transition-colors"
                                >
                                    {t("feedback")}
                                </Link>
                                <Link
                                    href={`/${locale}/hr/analytics`}
                                    className="hover:text-black transition-colors"
                                >
                                    📊 {t("analytics") || "BI Analitika"}
                                </Link>
                                <Link
                                    href={`/${locale}/hr/payroll`}
                                    className="hover:text-black transition-colors"
                                >
                                    {t("payroll") || "Oylik & Moliya"}
                                </Link>
                            </>
                        )}
                    </div>
                )}

                <div className="hidden md:flex items-center gap-5">
                    <LanguageSwitcher />

                    {isLoggedIn && userRole !== "SUPER_ADMIN" && <NotificationBell />}

                    {isLoadingUser ? (
                        <div className="flex items-center gap-2 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                            <div className="w-20 h-4 bg-gray-200 rounded" />
                        </div>
                    ) : isLoggedIn && userName ? (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#f3e8ff] text-[#9327FF] flex items-center justify-center text-xs font-bold shrink-0">
                                {userInitials}
                            </div>
                            <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
                                {userName}
                            </span>
                        </div>
                    ) : null}

                    {isLoggedIn ? (
                        <div className="flex items-center gap-4">
                            {hasOriginalAdmin && (
                                <button
                                    onClick={handleReturnToAdmin}
                                    className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium rounded-xl px-4 py-2 text-xs transition-all duration-200 shadow-sm flex items-center gap-1 cursor-pointer"
                                >
                                    <span>&larr;</span> {t("returnToAdmin") || "Qaytish"}
                                </button>
                            )}
                            <Link
                                href={getDashboardLink()}
                                className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-5 py-2 text-xs transition-all duration-200 shadow-sm flex items-center gap-1.5"
                            >
                                <span>&#9654;</span> Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium rounded-xl px-4 py-2 text-xs transition-all duration-200 shadow-sm cursor-pointer"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link
                            href={`/${locale}/login`}
                            className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-5 py-2 text-xs transition-all duration-200 shadow-sm flex items-center gap-1.5"
                        >
                            <span>&#9654;</span> {t("login")}
                        </Link>
                    )}
                </div>

                <MobileMenu
                    userRole={userRole}
                    isLoggedIn={isLoggedIn}
                    userName={userName}
                    userInitials={userInitials}
                    locale={locale}
                    onLogout={handleLogout}
                    dashboardLink={getDashboardLink()}
                />
            </div>
        </nav>
    );
}
