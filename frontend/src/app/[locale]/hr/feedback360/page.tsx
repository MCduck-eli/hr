"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import FeedbackAssignmentManager from "@/src/components/hr/feedback360/FeedbackAssignmentManager";

export default function HRFeedback360Page() {
    const t = useTranslations("Feedback360");
    const router = useRouter();

    return (
        <div className="max-w-[1400px] mx-auto p-6 sm:p-8 flex flex-col gap-6 font-sans">
            <div className="flex flex-col gap-1.5">
                <button 
                    onClick={() => router.back()} 
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-violet-600 transition-colors w-fit mb-2 cursor-pointer"
                >
                    &larr; {t("goBack") || "Orqaga"}
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 uppercase">
                    {t("pageTitle")}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {t("pageSubtitle")}
                </p>
            </div>

            <FeedbackAssignmentManager />
        </div>
    );
}
