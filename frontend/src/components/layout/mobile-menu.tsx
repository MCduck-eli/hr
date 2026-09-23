"use client";

import Link from "next/link";
import { useState } from "react";

export default function MobileMenu({
    userRole,
    isLoggedIn,
    userName,
    userInitials,
    locale = "uz",
    onLogout,
    dashboardLink = `/${locale}/profile`,
}: {
    userRole?: string;
    isLoggedIn?: boolean;
    userName?: string;
    userInitials?: string;
    locale?: string;
    onLogout?: () => void;
    dashboardLink?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-black"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    {isOpen ? (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    ) : (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    )}
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-16 left-0 w-full bg-[#f8f8f8] border-b border-gray-200 flex flex-col p-4 gap-4 shadow-lg z-50">
                    {(userRole === "SUPER_ADMIN" || userRole === "HR_ADMIN" || userRole === "DIRECTOR") && (
                        <>
                            <Link
                                href={`/${locale}/hr/okr`}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-black"
                            >
                                OKR
                            </Link>
                            <Link
                                href={`/${locale}/grading`}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-black"
                            >
                                Grading
                            </Link>
                            <Link
                                href={`/${locale}/disc`}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-black"
                            >
                                DISC
                            </Link>
                            <Link
                                href={`/${locale}/hr/feedback360`}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-black"
                            >
                                360 Feedback
                            </Link>
                            <div className="h-px w-full bg-gray-200 my-2" />
                        </>
                    )}
                    {isLoggedIn ? (
                        <div className="flex flex-col gap-3 pt-2 border-t border-gray-200">
                            {userName && (
                                <div className="flex items-center gap-2.5 px-1 py-1">
                                    <div className="w-8 h-8 rounded-full bg-[#f3e8ff] text-[#9327FF] flex items-center justify-center text-xs font-bold shrink-0">
                                        {userInitials}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 truncate">
                                        {userName}
                                    </span>
                                </div>
                            )}
                            <Link
                                href={dashboardLink}
                                onClick={() => setIsOpen(false)}
                                className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-5 py-2.5 text-xs transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <span>&#9654;</span> Dashboard
                            </Link>
                            {onLogout && (
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onLogout();
                                    }}
                                    className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium rounded-xl px-5 py-2.5 text-xs transition-all duration-200 shadow-sm flex items-center justify-center cursor-pointer"
                                >
                                    Logout
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                            <Link
                                href={`/${locale}/login`}
                                onClick={() => setIsOpen(false)}
                                className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-5 py-2.5 text-xs transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <span>&#9654;</span> LOGIN
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
