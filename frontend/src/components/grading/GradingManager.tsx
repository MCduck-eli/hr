"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    JobGrade,
    EmployeeWithGrade,
    PromotionRequest,
    fetchGrades,
    createGrade,
    updateGrade,
    deleteGrade,
    fetchEmployeesWithGrades,
    assignGradeToEmployee,
    fetchPromotionRequests,
    createPromotionRequest,
    processPromotionApproval,
} from "@/src/services/grading-service";
import CreateGradeModal from "./CreateGradeModal";
import AssignGradeModal from "./AssignGradeModal";
import RequestPromotionModal from "./RequestPromotionModal";
import CareerHistoryModal from "./CareerHistoryModal";
import Skeleton from "@/src/components/ui/Skeleton";
import { getQueryData, setQueryData, isQueryStale, invalidateQuery } from "@/src/utils/query-cache";

export default function GradingManager() {
    const t = useTranslations("Grading");
    const cachedData = getQueryData<{
        grades: JobGrade[];
        employees: EmployeeWithGrade[];
        promotions: PromotionRequest[];
    }>("grading:all");

    const [grades, setGrades] = useState<JobGrade[]>(() => cachedData?.grades || []);
    const [employees, setEmployees] = useState<EmployeeWithGrade[]>(() => cachedData?.employees || []);
    const [promotions, setPromotions] = useState<PromotionRequest[]>(() => cachedData?.promotions || []);
    const [loading, setLoading] = useState(() => !cachedData);
    const [activeTab, setActiveTab] = useState<"matrix" | "employees" | "promotions">("matrix");
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGrade, setEditingGrade] = useState<JobGrade | null>(null);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedEmployeeForAssign, setSelectedEmployeeForAssign] = useState<EmployeeWithGrade | null>(null);

    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [promotionInitialEmployeeId, setPromotionInitialEmployeeId] = useState<string | undefined>(undefined);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<EmployeeWithGrade | null>(null);

    const [employeeSearch, setEmployeeSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("ALL");
    const [gradeLevelFilter, setGradeLevelFilter] = useState("ALL");
    const [promotionStatusFilter, setPromotionStatusFilter] = useState("ALL");

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [bannerMessage, setBannerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {}
        }
        loadAllData();
    }, []);

    const loadAllData = async (isBackground = false) => {
        const cached = getQueryData<{
            grades: JobGrade[];
            employees: EmployeeWithGrade[];
            promotions: PromotionRequest[];
        }>("grading:all");
        const isStale = isQueryStale("grading:all");

        if (cached) {
            setGrades(cached.grades || []);
            setEmployees(cached.employees || []);
            setPromotions(cached.promotions || []);
        } else if (!isBackground) {
            setLoading(true);
        }

        if (cached && !isStale && !isBackground) {
            setLoading(false);
            return;
        }

        try {
            const [gradesData, employeesData, promotionsData] = await Promise.all([
                fetchGrades().catch(() => []),
                fetchEmployeesWithGrades().catch(() => []),
                fetchPromotionRequests().catch(() => []),
            ]);
            setGrades(gradesData || []);
            setEmployees(employeesData || []);
            setPromotions(promotionsData || []);
            setQueryData("grading:all", {
                grades: gradesData || [],
                employees: employeesData || [],
                promotions: promotionsData || [],
            });
        } catch (err: any) {
            showBanner("error", err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    const showBanner = (type: "success" | "error", text: string) => {
        setBannerMessage({ type, text });
        setTimeout(() => {
            setBannerMessage(null);
        }, 5000);
    };

    const handleSaveGrade = async (gradeData: any) => {
        if (editingGrade) {
            await updateGrade(editingGrade.id, gradeData);
            showBanner("success", t("editGradeTitle"));
        } else {
            await createGrade(gradeData);
            showBanner("success", t("createGradeTitle"));
        }
        invalidateQuery("grading:all");
        await loadAllData();
    };

    const handleDeleteGrade = async (gradeId: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        try {
            setActionLoading(gradeId);
            await deleteGrade(gradeId);
            invalidateQuery("grading:all");
            await loadAllData();
        } catch (err: any) {
            showBanner("error", err.message || "Error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleAssignGrade = async (employeeId: string, gradeId: string) => {
        await assignGradeToEmployee(employeeId, gradeId);
        invalidateQuery("grading:all");
        await loadAllData();
    };

    const handleCreatePromotion = async (data: any) => {
        await createPromotionRequest(data);
        invalidateQuery("grading:all");
        await loadAllData();
    };

    const handleProcessPromotion = async (requestId: string, action: "APPROVE" | "REJECT") => {
        try {
            setActionLoading(requestId);
            await processPromotionApproval(requestId, action);
            invalidateQuery("grading:all");
            await loadAllData();
        } catch (err: any) {
            showBanner("error", err.message || "Error");
        } finally {
            setActionLoading(null);
        }
    };

    const isHrOrDirector =
        currentUser?.role === "HR_ADMIN" ||
        currentUser?.role === "DIRECTOR" ||
        currentUser?.role === "SUPER_ADMIN";

    const departmentsList = Array.from(
        new Set(employees.map((e) => e.department?.name).filter(Boolean)),
    );

    const filteredEmployees = employees.filter((emp) => {
        const matchesSearch =
            !employeeSearch ||
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(employeeSearch.toLowerCase()) ||
            (emp.position && emp.position.toLowerCase().includes(employeeSearch.toLowerCase())) ||
            (emp.department?.name && emp.department.name.toLowerCase().includes(employeeSearch.toLowerCase()));

        const matchesDept =
            departmentFilter === "ALL" || emp.department?.name === departmentFilter;

        const matchesLevel =
            gradeLevelFilter === "ALL" ||
            (emp.grade && String(emp.grade.level) === gradeLevelFilter) ||
            (gradeLevelFilter === "NONE" && !emp.grade);

        return matchesSearch && matchesDept && matchesLevel;
    });

    const filteredPromotions = promotions.filter((p) => {
        if (promotionStatusFilter === "ALL") return true;
        return p.status === promotionStatusFilter;
    });

    const pendingPromotionsCount = promotions.filter((p) => p.status === "PENDING" || p.status === "APPROVED_BY_MANAGER").length;
    const assignedEmployeesCount = employees.filter((e) => e.gradeId).length;

    const totalMinSalary = grades.reduce((acc, g) => acc + g.minSalary, 0);
    const totalMaxSalary = grades.reduce((acc, g) => acc + g.maxSalary, 0);
    const avgMinSalary = grades.length > 0 ? Math.round(totalMinSalary / grades.length) : 0;
    const avgMaxSalary = grades.length > 0 ? Math.round(totalMaxSalary / grades.length) : 0;

    const getLevelAccent = (level: number) => {
        switch (level) {
            case 1:
                return {
                    text: "text-blue-600",
                    progress: "from-blue-500 to-sky-400",
                    badge: "bg-blue-50 text-blue-700 border-blue-200",
                    dot: "bg-blue-500",
                };
            case 2:
                return {
                    text: "text-emerald-600",
                    progress: "from-emerald-500 to-teal-400",
                    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    dot: "bg-emerald-500",
                };
            case 3:
                return {
                    text: "text-violet-600",
                    progress: "from-violet-500 to-purple-400",
                    badge: "bg-violet-50 text-violet-700 border-violet-200",
                    dot: "bg-violet-500",
                };
            case 4:
                return {
                    text: "text-purple-600",
                    progress: "from-purple-500 to-fuchsia-400",
                    badge: "bg-purple-50 text-purple-700 border-purple-200",
                    dot: "bg-purple-500",
                };
            case 5:
                return {
                    text: "text-amber-600",
                    progress: "from-amber-500 to-orange-400",
                    badge: "bg-amber-50 text-amber-700 border-amber-200",
                    dot: "bg-amber-500",
                };
            case 6:
                return {
                    text: "text-rose-600",
                    progress: "from-rose-500 to-pink-400",
                    badge: "bg-rose-50 text-rose-700 border-rose-200",
                    dot: "bg-rose-500",
                };
            default:
                return {
                    text: "text-gray-600",
                    progress: "from-gray-500 to-slate-400",
                    badge: "bg-gray-50 text-gray-700 border-gray-200",
                    dot: "bg-gray-500",
                };
        }
    };

    const getLevelBadgeColor = (level: number) => {
        return getLevelAccent(level).badge;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-amber-50 text-amber-700 border border-amber-200">{t("statusPending")}</span>;
            case "APPROVED_BY_MANAGER":
                return <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-blue-50 text-blue-700 border border-blue-200">{t("statusApprovedManager")}</span>;
            case "APPROVED_BY_HR":
                return <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">{t("statusApprovedHr")}</span>;
            case "REJECTED":
                return <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-red-50 text-red-700 border border-red-200">{t("statusRejected")}</span>;
            default:
                return <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-gray-100 text-gray-700 border border-gray-200">{status}</span>;
        }
    };

    return (
        <div className="w-full space-y-6">
            {bannerMessage && (
                <div
                    className={`p-4 rounded-2xl border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all ${
                        bannerMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-800 border-red-200"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {bannerMessage.type === "success" ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <span>{bannerMessage.text}</span>
                    </div>
                    <button
                        onClick={() => setBannerMessage(null)}
                        className="text-xs opacity-70 hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">{t("totalGrades")}</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#9327FF] flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="w-16 h-8 rounded-lg" />
                            <Skeleton className="w-28 h-4 rounded-md" />
                        </div>
                    ) : (
                        <>
                            <div className="text-3xl font-bold text-gray-900 tracking-tight">{grades.length}</div>
                            <div className="text-xs text-gray-500 mt-1 font-medium">
                                {t("levelCategoriesCount", { count: Array.from(new Set(grades.map((g) => g.level))).length })}
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">{t("gradedEmployees")}</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="w-20 h-8 rounded-lg" />
                            <Skeleton className="w-32 h-4 rounded-md" />
                        </div>
                    ) : (
                        <>
                            <div className="text-3xl font-bold text-gray-900 tracking-tight">
                                {assignedEmployeesCount} / {employees.length}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 font-medium">
                                {t("employeeCoverage", { percent: employees.length > 0 ? Math.round((assignedEmployeesCount / employees.length) * 100) : 0 })}
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">{t("avgSalaryRange")}</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="w-32 h-6 rounded-lg mt-1" />
                            <Skeleton className="w-24 h-4 rounded-md" />
                        </div>
                    ) : (
                        <>
                            <div className="text-base font-bold text-gray-900 tracking-tight mt-1 truncate">
                                {avgMinSalary.toLocaleString()} - {avgMaxSalary.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 font-medium">{t("salaryRangeUnit")}</div>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">{t("promotionRequests")}</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="w-16 h-8 rounded-lg" />
                            <Skeleton className="w-28 h-4 rounded-md" />
                        </div>
                    ) : (
                        <>
                            <div className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <span>{pendingPromotionsCount}</span>
                                {pendingPromotionsCount > 0 && (
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                                        {t("inReview")}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 font-medium">
                                {t("totalRequestsCount", { count: promotions.length })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setActiveTab("matrix")}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                            activeTab === "matrix"
                                ? "bg-violet-100 text-violet-700 shadow-xs"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        {t("gradesMatrix")} {loading && grades.length === 0 ? "" : `(${grades.length})`}
                    </button>
                    <button
                        onClick={() => setActiveTab("employees")}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                            activeTab === "employees"
                                ? "bg-violet-100 text-violet-700 shadow-xs"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        {t("employeesBoard")} {loading && employees.length === 0 ? "" : `(${employees.length})`}
                    </button>
                    <button
                        onClick={() => setActiveTab("promotions")}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all relative cursor-pointer ${
                            activeTab === "promotions"
                                ? "bg-violet-100 text-violet-700 shadow-xs"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        {t("promotionRequests")} {loading && promotions.length === 0 ? "" : `(${promotions.length})`}
                        {pendingPromotionsCount > 0 && (
                            <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-red-600 text-white rounded-full">
                                {pendingPromotionsCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {isHrOrDirector && (
                        <button
                            onClick={() => {
                                setEditingGrade(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="bg-[#9327FF] text-white rounded-xl shadow-sm px-5 py-2.5 hover:opacity-90 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t("newGrade")}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setPromotionInitialEmployeeId(undefined);
                            setIsPromotionModalOpen(true);
                        }}
                        className="bg-white border border-gray-200 text-gray-700 rounded-xl px-5 py-2.5 hover:bg-gray-50 shadow-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {t("requestPromotion")}
                    </button>
                </div>
            </div>

            {loading ? (
                activeTab === "matrix" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="w-20 h-6 rounded-lg" />
                                    <Skeleton className="w-16 h-6 rounded-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="w-3/4 h-5 rounded-md" />
                                    <Skeleton className="w-full h-3.5 rounded-md" />
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="w-16 h-3.5 rounded" />
                                        <Skeleton className="w-24 h-4 rounded" />
                                    </div>
                                    <Skeleton className="w-full h-2 rounded-full" />
                                </div>
                                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                                    <Skeleton className="w-24 h-4 rounded" />
                                    <div className="flex gap-2">
                                        <Skeleton className="w-7 h-7 rounded-lg" />
                                        <Skeleton className="w-7 h-7 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activeTab === "employees" ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                    <div className="space-y-1.5 flex-1 max-w-xs">
                                        <Skeleton className="w-36 h-4 rounded" />
                                        <Skeleton className="w-24 h-3 rounded" />
                                    </div>
                                </div>
                                <Skeleton className="w-28 h-6 rounded-lg hidden sm:block" />
                                <Skeleton className="w-20 h-6 rounded-lg" />
                                <Skeleton className="w-20 h-8 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                    <div className="space-y-1.5 flex-1 max-w-xs">
                                        <Skeleton className="w-40 h-4 rounded" />
                                        <Skeleton className="w-28 h-3 rounded" />
                                    </div>
                                </div>
                                <Skeleton className="w-24 h-6 rounded-lg hidden md:block" />
                                <Skeleton className="w-20 h-6 rounded-lg" />
                                <div className="flex gap-2">
                                    <Skeleton className="w-16 h-8 rounded-xl" />
                                    <Skeleton className="w-16 h-8 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : activeTab === "matrix" ? (
                <div className="space-y-6">
                    {grades.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center text-2xl">
                                📂
                            </div>
                            <span className="text-gray-400 font-medium text-sm">
                                {t("noGrades")}
                            </span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {grades.map((grade) => {
                                const count = grade.employees ? grade.employees.length : 0;
                                const lvlInfo = getLevelAccent(grade.level);
                                return (
                                    <div
                                        key={grade.id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all relative"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${lvlInfo.badge}`}>
                                                    Level {grade.level}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                                                    {grade.code}
                                                </span>
                                            </div>

                                            <h3 className={`text-base font-bold mb-2 tracking-tight ${lvlInfo.text}`}>
                                                {grade.title}
                                            </h3>

                                            <div className="bg-gray-50/80 rounded-xl border border-gray-100 p-4 mb-4 space-y-2">
                                                <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                                    {t("salaryRange")}
                                                </div>
                                                <div className="text-sm font-bold text-gray-900">
                                                    {grade.minSalary.toLocaleString()} — {grade.maxSalary.toLocaleString()} UZS
                                                </div>
                                                <div className="w-full bg-gray-200/80 h-2 rounded-full overflow-hidden mt-2">
                                                    <div className={`bg-gradient-to-r ${lvlInfo.progress} h-full w-full rounded-full`} />
                                                </div>
                                            </div>

                                            {grade.requirements && (
                                                <div className="mb-3">
                                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                                                        {t("requirements")}
                                                    </div>
                                                    <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                                                        {grade.requirements}
                                                    </p>
                                                </div>
                                            )}

                                            {grade.responsibilities && (
                                                <div className="mb-3">
                                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                                                        {t("responsibilities")}
                                                    </div>
                                                    <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                                                        {grade.responsibilities}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span>{t("employeesCount", { count })}</span>
                                            </div>

                                            {isHrOrDirector && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingGrade(grade);
                                                            setIsCreateModalOpen(true);
                                                        }}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                                                        title={t("edit")}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGrade(grade.id)}
                                                        disabled={actionLoading === grade.id || count > 0}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-30 cursor-pointer"
                                                        title={t("delete")}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : activeTab === "employees" ? (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                placeholder={t("searchPlaceholder")}
                                className="w-full rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-purple-500/20 pl-9 pr-3.5 py-2.5 text-xs outline-none text-gray-800"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-purple-500/20 px-3.5 py-2.5 text-xs outline-none text-gray-800 font-medium"
                            >
                                <option value="ALL">{t("allDepartments")}</option>
                                {departmentsList.map((d) => (
                                    <option key={d} value={d!}>{d}</option>
                                ))}
                            </select>

                            <select
                                value={gradeLevelFilter}
                                onChange={(e) => setGradeLevelFilter(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-purple-500/20 px-3.5 py-2.5 text-xs outline-none text-gray-800 font-medium"
                            >
                                <option value="ALL">{t("allLevels")}</option>
                                {Array.from(new Set(grades.map((g) => g.level)))
                                    .sort((a, b) => a - b)
                                    .map((lvl) => (
                                        <option key={lvl} value={String(lvl)}>
                                            Level {lvl}
                                        </option>
                                    ))}
                                <option value="NONE">{t("unassigned")}</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60 text-gray-500 uppercase tracking-wider font-bold text-[11px]">
                                    <th className="p-4">{t("employee")}</th>
                                    <th className="p-4">{t("department")}</th>
                                    <th className="p-4">{t("position")}</th>
                                    <th className="p-4">{t("currentGrade")}</th>
                                    <th className="p-4">{t("currentSalary")}</th>
                                    <th className="p-4 text-right">{t("actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                                            {t("noEmployeesFound")}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map((emp) => {
                                        const salary = emp.salary || 0;
                                        const grade = emp.grade;
                                        let salaryStatus = null;
                                        if (grade && salary > 0) {
                                            if (salary < grade.minSalary) {
                                                salaryStatus = <span className="text-[10px] text-amber-700 font-semibold">(Min dan kam)</span>;
                                            } else if (salary > grade.maxSalary) {
                                                salaryStatus = <span className="text-[10px] text-purple-700 font-semibold">(Max dan yuqori)</span>;
                                            } else {
                                                salaryStatus = <span className="text-[10px] text-emerald-700 font-semibold">(Normal)</span>;
                                            }
                                        }

                                        return (
                                            <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="p-4 font-bold text-gray-900">
                                                    <div>{emp.firstName} {emp.lastName}</div>
                                                    <div className="text-[11px] font-normal text-gray-400">{emp.user?.email}</div>
                                                </td>
                                                <td className="p-4 text-gray-700">
                                                    {emp.department?.name || <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="p-4 text-gray-700 font-medium">
                                                    {emp.position || <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="p-4">
                                                    {grade ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-lg border ${getLevelBadgeColor(grade.level)}`}>
                                                                L{grade.level}
                                                            </span>
                                                            <span className="font-semibold text-gray-900">{grade.title}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-gray-100 text-gray-500 rounded-lg border border-gray-200">
                                                            {t("unassigned")}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 font-mono text-gray-900 font-semibold">
                                                    {salary > 0 ? (
                                                        <div>
                                                            <div>{salary.toLocaleString()} UZS</div>
                                                            {salaryStatus}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 font-sans">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {isHrOrDirector && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedEmployeeForAssign(emp);
                                                                    setIsAssignModalOpen(true);
                                                                }}
                                                                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                                            >
                                                                {emp.grade ? t("changeGrade") : t("assignGrade")}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEmployeeForHistory(emp);
                                                                setIsHistoryModalOpen(true);
                                                            }}
                                                            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                                                            title={t("history")}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setPromotionInitialEmployeeId(emp.id);
                                                                setIsPromotionModalOpen(true);
                                                            }}
                                                            className="p-2 rounded-xl text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer"
                                                            title={t("requestPromotion")}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-2 items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            {t("promotionRequests")}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPromotionStatusFilter("ALL")}
                                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                    promotionStatusFilter === "ALL" ? "bg-[#9327FF] text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                {t("allStatuses")} ({promotions.length})
                            </button>
                            <button
                                onClick={() => setPromotionStatusFilter("PENDING")}
                                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                    promotionStatusFilter === "PENDING" ? "bg-[#9327FF] text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                {t("statusPending")} ({promotions.filter((p) => p.status === "PENDING").length})
                            </button>
                            <button
                                onClick={() => setPromotionStatusFilter("APPROVED_BY_HR")}
                                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                    promotionStatusFilter === "APPROVED_BY_HR" ? "bg-[#9327FF] text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                {t("statusApprovedHr")} ({promotions.filter((p) => p.status === "APPROVED_BY_HR").length})
                            </button>
                            <button
                                onClick={() => setPromotionStatusFilter("REJECTED")}
                                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                    promotionStatusFilter === "REJECTED" ? "bg-[#9327FF] text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                {t("statusRejected")} ({promotions.filter((p) => p.status === "REJECTED").length})
                            </button>
                        </div>
                    </div>

                    {filteredPromotions.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center text-2xl">
                                📂
                            </div>
                            <span className="text-gray-400 font-medium text-sm">
                                {t("noPromotionsFound")}
                            </span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredPromotions.map((req) => (
                                <div
                                    key={req.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all"
                                >
                                    <div className="space-y-3 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {getStatusBadge(req.status)}
                                            <span className="text-sm font-bold text-gray-900">
                                                {req.employee?.firstName} {req.employee?.lastName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                ({req.employee?.department?.name || "-"} — {req.employee?.position || "-"})
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono ml-auto">
                                                {new Date(req.createdAt).toLocaleDateString("uz-UZ")}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 bg-gray-50/80 rounded-xl p-4 border border-gray-100 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-gray-500">{t("currentGrade")}:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {req.currentGrade ? `${req.currentGrade.title} (L${req.currentGrade.level})` : t("unassigned")}
                                                </span>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-gray-500">{t("targetGrade")}:</span>
                                                <span className="font-bold text-gray-900">
                                                    {req.targetGrade?.title} (L{req.targetGrade?.level})
                                                </span>
                                            </div>
                                            <div className="ml-auto font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                                                {t("proposedSalary")}: {req.proposedSalary.toLocaleString()} UZS
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                            {req.okrScore !== null && req.okrScore !== undefined && (
                                                <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                                    OKR: {req.okrScore}%
                                                </span>
                                            )}
                                            {req.feedback360Score !== null && req.feedback360Score !== undefined && (
                                                <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                                                    360: {req.feedback360Score} / 5.0
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-600 bg-gray-50/50 rounded-xl border border-gray-100 p-3">
                                            <span className="font-bold text-gray-900">{t("reason")}:</span> {req.reason}
                                        </p>
                                    </div>

                                    {isHrOrDirector && (req.status === "PENDING" || req.status === "APPROVED_BY_MANAGER") && (
                                        <div className="flex lg:flex-col gap-2 shrink-0 justify-end">
                                            <button
                                                onClick={() => handleProcessPromotion(req.id, "APPROVE")}
                                                disabled={actionLoading === req.id}
                                                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {t("approve")}
                                            </button>
                                            <button
                                                onClick={() => handleProcessPromotion(req.id, "REJECT")}
                                                disabled={actionLoading === req.id}
                                                className="px-5 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                {t("reject")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <CreateGradeModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingGrade(null);
                }}
                onSave={handleSaveGrade}
                editingGrade={editingGrade}
                existingGrades={grades}
                companyName={currentUser?.companyName || (grades.length > 0 ? grades[0].companyName : null)}
            />

            <AssignGradeModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setSelectedEmployeeForAssign(null);
                }}
                onAssign={handleAssignGrade}
                employee={selectedEmployeeForAssign}
                grades={grades}
            />

            <RequestPromotionModal
                isOpen={isPromotionModalOpen}
                onClose={() => {
                    setIsPromotionModalOpen(false);
                    setPromotionInitialEmployeeId(undefined);
                }}
                onSubmit={handleCreatePromotion}
                employees={employees}
                grades={grades}
                initialEmployeeId={promotionInitialEmployeeId}
            />

            <CareerHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => {
                    setIsHistoryModalOpen(false);
                    setSelectedEmployeeForHistory(null);
                }}
                employee={selectedEmployeeForHistory}
            />
        </div>
    );
}
