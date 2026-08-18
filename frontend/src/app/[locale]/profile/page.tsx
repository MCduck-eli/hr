"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import QuickActions from "@/src/components/dashboard/quick-actions";
import { fetchMyPendingTasks, fetchTargetReport, fetchCycles } from "@/src/services/feedback360-service";

export default function EmployeeProfilePage() {
    const t = useTranslations("DashboardProfile");
    const router = useRouter();
    const params = useParams();

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [pendingTasks, setPendingTasks] = useState<any[]>([]);
    const [feedbackReport, setFeedbackReport] = useState<any>(null);
    const [cycles, setCycles] = useState<any[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState<string>("");

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

                let targetUserId: any =
                    params?.id || params?.userId || params?.employeeId;

                if (!targetUserId && typeof window !== "undefined") {
                    const searchParams = new URLSearchParams(
                        window.location.search,
                    );
                    targetUserId =
                        searchParams.get("id") ||
                        searchParams.get("userId") ||
                        searchParams.get("employeeId");

                    if (!targetUserId) {
                        const pathSegments = window.location.pathname
                            .split("/")
                            .filter(Boolean);
                        const empIndex = pathSegments.indexOf("employees");
                        if (empIndex !== -1 && pathSegments[empIndex + 1]) {
                            targetUserId = pathSegments[empIndex + 1];
                        } else {
                            const lastSegment =
                                pathSegments[pathSegments.length - 1];
                            const ignoredWords = [
                                "profile",
                                "dashboard",
                                "hr",
                                "uz",
                                "ru",
                                "en",
                                "academy",
                                "onboarding",
                            ];
                            if (
                                lastSegment &&
                                !ignoredWords.includes(lastSegment)
                            ) {
                                targetUserId = lastSegment;
                            }
                        }
                    }
                }

                if (!targetUserId) {
                    const userStr = localStorage.getItem("user");
                    if (userStr) {
                        try {
                            const u = JSON.parse(userStr);
                            targetUserId = u.id;
                        } catch (e) { }
                    }
                }

                let fetchUrl = `${API_URL}/employee/dashboard`;
                if (targetUserId) {
                    fetchUrl += `?userId=${targetUserId}`;
                }

                const res = await fetch(fetchUrl, {
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
    }, [params]);

    useEffect(() => {
        const loadFeedbackData = async () => {
            try {
                if (!currentUser?.employee?.id) return;
                const targetUserId = dashboardData?.user?.id || currentUser.id;
                if (targetUserId === currentUser.id) {
                    const tasks = await fetchMyPendingTasks();
                    setPendingTasks(tasks || []);
                }

                const cyclesData = await fetchCycles();
                setCycles(cyclesData || []);

                let cycleId = selectedCycleId;
                if (!cycleId && cyclesData?.length > 0) {
                    cycleId = cyclesData[0].id;
                    setSelectedCycleId(cycleId);
                }

                const targetEmployeeId = dashboardData?.user?.employee?.id || currentUser.employee?.id;
                if (targetEmployeeId && cycleId) {
                    const report = await fetchTargetReport(targetEmployeeId, cycleId);
                    console.log("Fetched report:", report);
                    setFeedbackReport(report);
                }
            } catch (err) {
                console.error("Failed to load feedback data:", err);
            }
        };

        if (!loading && currentUser) {
            loadFeedbackData();
        }
    }, [loading, currentUser, dashboardData, selectedCycleId]);

    if (!currentUser || loading)
        return <div className="p-8">{t("loading")}</div>;

    const firstName =
        dashboardData?.user?.firstName ||
        currentUser.employee?.firstName ||
        currentUser.email.split("@")[0];

    const roleData = dashboardData?.user?.role || currentUser.role;
    const roleName = roleData === "EMPLOYEE" ? t("roleEmployee") : roleData;

    const overallScore = feedbackReport?.competencies?.length > 0 
        ? (feedbackReport.competencies.reduce((acc: any, curr: any) => acc + curr.averageScore, 0) / feedbackReport.competencies.length).toFixed(1)
        : null;

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
            label: "UMUMIY 360 BAHO",
            value: overallScore ? `${overallScore} / 5` : "-",
            trend: "Joriy sikl",
        },
        {
            label: t("leaveBalance"),
            value:
                (dashboardData?.leaveBalance ??
                    currentUser?.employee?.leaveBalance) !== undefined
                    ? `${dashboardData?.leaveBalance ?? currentUser?.employee?.leaveBalance} Days`
                    : "0 Days",
            trend: t("annual"),
        },
    ];

    const activeCourses = dashboardData?.activeCourses || [];
    const recentActivities = dashboardData?.recentActivities || [];

    return (
        <div className="flex flex-col gap-12 py-12 px-4 md:px-8 max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-4"
                >
                    &larr; {t("goBack") || "Orqaga"}
                </button>
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
                                    const searchParams = new URLSearchParams(window.location.search);
                                    const currentUserId = searchParams.get("userId") || searchParams.get("id");
                                    let url = `/${locale}/academy`;
                                    if (currentUserId) {
                                        url += `?userId=${currentUserId}`;
                                    }
                                    router.push(url);
                                }}
                                className="text-xs font-bold text-black uppercase tracking-widest hover:underline"
                            >
                                {t("goToAcademy") || "AKADEMIYAGA O'TISH →"}
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {activeCourses.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    {t("noActiveCourses")}
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
                                                    <span
                                                        className={`mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit ${course.type === "ONBOARDING" || course.type === "ONBOARDING_TASK" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                                                    >
                                                        {course.type ===
                                                            "ONBOARDING" ||
                                                            course.type ===
                                                            "ONBOARDING_TASK"
                                                            ? t(
                                                                "onboardingBadge",
                                                            )
                                                            : t("academyBadge")}
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
                    {pendingTasks.length > 0 && (
                        <div className="flex flex-col gap-6 mt-8">
                            <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                                {t("pendingEvaluations") || "Baholashim kerak bo'lgan xodimlar"}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingTasks.map((task) => (
                                    <div key={task.id} className="border border-gray-200 bg-white p-4 flex flex-col gap-3 hover:border-black transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-black">{task.target?.firstName} {task.target?.lastName}</span>
                                                <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">{task.target?.department?.name || "-"} • {task.target?.position?.title || "-"}</span>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 px-2 py-1 shrink-0">
                                                {task.type === "PEER" ? t("rolePeer") || "Hamkasb" :
                                                    task.type === "MANAGER" ? t("roleManager") || "Rahbar" :
                                                        task.type === "SUBORDINATE" ? t("roleSubordinate") || "Qo'l ostidagi" :
                                                            task.type === "SELF" ? t("roleSelf") || "O'zini-o'zi" : task.type}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs font-bold uppercase tracking-widest text-black flex items-center justify-between border-t border-gray-100 pt-3">
                                            <span className="line-clamp-1 truncate w-1/2">{task.cycle?.title}</span>
                                            <button
                                                className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors shrink-0"
                                                onClick={() => {
                                                    const locale = window.location.pathname.split("/")[1] || "uz";
                                                    router.push(`/${locale}/evaluate/${task.id}`);
                                                }}
                                            >
                                                {t("evaluateButton") || "Baholash"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {feedbackReport && (
                        <div className="flex flex-col gap-6 mt-8">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                <h2 className="text-lg font-bold uppercase tracking-wider">
                                    {t("myFeedbackResults") || "360 Baho natijalari"}
                                </h2>
                                {cycles.length > 0 && (
                                    <select
                                        value={selectedCycleId}
                                        onChange={(e) => setSelectedCycleId(e.target.value)}
                                        className="p-2 border border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-widest"
                                    >
                                        {cycles.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {feedbackReport.competencies?.length === 0 ? (
                                <p className="text-sm text-gray-500 font-medium">{t("noFeedbackResults") || "Hali baholanmagansiz yoki natijalar tayyor emas."}</p>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-6 border border-gray-200 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-bold uppercase tracking-widest text-gray-500">{t("totalRespondents") || "Jami baholovchilar soni"}</span>
                                            <span className="text-2xl font-black">{feedbackReport.totalRespondents}</span>
                                        </div>
                                        {feedbackReport.lastEvaluatedAt && (
                                            <div className="flex flex-col gap-1.5 sm:items-end">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Oxirgi baholangan sana</span>
                                                <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 w-fit rounded-sm shadow-sm">
                                                    {new Date(feedbackReport.lastEvaluatedAt).toLocaleDateString("uz-UZ", { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto border border-gray-200">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-gray-50">
                                                <tr className="border-b border-gray-200">
                                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">{t("competency") || "Kompetensiya"}</th>
                                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">{t("averageScore") || "O'rtacha ball"}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {feedbackReport.competencies.map((comp: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-4 py-4 text-sm font-bold text-black">{comp.competency}</td>
                                                        <td className="px-4 py-4 text-sm font-black text-black text-right">{comp.averageScore} / 5</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {feedbackReport.anonymousComments?.length > 0 && (
                                        <div className="mt-4 flex flex-col gap-3">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2">{t("anonymousComments") || "Anonim izohlar"}</h3>
                                            <div className="flex flex-col gap-2 mt-2">
                                                {feedbackReport.anonymousComments.map((comment: string, idx: number) => (
                                                    <div key={idx} className="p-4 bg-gray-50 border border-gray-200 text-sm italic text-gray-700 font-medium relative">
                                                        <span className="absolute -left-2 -top-2 text-3xl text-gray-300 font-serif">"</span>
                                                        {comment}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
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
