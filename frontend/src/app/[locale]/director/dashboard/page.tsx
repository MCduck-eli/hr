"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/src/components/hr/employees/status-badge";
import EmployeeForm from "@/src/components/hr/employees/employee-form";
import DepartmentModal from "@/src/components/hr/employees/department-modal";
import EmployeeProfileModal from "@/src/components/hr/employees/EmployeeProfileModal";
import AssignDepartmentEmployeeModal from "@/src/components/hr/employees/AssignDepartmentEmployeeModal";
import Skeleton from "@/src/components/ui/Skeleton";
import { fetchAllUsers, createUser, updateUser, deleteUser } from "@/src/services/user-service";
import { fetchDepartments, createDepartment, deleteDepartment, unassignEmployeeFromDepartment } from "@/src/services/department-service";
import ExecutiveAnalyticsDashboard from "@/src/components/analytics/ExecutiveAnalyticsDashboard";
import OrgChartTree from "@/src/components/org-chart/OrgChartTree";
import { getQueryData, setQueryData, isQueryStale, invalidateQuery } from "@/src/utils/query-cache";
import { motion } from "framer-motion";
import GirihPattern from "@/src/components/ui/GirihPattern";
import AnimatedNumber from "@/src/components/ui/AnimatedNumber";

function EmployeeTableAvatar({ user }: { user: any }) {
    const [imageError, setImageError] = useState(false);
    const rawAvatar = user.avatar || user.employee?.avatar || user.image || user.employee?.image || "";
    const initial = (user.employee?.firstName?.[0] || user.firstName?.[0] || user.email?.[0] || "U").toUpperCase();

    let avatarSrc: string | null = null;
    if (rawAvatar && !imageError) {
        if (rawAvatar.startsWith("http://") || rawAvatar.startsWith("https://") || rawAvatar.startsWith("data:")) {
            avatarSrc = rawAvatar;
        } else {
            const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
            const baseOrigin = rawApi.replace(/\/api(\/v\d+)?\/?$/, "").replace(/\/+$/, "");
            const cleanPath = rawAvatar.startsWith("/") ? rawAvatar : `/${rawAvatar}`;
            avatarSrc = `${baseOrigin}${cleanPath}`;
        }
    }

    return (
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] overflow-hidden shrink-0">
            {avatarSrc ? (
                <img
                    src={avatarSrc}
                    alt={user.employee?.firstName || user.email || "Avatar"}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{initial}</span>
            )}
        </div>
    );
}

