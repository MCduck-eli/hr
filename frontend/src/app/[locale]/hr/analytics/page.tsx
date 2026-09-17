"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ExecutiveAnalyticsDashboard from "@/src/components/analytics/ExecutiveAnalyticsDashboard";

export default function HRExecutiveAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "uz";

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token || !userStr) {
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
        <div className="max-w-[1400px] mx-auto p-6 md:p-8 flex flex-col gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider print:hidden">
                <Link href={`/${locale}/hr/dashboard`} className="hover:text-black transition-colors">
                    HR Dashboard
                </Link>
                <span>/</span>
                <span className="text-black">Executive BI Analytics</span>
            </div>

            <ExecutiveAnalyticsDashboard />
        </div>
    );
}
