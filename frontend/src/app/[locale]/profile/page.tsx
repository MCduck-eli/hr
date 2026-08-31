"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import QuickActions from "@/src/components/dashboard/quick-actions";
import CareerPathRequirements from "@/src/components/profile/CareerPathRequirements";
import { fetchMyPendingTasks, fetchTargetReport, fetchCycles } from "@/src/services/feedback360-service";
import { checkInKeyResult } from "@/src/services/okr-service";

export default function EmployeeProfilePage() {
    const t = useTranslations("DashboardProfile");
    const router = useRouter();
    const params = useParams();

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [checkInKr, setCheckInKr] = useState<any>(null);
    const [checkInValue, setCheckInValue] = useState<number>(0);
    const [checkInComment, setCheckInComment] = useState("");
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

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
    }, [params, refreshKey]);

    useEffect(() => {
        const loadFeedbackData = async () => {
            try {
                const targetEmployeeId = dashboardData?.user?.employee?.id || currentUser?.employee?.id;
                const targetUserId = dashboardData?.user?.id || currentUser?.id;

                if (targetUserId) {
                    try {
                        const tasks = await fetchMyPendingTasks(targetUserId);
                        setPendingTasks(tasks || []);
                    } catch (e) {}
                }

                try {
                    const cyclesData = await fetchCycles();
                    setCycles(cyclesData || []);

                    let cycleId = selectedCycleId;
                    if (!cycleId && cyclesData?.length > 0) {
                        cycleId = cyclesData[0].id;
                        setSelectedCycleId(cycleId);
                    }

                    if (targetEmployeeId) {
                        const report = await fetchTargetReport(targetEmployeeId, cycleId || undefined);
                        setFeedbackReport(report);
                    }
                } catch (e) {}
            } catch (err) {
            }
        };

        if (!loading && (dashboardData || currentUser)) {
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

    const grade = dashboardData?.grade || dashboardData?.user?.employee?.grade || null;
    const positionTitle = dashboardData?.position || dashboardData?.user?.employee?.position || null;
    const departmentName = dashboardData?.user?.employee?.department || null;
    const salary = dashboardData?.salary || dashboardData?.user?.employee?.salary || null;
    const discAssessment = dashboardData?.discAssessment || null;

    const overallScore = feedbackReport?.competencies?.length > 0 
        ? (feedbackReport.competencies.reduce((acc: any, curr: any) => acc + curr.averageScore, 0) / feedbackReport.competencies.length).toFixed(1)
        : null;

    const stats = [
        {
            label: t("okrProgress"),
            value: dashboardData?.okrProgress
                ? `${dashboardData.okrProgress}%`
                : "0%",
            trend: dashboardData?.minExpectedProgress !== undefined 
                ? `Kamida ${dashboardData.minExpectedProgress}% kutilmoqda` 
                : "Belgilanmagan",
        },
        {
            label: "360 BAHOLASH BALLI",
            value: (overallScore !== null && overallScore !== undefined)
                ? `${overallScore} / 5.0`
                : (dashboardData?.feedback360Score !== null && dashboardData?.feedback360Score !== undefined
                    ? `${dashboardData.feedback360Score} / 5.0`
                    : "0.0 / 5.0"),
            trend: (overallScore || dashboardData?.feedback360Score) ? "Hamkasblar bahosi" : "Hali baholanmagan",
        },
        {
            label: t("attendance"),
            value: dashboardData?.attendanceHours
                ? `${dashboardData.attendanceHours}h`
                : "0h",
            trend: t("thisWeek"),
        },
        {
            label: "JORIY GREYD VA MAOSH",
            value: grade ? `Level ${grade.level} • ${grade.code}` : "Greydsiz",
            trend: salary ? `${Number(salary).toLocaleString()} UZS` : (grade ? `${grade.minSalary.toLocaleString()} - ${grade.maxSalary.toLocaleString()} UZS` : "Belgilanmagan"),
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
    const okrs = dashboardData?.okrs || [];

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkInKr) return;
        setIsCheckingIn(true);
        try {
            const formData = new FormData();
            if (checkInComment) formData.append("comment", checkInComment);
            if (checkInValue && typeof checkInValue !== "number") {
                formData.append("proofImage", checkInValue as any);
            }

            await checkInKeyResult(checkInKr.id, formData);
            setCheckInKr(null);
            setCheckInValue(0);
            setCheckInComment("");
            setRefreshKey(prev => prev + 1);
        } catch (err: any) {
            alert(err.message || "Failed to check in");
        } finally {
            setIsCheckingIn(false);
        }
    };

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
                <div className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                    <span>{roleName}</span>
                    {departmentName && (
                        <>
                            <span>•</span>
                            <span className="text-gray-700">{departmentName}</span>
                        </>
                    )}
                    {positionTitle && (
                        <>
                            <span>•</span>
                            <span className="text-black font-extrabold">{positionTitle}</span>
                        </>
                    )}
                    <span>•</span>
                    <span className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border ${
                        grade
                            ? "bg-black text-white border-black"
                            : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}>
                        {grade ? `${grade.title} (Level ${grade.level})` : "DARAJA BELGILANMAGAN"}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
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
                    <CareerPathRequirements
                        careerPath={dashboardData?.careerPath || null}
                        employeeId={dashboardData?.user?.employee?.id || currentUser?.employee?.id}
                        employeeName={`${firstName} ${dashboardData?.user?.lastName || ""}`}
                        onRefresh={() => setRefreshKey((k) => k + 1)}
                    />

                    <div className="flex flex-col gap-6">
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

                        {!feedbackReport || !feedbackReport.competencies || feedbackReport.competencies.length === 0 ? (
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
                            Mening maqsadlarim (OKR)
                        </h2>
                        <div className="flex flex-col gap-4">
                            {okrs.length === 0 ? (
                                <p className="text-sm text-gray-500">Joriy tsiklda OKR lar mavjud emas.</p>
                            ) : (
                                okrs.map((okr: any) => (
                                    <div key={okr.id} className="border border-gray-200 bg-white p-6 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-lg font-bold">{okr.title}</h3>
                                                {okr.description && <p className="text-sm text-gray-500">{okr.description}</p>}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-2xl font-bold tracking-tighter">{Math.round(okr.progress)}%</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Umumiy</span>
                                            </div>
                                        </div>
                                        {okr.keyResults?.length > 0 && (
                                            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
                                                {okr.keyResults.map((kr: any) => (
                                                    <div key={kr.id} className="flex flex-col gap-2 text-sm relative group">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-gray-700">{kr.title}</span>
                                                            <div className="flex items-center gap-4 w-1/3">
                                                                <div className="flex-1 h-1.5 bg-gray-200 overflow-hidden">
                                                                    <div className="h-full bg-black transition-all" style={{ width: `${kr.progress}%` }} />
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase tracking-widest w-20 text-right">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                                                                {kr.checkIns?.some((ci: any) => ci.status === 'PENDING') ? (
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 shrink-0">
                                                                        Kutilmoqda
                                                                    </span>
                                                                ) : kr.progress < 100 ? (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setCheckInKr(kr);
                                                                            setCheckInValue(kr.currentValue);
                                                                            setCheckInComment("");
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 shrink-0"
                                                                    >
                                                                        YANGILASH
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 shrink-0">
                                                                        Tasdiqlangan
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {checkInKr?.id === kr.id && (
                                                            <form onSubmit={handleCheckIn} className="mt-2 p-4 bg-gray-50 border border-gray-200 flex flex-col gap-3 relative animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Progressni yangilash</span>
                                                                    <button type="button" onClick={() => setCheckInKr(null)} className="text-gray-400 hover:text-black">
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex-[2] flex flex-col gap-1">
                                                                        <label className="text-[10px] font-bold uppercase text-gray-400">Natija rasmi (Ixtiyoriy)</label>
                                                                        <input 
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => {
                                                                                if (e.target.files && e.target.files[0]) {
                                                                                    setCheckInValue(e.target.files[0] as any);
                                                                                }
                                                                            }}
                                                                            className="border border-gray-200 p-1.5 text-sm focus:border-black outline-none w-full bg-white file:mr-4 file:py-1 file:px-3 file:border-0 file:text-xs file:font-bold file:uppercase file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-[3] flex flex-col gap-1">
                                                                        <label className="text-[10px] font-bold uppercase text-gray-400">Izoh (ixtiyoriy)</label>
                                                                        <input 
                                                                            type="text" 
                                                                            value={checkInComment}
                                                                            onChange={(e) => setCheckInComment(e.target.value)}
                                                                            className="border border-gray-200 p-2 text-sm focus:border-black outline-none w-full"
                                                                            placeholder="Nima ish qilindi?"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-end pb-1">
                                                                        <button 
                                                                            type="submit" 
                                                                            disabled={isCheckingIn}
                                                                            className="bg-black text-white px-4 py-2 h-[38px] text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50"
                                                                        >
                                                                            {isCheckingIn ? "..." : "Bajarildi"}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </form>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
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
                </div>

                <div className="flex flex-col gap-6">
                    {grade && (
                        <div className="border border-black bg-white p-5 flex flex-col gap-3 shadow-xs">
                            <div className="flex items-center justify-between border-b border-black pb-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                                    Greyd va Daraja
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-black text-white">
                                    Level {grade.level}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="text-base font-black text-black">
                                    {grade.title}
                                </div>
                                <div className="text-xs font-mono text-gray-500 font-semibold">
                                    Kodi: {grade.code}
                                </div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-3 space-y-1 text-xs">
                                <div className="text-gray-500 font-bold uppercase text-[10px]">
                                    Maosh Diapazoni:
                                </div>
                                <div className="font-bold text-black text-sm">
                                    {grade.minSalary.toLocaleString()} - {grade.maxSalary.toLocaleString()} UZS
                                </div>
                                {salary && (
                                    <div className="text-emerald-700 font-bold pt-1 border-t border-gray-200 text-xs">
                                        Belgilangan oylik: {salary.toLocaleString()} UZS
                                    </div>
                                )}
                            </div>
                            {grade.requirements && (
                                <div className="text-xs text-gray-600">
                                    <span className="font-bold text-black uppercase text-[10px] block mb-0.5">
                                        Talablar:
                                    </span>
                                    <p className="line-clamp-3 text-gray-600 bg-gray-50 p-2 border border-gray-100">
                                        {grade.requirements}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {discAssessment ? (
                        <div className="border border-black bg-white p-5 flex flex-col gap-3 shadow-xs">
                            <div className="flex items-center justify-between border-b border-black pb-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                                    DISC Shaxsiyat Turi
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                    discAssessment.primaryType === "D" ? "bg-red-600 text-white" :
                                    discAssessment.primaryType === "I" ? "bg-amber-500 text-white" :
                                    discAssessment.primaryType === "S" ? "bg-emerald-600 text-white" :
                                    "bg-blue-600 text-white"
                                }`}>
                                    Tip: {discAssessment.primaryType} {discAssessment.secondaryType ? `+ ${discAssessment.secondaryType}` : ""}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="text-base font-black text-black">
                                    {discAssessment.primaryType === "D" ? "Dominance (Yetakchi / Natija)" :
                                     discAssessment.primaryType === "I" ? "Influence (Muloqotmand / Ilhom)" :
                                     discAssessment.primaryType === "S" ? "Steadiness (Barqaror / Hamjihat)" :
                                     "Conscientiousness (Aniqlik / Tahlil)"}
                                </div>
                                <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-2 font-bold">
                                    <div className="bg-red-50 p-1 border border-red-100">
                                        <span className="text-red-700 block font-black">D</span>
                                        <span>{discAssessment.dScore}%</span>
                                    </div>
                                    <div className="bg-amber-50 p-1 border border-amber-100">
                                        <span className="text-amber-700 block font-black">I</span>
                                        <span>{discAssessment.iScore}%</span>
                                    </div>
                                    <div className="bg-emerald-50 p-1 border border-emerald-100">
                                        <span className="text-emerald-700 block font-black">S</span>
                                        <span>{discAssessment.sScore}%</span>
                                    </div>
                                    <div className="bg-blue-50 p-1 border border-blue-100">
                                        <span className="text-blue-700 block font-black">C</span>
                                        <span>{discAssessment.cScore}%</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const locale = window.location.pathname.split("/")[1] || "uz";
                                    router.push(`/${locale}/disc`);
                                }}
                                className="mt-1 w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors text-center"
                            >
                                To'liq DISC Tahlili →
                            </button>
                        </div>
                    ) : (
                        <div className="border border-dashed border-black bg-neutral-50 p-5 flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                                    DISC Psixometrik Test
                                </span>
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-100 text-amber-800">
                                    Topshirilmagan
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                O'z shaxsiy xarakteringiz, muloqot va yetakchilik uslubingizni aniqlash uchun testdan o'ting.
                            </p>
                            <button
                                onClick={() => {
                                    const locale = window.location.pathname.split("/")[1] || "uz";
                                    router.push(`/${locale}/disc`);
                                }}
                                className="w-full py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors text-center flex items-center justify-center gap-1.5"
                            >
                                DISC Testidan O'tish →
                            </button>
                        </div>
                    )}

                    <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                        {t("quickActions")}
                    </h2>
                    <QuickActions
                        onAttendanceUpdated={() => setRefreshKey((k) => k + 1)}
                    />
                </div>
            </div>
        </div>
    );
}
