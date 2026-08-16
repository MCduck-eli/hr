"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import QuickActions from "@/src/components/dashboard/quick-actions";

export default function EmployeeProfilePage() {
    const t = useTranslations("DashboardProfile");
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!userStr || !token) {
            const locale = window.location.pathname.split("/")[1] || "uz";
            router.push(`/${locale}/login`);
            return;
        }
        try {
            setCurrentUser(JSON.parse(userStr));
        } catch (e) {
            const locale = window.location.pathname.split("/")[1] || "uz";
            router.push(`/${locale}/login`);
        }
    }, [router]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");
                const API_URL = process.env.NEXT_PUBLIC_API_URL;

                const res = await fetch(`${API_URL}/employee/dashboard`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                setDashboardData(data.data || data);
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (!currentUser || loading)
        return <div className="p-8">{t("loading")}</div>;

    const firstName =
        currentUser.employee?.firstName || currentUser.email.split("@")[0];
    const roleName =
        currentUser.role === "EMPLOYEE" ? t("roleEmployee") : currentUser.role;

    const stats = [
        {
            label: t("okrProgress"),
            value: dashboardData?.okrProgress
                ? `${dashboardData.okrProgress}%`
                : "0%",
            trend: t("thisMonth"),
        },
        {
            label: t("attendance"),
            value: dashboardData?.attendanceHours
                ? `${dashboardData.attendanceHours}h`
                : "0h",
            trend: t("thisWeek"),
        },
        {
            label: t("pendingFeedbacks"),
            value: dashboardData?.pendingFeedbacks || "0",
            trend: t("dueIn3Days"),
        },
        {
            label: t("leaveBalance"),
            value: dashboardData?.leaveBalance
                ? `${dashboardData.leaveBalance} Days`
                : "0 Days",
            trend: t("annual"),
        },
    ];

    const activeCourses = dashboardData?.activeCourses || [];
    const recentActivities = dashboardData?.recentActivities || [];

    return (
        <div className="flex flex-col gap-12 py-12 px-4 md:px-8 max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-4">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-black">
                    {t("welcomeBack")} <br className="md:hidden" /> {firstName}
                </h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    {roleName} • {t("gradeMiddle")}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="border border-gray-200 bg-white p-6 flex flex-col gap-4 hover:border-black transition-colors"
                    >
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            {stat.label}
                        </span>
                        <span className="text-3xl font-black tracking-tighter">
                            {stat.value}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                            {stat.trend}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 flex flex-col gap-12">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-black">
                                {t("activeCourses") || "FAOL KURSLAR"}
                            </h2>
                            <button
                                onClick={() => {
                                    const locale =
                                        window.location.pathname.split(
                                            "/",
                                        )[1] || "uz";
                                    router.push(`/${locale}/academy`);
                                }}
                                className="text-xs font-bold text-black uppercase tracking-widest hover:underline"
                            >
                                {t("goToAcademy") || "AKADEMIYAGA O'TISH →"}
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {activeCourses.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    {t("noActiveCourses") ||
                                        "Hozircha sizga hech qanday kurs biriktirilmagan"}
                                </p>
                            ) : (
                                activeCourses.map(
                                    (course: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-200 gap-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-2 h-2 rounded-full shrink-0 ${course.isCompleted ? "bg-gray-300" : "bg-black"}`}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-black line-clamp-1">
                                                        {course.title}
                                                    </span>
                                                    <span className={`mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit ${course.type === 'ONBOARDING' || course.type === 'ONBOARDING_TASK' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        {course.type === 'ONBOARDING' || course.type === 'ONBOARDING_TASK' ? t("onboardingBadge") : t("academyBadge")}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span
                                                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${course.isCompleted ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                                                >
                                                    {course.isCompleted
                                                        ? "O'qilgan"
                                                        : "Yangi"}
                                                </span>
                                            </div>
                                        </div>
                                    ),
                                )
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                            {t("recentActivities")}
                        </h2>
                        <div className="flex flex-col gap-4">
                            {recentActivities.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    {t("noRecentActivities")}
                                </p>
                            ) : (
                                recentActivities.map(
                                    (activity: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold">
                                                    {activity.title}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {activity.description}
                                                </span>
                                            </div>
                                            <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {activity.timeAgo}
                                            </span>
                                        </div>
                                    ),
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                        {t("quickActions")}
                    </h2>
                    <QuickActions />
                </div>
            </div>
        </div>
    );
}
