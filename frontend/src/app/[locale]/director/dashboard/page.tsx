"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/src/components/hr/employees/status-badge";
import EmployeeForm from "@/src/components/hr/employees/employee-form";
import DepartmentModal from "@/src/components/hr/employees/department-modal";
import { fetchAllUsers, createUser, updateUser, deleteUser } from "@/src/services/user-service";
import { fetchDepartments, createDepartment, deleteDepartment } from "@/src/services/department-service";
import ExecutiveAnalyticsDashboard from "@/src/components/analytics/ExecutiveAnalyticsDashboard";
import OrgChartTree from "@/src/components/org-chart/OrgChartTree";
import EmailVerificationModal from "@/src/components/common/EmailVerificationModal";
import { sendOtpApi } from "@/src/services/auth";

export default function DirectorDashboard() {
    const t = useTranslations("DirectorDashboard");
    const tEmp = useTranslations("HREmployees");
    const params = useParams();
    const locale = (params.locale as string) || "uz";
    const router = useRouter();

    const [companyName, setCompanyName] = useState("");
    const [activeTab, setActiveTab] = useState<"employees" | "departments" | "analytics" | "orgchart">("analytics");

    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [pendingEmployeeData, setPendingEmployeeData] = useState<any>(null);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!userStr || !token) {
            router.push(`/${locale}/login`);
            return;
        }
        try {
            const user = JSON.parse(userStr);
            setCompanyName(user.companyName || user.employee?.companyName || "");
            if (user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN") {
                router.push(`/${locale}/profile`);
            }
        } catch (e) {
            router.push(`/${locale}/login`);
        }
    }, [locale, router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, deptsData] = await Promise.all([
                fetchAllUsers().catch(() => []),
                fetchDepartments().catch(() => []),
            ]);

            const filteredUsers = (usersData || []).filter(
                (u: any) => u.role !== "SUPER_ADMIN" && u.role !== "DIRECTOR",
            );
            setUsers(filteredUsers);
            setDepartments(deptsData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLoginAs = (targetUser: any) => {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
            localStorage.setItem("originalAdminUser", currentUser);
        }
        localStorage.setItem("user", JSON.stringify(targetUser));
        document.cookie = `user_role=${targetUser.role || ""}; path=/; max-age=86400; SameSite=Lax`;

        if (targetUser.role === "HR_ADMIN") {
            router.push(`/${locale}/hr/dashboard`);
        } else if (targetUser.role === "MANAGER") {
            router.push(`/${locale}/manager/okr`);
        } else if (targetUser.role === "RECRUITER") {
            router.push(`/${locale}/recruiter/vacancies`);
        } else {
            router.push(`/${locale}/profile`);
        }
    };

    const handleOpenCreateEmployee = () => {
        setEditingUser(null);
        setIsEmployeeModalOpen(true);
    };

    const handleOpenEditEmployee = (user: any) => {
        setEditingUser(user);
        setIsEmployeeModalOpen(true);
    };

    const handleEmployeeSubmit = async (formData: any) => {
        if (editingUser) {
            setFormLoading(true);
            try {
                const payload = { ...formData };
                if (!payload.password) {
                    delete payload.password;
                }
                await updateUser(editingUser.id, payload);
                setIsEmployeeModalOpen(false);
                setEditingUser(null);
                loadData();
            } catch (err: any) {
                alert(err.message || "Error");
            } finally {
                setFormLoading(false);
            }
            return;
        }

        setFormLoading(true);
        try {
            await sendOtpApi({ email: formData.email, checkExisting: true });
            setPendingEmployeeData(formData);
            setIsVerificationModalOpen(true);
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleVerifiedEmployeeSubmit = async () => {
        if (!pendingEmployeeData) return;
        setFormLoading(true);
        try {
            await createUser(pendingEmployeeData);
            setIsVerificationModalOpen(false);
            setIsEmployeeModalOpen(false);
            setPendingEmployeeData(null);
            setEditingUser(null);
            loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteEmployee = (user: any) => {
        setDeleteModalUser(user);
    };

    const confirmDeleteEmployee = async () => {
        if (!deleteModalUser) return;
        setIsDeleting(true);
        try {
            await deleteUser(deleteModalUser.id);
            setDeleteModalUser(null);
            loadData();
            showToast(tEmp("deletedSuccess") || "Xodim muvaffaqiyatli o'chirildi", "success");
        } catch (err: any) {
            showToast(err.message || tEmp("deleteError") || "Error", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveDepartment = async (name: string, parentId?: string) => {
        try {
            await createDepartment({ name, parentId });
            loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleDeleteDept = async (id: string) => {
        if (!window.confirm("Haqiqatan ham ushbu bo'limni o'chirmoqchimisiz?")) return;
        try {
            await deleteDepartment(id);
            loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const filteredUsers = users.filter((u) => {
        const query = searchQuery.toLowerCase();
        const fullName = `${u.employee?.firstName || ""} ${u.employee?.lastName || ""}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        const deptName = (u.employee?.department?.name || "").toLowerCase();
        const role = (u.role || "").toLowerCase();
        return (
            fullName.includes(query) ||
            email.includes(query) ||
            deptName.includes(query) ||
            role.includes(query)
        );
    });

    const hrAdminsCount = users.filter((u) => u.role === "HR_ADMIN").length;

    return (
        <div className="min-h-screen bg-slate-50/60 flex flex-col md:flex-row">
            <aside className="w-full md:w-72 bg-white border-r border-slate-100 shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto flex flex-col justify-between z-20">
                <div className="p-5 flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-2 pt-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#9327FF] to-purple-800 text-white flex items-center justify-center font-black text-base shadow-sm">
                            {companyName ? companyName[0].toUpperCase() : "D"}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-900 truncate">
                                {companyName || "Kompaniya"}
                            </span>
                            <span className="text-[11px] font-semibold text-[#9327FF] uppercase tracking-wider">
                                Direktor Paneli
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Boshqaruv
                        </span>

                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                activeTab === "analytics"
                                    ? "bg-purple-50 text-[#9327FF] shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <svg className={`w-4 h-4 ${activeTab === "analytics" ? "text-[#9327FF]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>BI & 9-Box Analitika</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab("orgchart")}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                activeTab === "orgchart"
                                    ? "bg-purple-50 text-[#9327FF] shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <svg className={`w-4 h-4 ${activeTab === "orgchart" ? "text-[#9327FF]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span>Tashkiliy Tuzilma</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab("employees")}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                activeTab === "employees"
                                    ? "bg-purple-50 text-[#9327FF] shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <svg className={`w-4 h-4 ${activeTab === "employees" ? "text-[#9327FF]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span>{t("employeesTab")}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                activeTab === "employees" ? "bg-purple-200/60 text-[#9327FF]" : "bg-slate-100 text-slate-600"
                            }`}>
                                {users.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab("departments")}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                activeTab === "departments"
                                    ? "bg-purple-50 text-[#9327FF] shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <svg className={`w-4 h-4 ${activeTab === "departments" ? "text-[#9327FF]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>{t("departmentsTab")}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                activeTab === "departments" ? "bg-purple-200/60 text-[#9327FF]" : "bg-slate-100 text-slate-600"
                            }`}>
                                {departments.length}
                            </span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-1 pt-3 border-t border-slate-100">
                        <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Platforma Bo'limlari
                        </span>

                        <Link
                            href={`/${locale}/hr/okr`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>OKR Maqsadlar</span>
                        </Link>

                        <Link
                            href={`/${locale}/grading`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Greyding Tizimi</span>
                        </Link>

                        <Link
                            href={`/${locale}/disc`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                            </svg>
                            <span>DISC Modeli</span>
                        </Link>

                        <Link
                            href={`/${locale}/hr/feedback360`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>360° Baholash</span>
                        </Link>

                        <Link
                            href={`/${locale}/profile?tab=payroll`}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Oylik & Moliya</span>
                        </Link>
                    </div>
                </div>

                <div className="p-4 m-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#9327FF] flex items-center justify-center font-bold text-sm">
                        👑
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800">Direktor Hub</span>
                        <span className="text-[10px] text-slate-500 truncate">SaaS Enterprise v2.4</span>
                    </div>
                </div>
            </aside>

            <main className="flex-1 min-w-0 p-6 md:p-10 flex flex-col gap-8 bg-slate-50/60 overflow-y-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 bg-purple-50 text-[#9327FF] text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#9327FF]"></span>
                                Direktor Kabineti
                            </span>
                            {companyName && (
                                <span className="text-xs font-semibold text-slate-500">
                                    • {companyName}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {companyName ? `${companyName} • ${t("title")}` : t("title")}
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm font-medium">
                            {t("welcome")}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleOpenCreateEmployee}
                            className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-5 py-2.5 transition-all duration-200 shadow-sm flex items-center gap-2 text-xs md:text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span>{t("createEmployee")}</span>
                        </button>
                        <button
                            onClick={() => setIsDeptModalOpen(true)}
                            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium rounded-xl px-5 py-2.5 transition-all duration-200 shadow-sm flex items-center gap-2 text-xs md:text-sm"
                        >
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{t("createDepartment")}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div
                        onClick={() => setActiveTab("employees")}
                        className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${
                            activeTab === "employees"
                                ? "bg-white border-[#9327FF] ring-2 ring-[#9327FF]/10"
                                : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t("totalEmployees")}
                            </span>
                            <span className="text-3xl font-extrabold text-slate-900">{users.length}</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#9327FF] flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>

                    <div
                        onClick={() => setActiveTab("departments")}
                        className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${
                            activeTab === "departments"
                                ? "bg-white border-[#9327FF] ring-2 ring-[#9327FF]/10"
                                : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t("totalDepartments")}
                            </span>
                            <span className="text-3xl font-extrabold text-slate-900">{departments.length}</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t("activeAdmins")}
                            </span>
                            <span className="text-3xl font-extrabold text-[#9327FF]">{hrAdminsCount}</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {activeTab === "analytics" && (
                    <div className="flex flex-col gap-6">
                        <ExecutiveAnalyticsDashboard />
                    </div>
                )}

                {activeTab === "orgchart" && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                        <div className="pb-5 mb-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Tashkiliy Ierarxiya va Strukturasi</h2>
                                <p className="text-xs text-slate-500">Bo'limlar va hisobot munosabatlari xaritasi</p>
                            </div>
                        </div>
                        <OrgChartTree />
                    </div>
                )}

                {activeTab === "employees" && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-base font-bold text-slate-900">
                                    {t("employeesTab")}
                                </h2>
                                <span className="px-3 py-1 bg-purple-50 text-[#9327FF] text-xs font-bold rounded-full">
                                    {filteredUsers.length} ta xodim
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Ism, email yoki bo'lim..."
                                        className="pl-9 pr-4 py-2.5 border border-slate-200 text-xs bg-slate-50/50 rounded-xl outline-none focus:bg-white focus:border-[#9327FF] focus:ring-2 focus:ring-[#9327FF]/10 w-64 md:w-72 transition-all"
                                    />
                                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <button
                                    onClick={handleOpenCreateEmployee}
                                    className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-4 py-2.5 transition-all duration-200 shadow-sm whitespace-nowrap flex items-center gap-1.5 text-xs"
                                >
                                    <span>+</span>
                                    <span>{tEmp("addEmployee")}</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] text-slate-400 uppercase tracking-wider font-bold whitespace-nowrap">
                                        <th className="p-4 pl-6">{tEmp("name")}</th>
                                        <th className="p-4">{tEmp("status")}</th>
                                        <th className="p-4">{tEmp("email")}</th>
                                        <th className="p-4">{tEmp("role")}</th>
                                        <th className="p-4">{tEmp("department")}</th>
                                        <th className="p-4 pr-6 text-right">{tEmp("actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-400 font-semibold text-xs">
                                                Yuklanmoqda...
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-400 font-semibold text-xs">
                                                {tEmp("noUsers")}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="p-4 pl-6 text-xs font-medium text-slate-900 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                                                            {u.employee?.firstName?.[0] || u.email[0]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">
                                                                {u.employee?.firstName} {u.employee?.lastName}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                ID: {u.id.slice(0, 8)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <StatusBadge
                                                        status={u.employee?.status}
                                                        statusConfig={u.employee?.statusConfig}
                                                        statusExpiresAt={u.employee?.statusExpiresAt}
                                                    />
                                                </td>
                                                <td className="p-4 text-xs font-medium text-slate-600 font-mono">
                                                    {u.email}
                                                </td>
                                                <td className="p-4 text-xs font-semibold uppercase text-slate-600">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                                        u.role === "HR_ADMIN"
                                                            ? "bg-purple-100 text-[#9327FF]"
                                                            : u.role === "MANAGER"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : u.role === "RECRUITER"
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-slate-100 text-slate-700"
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs font-semibold text-slate-700">
                                                    {u.employee?.department?.name || "-"}
                                                </td>
                                                <td className="p-4 pr-6 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleLoginAs(u)}
                                                            className="px-3 py-1.5 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-[11px] font-medium rounded-lg transition-colors shadow-xs flex items-center gap-1"
                                                        >
                                                            <span>🔑</span>
                                                            <span>{t("enterAccount")}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => router.push(`/${locale}/profile?userId=${u.id}`)}
                                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs"
                                                        >
                                                            Profil
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEditEmployee(u)}
                                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs"
                                                        >
                                                            {tEmp("edit")}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEmployee(u)}
                                                            className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
                                                        >
                                                            {tEmp("delete")}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "departments" && (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center gap-3">
                                <h2 className="text-base font-bold text-slate-900">
                                    {t("departmentsTab")}
                                </h2>
                                <span className="px-3 py-1 bg-purple-50 text-[#9327FF] text-xs font-bold rounded-full">
                                    {departments.length} ta bo'lim
                                </span>
                            </div>
                            <button
                                onClick={() => setIsDeptModalOpen(true)}
                                className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-5 py-2.5 transition-all duration-200 shadow-sm flex items-center gap-2 text-xs md:text-sm"
                            >
                                <span>+</span>
                                <span>{t("createDepartment")}</span>
                            </button>
                        </div>

                        {departments.length === 0 ? (
                            <div className="p-16 bg-white border border-slate-100 text-center rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                                <span className="text-4xl block mb-3">🏢</span>
                                <h3 className="text-base font-bold text-slate-900 mb-1">
                                    {t("noDepartments")}
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">Hozircha hech qanday bo'lim yaratilmagan</p>
                                <button
                                    onClick={() => setIsDeptModalOpen(true)}
                                    className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-6 py-2.5 transition-all duration-200 shadow-sm text-xs"
                                >
                                    + {t("createDepartment")}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {departments.map((dept) => {
                                    const deptEmployees = users.filter(
                                        (u) => u.employee?.departmentId === dept.id,
                                    );

                                    return (
                                        <div
                                            key={dept.id}
                                            className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-purple-200 transition-colors"
                                        >
                                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 bg-purple-50 text-[#9327FF] rounded-xl flex items-center justify-center text-xl">
                                                        🏢
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h3 className="text-base font-bold text-slate-900">
                                                            {dept.name}
                                                        </h3>
                                                        <span className="text-xs font-medium text-slate-500">
                                                            {deptEmployees.length} xodim biriktirilgan
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteDept(dept.id)}
                                                    className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs"
                                                >
                                                    O'chirish
                                                </button>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                    {t("departmentMembers")} ({deptEmployees.length})
                                                </span>
                                                {deptEmployees.length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic py-2">
                                                        {t("noDepartmentMembers")}
                                                    </p>
                                                ) : (
                                                    <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto pr-1">
                                                        {deptEmployees.map((empUser) => (
                                                            <div
                                                                key={empUser.id}
                                                                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2.5 rounded-xl transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                                                                        {empUser.employee?.firstName?.[0] || empUser.email[0]}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-slate-900">
                                                                            {empUser.employee?.firstName} {empUser.employee?.lastName}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-500 font-mono">
                                                                            {empUser.email}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => handleLoginAs(empUser)}
                                                                        className="px-2.5 py-1 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-[10px] font-medium rounded-lg shadow-xs flex items-center gap-1"
                                                                    >
                                                                        <span>🔑</span>
                                                                        <span>{t("enterAccount")}</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => router.push(`/${locale}/profile?userId=${empUser.id}`)}
                                                                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-[10px] font-medium rounded-lg"
                                                                    >
                                                                        Profil
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {isEmployeeModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-3xl relative p-8 border border-slate-100">
                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingUser ? tEmp("editEmployee") : tEmp("addEmployee")}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsEmployeeModalOpen(false);
                                    setEditingUser(null);
                                }}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center font-bold text-sm transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <EmployeeForm
                            initialData={editingUser}
                            onSubmit={handleEmployeeSubmit}
                            onCancel={() => {
                                setIsEmployeeModalOpen(false);
                                setEditingUser(null);
                            }}
                            loading={formLoading}
                        />
                    </div>
                </div>
            )}

            <DepartmentModal
                isOpen={isDeptModalOpen}
                onClose={() => setIsDeptModalOpen(false)}
                onSave={handleSaveDepartment}
                departments={departments}
            />

            <EmailVerificationModal
                isOpen={isVerificationModalOpen}
                email={pendingEmployeeData?.email || ""}
                onClose={() => setIsVerificationModalOpen(false)}
                onVerified={handleVerifiedEmployeeSubmit}
                checkExisting={true}
            />

            {deleteModalUser && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg shrink-0">
                                ⚠️
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {tEmp("deleteModalTitle") || "Diqqat!"}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {deleteModalUser.employee?.firstName ? `${deleteModalUser.employee.firstName} ${deleteModalUser.employee.lastName}` : deleteModalUser.email}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {tEmp("deleteModalText") || "Haqiqatan ham ushbu xodimni o'chirmoqchimisiz? Bu jarayonni orqaga qaytarib bo'lmaydi."}
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteModalUser(null)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl px-5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {tEmp("cancelBtn") || "Bekor qilish"}
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={confirmDeleteEmployee}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {isDeleting ? (tEmp("deletingBtn") || "O'chirilmoqda...") : (tEmp("deleteConfirmBtn") || "O'chirish")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform translate-y-0">
                    <div
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-medium ${
                            toast.type === "success"
                                ? "bg-white border-emerald-200 text-emerald-800"
                                : "bg-white border-rose-200 text-rose-800"
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
