"use client";

import { useState, useEffect } from "react";
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

export default function GradingManager() {
    const [grades, setGrades] = useState<JobGrade[]>([]);
    const [employees, setEmployees] = useState<EmployeeWithGrade[]>([]);
    const [promotions, setPromotions] = useState<PromotionRequest[]>([]);
    const [loading, setLoading] = useState(true);
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

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [gradesData, employeesData, promotionsData] = await Promise.all([
                fetchGrades().catch(() => []),
                fetchEmployeesWithGrades().catch(() => []),
                fetchPromotionRequests().catch(() => []),
            ]);
            setGrades(gradesData);
            setEmployees(employeesData);
            setPromotions(promotionsData);
        } catch (err: any) {
            showBanner("error", err.message || "Ma'lumotlarni yuklashda xatolik");
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
            showBanner("success", "Greyd muvaffaqiyatli yangilandi");
        } else {
            await createGrade(gradeData);
            showBanner("success", "Yangi greyd muvaffaqiyatli yaratildi");
        }
        await loadAllData();
    };

    const handleDeleteGrade = async (gradeId: string) => {
        if (!confirm("Haqiqatan ham ushbu greydni o'chirmoqchimisiz?")) return;
        try {
            setActionLoading(gradeId);
            await deleteGrade(gradeId);
            showBanner("success", "Greyd o'chirildi");
            await loadAllData();
        } catch (err: any) {
            showBanner("error", err.message || "O'chirishda xatolik yuz berdi");
        } finally {
            setActionLoading(null);
        }
    };

    const handleAssignGrade = async (employeeId: string, gradeId: string) => {
        await assignGradeToEmployee(employeeId, gradeId);
        showBanner("success", "Xodimga greyd muvaffaqiyatli biriktirildi");
        await loadAllData();
    };

    const handleCreatePromotion = async (data: any) => {
        await createPromotionRequest(data);
        showBanner("success", "Ko'tarilish so'rovi yuborildi");
        await loadAllData();
    };

    const handleProcessPromotion = async (requestId: string, action: "APPROVE" | "REJECT") => {
        try {
            setActionLoading(requestId);
            await processPromotionApproval(requestId, action);
            showBanner("success", action === "APPROVE" ? "So'rov tasdiqlandi va xodim lavozimi oshirildi" : "So'rov rad etildi");
            await loadAllData();
        } catch (err: any) {
            showBanner("error", err.message || "Amalni bajarishda xatolik");
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

    const getLevelBadgeColor = (level: number) => {
        switch (level) {
            case 1:
                return "bg-sky-50 text-sky-800 border-sky-200";
            case 2:
                return "bg-blue-50 text-blue-800 border-blue-200";
            case 3:
                return "bg-indigo-50 text-indigo-800 border-indigo-200";
            case 4:
                return "bg-purple-50 text-purple-800 border-purple-200";
            case 5:
                return "bg-amber-50 text-amber-800 border-amber-200";
            case 6:
                return "bg-emerald-50 text-emerald-800 border-emerald-200";
            default:
                return "bg-gray-50 text-gray-800 border-gray-200";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Kutilmoqda</span>;
            case "APPROVED_BY_MANAGER":
                return <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">Menejer tasdiqladi</span>;
            case "APPROVED_BY_HR":
                return <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Tasdiqlandi</span>;
            case "REJECTED":
                return <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">Rad etildi</span>;
            default:
                return <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">{status}</span>;
        }
    };

    return (
        <div className="w-full space-y-6">
            {bannerMessage && (
                <div
                    className={`p-4 border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all ${
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
                <div className="bg-white border border-black p-5 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Jami Greydlar</span>
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div className="text-3xl font-black text-black tracking-tight">{grades.length} ta</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {Array.from(new Set(grades.map((g) => g.level))).length} ta daraja toifasi
                    </div>
                </div>

                <div className="bg-white border border-black p-5 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Greydlangan Xodimlar</span>
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div className="text-3xl font-black text-black tracking-tight">
                        {assignedEmployeesCount} / {employees.length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {employees.length > 0 ? Math.round((assignedEmployeesCount / employees.length) * 100) : 0}% xodimlar qamrovi
                    </div>
                </div>

                <div className="bg-white border border-black p-5 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">O'rtacha Maosh Diapazoni</span>
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="text-lg font-black text-black tracking-tight mt-1">
                        {avgMinSalary.toLocaleString()} - {avgMaxSalary.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">UZS oralig'ida</div>
                </div>

                <div className="bg-white border border-black p-5 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Ko'tarilish So'rovlari</span>
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div className="text-3xl font-black text-black tracking-tight flex items-center gap-2">
                        <span>{pendingPromotionsCount}</span>
                        {pendingPromotionsCount > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 uppercase tracking-wider">
                                Ko'rib chiqishda
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Jami {promotions.length} ta so'rov berilgan
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black pb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setActiveTab("matrix")}
                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                            activeTab === "matrix"
                                ? "bg-black text-white border-black"
                                : "bg-white text-black border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                        Greydlar Matritsasi ({grades.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("employees")}
                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                            activeTab === "employees"
                                ? "bg-black text-white border-black"
                                : "bg-white text-black border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                        Xodimlar Taxtasi ({employees.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("promotions")}
                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors relative ${
                            activeTab === "promotions"
                                ? "bg-black text-white border-black"
                                : "bg-white text-black border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                        Ko'tarilish So'rovlari ({promotions.length})
                        {pendingPromotionsCount > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-red-600 text-white rounded-full">
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
                            className="px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Yangi Greyd
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setPromotionInitialEmployeeId(undefined);
                            setIsPromotionModalOpen(true);
                        }}
                        className="px-4 py-2.5 border border-black text-black text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Ko'tarish So'rovi
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                    Greyding ma'lumotlari yuklanmoqda...
                </div>
            ) : activeTab === "matrix" ? (
                <div className="space-y-6">
                    {grades.length === 0 ? (
                        <div className="bg-white border border-gray-200 p-12 text-center text-gray-500 text-xs">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Hozircha greydlar yaratilmagan. Yuqoridagi "Yangi Greyd" tugmasi orqali lavozim darajalarini belgilang.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {grades.map((grade) => {
                                const count = grade.employees ? grade.employees.length : 0;
                                return (
                                    <div
                                        key={grade.id}
                                        className="bg-white border border-black p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${getLevelBadgeColor(grade.level)}`}>
                                                    Level {grade.level}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 border border-gray-200">
                                                    {grade.code}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-black mb-2 tracking-tight">
                                                {grade.title}
                                            </h3>

                                            <div className="bg-gray-50 border border-gray-200 p-3 mb-4 space-y-1.5">
                                                <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                                    Maosh Diapazoni:
                                                </div>
                                                <div className="text-sm font-black text-black">
                                                    {grade.minSalary.toLocaleString()} — {grade.maxSalary.toLocaleString()} UZS
                                                </div>
                                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                                                    <div className="bg-black h-full w-full opacity-60" />
                                                </div>
                                            </div>

                                            {grade.requirements && (
                                                <div className="mb-3">
                                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                                                        Talablar:
                                                    </div>
                                                    <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50/50 p-2 border border-gray-100">
                                                        {grade.requirements}
                                                    </p>
                                                </div>
                                            )}

                                            {grade.responsibilities && (
                                                <div className="mb-3">
                                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                                                        Mas'uliyatlar:
                                                    </div>
                                                    <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50/50 p-2 border border-gray-100">
                                                        {grade.responsibilities}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-gray-200 mt-4 flex items-center justify-between">
                                            <div className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span>{count} nafar xodim</span>
                                            </div>

                                            {isHrOrDirector && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingGrade(grade);
                                                            setIsCreateModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                                                        title="Tahrirlash"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGrade(grade.id)}
                                                        disabled={actionLoading === grade.id || count > 0}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                                        title={count > 0 ? "Xodimlar biriktirilgan greydni o'chirib bo'lmaydi" : "O'chirish"}
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
                    <div className="bg-white border border-black p-4 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                placeholder="Xodim ismi, lavozimi yoki bo'limi bo'yicha qidirish..."
                                className="w-full border border-gray-300 pl-9 pr-3.5 py-2 text-xs focus:border-black focus:outline-none bg-[#fcfcfc]"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="border border-gray-300 px-3 py-2 text-xs focus:border-black focus:outline-none bg-[#fcfcfc]"
                            >
                                <option value="ALL">Barcha Bo'limlar</option>
                                {departmentsList.map((d) => (
                                    <option key={d} value={d!}>{d}</option>
                                ))}
                            </select>

                            <select
                                value={gradeLevelFilter}
                                onChange={(e) => setGradeLevelFilter(e.target.value)}
                                className="border border-gray-300 px-3 py-2 text-xs focus:border-black focus:outline-none bg-[#fcfcfc]"
                            >
                                <option value="ALL">Barcha Darajalar</option>
                                {Array.from(new Set(grades.map((g) => g.level)))
                                    .sort((a, b) => a - b)
                                    .map((lvl) => (
                                        <option key={lvl} value={String(lvl)}>
                                            Level {lvl}
                                        </option>
                                    ))}
                                <option value="NONE">Greydsiz Xodimlar</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white border border-black overflow-x-auto shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-black bg-gray-50 text-black uppercase tracking-wider font-bold text-[11px]">
                                    <th className="p-3.5">Xodim</th>
                                    <th className="p-3.5">Bo'lim</th>
                                    <th className="p-3.5">Lavozim</th>
                                    <th className="p-3.5">Joriy Greyd</th>
                                    <th className="p-3.5">Belgilangan Maosh</th>
                                    <th className="p-3.5 text-right">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            Qidiruvga mos keladigan xodim topilmadi.
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
                                            <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="p-3.5 font-bold text-black">
                                                    <div>{emp.firstName} {emp.lastName}</div>
                                                    <div className="text-[11px] font-normal text-gray-500">{emp.user?.email}</div>
                                                </td>
                                                <td className="p-3.5 text-gray-700">
                                                    {emp.department?.name || <span className="text-gray-400">Belgilanmagan</span>}
                                                </td>
                                                <td className="p-3.5 text-gray-700 font-medium">
                                                    {emp.position || <span className="text-gray-400">Belgilanmagan</span>}
                                                </td>
                                                <td className="p-3.5">
                                                    {grade ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${getLevelBadgeColor(grade.level)}`}>
                                                                L{grade.level}
                                                            </span>
                                                            <span className="font-semibold text-black">{grade.title}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200">
                                                            Greydsiz
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 font-mono text-black font-semibold">
                                                    {salary > 0 ? (
                                                        <div>
                                                            <div>{salary.toLocaleString()} UZS</div>
                                                            {salaryStatus}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 font-sans">Belgilanmagan</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {isHrOrDirector && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedEmployeeForAssign(emp);
                                                                    setIsAssignModalOpen(true);
                                                                }}
                                                                className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border border-black hover:bg-black hover:text-white transition-colors"
                                                            >
                                                                Greydlash
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEmployeeForHistory(emp);
                                                                setIsHistoryModalOpen(true);
                                                            }}
                                                            className="p-1 text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                                                            title="Karyera Tarixi"
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
                                                            className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                                            title="Lavozimni ko'tarish"
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
                    <div className="bg-white border border-black p-4 flex flex-wrap gap-2 items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-black">
                            Ko'tarilish va Daraja O'zgarishi So'rovlari
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPromotionStatusFilter("ALL")}
                                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                                    promotionStatusFilter === "ALL" ? "bg-black text-white border-black" : "bg-white text-black border-gray-300"
                                }`}
                            >
                                Barchasi ({promotions.length})
                            </button>
                            <button
                                onClick={() => setPromotionStatusFilter("PENDING")}
                                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                                    promotionStatusFilter === "PENDING" ? "bg-black text-white border-black" : "bg-white text-black border-gray-300"
                                }`}
                            >
                                Kutilmoqda ({promotions.filter((p) => p.status === "PENDING").length})
                            </button>
                            <button
                                onClick={() => setPromotionStatusFilter("APPROVED_BY_HR")}
                                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                                    promotionStatusFilter === "APPROVED_BY_HR" ? "bg-black text-white border-black" : "bg-white text-black border-gray-300"
                                }`}
                            >
                                Tasdiqlangan ({promotions.filter((p) => p.status === "APPROVED_BY_HR").length})
                            </button>
                            <button
                                onClick={() => setPromotionStatusFilter("REJECTED")}
                                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                                    promotionStatusFilter === "REJECTED" ? "bg-black text-white border-black" : "bg-white text-black border-gray-300"
                                }`}
                            >
                                Rad etilgan ({promotions.filter((p) => p.status === "REJECTED").length})
                            </button>
                        </div>
                    </div>

                    {filteredPromotions.length === 0 ? (
                        <div className="bg-white border border-gray-200 p-12 text-center text-gray-500 text-xs">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Ushbu toifada lavozim ko'tarish so'rovlari mavjud emas.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredPromotions.map((req) => (
                                <div
                                    key={req.id}
                                    className="bg-white border border-black p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xs"
                                >
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {getStatusBadge(req.status)}
                                            <span className="text-sm font-bold text-black">
                                                {req.employee?.firstName} {req.employee?.lastName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                ({req.employee?.department?.name || "Bo'limsiz"} — {req.employee?.position || "Xodim"})
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono ml-auto">
                                                {new Date(req.createdAt).toLocaleDateString("uz-UZ")}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 border border-gray-200 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-gray-500">Hozirgi Greyd:</span>
                                                <span className="font-semibold text-black">
                                                    {req.currentGrade ? `${req.currentGrade.title} (L${req.currentGrade.level})` : "Greydsiz"}
                                                </span>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-gray-500">Maqsadli Greyd:</span>
                                                <span className="font-bold text-black">
                                                    {req.targetGrade?.title} (L{req.targetGrade?.level})
                                                </span>
                                            </div>
                                            <div className="ml-auto font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                                                Yangi Maosh: {req.proposedSalary.toLocaleString()} UZS
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                            {req.okrScore !== null && req.okrScore !== undefined && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                                    OKR Natijasi: {req.okrScore}%
                                                </span>
                                            )}
                                            {req.feedback360Score !== null && req.feedback360Score !== undefined && (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                                                    360 Baholash: {req.feedback360Score} / 5.0
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-600 bg-white border border-gray-200 p-2.5">
                                            <span className="font-bold text-black">Asos:</span> {req.reason}
                                        </p>
                                    </div>

                                    {isHrOrDirector && (req.status === "PENDING" || req.status === "APPROVED_BY_MANAGER") && (
                                        <div className="flex lg:flex-col gap-2 shrink-0 justify-end">
                                            <button
                                                onClick={() => handleProcessPromotion(req.id, "APPROVE")}
                                                disabled={actionLoading === req.id}
                                                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Tasdiqlash
                                            </button>
                                            <button
                                                onClick={() => handleProcessPromotion(req.id, "REJECT")}
                                                disabled={actionLoading === req.id}
                                                className="px-5 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Rad etish
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
