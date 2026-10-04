"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import HRMonitoring from "../components/hr-monitoring";
import {
    fetchHRDashboardActivities,
    fetchHRDashboardStats,
    fetchHRMonitoringData,
    HRActivityItem,
    HRDashboardStats,
} from "@/src/services/dashboard-service";
import { fetchOkrDashboard } from "@/src/services/okr-service";
import Skeleton from "@/src/components/ui/Skeleton";

function CircularProgress({
    value,
    size = 48,
    strokeWidth = 4,
    color = "#9327FF",
}: {
    value: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div
            className="relative inline-flex items-center justify-center shrink-0"
            style={{ width: size, height: size }}
        >
            <svg
                className="w-full h-full transform -rotate-90"
                viewBox={`0 0 ${size} ${size}`}
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-100"
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                    fill="transparent"
                />
            </svg>
            <span className="absolute text-[11px] font-bold text-gray-900">
                {value}%
            </span>
        </div>
    );
}

function ActivityAvatar({ act }: { act: HRActivityItem }) {
    const [imageError, setImageError] = useState(false);
    const rawAvatar = act.avatarUrl || "";

    let avatarSrc: string | null = null;
    if (rawAvatar && !imageError) {
        if (
            rawAvatar.startsWith("http://") ||
            rawAvatar.startsWith("https://") ||
            rawAvatar.startsWith("data:")
        ) {
            avatarSrc = rawAvatar;
        } else {
            const rawApi =
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
            const baseOrigin = rawApi
                .replace(/\/api(\/v\d+)?\/?$/, "")
                .replace(/\/+$/, "");
            const cleanPath = rawAvatar.startsWith("/")
                ? rawAvatar
                : `/${rawAvatar}`;
            avatarSrc = `${baseOrigin}${cleanPath}`;
        }
    }

    return (
        <div
            className={`w-11 h-11 rounded-2xl ${
                avatarSrc ? "bg-slate-100" : `bg-gradient-to-br ${act.avatarBg}`
            } text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs overflow-hidden`}
        >
            {avatarSrc ? (
                <img
                    src={avatarSrc}
                    alt={act.employeeName || "Avatar"}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{act.avatarInitials}</span>
            )}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-8 w-full animate-pulse">
            <div className="flex flex-col gap-2 pb-6 border-b border-slate-200/80">
                <Skeleton className="h-6 w-44 rounded-lg" />
                <Skeleton className="h-8 w-64 rounded-xl" />
                <Skeleton className="h-4 w-80 rounded-md" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                    >
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-3 w-24 rounded-md" />
                            <Skeleton className="h-8 w-16 rounded-lg" />
                            <Skeleton className="h-3 w-28 rounded-md" />
                        </div>
                        <Skeleton className="w-14 h-14 rounded-2xl" />
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48 rounded-lg" />
                    <Skeleton className="h-8 w-64 rounded-xl" />
                </div>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="p-4 rounded-xl border border-gray-100 flex items-center gap-4"
                    >
                        <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
                        <div className="flex-1 flex flex-col gap-2">
                            <Skeleton className="h-4 w-40 rounded-md" />
                            <Skeleton className="h-3 w-72 rounded-md" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function HRAdminDashboard() {
    const t = useTranslations("HRDashboard");
    const params = useParams();
    const locale = (params.locale as string) || "uz";

    const router = useRouter();
    const [companyName, setCompanyName] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [activities, setActivities] = useState<HRActivityItem[]>([]);
    const [monitoringData, setMonitoringData] = useState<any[]>([]);
    const [okrObjectives, setOkrObjectives] = useState<any[]>([]);
    const [stats, setStats] = useState<HRDashboardStats>({
        totalEmployees: 0,
        totalDepartments: 0,
        onboardingPercentage: 0,
        onboardingStatusText: "Rejalar yo'q",
        attendancePercentage: 0,
        attendanceStatusText: "Qayd etilmadi",
        todayCheckedInCount: 0,
        regulationsPercentage: 0,
        regulationsStatusText: "Jarayonda",
    });

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!userStr || !token) {
            router.push(`/${locale}/login`);
            return;
        }
        try {
            const user = JSON.parse(userStr);
            setCompanyName(
                user.companyName || user.employee?.companyName || "",
            );
            const perms = Array.isArray(user.permissions)
                ? user.permissions
                : [];
            if (
                user.role !== "HR_ADMIN" &&
                user.role !== "SUPER_ADMIN" &&
                user.role !== "DIRECTOR" &&
                !perms.includes("hr_dashboard") &&
                !perms.includes("hr")
            ) {
                router.push(`/${locale}/profile`);
            }
        } catch (e) {
            router.push(`/${locale}/login`);
        }
    }, [locale, router]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                const [statsData, activitiesData, monitorData, okrData] =
                    await Promise.all([
                        fetchHRDashboardStats(controller.signal).catch(
                            () => null,
                        ),
                        fetchHRDashboardActivities(controller.signal).catch(
                            () => [],
                        ),
                        fetchHRMonitoringData(controller.signal).catch(
                            () => [],
                        ),
                        fetchOkrDashboard().catch(() => null),
                    ]);

                if (!isMounted) return;

                if (statsData) {
                    setStats(statsData);
                }

                if (Array.isArray(activitiesData)) {
                    setActivities(activitiesData);
                }

                if (Array.isArray(monitorData)) {
                    setMonitoringData(monitorData);
                }

                if (okrData?.tree) {
                    const allObjs = [
                        ...(okrData.tree.company || []),
                        ...(okrData.tree.department || []),
                        ...(okrData.tree.individual || []),
                    ];
                    setOkrObjectives(allObjs);
                }
            } catch (e) {
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadDashboardData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    const filteredActivities = activities.filter((item) => {
        if (activeCategory === "all") return true;
        return item.category === activeCategory;
    });

    const onboardingActivities = activities.filter(
        (act) => act.category === "onboarding" && act.progress !== undefined,
    );
    const dynamicOnboardingPercentage =
        stats.onboardingPercentage !== undefined &&
        stats.onboardingPercentage > 0
            ? stats.onboardingPercentage
            : onboardingActivities.length > 0
              ? Math.round(
                    onboardingActivities.reduce(
                        (acc, curr) => acc + (curr.progress || 0),
                        0,
                    ) / onboardingActivities.length,
                )
              : stats.onboardingPercentage || 0;

    const dynamicOnboardingStatusText =
        dynamicOnboardingPercentage >= 100
            ? "Yakunlandi"
            : dynamicOnboardingPercentage > 0
              ? "Jarayonda"
              : "Rejalar yo'q";

    return (
        <div className="min-h-screen bg-slate-50/60 flex flex-col md:flex-row font-sans">
            <aside className="w-full md:w-72 bg-white border-r border-slate-100 shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto flex flex-col justify-between z-20">
                <div className="p-5 flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-2 pt-2">
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
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Boshqaruv
                        </span>

                        <Link
                            href={`/${locale}/hr/analytics`}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-2.5">
                                <svg
                                    className="w-4 h-4 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                <span>BI & 9-Box Analitika</span>
                            </div>
                        </Link>

                        <Link
                            href={`/${locale}/hr/org-chart`}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-2.5">
                                <svg
                                    className="w-4 h-4 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                                <span>Tashkiliy Tuzilma</span>
                            </div>
                        </Link>

                        <Link
                            href={`/${locale}/hr/employees`}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-2.5">
                                <svg
                                    className="w-4 h-4 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                                <span>{t("employees")}</span>
                            </div>
                            {isLoading ? (
                                <Skeleton className="w-6 h-4 rounded-full" />
                            ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                    {stats.totalEmployees}
                                </span>
                            )}
                        </Link>

                        <Link
                            href={`/${locale}/hr/attendance`}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-2.5">
                                <svg
                                    className="w-4 h-4 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>{t("attendance")}</span>
                            </div>
                        </Link>

                        <Link
                            href={`/${locale}/hr/payroll`}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-2.5">
                                <svg
                                    className="w-4 h-4 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>{t("payrollTitle")}</span>
                            </div>
                        </Link>
                    </div>

                    <div className="flex flex-col gap-1 pt-3 border-t border-slate-100">
                        <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Platforma Bo'limlari
                        </span>

                        <Link
                            href={`/${locale}/hr/okr`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>OKR Maqsadlar</span>
                        </Link>

                        <Link
                            href={`/${locale}/grading`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            </svg>
                            <span>Greyding Tizimi</span>
                        </Link>

                        <Link
                            href={`/${locale}/disc`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                                />
                            </svg>
                            <span>DISC Modeli</span>
                        </Link>

                        <Link
                            href={`/${locale}/hr/feedback360`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            <span>360° Baholash</span>
                        </Link>

                        <Link
                            href={`/${locale}/hr/recruiting`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                            <span>{t("recruiting")}</span>
                        </Link>

                        <Link
                            href={`/${locale}/hr/onboarding`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                            <span>{t("onboarding")}</span>
                        </Link>

                        <Link
                            href={`/${locale}/hr/offboarding`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            <span>{t("offboardingTitle")}</span>
                        </Link>

                        <Link
                            href={`/${locale}/hr/academy`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                            </svg>
                            <span>{t("academy")}</span>
                        </Link>

                        <Link
                            href={`/${locale}/hr/regulations`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span>{t("regulations")}</span>
                        </Link>

                        <Link
                            href={`/${locale}/hr/ejm`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                />
                            </svg>
                            <span>{t("ejmRoadmap")}</span>
                        </Link>

                        <Link
                            href={`/${locale}/profile`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg
                                className="w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            <span>Mening Profilim</span>
                        </Link>
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
            </aside>

            <main className="flex-1 min-w-0 p-6 md:p-10 flex flex-col gap-8 bg-slate-50/60 overflow-y-auto">
                {isLoading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2.5">
                                    <span className="px-2.5 py-1 bg-purple-50 text-[#9327FF] text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#9327FF]"></span>
                                        HR Admin Kabineti
                                    </span>
                                    {companyName && (
                                        <span className="text-xs font-semibold text-slate-500">
                                            • {companyName}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {t("title")}
                                </h1>
                                <p className="text-slate-500 text-xs md:text-sm font-medium">
                                    {t("welcome")}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href={`/${locale}/profile`}
                                    className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-medium rounded-xl px-4 py-2.5 transition-all duration-200 shadow-sm flex items-center gap-2 text-xs md:text-sm"
                                >
                                    <span>👤</span>
                                    <span>Mening Profilim</span>
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <Link
                                href={`/${locale}/hr/employees`}
                                className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Jami Xodimlar
                                    </span>
                                    <span className="text-3xl font-extrabold text-slate-900 group-hover:text-[#9327FF] transition-colors">
                                        {stats.totalEmployees}
                                    </span>
                                    <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5">
                                        <span>●</span> Faol tarkib
                                    </span>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#9327FF] flex items-center justify-center text-xl">
                                    👥
                                </div>
                            </Link>

                            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Onboarding Rejasi
                                    </span>
                                    <span className="text-xl font-extrabold text-slate-900">
                                        {dynamicOnboardingStatusText}
                                    </span>
                                    <span className="text-[11px] font-medium text-purple-600 mt-0.5">
                                        Adaptatsiya indeksi
                                    </span>
                                </div>
                                <CircularProgress
                                    value={dynamicOnboardingPercentage}
                                    size={56}
                                    strokeWidth={5}
                                    color="#9327FF"
                                />
                            </div>

                            <Link
                                href={`/${locale}/hr/regulations`}
                                className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Ichki Nizomlar
                                    </span>
                                    <span className="text-xl font-extrabold text-slate-900 group-hover:text-[#9327FF] transition-colors">
                                        {stats.regulationsStatusText ||
                                            (stats.regulationsPercentage &&
                                            stats.regulationsPercentage >= 100
                                                ? "To'liq tanishildi"
                                                : "Jarayonda")}
                                    </span>
                                    <span className="text-[11px] font-medium text-purple-600 mt-0.5">
                                        Tanishuv indeksi
                                    </span>
                                </div>
                                <CircularProgress
                                    value={stats.regulationsPercentage || 0}
                                    size={56}
                                    strokeWidth={5}
                                    color="#9327FF"
                                />
                            </Link>

                            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Bugungi Davomat
                                    </span>
                                    <span className="text-xl font-extrabold text-slate-900">
                                        {stats.attendanceStatusText}
                                    </span>
                                    <span className="text-[11px] font-medium text-emerald-600 mt-0.5">
                                        {stats.todayCheckedInCount > 0
                                            ? `${stats.todayCheckedInCount} nafar kelgan`
                                            : "Keldi-ketdi normasi"}
                                    </span>
                                </div>
                                <CircularProgress
                                    value={stats.attendancePercentage || 0}
                                    size={56}
                                    strokeWidth={5}
                                    color="#10b981"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#9327FF]"></span>
                                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                            Faol OKR Maqsadlar va Progress
                                        </h2>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Xodimlar va bo'limlar bo'yicha belgilangan maqsadlarning bajarilish ko'rsatkichlari
                                    </p>
                                </div>
                                <Link
                                    href={`/${locale}/hr/okr`}
                                    className="text-xs font-semibold text-[#9327FF] hover:text-purple-700 transition-colors flex items-center gap-1 self-start sm:self-auto"
                                >
                                    <span>Barcha OKR'lar</span>
                                    <span>→</span>
                                </Link>
                            </div>

                            {(() => {
                                const now = Date.now();
                                const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                                const activeOkrList = okrObjectives.filter((obj: any) => {
                                    const progress = Math.min(100, Math.max(0, Math.round(obj.progress || 0)));
                                    if (progress < 100) return true;
                                    const dateStr = obj.completedAt || obj.updatedAt || obj.createdAt;
                                    if (!dateStr) return true;
                                    const diff = now - new Date(dateStr).getTime();
                                    return diff <= threeDaysMs;
                                });

                                if (activeOkrList.length === 0) {
                                    return (
                                        <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                                            <span className="text-2xl">🎯</span>
                                            <p className="text-xs font-medium">Hozircha faol OKR maqsadlar mavjud emas</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeOkrList.map((obj: any) => {
                                            const progress = Math.min(100, Math.max(0, Math.round(obj.progress || 0)));
                                            const isCompleted = progress >= 100;
                                        const assigneeName = obj.level === "INDIVIDUAL" && obj.employee
                                            ? `${obj.employee.firstName} ${obj.employee.lastName}`
                                            : obj.level === "DEPARTMENT" && obj.department
                                            ? `${obj.department.name} bo'limi`
                                            : "Butun kompaniya";

                                        const levelBadge = obj.level === "INDIVIDUAL"
                                            ? { label: "Shaxsiy", bg: "bg-purple-50 text-[#9327FF] border-purple-100" }
                                            : obj.level === "DEPARTMENT"
                                            ? { label: "Bo'lim", bg: "bg-blue-50 text-blue-700 border-blue-100" }
                                            : { label: "Kompaniya", bg: "bg-amber-50 text-amber-700 border-amber-100" };

                                        return (
                                            <div
                                                key={obj.id}
                                                className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-4 hover:shadow-xs transition-all"
                                            >
                                                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${levelBadge.bg}`}>
                                                            {levelBadge.label}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2" title={obj.title}>
                                                        {obj.title}
                                                    </h3>

                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
                                                        <span>👤</span>
                                                        <span className="truncate">{assigneeName}</span>
                                                    </div>
                                                </div>

                                                <div className="shrink-0">
                                                    <CircularProgress
                                                        value={progress}
                                                        size={48}
                                                        strokeWidth={4}
                                                        color={isCompleted ? "#10b981" : "#9327FF"}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                );
                            })()}
                        </div>

                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#9327FF] animate-pulse"></span>
                                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                            So'nggi Faollik va Bildirishnomalar
                                        </h2>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Xodimlarning kunlik davomati,
                                        topshiriqlari va tashkiliy so'rovlari
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 self-start sm:self-auto overflow-x-auto max-w-full">
                                    <button
                                        onClick={() => setActiveCategory("all")}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                            activeCategory === "all"
                                                ? "bg-white text-slate-900 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Barchasi ({activities.length})
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveCategory("delay")
                                        }
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                            activeCategory === "delay"
                                                ? "bg-white text-slate-900 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Kechikishlar (
                                        {
                                            activities.filter(
                                                (a) => a.category === "delay",
                                            ).length
                                        }
                                        )
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveCategory("onboarding")
                                        }
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                            activeCategory === "onboarding"
                                                ? "bg-white text-slate-900 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Onboarding (
                                        {
                                            activities.filter(
                                                (a) =>
                                                    a.category === "onboarding",
                                            ).length
                                        }
                                        )
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveCategory("leave")
                                        }
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                            activeCategory === "leave"
                                                ? "bg-white text-slate-900 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Ta'tillar (
                                        {
                                            activities.filter(
                                                (a) => a.category === "leave",
                                            ).length
                                        }
                                        )
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveCategory("evaluation")
                                        }
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                            activeCategory === "evaluation"
                                                ? "bg-white text-slate-900 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Baholash & OKR (
                                        {
                                            activities.filter(
                                                (a) =>
                                                    a.category === "evaluation",
                                            ).length
                                        }
                                        )
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3.5">
                                {filteredActivities.map((act) => (
                                    <div
                                        key={act.id}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-start md:items-center gap-4 min-w-0">
                                            <ActivityAvatar act={act} />

                                            <div className="flex flex-col min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {act.employeeName}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        •
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">
                                                        {act.department}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        •
                                                    </span>
                                                    <span className="text-[11px] font-medium text-slate-400">
                                                        {act.timeAgo}
                                                    </span>
                                                </div>

                                                <p className="text-xs md:text-sm text-slate-700 font-medium mt-1">
                                                    {act.eventText}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                                            {act.progress !== undefined && (
                                                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            {act.progressLabel ||
                                                                "Progress"}
                                                        </span>
                                                        <span className="text-xs font-extrabold text-slate-800">
                                                            {act.progress}%
                                                        </span>
                                                    </div>
                                                    <CircularProgress
                                                        value={act.progress}
                                                        size={38}
                                                        strokeWidth={3.5}
                                                        color={
                                                            act.progressColor ||
                                                            "#9327FF"
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <span
                                                className={`px-3 py-1 rounded-xl text-xs font-bold tracking-wide ${act.badgeClass}`}
                                            >
                                                {act.badgeText}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {filteredActivities.length === 0 && (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center flex flex-col items-center justify-center gap-2">
                                        <span className="text-3xl">📭</span>
                                        <h3 className="text-sm font-bold text-slate-800">
                                            Hozircha yangi bildirishnomalar yo'q
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Tanlangan toifada hozircha yangi
                                            faollik yoki hodisalar mavjud emas
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-200/80">
                            <HRMonitoring
                                monitoringData={monitoringData}
                                loading={isLoading}
                            />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
