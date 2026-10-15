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
        <div className="flex flex-col w-full bg-white text-black relative">
            <div
                className="fixed inset-0 -z-10 pointer-events-none bg-repeat opacity-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: "240px 240px",
                }}
            />
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
