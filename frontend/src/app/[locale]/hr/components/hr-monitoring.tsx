"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

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
            <div className="p-8 text-sm font-bold uppercase tracking-widest text-gray-500">
                {t("loading")}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h2 className="text-xl font-black uppercase tracking-wider text-black">
                    {t("title")}
                </h2>
            </div>

            <div className="flex flex-col gap-4">
                {monitoringData.length === 0 ? (
                    <div className="border border-gray-200 bg-gray-50 p-8 text-center flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
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
                                className="border border-gray-200 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-black transition-colors"
                            >
                                <div className="flex flex-col gap-1 min-w-[200px]">
                                    <span className="text-lg font-bold text-black uppercase tracking-wide">
                                        {employee?.firstName}{" "}
                                        {employee?.lastName}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        {employee?.department?.name ||
                                            t("noDepartment")}
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-col gap-2 max-w-xl w-full">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-black uppercase tracking-widest">
                                            {t("totalProgress")}
                                        </span>
                                        <span className="text-xs font-bold text-gray-500">
                                            {progress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${progress === 100 ? "bg-green-500" : "bg-black"}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-6 mt-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                            {t("tasks")} {completedTasks}/
                                            {totalTasks}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                            {t("courses")}{" "}
                                            {completedCoursesCount}/
                                            {totalCourses}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {progress === 100 ? (
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded bg-green-100 text-green-700">
                                            {t("completed")}
                                        </span>
                                    ) : progress > 0 ? (
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded bg-orange-100 text-orange-700">
                                            {t("inProgress")}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded bg-gray-100 text-gray-600">
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
