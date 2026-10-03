"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import StickyHeroScroll from "../../components/home/StickyHeroScroll";
import CloudRevealSection from "../../components/home/CloudRevealSection";
import AboutUsScrollSection from "../../components/home/AboutUsScrollSection";
import FeatureDashboardScroll from "../../components/home/FeatureDashboardScroll";
import Footer from "../../components/layout/footer";

function getRoleDashboardPath(locale: string, role?: string) {
    if (role === "SUPER_ADMIN") {
        return `/${locale}/dashboard`;
    } else if (role === "DIRECTOR") {
        return `/${locale}/director/dashboard`;
    } else if (role === "HR_ADMIN") {
        return `/${locale}/hr/dashboard`;
    } else if (role === "ACCOUNTANT") {
        return `/${locale}/profile?tab=payroll`;
    } else if (role === "MANAGER" || role === "DEPARTMENT_HEAD") {
        return `/${locale}/manager/okr`;
    } else if (role === "RECRUITER") {
        return `/${locale}/recruiter/vacancies`;
    }
    return `/${locale}/profile`;
}

export default function Home() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                router.replace(getRoleDashboardPath(locale, user.role));
            } catch (e) {}
        }
    }, [locale, router]);

    return (
        <div className="flex flex-col w-full bg-[#f8f8f8] text-black">
            <StickyHeroScroll />
            <div className="relative z-20 w-full bg-[#fff0f4] rounded-t-[4rem] sm:rounded-t-[60px] md:rounded-t-[70px] shadow-[0_-15px_50px_rgba(0,0,0,0.06)]">
                <CloudRevealSection />
                <AboutUsScrollSection />
            </div>
            <FeatureDashboardScroll />
            <Footer />
        </div>
    );
}
