"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import GirihPattern from "@/src/components/ui/GirihPattern";

export default function Sidebar() {
    const pathname = usePathname();
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    const [companyName, setCompanyName] = useState("");
    const [pendingLeavesCount, setPendingLeavesCount] = useState<number>(0);

    useEffect(() => {
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCompanyName(user.companyName || user.employee?.companyName || "");
            } catch {
            }
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchPending = async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                if (!token) return;
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
                const res = await fetch(`${apiUrl}/leaves?status=PENDING`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data?.data || []);
                    if (isMounted) {
                        setPendingLeavesCount(list.length);
                    }
                }
            } catch {
            }
        };

        fetchPending();
        const interval = setInterval(fetchPending, 15000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const managementItems = [
        {
            href: `/${locale}/hr/dashboard`,
            label: "HR Dashboard",
            exact: true,
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/analytics`,
            label: "BI & 9-Box Analitika",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/org-chart`,
            label: "Tashkiliy Tuzilma",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/employees`,
            label: "Xodimlar",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/attendance`,
            label: "Davomat",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/leaves`,
            label: "Ta'til So'rovlari",
            badge: pendingLeavesCount > 0 ? (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {pendingLeavesCount}
                </span>
            ) : null,
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/payroll`,
            label: "Jarimalar",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    const platformItems = [
        {
            href: `/${locale}/hr/okr`,
            label: "OKR Maqsadlar",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/grading`,
            label: "Greyding Tizimi",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/disc`,
            label: "DISC Modeli",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/feedback360`,
            label: "360° Baholash",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/recruiting`,
            label: "Ishga Qabul",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/onboarding`,
            label: "Moslashuv (Onboarding)",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/offboarding`,
            label: "Offboarding",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/academy`,
            label: "HR Akademiya",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/regulations`,
            label: "Ichki Nizomlar",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
        {
            href: `/${locale}/hr/ejm`,
            label: "EJM Xaritasi",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            ),
        },
        {
            href: `/${locale}/profile`,
            label: "Mening Profilim",
            icon: (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
    ];

    const isItemActive = (href: string, exact = false) => {
        if (exact) {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <aside className="w-72 m-4 h-[calc(100vh-2rem)] bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl flex flex-col relative overflow-hidden transition-all duration-300 shrink-0">
            <GirihPattern className="opacity-[0.10]" />
            <div className="relative z-10 flex-1 overflow-y-auto flex flex-col justify-between">
            <div className="p-5 flex flex-col gap-6">
                <div className="flex items-center gap-3 px-2 pt-2">
                    <Link href={`/${locale}/hr/dashboard`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#9327FF] to-purple-800 text-white flex items-center justify-center font-black text-base shadow-sm">
                            {companyName ? companyName[0].toUpperCase() : "H"}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-900 truncate">
                                {companyName || "Kompaniya"}
                            </span>
                            <span className="text-[11px] font-semibold text-[#9327FF] uppercase tracking-wider">
                                HR Boshqaruv
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Boshqaruv
                    </span>
                    {managementItems.map((item) => {
                        const active = isItemActive(item.href, item.exact);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                    active
                                        ? "text-[#9327FF] bg-purple-50/70"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className={active ? "text-[#9327FF]" : "text-slate-400"}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </div>
                                {item.badge}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-1 pt-3 border-t border-slate-100">
                    <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Platforma Bo&apos;limlari
                    </span>
                    {platformItems.map((item) => {
                        const active = isItemActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                    active
                                        ? "text-[#9327FF] bg-purple-50/70"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                <span className={active ? "text-[#9327FF]" : "text-slate-400"}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 m-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#9327FF] flex items-center justify-center font-bold text-sm">
                    ⚡
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800">
                        HR Hub
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">
                        SaaS Enterprise v2.4
                    </span>
                </div>
            </div>
            </div>
        </aside>
    );
}
