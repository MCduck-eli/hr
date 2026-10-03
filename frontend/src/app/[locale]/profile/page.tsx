"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import CareerPathRequirements from "@/src/components/profile/CareerPathRequirements";
import EmployeeJourneyTimeline from "@/src/components/lifecycle/EmployeeJourneyTimeline";
import EmployeePayslipsSection from "@/src/components/payroll/EmployeePayslipsSection";
import PayrollManager from "@/src/components/payroll/PayrollManager";
import EmployeeTestModal from "@/src/components/profile/EmployeeTestModal";
import EmployeeEnpsModal from "@/src/components/profile/EmployeeEnpsModal";
import AbsenceReasonModal from "@/src/components/hr/attendance/absence-reason-modal";
import { fetchMyPendingTasks, fetchTargetReport, fetchCycles } from "@/src/services/feedback360-service";
import { fetchMyLatestEnps } from "@/src/services/enps-service";
import { checkInKeyResult } from "@/src/services/okr-service";
import { fetchOffboardingDetails, toggleOffboardingTask } from "@/src/services/offboarding-service";
import ExitInterviewModal from "@/src/components/offboarding/ExitInterviewModal";
import EmployeeResignationModal from "@/src/components/offboarding/EmployeeResignationModal";
import Skeleton from "@/src/components/ui/Skeleton";

type ProfileTab = "overview" | "career" | "okr" | "assessments" | "offboarding" | "payroll";

function CircularProgress({ value, size = 48, strokeWidth = 4, color = "#9327FF" }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-100"
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
            <span className="absolute text-[11px] font-black text-slate-800">{Math.round(value)}%</span>
        </div>
    );
}

