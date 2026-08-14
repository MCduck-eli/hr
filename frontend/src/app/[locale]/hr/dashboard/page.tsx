"use client";

import { useTranslations } from "next-intl";

export default function HRAdminDashboard() {
    const t = useTranslations("HRDashboard");

    return (
        <div className="max-w-[1400px] mx-auto p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">
                {t("title")}
            </h1>
            <p className="mb-8 text-gray-500 uppercase text-xs font-bold tracking-widest">
                {t("welcome")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4">
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                        <span className="text-lg">👥</span>
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-black">
                        {t("employees")}
                    </h2>
                </div>

                <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4">
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                        <span className="text-lg">🎯</span>
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-black">
                        {t("recruiting")}
                    </h2>
                </div>

                <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4">
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                        <span className="text-lg">🚀</span>
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-black">
                        {t("onboarding")}
                    </h2>
                </div>

                <div className="bg-white p-8 border border-gray-200 hover:border-black transition-colors cursor-pointer flex flex-col gap-4">
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm">
                        <span className="text-lg">📚</span>
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-black">
                        {t("academy")}
                    </h2>
                </div>
            </div>
        </div>
    );
}
