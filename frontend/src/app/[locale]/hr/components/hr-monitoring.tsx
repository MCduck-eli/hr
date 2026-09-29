"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

function CircularProgress({ value, size = 52, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    const color = value === 100 ? "#10b981" : value > 0 ? "#9327FF" : "#9ca3af";

    return (
        <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
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
            <span className="absolute text-[11px] font-bold text-gray-900">{value}%</span>
        </div>
    );
}

export default function HRMonitoring() {
    const [monitoringData, setMonitoringData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const userStr = localStorage.getItem("user");

                let currentUserEmpId = null;
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        currentUserEmpId = user.employee?.id || user.employeeId;
                    } catch (e) {}
                }

                const res = await fetch(`${API_URL}/onboarding/monitoring`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();

                if (res.ok) {
                    let list = data.data || [];

                    list = list.filter(
                        (record: any) =>
                            record.employee?.user?.role !== "SUPER_ADMIN" &&
                            record.employee?.user?.role !== "DIRECTOR" &&
                            record.employee?.user?.role !== "HR_ADMIN" &&
                            record.employeeId !== currentUserEmpId,
                    );

                    setMonitoringData(list);
                }
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const t = useTranslations("HRMonitoring");

    if (loading) {
        return (
            <div className="p-8 text-xs font-bold uppercase tracking-wider text-gray-400">
                {t("loading")}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">
                        {t("title")}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                        Xodimlarning onboarding va o'quv jarayonlari monitoringi
                    </p>
                </div>
                <span className="text-xs font-semibold px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-xs">
                    {monitoringData.length} ta xodim
                </span>
            </div>

            <div className="flex flex-col gap-4">
                {monitoringData.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {t("noCourses")}
                        </span>
                    </div>
                ) : (
                    monitoringData.map((record: any, idx: number) => {
                        const employee = record.employee;
                        const tasks = record.tasks || [];
                        const onboardingCourses = record.courses || [];
                        const academyCourses = employee?.courseProgresses || [];

                        const totalTasks = tasks.length;
                        const completedTasks = tasks.filter(
                            (t: any) => t.status === "COMPLETED",
                        ).length;

                        const allCourses = [
                            ...onboardingCourses,
                            ...academyCourses,
                        ];
                        const totalCourses = allCourses.length;

                        const completedCoursesCount = allCourses.filter(
                            (c: any) => c.isCompleted,
                        ).length;

                        const totalCourseProgress = allCourses.reduce(
                            (acc: number, c: any) =>
                                acc +
                                (c.isCompleted ? 100 : c.progressPercent || 0),
                            0,
                        );

                        const maxPossibleScore =
                            totalTasks * 100 + totalCourses * 100;
                        const currentScore =
                            completedTasks * 100 + totalCourseProgress;

                        const progress =
                            maxPossibleScore === 0
                                ? 0
                                : Math.round(
                                      (currentScore / maxPossibleScore) * 100,
                                  );

                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-4 min-w-[220px]">
                                    <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#9327FF] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                        {employee?.firstName?.[0] || "U"}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                            {employee?.firstName}{" "}
                                            {employee?.lastName}
                                        </span>
                                        <span className="text-xs font-medium text-gray-500">
                                            {employee?.department?.name ||
                                                t("noDepartment")}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col gap-2 max-w-xl w-full">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            {t("totalProgress")}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900">
                                            {progress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-emerald-500" : "bg-[#9327FF]"}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-5 mt-1">
                                        <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            {t("tasks")}: {completedTasks}/{totalTasks}
                                        </span>
                                        <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                                            {t("courses")}: {completedCoursesCount}/{totalCourses}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                                    <CircularProgress value={progress} size={48} strokeWidth={4} />

                                    {progress === 100 ? (
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {t("completed")}
                                        </span>
                                    ) : progress > 0 ? (
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                                            {t("inProgress")}
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-xl bg-gray-100 text-gray-600">
                                            {t("notStarted")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