export default function EmployeeProfilePage() {
    const t = useTranslations("DashboardProfile");
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

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
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            const tabParam = searchParams.get("tab") as ProfileTab | null;
            if (tabParam && ["overview", "career", "okr", "assessments", "offboarding", "payroll"].includes(tabParam)) {
                setActiveTab(tabParam);
            }
        }
    }, []);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!userStr || !token) {
            const loc = window.location.pathname.split("/")[1] || "uz";
            router.push(`/${loc}/login`);
            return;
        }
        try {
            setCurrentUser(JSON.parse(userStr));
        } catch (e) {
            const loc = window.location.pathname.split("/")[1] || "uz";
            router.push(`/${loc}/login`);
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
                    const searchParams = new URLSearchParams(window.location.search);
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
                            const lastSegment = pathSegments[pathSegments.length - 1];
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
                            if (lastSegment && !ignoredWords.includes(lastSegment)) {
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
                        } catch (e) {}
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

                const empId = targetEmployeeId || targetUserId || currentUser?.id || "my";
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
    }, [loading, currentUser, dashboardData, selectedCycleId, refreshKey]);

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case "IT_ACCESS":
                return { label: "IT & Tizimlar", color: "bg-blue-50 text-blue-700 border-blue-200" };
            case "ASSET_RETURN":
                return { label: "Jihozlar & Aktivlar", color: "bg-amber-50 text-amber-700 border-amber-200" };
            case "FINANCE":
                return { label: "Moliya & Hisob-kitob", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
            case "HR_DOCUMENTS":
            default:
                return { label: "HR & Hujjatlar", color: "bg-purple-50 text-purple-700 border-purple-200" };
        }
    };

    const handleToggleOffboardingTask = async (taskId: string, currentStatus: boolean) => {
        if (!offboardingData) return;

        const previousData = offboardingData;
        const newStatus = !currentStatus;

        const updatedTasks = (offboardingData.tasks || []).map((t: any) =>
            t.id === taskId
                ? { ...t, isCompleted: newStatus, completedAt: newStatus ? new Date().toISOString() : null }
                : t
        );
        const allDone = updatedTasks.length > 0 && updatedTasks.every((t: any) => t.isCompleted);

        setOffboardingData({
            ...offboardingData,
            status: allDone ? "COMPLETED" : "IN_PROGRESS",
            isAssetsReturned: allDone,
            tasks: updatedTasks,
        });

        try {
            await toggleOffboardingTask(taskId, newStatus);
        } catch (e) {
            setOffboardingData(previousData);
        }
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

    if (!currentUser || loading) {
        return (
            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50/60">
                <div className="w-full lg:w-72 bg-white border-r border-slate-200/80 p-6 space-y-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="w-3/4 h-5 rounded-lg" />
                            <Skeleton className="w-1/2 h-3 rounded-md" />
                        </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="w-full h-10 rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="flex-1 p-6 md:p-10 space-y-8">
                    <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                        <div className="space-y-2">
                            <Skeleton className="w-64 h-8 rounded-xl" />
                            <Skeleton className="w-40 h-4 rounded-md" />
                        </div>
                        <Skeleton className="w-32 h-10 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 space-y-3">
                                <Skeleton className="w-24 h-4 rounded" />
                                <Skeleton className="w-16 h-8 rounded-lg" />
                                <Skeleton className="w-28 h-3 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const firstName =
        dashboardData?.user?.firstName ||
        currentUser.employee?.firstName ||
        currentUser.email.split("@")[0];

    const lastName =
        dashboardData?.user?.lastName ||
        currentUser.employee?.lastName ||
        "";

    const fullName = `${firstName} ${lastName}`.trim();

    const roleData = dashboardData?.user?.role || currentUser.role;
    const userPermissions: string[] =
        dashboardData?.user?.permissions ||
        currentUser?.permissions ||
        [];

    const isAccountant =
        roleData === "ACCOUNTANT" ||
        currentUser?.role === "ACCOUNTANT" ||
        currentUser?.customRole?.baseRole === "ACCOUNTANT" ||
        dashboardData?.user?.customRole?.baseRole === "ACCOUNTANT" ||
        userPermissions.includes("payroll") ||
        userPermissions.includes("accounting");

    const isDirector =
        roleData === "DIRECTOR" ||
        currentUser?.role === "DIRECTOR" ||
        roleData === "SUPER_ADMIN" ||
        currentUser?.role === "SUPER_ADMIN" ||
        currentUser?.customRole?.baseRole === "DIRECTOR";

    const isHrAdmin =
        roleData === "HR_ADMIN" ||
        currentUser?.role === "HR_ADMIN" ||
        currentUser?.customRole?.baseRole === "HR_ADMIN" ||
        userPermissions.includes("hr_dashboard") ||
        userPermissions.includes("hr");

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

    const activeCourses = dashboardData?.activeCourses || [];
    const recentActivities = dashboardData?.recentActivities || [];
    const okrs = dashboardData?.okrs || [];

    const statsCards = [
        {
            title: "OKR IJROSI",
            value: dashboardData?.okrProgress ? `${Math.round(dashboardData.okrProgress)}%` : "0%",
            subtext: dashboardData?.minExpectedProgress !== undefined ? `Kamida ${dashboardData.minExpectedProgress}% kutilmoqda` : "Kvartallik maqsadlar",
            icon: "🎯",
            color: "#9327FF",
            progressValue: dashboardData?.okrProgress ? Math.round(dashboardData.okrProgress) : 0,
            hasCircular: true,
        },
        {
            title: "360° BAHOLASH",
            value: (overallScore !== null && overallScore !== undefined)
                ? `${overallScore} / 5.0`
                : (dashboardData?.feedback360Score !== null && dashboardData?.feedback360Score !== undefined
                    ? `${dashboardData.feedback360Score} / 5.0`
                    : "0.0 / 5.0"),
            subtext: (overallScore || dashboardData?.feedback360Score) ? "Hamkasblar bahosi" : "Hali baholanmagan",
            icon: "⭐",
            color: "#F59E0B",
            hasCircular: false,
        },
        {
            title: "DAVOMAT SOATLARI",
            value: dashboardData?.attendanceHours ? `${dashboardData.attendanceHours}h` : "0h",
            subtext: "Joriy haftalik davomat",
            icon: "⏱️",
            color: "#2563EB",
            hasCircular: false,
        },
        {
            title: "GREYD & DARAJASI",
            value: grade ? `Level ${grade.level}` : "Belgilanmagan",
            subtext: salary ? `${Number(salary).toLocaleString()} UZS` : (grade ? `${grade.minSalary.toLocaleString()} - ${grade.maxSalary.toLocaleString()} UZS` : "Maosh ko'rsatilmagan"),
            icon: "📈",
            color: "#059669",
            hasCircular: false,
        },
        {
            title: "TA'TIL QOLDIG'I",
            value: (dashboardData?.leaveBalance ?? currentUser?.employee?.leaveBalance) !== undefined
                ? `${dashboardData?.leaveBalance ?? currentUser?.employee?.leaveBalance} Kun`
                : "0 Kun",
            subtext: "Yillik mehnat ta'tili",
            icon: "🏖️",
            color: "#E11D48",
            hasCircular: false,
        },
    ];

    const menuItems = [
        {
            id: "overview" as ProfileTab,
            label: "Umumiy ko'rinish",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
        },
        {
            id: "career" as ProfileTab,
            label: "Karyera va Greyd",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            badge: grade ? `L${grade.level}` : undefined,
        },
        {
            id: "okr" as ProfileTab,
            label: "Maqsadlar (OKR)",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            badge: okrs.length > 0 ? `${okrs.length}` : undefined,
        },
        {
            id: "assessments" as ProfileTab,
            label: "Baholash & Testlar",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
            ),
            badge: pendingTasks.length > 0 ? `${pendingTasks.length} ta vazifa` : undefined,
            badgeColor: "bg-amber-100 text-amber-800",
        },
        {
            id: "offboarding" as ProfileTab,
            label: "Offboarding",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            ),
            badge: offboardingData && offboardingData.status !== "CANCELLED" ? "Faol" : undefined,
            badgeColor: offboardingData?.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
        },
    ];

    if (canManagePayroll) {
        menuItems.push({
            id: "payroll" as ProfileTab,
            label: "Moliya & Ish Haqi",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            badge: undefined,
            badgeColor: undefined,
        });
    }

    const quickSidebarActions = [
        {
            label: "Kelolmaslik sababini bildirish",
            icon: "📝",
            action: () => setIsReasonModalOpen(true),
        },
        {
            label: "Ichki nizomlar",
            icon: "⚖️",
            action: () => router.push(`/${locale}/regulations`),
        },
        {
            label: "Ta'til so'rovi",
            icon: "🏖️",
            action: () => router.push(`/${locale}/hr/attendance`),
        },
        {
            label: "OKR progressini yangilash",
            icon: "🎯",
            action: () => setActiveTab("okr"),
        },
        {
            label: "eNPS bahosini berish",
            icon: "💬",
            action: () => setIsEnpsModalOpen(true),
        },
    ];

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50/60 font-sans">
            <aside className="w-full lg:w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 shadow-xs">
                <div className="p-5 flex flex-col gap-6">
                    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/60 shadow-2xs">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#9327FF] to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0 uppercase">
                            {firstName?.[0] || "U"}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-extrabold text-slate-900 truncate leading-tight">
                                {fullName || firstName}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                                {positionTitle || roleName}
                            </span>
                            {departmentName && (
                                <span className="text-[10px] font-bold text-[#9327FF] truncate mt-0.5">
                                    {departmentName}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Shaxsiy Kabinet
                        </span>
                        {menuItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                                        isActive
                                            ? "bg-[#9327FF] text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className={isActive ? "text-white" : "text-slate-400"}>
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                isActive
                                                    ? "bg-white/20 text-white"
                                                    : item.badgeColor || "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col gap-1 pt-3 border-t border-slate-100">
                        <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Tezkor Amallar
                        </span>
                        {quickSidebarActions.map((qa, idx) => (
                            <button
                                key={idx}
                                onClick={qa.action}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all text-left cursor-pointer"
                            >
                                <span className="text-sm">{qa.icon}</span>
                                <span className="truncate">{qa.label}</span>
                            </button>
                        ))}
                    </div>

                    {isHrAdmin && (
                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                            <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Ma'muriyat
                            </span>
                            <button
                                onClick={() => router.push(`/${locale}/hr/dashboard`)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 transition-colors text-left cursor-pointer"
                            >
                                <span>🛡️</span>
                                <span>HR Admin Dashboard &rarr;</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 m-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#9327FF] flex items-center justify-center font-bold text-sm shrink-0">
                        👤
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800">Xodim Profili</span>
                        <span className="text-[10px] text-slate-500 truncate">
                            {currentUser?.companyName || "Kompaniya xodimi"}
                        </span>
                    </div>
                </div>
            </aside>

            <main className="flex-1 min-w-0 p-6 md:p-10 flex flex-col gap-8 bg-slate-50/60 overflow-y-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 bg-purple-50 text-[#9327FF] text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#9327FF]"></span>
                                {roleName}
                            </span>
                            {grade && (
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                                    {grade.title} (Level {grade.level})
                                </span>
                            )}
                            {currentUser?.companyName && (
                                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                                    • {currentUser.companyName}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {t("welcomeBack")} {firstName}!
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm font-medium">
                            {positionTitle ? `${positionTitle} • ` : ""}{departmentName ? `${departmentName} • ` : ""}Shaxsiy ko'rsatkichlaringiz va faoliyat monitoringi
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => router.push(`/${locale}/academy`)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl px-4 py-2.5 transition-all duration-200 shadow-2xs flex items-center gap-2 text-xs md:text-sm cursor-pointer"
                        >
                            <span>📚</span>
                            <span>Akademiya</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("okr")}
                            className="bg-[#9327FF] hover:bg-purple-700 text-white font-bold rounded-xl px-4 py-2.5 transition-all duration-200 shadow-sm flex items-center gap-2 text-xs md:text-sm cursor-pointer"
                        >
                            <span>🎯</span>
                            <span>Mening OKRlarim</span>
                        </button>
                    </div>
                </div>

                {activeTab === "overview" && (
                    <div className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                            {statsCards.map((st, idx) => (
                                <div
                                    key={idx}
                                    className="p-5 bg-white rounded-2xl shadow-2xs border border-slate-100 hover:shadow-md transition-all duration-200 flex items-center justify-between group"
                                >
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                                            {st.title}
                                        </span>
                                        <span className="text-2xl font-black text-slate-900 group-hover:text-[#9327FF] transition-colors truncate">
                                            {st.value}
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                                            {st.subtext}
                                        </span>
                                    </div>
                                    {st.hasCircular ? (
                                        <CircularProgress value={st.progressValue || 0} size={50} strokeWidth={4.5} color={st.color} />
                                    ) : (
                                        <div
                                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                                            style={{ backgroundColor: `${st.color}15`, color: st.color }}
                                        >
                                            {st.icon}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {offboardingData && offboardingData.status !== "CANCELLED" && (
                            <div className="p-6 bg-gradient-to-r from-rose-50 via-white to-amber-50/60 rounded-2xl border border-rose-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl shrink-0">
                                        🏁
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="text-base font-black text-rose-950">
                                                Faol Offboarding Jarayoni
                                            </h3>
                                            <span
                                                className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                                                    offboardingData.status === "COMPLETED"
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-amber-100 text-amber-800"
                                                }`}
                                            >
                                                {offboardingData.status === "COMPLETED" ? "Yakunlangan" : "Jarayonda"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-rose-700 font-medium">
                                            HR biriktirgan aylanma varaqasi: {(offboardingData.tasks || []).filter((t: any) => t.isCompleted).length} / {(offboardingData.tasks || []).length} topshiriq bajarilgan.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setActiveTab("offboarding")}
                                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                                >
                                    Aylanma Varaqasini Ochish &rarr;
                                </button>
                            </div>
                        )}

                        {pendingTasks.length > 0 && (
                            <div className="p-5 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 rounded-2xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0">
                                        📝
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                                            360° Baholash Vazifalari ({pendingTasks.length})
                                        </h4>
                                        <p className="text-xs text-amber-800 font-medium">
                                            Sizga biriktirilgan hamkasblaringizni baholash uchun kutilayotgan vazifalar mavjud.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveTab("assessments")}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                                >
                                    Baholash &rarr;
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs flex flex-col gap-5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-xl">📢</span>
                                        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                                            So'nggi faollik va yangiliklar lentasi
                                        </h2>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">
                                        Timeline Feed
                                    </span>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {recentActivities.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 text-xs font-medium">
                                            Hozircha yangi bildirishnomalar mavjud emas.
                                        </div>
                                    ) : (
                                        recentActivities.map((act: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-4 p-3.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#9327FF] flex items-center justify-center font-bold text-sm shrink-0">
                                                    ✨
                                                </div>
                                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                    <span className="text-xs font-bold text-slate-900">
                                                        {getActivityTitle(act.title)}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-medium leading-relaxed">
                                                        {getActivityDescription(act.description)}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                                                    {act.timeAgo === "Yaqinda" ? t("recently") : act.timeAgo}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs flex flex-col gap-5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-xl">📚</span>
                                        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                                            {t("activeCourses") || "Faol Darsliklar & Kurslar"}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/${locale}/academy`)}
                                        className="text-xs font-bold text-[#9327FF] hover:underline cursor-pointer"
                                    >
                                        Barchasi &rarr;
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {activeCourses.length === 0 ? (
                                        <p className="text-xs text-slate-400 font-medium py-8 text-center">
                                            {t("noActiveCourses") || "Biriktirilgan darsliklar mavjud emas."}
                                        </p>
                                    ) : (
                                        activeCourses.map((course: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/70 rounded-xl border border-slate-100 gap-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${course.isCompleted ? "bg-emerald-500" : "bg-[#9327FF]"}`} />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                                                            {course.title}
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-slate-500">
                                                            {course.type === "ONBOARDING" || course.type === "ONBOARDING_TASK" ? "Onboarding Dasturi" : "Akademiya"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 w-fit ${
                                                    course.isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                                }`}>
                                                    {course.isCompleted ? "Yakunlangan" : "O'qilmoqda"}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "career" && (
                    <div className="flex flex-col gap-8">
                        {grade && (
                            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#9327FF] flex items-center justify-center text-2xl font-black shrink-0">
                                        L{grade.level}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="text-lg font-black text-slate-900">
                                                {grade.title}
                                            </h3>
                                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono font-bold rounded-md">
                                                {grade.code}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Maosh oralig'i: {grade.minSalary?.toLocaleString()} - {grade.maxSalary?.toLocaleString()} UZS
                                            {salary && ` • Belgilangan maosh: ${Number(salary).toLocaleString()} UZS`}
                                        </p>
                                    </div>
                                </div>
                                {grade.requirements && (
                                    <div className="max-w-md p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                                        <span className="font-bold text-slate-800 uppercase text-[10px] block mb-1">Talablar:</span>
                                        <p className="line-clamp-2">{grade.requirements}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <CareerPathRequirements
                            careerPath={dashboardData?.careerPath || null}
                            employeeId={dashboardData?.user?.employee?.id || currentUser?.employee?.id}
                            employeeName={fullName}
                            onRefresh={() => setRefreshKey((k) => k + 1)}
                        />

                        {(dashboardData?.user?.employee?.id || currentUser?.employee?.id) && (
                            <EmployeeJourneyTimeline
                                employeeId={dashboardData?.user?.employee?.id || currentUser?.employee?.id}
                                employeeName={fullName}
                            />
                        )}
                    </div>
                )}

                {activeTab === "okr" && (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                    Mening OKR Maqsadlarim
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Kvartallik maqsadlar va asosiy natijalar (Key Results) ijrosi
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-purple-50 text-[#9327FF] text-xs font-bold rounded-lg w-fit">
                                {okrs.length} ta maqsad biriktirilgan
                            </span>
                        </div>

                        <div className="flex flex-col gap-5">
                            {okrs.length === 0 ? (
                                <div className="p-12 border border-dashed border-slate-300 bg-white rounded-2xl text-center flex flex-col items-center justify-center gap-3">
                                    <span className="text-4xl">🎯</span>
                                    <p className="text-sm text-slate-500 font-semibold">
                                        Hozircha biriktirilgan OKR maqsadlar mavjud emas.
                                    </p>
                                </div>
                            ) : (
                                okrs.map((okr: any) => (
                                    <div key={okr.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs flex flex-col gap-5">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                                                        okr.level === "INDIVIDUAL"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : okr.level === "DEPARTMENT"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-emerald-100 text-emerald-800"
                                                    }`}>
                                                        {okr.level === "INDIVIDUAL" ? "👤 Shaxsiy OKR" : okr.level === "DEPARTMENT" ? `🏢 Bo'lim OKR${okr.department?.name ? ` (${okr.department.name})` : ""}` : "🌐 Kompaniya OKR"}
                                                    </span>
                                                    {okr.cycle?.title && (
                                                        <span className="text-[11px] font-bold text-slate-400">
                                                            • {okr.cycle.title}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-base font-black text-slate-900">{okr.title}</h3>
                                                {okr.description && <p className="text-xs text-slate-500 font-medium leading-relaxed">{okr.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-2xl font-black text-slate-900">{Math.round(okr.progress)}%</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Umumiy ijro</span>
                                                </div>
                                                <CircularProgress value={okr.progress} size={48} strokeWidth={4.5} color="#9327FF" />
                                            </div>
                                        </div>

                                        {okr.keyResults?.length > 0 && (
                                            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                                    Asosiy Natijalar (Key Results)
                                                </span>
                                                {okr.keyResults.map((kr: any) => {
                                                    const latestCheckIn = kr.checkIns?.[0];
                                                    const isPending = latestCheckIn?.status === "PENDING";
                                                    const isRejected = latestCheckIn?.status === "REJECTED";
                                                    const isApproved = kr.progress >= 100 || latestCheckIn?.status === "APPROVED";

                                                    return (
                                                        <div key={kr.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="flex flex-col gap-1.5 flex-1">
                                                                <span className="text-xs font-bold text-slate-900">{kr.title}</span>
                                                                <div className="flex items-center gap-3 w-full max-w-md">
                                                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className={`h-full transition-all duration-300 rounded-full ${isApproved ? "bg-emerald-500" : isPending ? "bg-amber-500" : isRejected ? "bg-rose-500" : "bg-[#9327FF]"}`} 
                                                                            style={{ width: `${Math.min(100, Math.max(0, kr.progress))}%` }} 
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
                                                                        {kr.currentValue} / {kr.targetValue} {kr.unit || ""} ({Math.round(kr.progress)}%)
                                                                    </span>
                                                                </div>
                                                                {latestCheckIn?.comment && (
                                                                    <div className="text-[11px] text-slate-500 italic mt-0.5">
                                                                        Topshirilgan hisobot: "{latestCheckIn.comment}"
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {isPending ? (
                                                                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                                                                        <span>⏳</span> Kutilmoqda
                                                                    </span>
                                                                ) : isApproved ? (
                                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                                                                        <span>✓</span> Tasdiqlangan
                                                                    </span>
                                                                ) : isRejected ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            setCheckInKr(kr);
                                                                            setCheckInComment("");
                                                                            setCheckInFile(null);
                                                                        }}
                                                                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                                                                    >
                                                                        🔄 Qayta topshirish
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setCheckInKr(kr);
                                                                            setCheckInComment("");
                                                                            setCheckInFile(null);
                                                                        }}
                                                                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs"
                                                                    >
                                                                        🚀 Topshirish
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
                )}

                {activeTab === "assessments" && (
                    <div className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs flex flex-col gap-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🧠</span>
                                        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                                            DISC Shaxsiyat Modeli
                                        </h3>
                                    </div>
                                    {discAssessment ? (
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                                            discAssessment.primaryType === "D" ? "bg-red-600 text-white" :
                                            discAssessment.primaryType === "I" ? "bg-amber-500 text-white" :
                                            discAssessment.primaryType === "S" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                                        }`}>
                                            {discAssessment.primaryType} {discAssessment.secondaryType ? `+ ${discAssessment.secondaryType}` : ""}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 rounded-md">
                                            Topshirilmagan
                                        </span>
                                    )}
                                </div>

                                {discAssessment ? (
                                    <div className="space-y-3">
                                        <div className="text-sm font-extrabold text-slate-800">
                                            {discAssessment.primaryType === "D" ? "Dominance (Yetakchilik)" :
                                             discAssessment.primaryType === "I" ? "Influence (Ta'sir o'tkazish)" :
                                             discAssessment.primaryType === "S" ? "Steadiness (Barqarorlik)" : "Conscientiousness (Aniqlik)"}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                                            <div className="p-2 rounded-xl bg-red-50 text-red-700">D: {discAssessment.dScore}%</div>
                                            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">I: {discAssessment.iScore}%</div>
                                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">S: {discAssessment.sScore}%</div>
                                            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">C: {discAssessment.cScore}%</div>
                                        </div>
                                        <button
                                            onClick={() => setIsDiscTestModalOpen(true)}
                                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center cursor-pointer mt-1"
                                        >
                                            🔄 Qayta topshirish
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            O'z xarakteringiz va professional kuchli tomonlaringizni aniqlash uchun testdan o'ting.
                                        </p>
                                        <button
                                            onClick={() => setIsDiscTestModalOpen(true)}
                                            className="w-full py-2.5 bg-[#9327FF] hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center cursor-pointer"
                                        >
                                            🧠 DISC Testini Topshirish
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs flex flex-col gap-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">💬</span>
                                        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                                            Kompaniya Qoniqish So'rovi (eNPS)
                                        </h3>
                                    </div>
                                    {latestEnps && (
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg">
                                            Baho: {latestEnps.score} / 10
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    {latestEnps 
                                        ? `Oxirgi baholash: ${new Date(latestEnps.submittedAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}`
                                        : "Kompaniyadagi muhit, jarayonlar va boshqaruv bo'yicha fikringizni bildiring."}
                                </p>
                                <button
                                    onClick={() => setIsEnpsModalOpen(true)}
                                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center cursor-pointer mt-auto shadow-xs"
                                >
                                    {latestEnps ? "🔄 Fikringizni Yangilash" : "💬 eNPS Bahosini Berish"}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                                        360° Baholash Natijalari
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Rahbar va hamkasblarning kompetensiyalar bo'yicha baholari
                                    </p>
                                </div>
                                {cycles.length > 0 && (
                                    <select
                                        value={selectedCycleId}
                                        onChange={(e) => setSelectedCycleId(e.target.value)}
                                        className="p-2 border border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider rounded-xl outline-none"
                                    >
                                        {cycles.map((c) => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {!feedbackReport || !feedbackReport.competencies || feedbackReport.competencies.length === 0 ? (
                                <p className="text-xs text-slate-400 font-medium py-6 text-center">
                                    Hali baholash natijalari mavjud emas.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                                <tr className="border-b border-slate-100">
                                                    <th className="px-4 py-3">Kompetensiya</th>
                                                    <th className="px-4 py-3 text-right">O'rtacha Ball</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {feedbackReport.competencies.map((comp: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-bold text-slate-900">{comp.competency}</td>
                                                        <td className="px-4 py-3 font-black text-right text-slate-900">{comp.averageScore} / 5.0</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {feedbackReport.anonymousComments?.length > 0 && (
                                        <div className="flex flex-col gap-3 pt-2">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                Anonim Izohlar
                                            </h4>
                                            <div className="flex flex-col gap-2">
                                                {feedbackReport.anonymousComments.map((comment: string, idx: number) => (
                                                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs italic text-slate-700 font-medium">
                                                        "{comment}"
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {pendingTasks.length > 0 && (
                            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-2xs flex flex-col gap-5">
                                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                                    Mening Baholash Vazifalarim ({pendingTasks.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pendingTasks.map((task) => (
                                        <div key={task.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col justify-between gap-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900">{task.target?.firstName} {task.target?.lastName}</span>
                                                    <span className="text-[11px] text-slate-500 font-medium">{task.target?.department?.name || "-"} • {task.target?.position?.title || "-"}</span>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700">
                                                    {task.type}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/${locale}/evaluate/${task.id}`)}
                                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors text-center cursor-pointer shadow-xs"
                                            >
                                                Baholash &rarr;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "offboarding" && (
                    <div className="flex flex-col gap-6">
                        {offboardingData && offboardingData.status !== "CANCELLED" ? (
                            <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-2xs flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl shrink-0">
                                            🏁
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <h2 className="text-lg font-black text-rose-950">
                                                    Offboarding & Aylanma Varaqasi
                                                </h2>
                                                <span
                                                    className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                                                        offboardingData.status === "COMPLETED"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-amber-100 text-amber-800"
                                                    }`}
                                                >
                                                    {offboardingData.status === "COMPLETED" ? "Yakunlangan" : "Jarayonda"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-rose-700 font-medium mt-0.5">
                                                HR tomonidan biriktirilgan aylanma varaqasi (Checklist) topshiriqlarini bajaring va tasdiqlang.
                                            </p>
                                        </div>
                                    </div>

                                    {offboardingData.lastWorkingDay && (
                                        <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl flex flex-col sm:items-end">
                                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Oxirgi ish kuni</span>
                                            <span className="text-xs font-black text-rose-950">
                                                {new Date(offboardingData.lastWorkingDay).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {offboardingData.reason && (
                                    <div className="text-xs text-slate-700 bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                                        <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mr-2">Ketish sababi:</span>
                                        {offboardingData.reason}
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">
                                            Checklist topshiriqlari ({(offboardingData.tasks || []).filter((t: any) => t.isCompleted).length} / {(offboardingData.tasks || []).length})
                                        </span>
                                        <span className="font-black text-rose-950 text-xs">
                                            {Math.round(
                                                (((offboardingData.tasks || []).filter((t: any) => t.isCompleted).length) /
                                                    Math.max((offboardingData.tasks || []).length, 1)) *
                                                    100
                                            )}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-rose-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-rose-500 to-emerald-500 transition-all duration-300 rounded-full"
                                            style={{
                                                width: `${Math.round(
                                                    (((offboardingData.tasks || []).filter((t: any) => t.isCompleted).length) /
                                                        Math.max((offboardingData.tasks || []).length, 1)) *
                                                        100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(offboardingData.tasks || []).map((task: any) => {
                                        const cat = getCategoryBadge(task.category);
                                        return (
                                            <div
                                                key={task.id}
                                                onClick={() => handleToggleOffboardingTask(task.id, task.isCompleted)}
                                                className={`p-4 border rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                                    task.isCompleted
                                                        ? "bg-emerald-50/50 border-emerald-200 text-slate-500"
                                                        : "bg-white border-slate-200 hover:border-rose-300 hover:shadow-2xs text-slate-900"
                                                }`}
                                            >
                                                <div className="flex items-start gap-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.isCompleted}
                                                        onChange={() => {}}
                                                        className="mt-0.5 w-4 h-4 rounded-md border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer pointer-events-none"
                                                    />
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-xs font-semibold ${task.isCompleted ? "line-through text-slate-400" : "text-slate-900"}`}>
                                                            {task.title}
                                                        </span>
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md w-fit ${cat.color}`}>
                                                            {cat.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0 rounded-md ${task.isCompleted ? "text-emerald-700 bg-emerald-100" : "text-slate-500 bg-slate-100"}`}>
                                                    {task.isCompleted ? "Bajarildi" : "Kutilmoqda"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-rose-100">
                                    {offboardingData.exitInterviewNotes ? (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 rounded-xl">
                                            <span>✓</span> Exit Interview topshirilgan
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsExitModalOpen(true)}
                                            className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors text-center shadow-xs cursor-pointer rounded-xl"
                                        >
                                            📝 Exit Interview topshirish
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-2xs flex flex-col gap-4 max-w-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                                        🏁
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900">
                                            Ishdan ketish arizasi (Offboarding)
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Hozirda sizda faol offboarding jarayoni mavjud emas.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsResignationModalOpen(true)}
                                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors text-center cursor-pointer"
                                >
                                    Ishdan ketish arizasini topshirish &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "payroll" && canManagePayroll && (
                    <div className="flex flex-col gap-8">
                        <PayrollManager />
                        <EmployeePayslipsSection />
                    </div>
                )}
            </main>

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

            <AbsenceReasonModal
                isOpen={isReasonModalOpen}
                onClose={() => setIsReasonModalOpen(false)}
                employeeId={dashboardData?.user?.employee?.id || currentUser?.employee?.id}
                employeeName={fullName}
                submittedBy="EMPLOYEE"
                onSaved={() => setRefreshKey((k) => k + 1)}
            />

            {checkInKr && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <span className="text-2xl">🎯</span>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        OKR Natijasini Topshirish
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                                        {checkInKr.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCheckInKr(null)}
                                className="text-slate-400 hover:text-slate-900 text-sm font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCheckIn} className="flex flex-col gap-4 mt-4">
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Maqsadli ko'rsatkich
                                </span>
                                <span className="text-sm font-black text-slate-900">
                                    {checkInKr.targetValue} {checkInKr.unit || ""} (100% bajarilgan deb topshiriladi)
                                </span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Bajarilgan ish bo'yicha hisobot / izoh
                                </label>
                                <textarea
                                    value={checkInComment}
                                    onChange={(e) => setCheckInComment(e.target.value)}
                                    placeholder="Ushbu vazifani qanday bajarganingiz haqida yozing..."
                                    rows={3}
                                    className="border border-slate-200 rounded-xl p-3 text-sm focus:border-[#9327FF] outline-none w-full font-medium"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
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
                                    className="border border-slate-200 rounded-xl p-2 text-xs font-medium w-full bg-slate-50 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:rounded-lg file:text-xs file:font-bold file:uppercase file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                                />
                                {checkInFile && (
                                    <div className="mt-2 p-2 border border-slate-200 bg-slate-50 rounded-xl flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={URL.createObjectURL(checkInFile)}
                                                alt="Preview"
                                                className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                                            />
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                                                {checkInFile.name}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCheckInFile(null)}
                                            className="text-xs font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider cursor-pointer"
                                        >
                                            O'chirish
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCheckInKr(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 rounded-xl transition-colors cursor-pointer"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCheckingIn}
                                    className="px-6 py-2 bg-[#9327FF] hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                                >
                                    {isCheckingIn ? "Yuborilmoqda..." : "🚀 Natijani Topshirish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
