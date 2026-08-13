"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export default function Footer() {
    const t = useTranslations("Footer");
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "en";

    return (
        <footer className="w-full border-t border-gray-200 bg-[#f8f8f8] py-12 px-4 md:px-8 relative z-10">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="flex flex-col gap-4">
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
                        <span className="text-xl font-bold tracking-tight text-black">
                            HR Platform
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium max-w-[200px]">
                        {t("description")}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {t("platform")}
                    </span>
                    <Link
                        href={`/${locale}/okr`}
                        className="text-sm font-medium text-black hover:text-gray-500 transition-colors"
                    >
                        {t("okr")}
                    </Link>
                    <Link
                        href={`/${locale}/grading`}
                        className="text-sm font-medium text-black hover:text-gray-500 transition-colors"
                    >
                        {t("grading")}
                    </Link>
                    <Link
                        href={`/${locale}/disc`}
                        className="text-sm font-medium text-black hover:text-gray-500 transition-colors"
                    >
                        {t("disc")}
                    </Link>
                </div>

                <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {t("company")}
                    </span>
                    <Link
                        href={`/${locale}/about`}
                        className="text-sm font-medium text-black hover:text-gray-500 transition-colors"
                    >
                        {t("about")}
                    </Link>
                    <Link
                        href={`/${locale}/careers`}
                        className="text-sm font-medium text-black hover:text-gray-500 transition-colors"
                    >
                        {t("careers")}
                    </Link>
                    <Link
                        href={`/${locale}/contact`}
                        className="text-sm font-medium text-black hover:text-gray-500 transition-colors"
                    >
                        {t("contact")}
                    </Link>
                </div>

                <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {t("legal")}
                    </span>
                    <Link
                        href={`/${locale}/privacy`}
                        className="text-sm font-medium text-black hover:text-gray-500 transition-colors"
                    >
                        {t("privacy")}
                    </Link>
                    <Link
                        href={`/${locale}/terms`}
                        className="text-sm font-medium text-black hover:text-gray-500 transition-colors"
                    >
                        {t("terms")}
                    </Link>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    {t("rights")}
                </p>
            </div>
        </footer>
    );
}
