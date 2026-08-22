"use client";

import Link from "next/link";
import { useState } from "react";

export default function MobileMenu({ userRole, isLoggedIn, locale }: { userRole?: string, isLoggedIn?: boolean, locale?: string }) {
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
                    {(userRole === "SUPER_ADMIN" || userRole === "HR_ADMIN") && (
                        <>
                            <Link
                                href={`/${locale || "en"}/hr/okr`}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-black"
                            >
                                OKR
                            </Link>
                            <Link
                                href={`/${locale || "en"}/grading`}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-black"
                            >
                                Grading
                            </Link>
                            <Link
                                href={`/${locale || "en"}/disc`}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-black"
                            >
                                DISC
                            </Link>
                            <Link
                                href={`/${locale || "en"}/feedback`}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-black"
                            >
                                360 Feedback
                            </Link>
                            <div className="h-px w-full bg-gray-200 my-2" />
                        </>
                    )}
                    {!isLoggedIn && (
                        <>
                            <Link
                                href={`/${locale || "en"}/login`}
                                onClick={() => setIsOpen(false)}
                                className="text-[12px] font-bold uppercase tracking-wider text-black flex items-center gap-1"
                            >
                                <span>&#9654;</span> LOGIN
                            </Link>
                            <Link
                                href={`/${locale || "en"}/signup`}
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2.5 bg-[#1a1a1a] text-white text-[12px] font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1"
                            >
                                <span>&#9654;</span> SIGN UP
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
