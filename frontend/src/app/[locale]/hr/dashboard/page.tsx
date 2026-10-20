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
        <main className="flex-1 min-w-0 p-6 md:p-10 flex flex-col gap-8 bg-slate-50/60 overflow-y-auto">
                {isLoading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        <div className="flex flex-col gap-1.5 pb-6 border-b border-slate-200/80">
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
    );
}