export default function DirectorDashboard() {
    const t = useTranslations("DirectorDashboard");
    const tEmp = useTranslations("HREmployees");
    const params = useParams();
    const locale = (params.locale as string) || "uz";
    const router = useRouter();
    const searchParams = useSearchParams();

    const tabParam = searchParams.get("tab") as "employees" | "departments" | "analytics" | "orgchart" | null;

    const [companyName, setCompanyName] = useState("");
    const [activeTab, setActiveTab] = useState<"employees" | "departments" | "analytics" | "orgchart">("analytics");

    useEffect(() => {
        if (tabParam && ["employees", "departments", "analytics", "orgchart"].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleTabChange = (tab: "employees" | "departments" | "analytics" | "orgchart") => {
        setActiveTab(tab);
        router.replace(`/${locale}/director/dashboard?tab=${tab}`, { scroll: false });
    };

    const [users, setUsers] = useState<any[]>(() => getQueryData<any[]>("director:users") || []);
    const [departments, setDepartments] = useState<any[]>(() => getQueryData<any[]>("director:departments") || []);
    const [loading, setLoading] = useState<boolean>(() => !getQueryData("director:users") || !getQueryData("director:departments"));
    const [isDeptUpdating, setIsDeptUpdating] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

    const [editingUser, setEditingUser] = useState<any>(null);
    const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
    const [selectedProfileUser, setSelectedProfileUser] = useState<any | null>(null);
    const [expandedDeptIds, setExpandedDeptIds] = useState<string[]>([]);
    const [assigningDept, setAssigningDept] = useState<any | null>(null);
    const [unassigningUserId, setUnassigningUserId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const toggleDeptExpand = (deptId: string) => {
        setExpandedDeptIds((prev) =>
            prev.includes(deptId)
                ? prev.filter((id) => id !== deptId)
                : [...prev, deptId]
        );
    };

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

    const loadData = async (isBackground = false) => {
        let currentCompany = companyName;
        if (!currentCompany) {
            try {
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                currentCompany = u.companyName || u.companyId || u.employee?.companyName || "";
            } catch {}
        }

        const usersCacheKey = currentCompany ? `director:${currentCompany}:users` : "director:users";
        const deptsCacheKey = currentCompany ? `director:${currentCompany}:departments` : "director:departments";

        const hasCachedUsers = getQueryData<any[]>(usersCacheKey);
        const hasCachedDepts = getQueryData<any[]>(deptsCacheKey);
        const hasCache = Boolean(hasCachedUsers && hasCachedDepts);
        const isStale = isQueryStale(usersCacheKey) || isQueryStale(deptsCacheKey);

        if (!hasCache && !isBackground) {
            setLoading(true);
        }

        if (hasCache && !isStale && !isBackground) {
            return;
        }

        if (!hasCache) {
            setIsDeptUpdating(true);
        }

        try {
            const [usersData, deptsData] = await Promise.all([
                fetchAllUsers().catch(() => []),
                fetchDepartments().catch(() => []),
            ]);

            const filteredUsers = (usersData || []).filter(
                (u: any) =>
                    u.role !== "SUPER_ADMIN" &&
                    u.role !== "DIRECTOR" &&
                    (!currentCompany || u.companyName === currentCompany),
            );
            setUsers(filteredUsers);
            setDepartments(deptsData || []);
            setQueryData(usersCacheKey, filteredUsers);
            setQueryData(deptsCacheKey, deptsData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setIsDeptUpdating(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [companyName]);

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
        let userCompany = companyName;
        if (!userCompany) {
            try {
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                userCompany = u.companyName || u.companyId || u.employee?.companyName || "";
            } catch {}
        }

        if (editingUser) {
            setFormLoading(true);
            try {
                const payload = {
                    ...formData,
                    ...(userCompany ? { companyId: userCompany, companyName: userCompany } : {}),
                };
                if (!payload.password) {
                    delete payload.password;
                }
                await updateUser(editingUser.id, payload);
                setIsEmployeeModalOpen(false);
                setEditingUser(null);
                invalidateQuery("director");
                loadData(true);
            } catch (err: any) {
                showToast(err.message || "Ushbu email bilan foydalanuvchi allaqachon mavjud", "error");
            } finally {
                setFormLoading(false);
            }
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                ...formData,
                ...(userCompany ? { companyId: userCompany, companyName: userCompany } : {}),
            };
            await createUser(payload);
            setIsEmployeeModalOpen(false);
            setEditingUser(null);
            invalidateQuery("director");
            loadData(true);
            showToast("Muvaffaqiyatli yaratildi", "success");
        } catch (err: any) {
            showToast(err.message || "Ushbu email bilan foydalanuvchi allaqachon mavjud", "error");
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
            invalidateQuery("director");
            loadData(true);
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
            invalidateQuery("director");
            loadData(true);
        } catch (err: any) {
            showToast(err.message || "Error", "error");
        }
    };

    const handleDeleteDept = async (id: string) => {
        if (!window.confirm("Haqiqatan ham ushbu bo'limni o'chirmoqchimisiz?")) return;
        try {
            await deleteDepartment(id);
            invalidateQuery("director");
            loadData(true);
        } catch (err: any) {
            showToast(err.message || "Error", "error");
        }
    };

    const handleUnassignEmployee = async (departmentId: string, userId: string) => {
        setUnassigningUserId(userId);
        setIsDeptUpdating(true);
        try {
            await unassignEmployeeFromDepartment(departmentId, { userId });
            invalidateQuery("director");
            await loadData(true);
            showToast("Xodim bo'limdan muvaffaqiyatli chiqarildi", "success");
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Xodimni bo'limdan chiqarishda xatolik yuz berdi", "error");
        } finally {
            setUnassigningUserId(null);
            setIsDeptUpdating(false);
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
        <div className="min-h-full flex flex-col gap-8 pb-10">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3.5 py-1.5 bg-white text-purple-600 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] text-xs font-black uppercase tracking-wider rounded-2xl inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                                Direktor Kabineti
                            </span>
                            {companyName && (
                                <span className="text-xs font-bold text-slate-500">
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

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            type="button"
                            onClick={handleOpenCreateEmployee}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl px-5 py-3 transition-all duration-200 shadow-[4px_4px_10px_#e2e8f0,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] flex items-center gap-2 text-xs md:text-sm cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span>{t("createEmployee")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsDeptModalOpen(true)}
                            className="bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-2xl px-5 py-3 transition-all duration-200 shadow-[4px_4px_10px_#e2e8f0,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] flex items-center gap-2 text-xs md:text-sm cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{t("createDepartment")}</span>
                        </button>
                    </div>
                </div>

                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1,
                            },
                        },
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                >
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 16 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                        }}
                        onClick={() => handleTabChange("employees")}
                        className={`p-6 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between relative overflow-hidden ${
                            activeTab === "employees"
                                ? "bg-white shadow-[inset_3px_3px_6px_#e2e8f0,inset_-3px_-3px_6px_#ffffff]"
                                : "bg-white shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]"
                        }`}
                    >
                        <GirihPattern className="opacity-[0.11]" />
                        <div className="relative z-10 flex items-center justify-between w-full">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {t("totalEmployees")}
                                </span>
                                {loading ? (
                                    <Skeleton className="w-16 h-8 rounded-lg" />
                                ) : (
                                    <span className="text-3xl font-extrabold text-slate-900">
                                        <AnimatedNumber value={users.length} />
                                    </span>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] text-purple-600 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 16 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                        }}
                        onClick={() => handleTabChange("departments")}
                        className={`p-6 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between relative overflow-hidden ${
                            activeTab === "departments"
                                ? "bg-white shadow-[inset_3px_3px_6px_#e2e8f0,inset_-3px_-3px_6px_#ffffff]"
                                : "bg-white shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]"
                        }`}
                    >
                        <GirihPattern className="opacity-[0.11]" />
                        <div className="relative z-10 flex items-center justify-between w-full">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {t("totalDepartments")}
                                </span>
                                {loading ? (
                                    <Skeleton className="w-16 h-8 rounded-lg" />
                                ) : (
                                    <span className="text-3xl font-extrabold text-slate-900">
                                        <AnimatedNumber value={departments.length} />
                                    </span>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] text-blue-600 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 16 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                        }}
                        className="p-6 bg-white rounded-2xl flex items-center justify-between shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden"
                    >
                        <GirihPattern className="opacity-[0.11]" />
                        <div className="relative z-10 flex items-center justify-between w-full">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {t("activeAdmins")}
                                </span>
                                {loading ? (
                                    <Skeleton className="w-16 h-8 rounded-lg" />
                                ) : (
                                    <span className="text-3xl font-extrabold text-purple-600">
                                        <AnimatedNumber value={hrAdminsCount} />
                                    </span>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] text-emerald-600 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {activeTab === "analytics" && (
                    <div className="flex flex-col gap-6">
                        <ExecutiveAnalyticsDashboard />
                    </div>
                )}

                {activeTab === "orgchart" && (
                    <div className="bg-white rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] p-6 md:p-8">
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
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="bg-white rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] overflow-hidden flex flex-col"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <h2 className="text-base font-bold text-slate-900">
                                    {t("employeesTab")}
                                </h2>
                                {loading ? (
                                    <Skeleton className="w-20 h-6 rounded-full" />
                                ) : (
                                    <span className="px-3 py-1 bg-white shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] text-purple-600 text-xs font-bold rounded-full">
                                        <AnimatedNumber value={filteredUsers.length} /> ta xodim
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Ism, email yoki bo'lim..."
                                        className="pl-9 pr-4 py-2.5 bg-white shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] text-xs text-slate-900 rounded-2xl outline-none w-64 md:w-72 transition-all focus:text-purple-600"
                                    />
                                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOpenCreateEmployee}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-2xl px-4 py-2.5 transition-all duration-200 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] whitespace-nowrap flex items-center gap-1.5 text-xs cursor-pointer"
                                >
                                    <span>+</span>
                                    <span>{tEmp("addEmployee")}</span>
                                </button>
                            </div>
                        </motion.div>

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
                                        Array.from({ length: 5 }).map((_, idx) => (
                                            <tr key={`skeleton-row-${idx}`} className="animate-pulse">
                                                <td className="p-4 pl-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                                                        <div className="flex flex-col gap-1.5">
                                                            <Skeleton className="w-32 h-4 rounded-md" />
                                                            <Skeleton className="w-20 h-2.5 rounded-md" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <Skeleton className="w-24 h-6 rounded-full" />
                                                </td>
                                                <td className="p-4">
                                                    <Skeleton className="w-36 h-4 rounded-md" />
                                                </td>
                                                <td className="p-4">
                                                    <Skeleton className="w-20 h-6 rounded-lg" />
                                                </td>
                                                <td className="p-4">
                                                    <Skeleton className="w-28 h-4 rounded-md" />
                                                </td>
                                                <td className="p-4 pr-6 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Skeleton className="w-24 h-7 rounded-lg" />
                                                        <Skeleton className="w-16 h-7 rounded-lg" />
                                                        <Skeleton className="w-16 h-7 rounded-lg" />
                                                        <Skeleton className="w-16 h-7 rounded-lg" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-400 font-semibold text-xs">
                                                {tEmp("noUsers")}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((u, index) => (
                                            <motion.tr
                                                key={u.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.35,
                                                    delay: Math.min(index * 0.05, 0.6),
                                                    ease: "easeOut",
                                                }}
                                                className="hover:bg-slate-50/70 transition-colors"
                                            >
                                                <td className="p-4 pl-6 text-xs font-medium text-slate-900 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <EmployeeTableAvatar user={u} />
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
                                                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
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
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLoginAs(u)}
                                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium rounded-xl transition-all shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)] flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span>🔑</span>
                                                            <span>{t("enterAccount")}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedProfileUser(u)}
                                                            className="px-3 py-1.5 bg-white text-slate-700 hover:text-slate-900 text-[11px] font-medium rounded-xl transition-all shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] cursor-pointer"
                                                        >
                                                            Profil
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditEmployee(u)}
                                                            className="px-3 py-1.5 bg-white text-slate-700 hover:text-slate-900 text-[11px] font-medium rounded-xl transition-all shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] cursor-pointer"
                                                        >
                                                            {tEmp("edit")}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteEmployee(u)}
                                                            className="px-3 py-1.5 bg-white text-red-600 hover:text-red-700 text-[11px] font-medium rounded-xl transition-all shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] cursor-pointer"
                                                        >
                                                            {tEmp("delete")}
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === "departments" && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex flex-col gap-6"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff]"
                        >
                            <div className="flex items-center gap-3">
                                <h2 className="text-base font-bold text-slate-900">
                                    {t("departmentsTab")}
                                </h2>
                                {loading ? (
                                    <Skeleton className="w-20 h-6 rounded-full" />
                                ) : (
                                    <span className="px-3 py-1 bg-white shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] text-purple-600 text-xs font-bold rounded-full">
                                        <AnimatedNumber value={departments.length} /> ta bo'lim
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDeptModalOpen(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-2xl px-5 py-2.5 transition-all duration-200 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] flex items-center gap-2 text-xs md:text-sm cursor-pointer"
                            >
                                <span>+</span>
                                <span>{t("createDepartment")}</span>
                            </button>
                        </motion.div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {Array.from({ length: 4 }).map((_, idx) => (
                                    <div
                                        key={`dept-skel-${idx}`}
                                        className="bg-white rounded-2xl p-6 shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] flex flex-col gap-4 animate-pulse"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                                                <div className="flex flex-col gap-2">
                                                    <Skeleton className="w-32 h-4 rounded-md" />
                                                    <Skeleton className="w-24 h-3 rounded-md" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Skeleton className="w-28 h-7 rounded-xl" />
                                                <Skeleton className="w-16 h-7 rounded-lg" />
                                                <Skeleton className="w-8 h-8 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : departments.length === 0 ? (
                            <div className="p-16 bg-white text-center rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff]">
                                <span className="text-4xl block mb-3">🏢</span>
                                <h3 className="text-base font-bold text-slate-900 mb-1">
                                    {t("noDepartments")}
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">Hozircha hech qanday bo'lim yaratilmagan</p>
                                <button
                                    type="button"
                                    onClick={() => setIsDeptModalOpen(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-2xl px-6 py-2.5 transition-all duration-200 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] text-xs cursor-pointer"
                                >
                                    + {t("createDepartment")}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {departments.map((dept, index) => {
                                    const deptEmployees = users.filter(
                                        (u) => u.employee?.departmentId === dept.id,
                                    );
                                    const isExpanded = expandedDeptIds.includes(dept.id);

                                    return (
                                        <motion.div
                                            key={dept.id}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.35,
                                                delay: Math.min(index * 0.05, 0.6),
                                                ease: "easeOut",
                                            }}
                                            className="bg-white rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] transition-all duration-200 overflow-hidden"
                                        >
                                            <div
                                                onClick={() => toggleDeptExpand(dept.id)}
                                                className="p-6 cursor-pointer select-none flex flex-col gap-4"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-11 h-11 bg-white shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] text-purple-600 rounded-2xl flex items-center justify-center text-xl shrink-0">
                                                            🏢
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <h3 className="text-base font-bold text-slate-900 truncate">
                                                                {dept.name}
                                                            </h3>
                                                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                                {isDeptUpdating || loading ? (
                                                                    <Skeleton className="w-6 h-4 inline-block rounded-md" />
                                                                ) : (
                                                                    <span>{deptEmployees.length}</span>
                                                                )}
                                                                <span>xodim biriktirilgan</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAssigningDept(dept);
                                                            }}
                                                            className="px-3 py-1.5 bg-white text-purple-600 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span>+</span>
                                                            <span>Xodim biriktirish</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteDept(dept.id);
                                                            }}
                                                            className="px-3 py-1.5 bg-white text-red-600 hover:text-red-700 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] text-[11px] font-medium rounded-xl transition-all cursor-pointer"
                                                        >
                                                            O'chirish
                                                        </button>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] text-slate-500 transition-transform duration-200 ${
                                                            isExpanded ? "rotate-180 text-purple-600" : ""
                                                        }`}>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex flex-col gap-3 animate-in fade-in duration-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                            Bo'lim a'zolari ({deptEmployees.length})
                                                        </span>
                                                    </div>

                                                    {(isDeptUpdating || loading) && (
                                                        <div className="flex flex-col gap-2 py-1">
                                                            <div className="py-2.5 flex items-center justify-between gap-3 px-3 rounded-xl bg-slate-50/60 animate-pulse">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <Skeleton className="w-28 h-3.5 rounded-md" />
                                                                        <Skeleton className="w-20 h-2.5 rounded-md" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Skeleton className="w-14 h-6 rounded-lg" />
                                                                </div>
                                                            </div>
                                                            <div className="py-2.5 flex items-center justify-between gap-3 px-3 rounded-xl bg-slate-50/60 animate-pulse">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <Skeleton className="w-32 h-3.5 rounded-md" />
                                                                        <Skeleton className="w-24 h-2.5 rounded-md" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Skeleton className="w-14 h-6 rounded-lg" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!isDeptUpdating && !loading && deptEmployees.length === 0 ? (
                                                        <div className="p-6 bg-slate-50/70 rounded-2xl text-center">
                                                            <p className="text-xs text-slate-500 font-medium">
                                                                Bu bo'limda hali xodimlar yo'q
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                                                            {deptEmployees.map((empUser) => {
                                                                if (unassigningUserId === empUser.id) {
                                                                    return (
                                                                        <div
                                                                            key={empUser.id}
                                                                            className="py-2.5 flex items-center justify-between gap-3 px-3 rounded-xl bg-slate-50/60 animate-pulse"
                                                                        >
                                                                            <div className="flex items-center gap-3 min-w-0">
                                                                                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                                                                                <div className="flex flex-col gap-1.5">
                                                                                    <Skeleton className="w-28 h-3.5 rounded-md" />
                                                                                    <Skeleton className="w-20 h-2.5 rounded-md" />
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Skeleton className="w-16 h-6 rounded-lg" />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <div
                                                                        key={empUser.id}
                                                                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-3 rounded-xl transition-colors"
                                                                    >
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <EmployeeTableAvatar user={empUser} />
                                                                            <div className="flex flex-col min-w-0">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-bold text-slate-900 truncate">
                                                                                        {empUser.employee?.firstName} {empUser.employee?.lastName}
                                                                                    </span>
                                                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
                                                                                        {empUser.customRole?.name || empUser.role}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-[11px] text-slate-400 font-mono truncate">
                                                                                    {empUser.email}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleLoginAs(empUser)}
                                                                                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-medium rounded-xl shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)] flex items-center gap-1 cursor-pointer"
                                                                            >
                                                                                <span>🔑</span>
                                                                                <span>{t("enterAccount")}</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setSelectedProfileUser(empUser)}
                                                                                className="px-2.5 py-1.5 bg-white text-slate-700 hover:text-slate-900 text-[10px] font-medium rounded-xl shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] cursor-pointer"
                                                                            >
                                                                                Profil
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleUnassignEmployee(dept.id, empUser.id)}
                                                                                disabled={unassigningUserId === empUser.id}
                                                                                className="px-2.5 py-1.5 bg-white text-red-600 hover:text-red-700 text-[10px] font-medium rounded-xl shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                                            >
                                                                                <span>🗑️</span>
                                                                                <span>Chiqarish</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {isEmployeeModalOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-[10px_10px_30px_#cbd5e1,-10px_-10px_30px_#ffffff] relative p-8 overflow-hidden">
                        <GirihPattern className="opacity-[0.11] rounded-3xl overflow-hidden" strokeColor="#9333ea" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900">
                                    {editingUser ? tEmp("editEmployee") : tEmp("addEmployee")}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEmployeeModalOpen(false);
                                        setEditingUser(null);
                                    }}
                                    className="w-8 h-8 rounded-full bg-white text-slate-500 hover:text-slate-900 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
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
                </div>
            )}

            <DepartmentModal
                isOpen={isDeptModalOpen}
                onClose={() => setIsDeptModalOpen(false)}
                onSave={handleSaveDepartment}
                departments={departments}
            />

            {deleteModalUser && (
                <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-[10px_10px_30px_#cbd5e1,-10px_-10px_30px_#ffffff] p-6 max-w-md w-full flex flex-col gap-4 relative overflow-hidden">
                        <GirihPattern className="opacity-[0.11] rounded-3xl overflow-hidden" strokeColor="#9333ea" />
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white text-red-600 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center justify-center font-bold text-lg shrink-0">
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
                                    className="bg-white text-slate-700 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {tEmp("cancelBtn") || "Bekor qilish"}
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={confirmDeleteEmployee}
                                    className="bg-red-500 hover:bg-red-600 text-white shadow-[3px_3px_8px_#fca5a5,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {isDeleting ? (tEmp("deletingBtn") || "O'chirilmoqda...") : (tEmp("deleteConfirmBtn") || "O'chirish")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EmployeeProfileModal
                isOpen={Boolean(selectedProfileUser)}
                onClose={() => setSelectedProfileUser(null)}
                user={selectedProfileUser}
            />

            <AssignDepartmentEmployeeModal
                isOpen={Boolean(assigningDept)}
                onClose={() => setAssigningDept(null)}
                department={assigningDept}
                users={users}
                onSuccess={(msg) => {
                    invalidateQuery("director");
                    loadData(true);
                    showToast(msg || "Xodim biriktirildi", "success");
                }}
            />

            {toast && (
                <div className="fixed top-6 right-6 z-[9999] transition-all duration-300 transform translate-y-0">
                    <div
                        className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-[5px_5px_15px_#cbd5e1,-5px_-5px_15px_#ffffff] bg-white text-xs sm:text-sm font-semibold ${
                            toast.type === "success"
                                ? "text-emerald-800"
                                : "text-rose-800"
                        }`}
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
