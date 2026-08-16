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
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

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

                const textData = await res.text();

                if (!res.ok) {
                    throw new Error(
                        `Xato status: ${res.status}. Backend javobi: ${textData}`,
                    );
                }

                const data = JSON.parse(textData);
                setDashboardData(data.data);
            } catch (err) {
                console.error("Dashboard fetch xatosi:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (!currentUser || loading) return <div className="p-8">Loading...</div>;

    const firstName =
        currentUser.employee?.firstName || currentUser.email.split("@")[0];
    const roleName =
        currentUser.role === "EMPLOYEE" ? "Employee" : currentUser.role;

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
                    {roleName} • Middle (Grade 2)
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
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                            <h2 className="text-lg font-bold uppercase tracking-wider">
                                {t("activeCourses")}
                            </h2>
                            <button
                                onClick={() => router.push("/academy")}
                                className="text-xs font-bold uppercase tracking-widest text-black hover:underline"
                            >
                                Akademiyaga o&apos;tish &rarr;
                            </button>
                        </div>

                        {activeCourses.length === 0 ? (
                            <div className="p-6 border border-gray-200 bg-white flex flex-col gap-4">
                                <p className="text-sm text-gray-500">
                                    Kutilyotgan kurslar yo&apos;q
                                </p>
                                <button
                                    onClick={() => router.push("/academy")}
                                    className="w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                                >
                                    Kurslarni ko&apos;rish
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeCourses.map(
                                    (course: any, index: number) => (
                                        <div
                                            key={index}
                                            className="p-5 border border-gray-200 bg-white flex flex-col gap-4"
                                        >
                                            <h3 className="text-sm font-bold text-black">
                                                {course.title}
                                            </h3>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-black h-full"
                                                    style={{
                                                        width: `${course.progress}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs font-bold text-gray-500">
                                                    {course.progress}%
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        router.push("/academy")
                                                    }
                                                    className="text-[10px] font-bold uppercase tracking-widest text-black hover:underline"
                                                >
                                                    {t("continueCourse")}
                                                </button>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-6">
                        <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                            {t("recentActivities")}
                        </h2>
                        <div className="flex flex-col gap-4">
                            {recentActivities.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    Faolliklar tarixi bo&apos;sh
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
