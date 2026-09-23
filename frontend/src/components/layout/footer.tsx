"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export default function Footer() {
    const t = useTranslations("Footer");
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "uz";

    return (
        <footer className="w-full bg-slate-950 text-gray-400 pt-16 pb-12 border-t border-slate-800 relative z-20">
            <div className="max-w-[1280px] mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
                    <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
                        <Link href={`/${locale}`} className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-slate-950 shadow-md">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="black" />
                                    <path d="M2 17L12 22L22 17" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2 12L12 17L22 12" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">HR Platform</span>
                        </Link>

                        <p className="text-xs sm:text-sm text-gray-400 font-normal leading-relaxed max-w-sm">
                            {t("description")}
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                            <a
                                href="https://t.me"
                                target="_blank"
                                rel="noreferrer"
                                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all duration-200"
                                aria-label="Telegram"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                                </svg>
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noreferrer"
                                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all duration-200"
                                aria-label="LinkedIn"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                                </svg>
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noreferrer"
                                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all duration-200"
                                aria-label="Instagram"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                            {t("platform")}
                        </span>
                        <Link
                            href={`/${locale}/dashboard`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("dashboard")}
                        </Link>
                        <Link
                            href={`/${locale}/analytics`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("nineBox")}
                        </Link>
                        <Link
                            href={`/${locale}/okr`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("okr")}
                        </Link>
                        <Link
                            href={`/${locale}/profile?tab=attendance`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("attendance")}
                        </Link>
                        <Link
                            href={`/${locale}/profile?tab=payroll`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("payroll")}
                        </Link>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                            {t("resources")}
                        </span>
                        <Link
                            href={`/${locale}/blog`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("blog")}
                        </Link>
                        <Link
                            href={`/${locale}/guides`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("guides")}
                        </Link>
                        <Link
                            href={`/${locale}/api-docs`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("apiDocs")}
                        </Link>
                        <Link
                            href={`/${locale}/help`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("helpCenter")}
                        </Link>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                            {t("company")}
                        </span>
                        <Link
                            href={`/${locale}/about`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("about")}
                        </Link>
                        <Link
                            href={`/${locale}/careers`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("careers")}
                        </Link>
                        <Link
                            href={`/${locale}/contact`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("contact")}
                        </Link>
                        <Link
                            href={`/${locale}/pricing`}
                            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {t("pricing")}
                        </Link>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500 font-medium">
                        {t("rights")}
                    </p>
                    <div className="flex items-center gap-6 text-xs text-gray-400">
                        <Link
                            href={`/${locale}/privacy`}
                            className="hover:text-white transition-colors duration-200"
                        >
                            {t("privacy")}
                        </Link>
                        <Link
                            href={`/${locale}/terms`}
                            className="hover:text-white transition-colors duration-200"
                        >
                            {t("terms")}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
