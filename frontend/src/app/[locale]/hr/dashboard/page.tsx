"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import HRMonitoring from "../components/hr-monitoring";
import HRAttendanceWidget from "@/src/components/hr/dashboard/hr-attendance-widget";
import EjmTemplateManager from "@/src/components/lifecycle/EjmTemplateManager";

export default function HRAdminDashboard() {
    const t = useTranslations("HRDashboard");
    const params = useParams();
    const locale = params.locale as string;

    const router = useRouter();
    const [isEjmModalOpen, setIsEjmModalOpen] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!userStr || !token) {
            router.push(`/${locale}/login`);
            return;
        }
        try {
            const user = JSON.parse(userStr);
            if (
                user.role !== "HR_ADMIN" &&
                user.role !== "SUPER_ADMIN" &&
                user.role !== "DIRECTOR"
            ) {
                router.push(`/${locale}/profile`);
            }
        } catch (e) {
            router.push(`/${locale}/login`);
        }
    }, [locale, router]);

    return (
        <div className="max-w-[1400px] mx-auto p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">
                        {t("title")}
                    </h1>
                    <p className="text-gray-500 uppercase text-xs font-bold tracking-widest">
                        {t("welcome")}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsEjmModalOpen(true)}
                        className="px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs"
                    >
                        <span>🗺️</span>
                        <span>EJM Xaritasi & Bosqichlar Rejasi</span>
                    </button>
                    <HRAttendanceWidget />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
                <Link href={`/${locale}/hr/employees`}>
                    <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4 h-full">
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                            <span className="text-lg">👥</span>
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-black">
                            {t("employees")}
                        </h2>
                    </div>
                </Link>

                <div
                    onClick={() => setIsEjmModalOpen(true)}
                    className="bg-white p-8 border-2 border-purple-300 hover:border-purple-600 transition-colors cursor-pointer flex flex-col gap-4 h-full group"
                >
                    <div className="w-10 h-10 bg-purple-50 flex items-center justify-center rounded-sm">
                        <span className="text-lg">🗺️</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">
                            Roadmap
                        </span>
                        <h2 className="text-sm font-black uppercase tracking-wider text-black group-hover:text-purple-700">
                            EJM Bosqichlar Rejasi
                        </h2>
                    </div>
                </div>

                <Link href={`/${locale}/hr/recruiting`}>
                    <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4 h-full">
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                            <span className="text-lg">🎯</span>
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-black">
                            {t("recruiting")}
                        </h2>
                    </div>
                </Link>

                <Link href={`/${locale}/hr/onboarding`}>
                    <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4 h-full">
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                            <span className="text-lg">🚀</span>
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-black">
                            {t("onboarding")}
                        </h2>
                    </div>
                </Link>

                <Link href={`/${locale}/hr/regulations`}>
                    <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4 h-full">
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                            <span className="text-lg">⚖️</span>
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-black">
                            {t("regulations")}
                        </h2>
                    </div>
                </Link>

                <Link href={`/${locale}/hr/academy`}>
                    <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4 h-full">
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                            <span className="text-lg">📚</span>
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-black">
                            {t("academy")}
                        </h2>
                    </div>
                </Link>

                <Link href={`/${locale}/hr/feedback360`}>
                    <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4 h-full">
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                            <span className="text-lg">🔄</span>
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-black">
                            {t("feedback360")}
                        </h2>
                    </div>
                </Link>

                <Link href={`/${locale}/hr/attendance`}>
                    <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4 h-full">
                        <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center rounded-sm">
                            <span className="text-lg">⏱️</span>
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-black">
                            {t("attendance")}
                        </h2>
                    </div>
                </Link>
            </div>

            {isEjmModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                            <h2 className="text-base font-black uppercase tracking-tight text-black">
                                EJM Bosqichlar Rejasi & Shablonlar Boshqaruvi
                            </h2>
                            <button
                                onClick={() => setIsEjmModalOpen(false)}
                                className="px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800"
                            >
                                Yopish ✕
                            </button>
                        </div>

                        <EjmTemplateManager />
                    </div>
                </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-200">
                <HRMonitoring />
            </div>
        </div>
    );
}
