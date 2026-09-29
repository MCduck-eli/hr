"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import EjmTemplateManager from "@/src/components/lifecycle/EjmTemplateManager";

export default function HREjmPage() {
    const t = useTranslations("EjmManager");
    const router = useRouter();

    return (
        <div className="max-w-[1400px] mx-auto p-6 sm:p-8 flex flex-col gap-6 font-sans">
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit mb-2 cursor-pointer"
            >
                &larr; Orqaga
            </button>

            <EjmTemplateManager />
        </div>
    );
}
