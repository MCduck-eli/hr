"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import FeedbackAssignmentManager from "@/src/components/hr/feedback360/FeedbackAssignmentManager";

export default function HRFeedback360Page() {
    const t = useTranslations("Feedback360");
    const router = useRouter();

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => router.back()} 
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-4"
                >
                    &larr; {t("goBack") || "Orqaga"}
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-black uppercase">
                    {t("pageTitle")}
                </h1>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                    {t("pageSubtitle")}
                </p>
            </div>

            <FeedbackAssignmentManager />
        </div>
    );
}
