"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import GradingManager from "@/src/components/grading/GradingManager";

export default function GradingPage() {
    const t = useTranslations("Grading");
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || "uz";
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            router.push(`/${locale}/login`);
        } else {
            setIsAuthenticated(true);
        }
    }, [locale, router]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {t("loading")}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f8f8] text-black pb-20">
            <div className="border-b border-black bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                                <span>{t("breadcrumbParent")}</span>
                                <span>/</span>
                                <span className="text-black font-bold">{t("breadcrumbCurrent")}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                                {t("pageTitle")}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
                                {t("pageSubtitle")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <GradingManager />
            </main>
        </div>
    );
}
