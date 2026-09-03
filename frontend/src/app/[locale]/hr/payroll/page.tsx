"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import PayrollManager from "@/src/components/payroll/PayrollManager";

export default function HRPayrollPage() {
    const router = useRouter();
    const t = useTranslations("Payroll");

    return (
        <div className="max-w-[1400px] mx-auto p-6 md:p-8 flex flex-col gap-6">
            <button
                onClick={() => router.back()}
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-2"
            >
                &larr; {t("goBack")}
            </button>

            <PayrollManager />
        </div>
    );
}
