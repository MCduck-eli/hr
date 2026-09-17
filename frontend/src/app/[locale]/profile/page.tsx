"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import QuickActions from "@/src/components/dashboard/quick-actions";
import CareerPathRequirements from "@/src/components/profile/CareerPathRequirements";
import EmployeeJourneyTimeline from "@/src/components/lifecycle/EmployeeJourneyTimeline";
import EmployeePayslipsSection from "@/src/components/payroll/EmployeePayslipsSection";
import PayrollManager from "@/src/components/payroll/PayrollManager";
import EmployeeTestModal from "@/src/components/profile/EmployeeTestModal";
import EmployeeEnpsModal from "@/src/components/profile/EmployeeEnpsModal";
import { fetchMyPendingTasks, fetchTargetReport, fetchCycles } from "@/src/services/feedback360-service";
import { fetchMyLatestEnps } from "@/src/services/enps-service";
import { checkInKeyResult } from "@/src/services/okr-service";
import { fetchOffboardingDetails } from "@/src/services/offboarding-service";
import ExitInterviewModal from "@/src/components/offboarding/ExitInterviewModal";
import EmployeeResignationModal from "@/src/components/offboarding/EmployeeResignationModal";

export default function EmployeeProfilePage() {
    const t = useTranslations("DashboardProfile");
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<"profile" | "payroll">("profile");

    const [checkInKr, setCheckInKr] = useState<any>(null);
    const [checkInComment, setCheckInComment] = useState("");
    const [checkInFile, setCheckInFile] = useState<File | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [pendingTasks, setPendingTasks] = useState<any[]>([]);
    const [feedbackReport, setFeedbackReport] = useState<any>(null);
    const [cycles, setCycles] = useState<any[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState<string>("");

    const [offboardingData, setOffboardingData] = useState<any>(null);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const [isResignationModalOpen, setIsResignationModalOpen] = useState(false);
    const [isDiscTestModalOpen, setIsDiscTestModalOpen] = useState(false);
    const [localDiscAssessment, setLocalDiscAssessment] = useState<any>(null);
    const [isEnpsModalOpen, setIsEnpsModalOpen] = useState(false);
    const [latestEnps, setLatestEnps] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            const tabParam = searchParams.get("tab");
            if (tabParam === "payroll") {
                setActiveTab("payroll");
            }
        }
    }, []);

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
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

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
                const dData = data.data || data;
                setDashboardData(dData);
                if (dData.discAssessment) {
                    setLocalDiscAssessment(dData.discAssessment);
                }
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
                    if (cyclesData?.length > 0) {
                        setSelectedCycleId(cyclesData[0].id);
                    }
                } catch (e) {}

                try {
                    const enpsData = await fetchMyLatestEnps();
                    setLatestEnps(enpsData);
                } catch (e) {}

                const cycleId = selectedCycleId || (cycles.length > 0 ? cycles[0].id : undefined);
                if (targetEmployeeId) {
                    try {
                        const report = await fetchTargetReport(targetEmployeeId, cycleId);
                        setFeedbackReport(report);
                    } catch (e) {}
                }

                const empId = targetEmployeeId || targetUserId;
                if (empId) {
                    try {
                        const off = await fetchOffboardingDetails(empId);
                        setOffboardingData(off);
                    } catch (e) {
                        setOffboardingData(null);
                    }
                }
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
    const isAccountant =
        roleData === "ACCOUNTANT" ||
        currentUser?.role === "ACCOUNTANT" ||
        currentUser?.customRole?.baseRole === "ACCOUNTANT" ||
        dashboardData?.user?.customRole?.baseRole === "ACCOUNTANT";
    const isDirector =
        roleData === "DIRECTOR" ||
        currentUser?.role === "DIRECTOR" ||
        roleData === "SUPER_ADMIN" ||
        currentUser?.role === "SUPER_ADMIN" ||
        currentUser?.customRole?.baseRole === "DIRECTOR";
    const isHrAdmin =
        roleData === "HR_ADMIN" ||
        currentUser?.role === "HR_ADMIN" ||
        currentUser?.customRole?.baseRole === "HR_ADMIN";
    const canManagePayroll = isAccountant || isDirector;
    const roleName = roleData === "EMPLOYEE" ? t("roleEmployee") : roleData === "ACCOUNTANT" ? "Bugalter / Hisobchi" : roleData === "HR_ADMIN" ? "HR Admin" : roleData;

    const grade = dashboardData?.grade || dashboardData?.user?.employee?.grade || null;
    const positionTitle = dashboardData?.position || dashboardData?.user?.employee?.position || null;
    const departmentName = dashboardData?.user?.employee?.department || null;
    const salary = dashboardData?.salary || dashboardData?.user?.employee?.salary || null;
    const discAssessment = localDiscAssessment || dashboardData?.discAssessment || null;

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
            label: t("currentGradeSalary"),
            value: grade ? `Level ${grade.level} • ${grade.code}` : t("unassigned"),
            trend: salary ? `${Number(salary).toLocaleString()} UZS` : (grade ? `${grade.minSalary.toLocaleString()} - ${grade.maxSalary.toLocaleString()} UZS` : t("notSpecified")),
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

    const getActivityTitle = (title: string) => {
        if (title === "Offboarding muvaffaqiyatli yakunlandi") return t("activityOffboardingCompleted");
        if (title === "Exit Interview topshirildi") return t("activityExitInterview");
        if (title === "Ishga qabul qilindi") return t("activityHired");
        if (title === "Onboarding boshlandi") return t("activityOnboardingStarted");
        if (title === "Sinov muddati o'tdi") return t("activityProbationPassed");
        if (title === "Greyd oshirildi") return t("activityPromoted");
        return title;
    };

    const getActivityDescription = (description: string) => {
        if (!description) return "";
        if (description === "Barcha aylanma varaqasi (Checklist) topshiriqlari va aktivlar to'liq topshirildi.") {
            return t("activityOffboardingCompletedDesc");
        }
        if (description.startsWith("【Ketish Sababi】: ")) {
            const val = description.replace("【Ketish Sababi】: ", "");
            return `【${t("exitReasonPrefix")}】: ${val}`;
        }
        return description;
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkInKr) return;
        setIsCheckingIn(true);
        try {
            const formData = new FormData();
            if (checkInComment) formData.append("comment", checkInComment);
            if (checkInFile) {
                formData.append("proofImage", checkInFile);
            }

            await checkInKeyResult(checkInKr.id, formData);
            setCheckInKr(null);
            setCheckInFile(null);
            setCheckInComment("");
            setRefreshKey(prev => prev + 1);
        } catch (err: any) {
            alert(err.message || "Failed to check in");
        } finally {
            setIsCheckingIn(false);
        }
    };

    return (
        <div className="flex flex-col gap-10 py-10 px-4 md:px-8 max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-2"
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
                        {grade ? `${grade.title} (Level ${grade.level})` : t("noGradeAssigned")}
                    </span>
                </div>

                {canManagePayroll && (
                    <div className="flex border-b border-gray-200 gap-2 mt-4">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                                activeTab === "profile"
                                    ? "border-black text-black"
                                    : "border-transparent text-gray-400 hover:text-black"
                            }`}
                        >
                            <span>👤</span>
                            <span>{t("employeeProfile") || "Xodim Profili"}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("payroll")}
                            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                                activeTab === "payroll"
                                    ? "border-black text-black"
                                    : "border-transparent text-gray-400 hover:text-black"
                            }`}
                        >
                            <span>💵</span>
                            <span>Moliya & Ish Haqi Boshqaruvi</span>
                        </button>
                    </div>
                )}
            </div>

            {canManagePayroll && activeTab === "payroll" ? (
                <div className="flex flex-col gap-6">
                    <PayrollManager />
                </div>
            ) : (
                <>
                    {canManagePayroll && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">💼</span>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                        Bugalteriya va Moliya Boshqaruvi
                                    </div>
                                    <div className="text-[11px] font-semibold text-emerald-700">
                                        Kompaniya xodimlari oylik maoshlari, avanslar va to'lovlarni to'liq nazorat qilish uchun moliya bo'limiga o'ting.
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab("payroll")}
                                className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-colors shrink-0 rounded-sm shadow-xs"
                            >
                                Moliya & Oyliklarni Boshqarish &rarr;
                            </button>
                        </div>
                    )}

                    {isHrAdmin && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🛡️</span>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider text-blue-950">
                                        HR Admin Boshqaruv Paneli
                                    </div>
                                    <div className="text-[11px] font-semibold text-blue-800">
                                        Kompaniya xodimlari, rekruting, onboarding, lavozimlar va tizim sozlamalarini boshqarish uchun HR paneliga o'ting.
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push(`/${locale}/hr/dashboard`)}
                                className="px-4 py-2 bg-blue-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-900 transition-colors shrink-0 rounded-sm shadow-xs"
                            >
                                HR Dashboard &rarr;
                            </button>
                        </div>
                    )}

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

                    {(dashboardData?.user?.employee?.id || currentUser?.employee?.id) && (
                        <EmployeeJourneyTimeline
                            employeeId={dashboardData?.user?.employee?.id || currentUser?.employee?.id}
                            employeeName={`${firstName} ${dashboardData?.user?.lastName || ""}`}
                        />
                    )}

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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🎯</span>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-black">
                                    {t("myGoalsOkr") || "MAQSADLAR VA OKR"}
                                </h2>
                            </div>
                            <span className="text-xs font-bold text-gray-500">
                                {okrs.length} ta maqsad biriktirilgan
                            </span>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            {okrs.length === 0 ? (
                                <div className="p-8 border border-dashed border-gray-300 bg-gray-50 text-center flex flex-col items-center justify-center gap-2">
                                    <span className="text-3xl">📋</span>
                                    <p className="text-sm text-gray-500 font-medium">{t("noOkrsInCycle") || "Hozircha biriktirilgan OKR maqsadlar mavjud emas."}</p>
                                </div>
                            ) : (
                                okrs.map((okr: any) => (
                                    <div key={okr.id} className="border-2 border-black bg-white p-5 md:p-6 flex flex-col gap-4 shadow-xs">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                                        okr.level === "INDIVIDUAL"
                                                            ? "bg-purple-100 text-purple-800 border border-purple-300"
                                                            : okr.level === "DEPARTMENT"
                                                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                                                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                    }`}>
                                                        {okr.level === "INDIVIDUAL" ? "👤 Shaxsiy OKR" : okr.level === "DEPARTMENT" ? `🏢 Bo'lim OKR${okr.department?.name ? ` (${okr.department.name})` : ""}` : "🌐 Kompaniya OKR"}
                                                    </span>
                                                    {okr.cycle?.title && (
                                                        <span className="text-[10px] font-bold text-gray-500">
                                                            • Sikl: {okr.cycle.title}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-black text-black">{okr.title}</h3>
                                                {okr.description && <p className="text-xs text-gray-600 font-medium">{okr.description}</p>}
                                            </div>
                                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 gap-1 shrink-0">
                                                <span className="text-2xl font-black font-mono tracking-tighter text-black">{Math.round(okr.progress)}%</span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{t("overall") || "UMUMIY IJRO"}</span>
                                            </div>
                                        </div>

                                        {okr.keyResults?.length > 0 && (
                                            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    Asosiy Natijalar (Key Results)
                                                </span>
                                                {okr.keyResults.map((kr: any) => {
                                                    const latestCheckIn = kr.checkIns?.[0];
                                                    const isPending = latestCheckIn?.status === "PENDING";
                                                    const isRejected = latestCheckIn?.status === "REJECTED";
                                                    const isApproved = kr.progress >= 100 || latestCheckIn?.status === "APPROVED";

                                                    return (
                                                        <div key={kr.id} className="p-3.5 bg-gray-50 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-gray-400 transition-colors">
                                                            <div className="flex flex-col gap-1 flex-1">
                                                                <span className="text-sm font-bold text-black">{kr.title}</span>
                                                                <div className="flex items-center gap-3 w-full max-w-md">
                                                                    <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
                                                                        <div 
                                                                            className={`h-full transition-all ${isApproved ? "bg-emerald-600" : isPending ? "bg-amber-500" : isRejected ? "bg-rose-500" : "bg-black"}`} 
                                                                            style={{ width: `${Math.min(100, Math.max(0, kr.progress))}%` }} 
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-mono font-bold text-gray-700 whitespace-nowrap">
                                                                        {kr.currentValue} / {kr.targetValue} {kr.unit || ""} ({Math.round(kr.progress)}%)
                                                                    </span>
                                                                </div>
                                                                {latestCheckIn?.comment && (
                                                                    <div className="text-[11px] text-gray-500 italic mt-0.5">
                                                                        Topshirilgan hisobot: "{latestCheckIn.comment}"
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                                                {isPending ? (
                                                                    <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                        <span>⏳</span> Tekshiruvda (Kutilmoqda)
                                                                    </span>
                                                                ) : isApproved ? (
                                                                    <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                        <span>✓</span> Bajarildi (Tasdiqlangan)
                                                                    </span>
                                                                ) : isRejected ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            setCheckInKr(kr);
                                                                            setCheckInComment("");
                                                                            setCheckInFile(null);
                                                                        }}
                                                                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                                    >
                                                                        <span>🔄</span> Qayta topshirish
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setCheckInKr(kr);
                                                                            setCheckInComment("");
                                                                            setCheckInFile(null);
                                                                        }}
                                                                        className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                                    >
                                                                        <span>🚀</span> Natijani topshirish
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
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
                                                    {getActivityTitle(activity.title)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {getActivityDescription(activity.description)}
                                                </span>
                                            </div>
                                            <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {activity.timeAgo === "Yaqinda" ? t("recently") : activity.timeAgo}
                                            </span>
                                        </div>
                                    ),
                                )
                            )}
                        </div>
                    </div>

                    <EmployeePayslipsSection />
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
                                    {t("gradeAndLevel")}
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
                                    {t("code")}: {grade.code}
                                </div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-3 space-y-1 text-xs">
                                <div className="text-gray-500 font-bold uppercase text-[10px]">
                                    {t("salaryRange")}:
                                </div>
                                <div className="font-bold text-black text-sm">
                                    {grade.minSalary.toLocaleString()} - {grade.maxSalary.toLocaleString()} UZS
                                </div>
                                {salary && (
                                    <div className="text-emerald-700 font-bold pt-1 border-t border-gray-200 text-xs">
                                        {t("assignedSalary")}: {salary.toLocaleString()} UZS
                                    </div>
                                )}
                            </div>
                            {grade.requirements && (
                                <div className="text-xs text-gray-600">
                                    <span className="font-bold text-black uppercase text-[10px] block mb-0.5">
                                        {t("requirements")}:
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
                                    {t("discPersonalityType")}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                    discAssessment.primaryType === "D" ? "bg-red-600 text-white" :
                                    discAssessment.primaryType === "I" ? "bg-amber-500 text-white" :
                                    discAssessment.primaryType === "S" ? "bg-emerald-600 text-white" :
                                    "bg-blue-600 text-white"
                                }`}>
                                    {t("type")}: {discAssessment.primaryType} {discAssessment.secondaryType ? `+ ${discAssessment.secondaryType}` : ""}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="text-base font-black text-black">
                                    {discAssessment.primaryType === "D" ? "Dominance" :
                                     discAssessment.primaryType === "I" ? "Influence" :
                                     discAssessment.primaryType === "S" ? "Steadiness" :
                                     "Conscientiousness"}
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
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <button
                                    onClick={() => setIsDiscTestModalOpen(true)}
                                    className="py-2 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors text-center"
                                >
                                    🔄 Qayta topshirish
                                </button>
                                <button
                                    onClick={() => {
                                        const locale = window.location.pathname.split("/")[1] || "uz";
                                        router.push(`/${locale}/disc`);
                                    }}
                                    className="py-2 border border-black bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors text-center"
                                >
                                    {t("fullDiscAnalysis")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-dashed border-black bg-neutral-50 p-5 flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                                    {t("discTest")}
                                </span>
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-100 text-amber-800">
                                    {t("notPassed")}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {t("discHint")}
                            </p>
                            <button
                                onClick={() => setIsDiscTestModalOpen(true)}
                                className="w-full py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-colors text-center flex items-center justify-center gap-1.5"
                            >
                                🧠 {t("takeDiscTest")}
                            </button>
                        </div>
                    )}

                    <div className="border border-black bg-white p-5 flex flex-col gap-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-black pb-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                                💬 eNPS / Kompaniya Qoniqish So'rovi
                            </span>
                            {latestEnps ? (
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                    latestEnps.score >= 9 ? "bg-emerald-600 text-white" :
                                    latestEnps.score >= 7 ? "bg-amber-500 text-white" : "bg-rose-600 text-white"
                                }`}>
                                    Baho: {latestEnps.score} / 10
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-gray-100 text-gray-700">
                                    Kutilmoqda
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {latestEnps 
                                ? `Oxirgi baholangan sana: ${new Date(latestEnps.submittedAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}`
                                : "Kompaniyada ishlash tajribangizni baholang va o'z takliflaringizni bildiring."}
                        </p>
                        <button
                            onClick={() => setIsEnpsModalOpen(true)}
                            className="w-full py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors text-center flex items-center justify-center gap-1.5"
                        >
                            {latestEnps ? "🔄 Qayta baholash (eNPS)" : "💬 eNPS Bahosini Berish"}
                        </button>
                    </div>

                    {offboardingData && offboardingData.status !== "CANCELLED" ? (
                        <div className="border-2 border-red-300 bg-red-50/40 p-5 flex flex-col gap-3 shadow-xs">
                            <div className="flex items-center justify-between border-b border-red-200 pb-2">
                                <span className="text-[11px] font-black uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                                    <span>🏁</span> {t("offboardingTitle")}
                                </span>
                                <span
                                    className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-xs ${
                                        offboardingData.status === "COMPLETED"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800"
                                    }`}
                                >
                                    {offboardingData.status === "COMPLETED"
                                        ? t("statusOffboardingCompleted")
                                        : t("statusInProgress")}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{t("lastWorkingDay")}:</span>
                                    <span className="font-bold text-black">
                                        {offboardingData.lastWorkingDay
                                            ? new Date(offboardingData.lastWorkingDay).toISOString().split("T")[0]
                                            : "-"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{t("requirements")}:</span>
                                    <span className="font-bold text-black">
                                        {t("tasksCompleted", {
                                            completed: offboardingData.tasks?.filter((t: any) => t.isCompleted).length || 0,
                                            total: offboardingData.tasks?.length || 0,
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                                {offboardingData.tasks?.map((t: any) => (
                                    <div
                                        key={t.id}
                                        className="flex items-center gap-2 text-[11px] p-1.5 bg-white border border-red-100"
                                    >
                                        <span className={t.isCompleted ? "text-emerald-600 font-bold" : "text-gray-400"}>
                                            {t.isCompleted ? "✓" : "○"}
                                        </span>
                                        <span className={t.isCompleted ? "line-through text-gray-400" : "font-medium text-gray-800"}>
                                            {t.title}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {offboardingData.exitInterviewNotes ? (
                                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                                    <span>✓</span> {t("exitInterviewCompleted")}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsExitModalOpen(true)}
                                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors text-center shadow-xs cursor-pointer"
                                >
                                    {t("exitInterviewBtn")}
                                </button>
                            )}
                        </div>
                    ) : (
                        currentUser?.role !== "SUPER_ADMIN" &&
                        currentUser?.role !== "DIRECTOR" &&
                        (dashboardData?.user?.employee?.id || currentUser?.employee?.id) && (
                            <div className="border border-gray-200 bg-gray-50/70 p-4 flex flex-col gap-2 rounded-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                        <span>🏁</span> {t("offboardingTitle") || "Ishdan ketish (Offboarding)"}
                                    </span>
                                    {offboardingData?.status === "CANCELLED" && (
                                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-gray-200 text-gray-700">
                                            Oldingi ariza bekor qilingan
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 font-normal">
                                    Ishdan ketish bo'yicha arizani to'g'ridan-to'g'ri o'z kompaniyangiz HR bo'limiga yuborishingiz mumkin.
                                </p>
                                <button
                                    onClick={() => setIsResignationModalOpen(true)}
                                    className="w-full py-2 px-3 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold uppercase tracking-wider transition-colors text-center cursor-pointer mt-1"
                                >
                                    🏁 Ishdan ketish arizasini topshirish
                                </button>
                            </div>
                        )
                    )}

                    <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                        {t("quickActions")}
                    </h2>
                    <QuickActions
                        onAttendanceUpdated={() => setRefreshKey((k) => k + 1)}
                    />
                </div>
            </div>

            {offboardingData && (
                <ExitInterviewModal
                    isOpen={isExitModalOpen}
                    onClose={() => setIsExitModalOpen(false)}
                    employeeId={offboardingData.employeeId}
                    onSuccess={() => setRefreshKey((k) => k + 1)}
                />
            )}

            <EmployeeResignationModal
                isOpen={isResignationModalOpen}
                onClose={() => setIsResignationModalOpen(false)}
                employeeId={dashboardData?.user?.employee?.id || currentUser?.employee?.id}
                onSuccess={() => setRefreshKey((k) => k + 1)}
            />

            <EmployeeTestModal
                isOpen={isDiscTestModalOpen}
                onClose={() => setIsDiscTestModalOpen(false)}
                onSuccess={(profile) => {
                    if (profile.assessment) {
                        setLocalDiscAssessment(profile.assessment);
                    }
                    setIsDiscTestModalOpen(false);
                    setRefreshKey((k) => k + 1);
                }}
                locale={locale}
            />

            <EmployeeEnpsModal
                isOpen={isEnpsModalOpen}
                onClose={() => setIsEnpsModalOpen(false)}
                onSuccess={(data) => {
                    setLatestEnps(data);
                    setIsEnpsModalOpen(false);
                    setRefreshKey((k) => k + 1);
                }}
            />

            {checkInKr && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🎯</span>
                                <div>
                                    <h3 className="text-base font-black uppercase tracking-tight text-black">
                                        OKR Natijasini Topshirish
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium line-clamp-1">
                                        {checkInKr.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCheckInKr(null)}
                                className="text-gray-400 hover:text-black text-sm font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCheckIn} className="flex flex-col gap-4 mt-4">
                            <div className="p-3 bg-gray-50 border border-gray-200 flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    Maqsadli ko'rsatkich
                                </span>
                                <span className="text-sm font-black text-black">
                                    {checkInKr.targetValue} {checkInKr.unit || ""} (100% bajarilgan deb topshiriladi)
                                </span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-black">
                                    Bajarilgan ish bo'yicha hisobot / izoh
                                </label>
                                <textarea
                                    value={checkInComment}
                                    onChange={(e) => setCheckInComment(e.target.value)}
                                    placeholder="Ushbu vazifani qanday bajarganingiz, erishilgan natijalar haqida qisqacha yozing..."
                                    rows={3}
                                    className="border-2 border-gray-200 p-3 text-sm focus:border-black outline-none w-full font-medium"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-black">
                                    Tasdiqlovchi rasm yoki fayl (Ixtiyoriy)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setCheckInFile(e.target.files[0]);
                                        }
                                    }}
                                    className="border border-gray-300 p-2 text-xs font-medium w-full bg-gray-50 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:font-bold file:uppercase file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
                                />
                                {checkInFile && (
                                    <div className="mt-2 p-2 border border-gray-200 bg-gray-50 rounded-sm flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={URL.createObjectURL(checkInFile)}
                                                alt="Preview"
                                                className="w-12 h-12 object-cover border border-gray-300"
                                            />
                                            <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">
                                                {checkInFile.name}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCheckInFile(null)}
                                            className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider cursor-pointer"
                                        >
                                            O'chirish
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setCheckInKr(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold uppercase tracking-wider text-black transition-colors cursor-pointer"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCheckingIn}
                                    className="px-6 py-2 bg-black hover:bg-gray-800 text-white text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    {isCheckingIn ? "Yuborilmoqda..." : "🚀 Natijani Topshirish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
                </>
            )}
        </div>
    );
}
