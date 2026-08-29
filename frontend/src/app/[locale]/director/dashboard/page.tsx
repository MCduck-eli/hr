"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import StatusBadge from "@/src/components/hr/employees/status-badge";
import EmployeeForm from "@/src/components/hr/employees/employee-form";
import DepartmentModal from "@/src/components/hr/employees/department-modal";
import { fetchAllUsers, createUser, updateUser, deleteUser } from "@/src/services/user-service";
import { fetchDepartments, createDepartment, deleteDepartment } from "@/src/services/department-service";

export default function DirectorDashboard() {
    const t = useTranslations("DirectorDashboard");
    const tEmp = useTranslations("HREmployees");
    const params = useParams();
    const locale = (params.locale as string) || "uz";
    const router = useRouter();

    const [companyName, setCompanyName] = useState("");
    const [activeTab, setActiveTab] = useState<"employees" | "departments">("employees");

    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

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
        setFormLoading(true);
        try {
            const payload = { ...formData };
            if (editingUser && !payload.password) {
                delete payload.password;
            }

            if (editingUser) {
                await updateUser(editingUser.id, payload);
            } else {
                await createUser(payload);
            }

            setIsEmployeeModalOpen(false);
            setEditingUser(null);
            loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!window.confirm("Haqiqatan ham ushbu xodimni o'chirmoqchimisiz?")) return;
        try {
            await deleteUser(id);
            loadData();
        } catch (err: any) {
            alert(err.message || "Error");
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
        <div className="max-w-[1400px] mx-auto p-6 md:p-8 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-sm">
                            Direktor
                        </span>
                        {companyName && (
                            <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                                {companyName}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-black mt-1">
                        {companyName ? `${companyName} • ${t("title")}` : t("title")}
                    </h1>
                    <p className="text-gray-500 uppercase text-xs font-bold tracking-widest">
                        {t("welcome")}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleOpenCreateEmployee}
                        className="px-5 py-3 bg-black text-white text-xs font-black uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <span>👥</span>
                        <span>{t("createEmployee")}</span>
                    </button>
                    <button
                        onClick={() => setIsDeptModalOpen(true)}
                        className="px-5 py-3 bg-white border border-gray-300 text-black hover:border-black text-xs font-black uppercase tracking-wider rounded-sm transition-colors shadow-sm flex items-center gap-2"
                    >
                        <span>🏢</span>
                        <span>{t("createDepartment")}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div
                    onClick={() => setActiveTab("employees")}
                    className={`p-6 border transition-all cursor-pointer rounded-sm flex items-center justify-between ${
                        activeTab === "employees"
                            ? "bg-black text-white border-black shadow-md"
                            : "bg-white text-black border-gray-200 hover:border-gray-400"
                    }`}
                >
                    <div className="flex flex-col gap-1">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${
                            activeTab === "employees" ? "text-gray-400" : "text-gray-500"
                        }`}>
                            {t("totalEmployees")}
                        </span>
                        <span className="text-3xl font-black">{users.length}</span>
                    </div>
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center text-2xl ${
                        activeTab === "employees" ? "bg-gray-800" : "bg-gray-100"
                    }`}>
                        👥
                    </div>
                </div>

                <div
                    onClick={() => setActiveTab("departments")}
                    className={`p-6 border transition-all cursor-pointer rounded-sm flex items-center justify-between ${
                        activeTab === "departments"
                            ? "bg-black text-white border-black shadow-md"
                            : "bg-white text-black border-gray-200 hover:border-gray-400"
                    }`}
                >
                    <div className="flex flex-col gap-1">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${
                            activeTab === "departments" ? "text-gray-400" : "text-gray-500"
                        }`}>
                            {t("totalDepartments")}
                        </span>
                        <span className="text-3xl font-black">{departments.length}</span>
                    </div>
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center text-2xl ${
                        activeTab === "departments" ? "bg-gray-800" : "bg-gray-100"
                    }`}>
                        🏢
                    </div>
                </div>

                <div className="p-6 bg-white border border-gray-200 rounded-sm flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                            {t("activeAdmins")}
                        </span>
                        <span className="text-3xl font-black text-purple-600">{hrAdminsCount}</span>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-sm flex items-center justify-center text-2xl">
                        👑
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveTab("employees")}
                    className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative ${
                        activeTab === "employees"
                            ? "text-black border-b-2 border-black"
                            : "text-gray-400 hover:text-black"
                    }`}
                >
                    👥 {t("employeesTab")} ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab("departments")}
                    className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative ${
                        activeTab === "departments"
                            ? "text-black border-b-2 border-black"
                            : "text-gray-400 hover:text-black"
                    }`}
                >
                    🏢 {t("departmentsTab")} ({departments.length})
                </button>
            </div>

            {activeTab === "employees" && (
                <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-black uppercase tracking-wider text-black">
                                {t("employeesTab")}
                            </h2>
                            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                                {filteredUsers.length} ta
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Xodim ismi, email yoki bo'lim bo'yicha qidirish..."
                                className="px-4 py-2 border border-gray-200 text-xs bg-[#f8f8f8] outline-none focus:border-black w-72 rounded-sm"
                            />
                            <button
                                onClick={handleOpenCreateEmployee}
                                className="px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors whitespace-nowrap flex items-center gap-1.5"
                            >
                                <span>+</span>
                                <span>{tEmp("addEmployee")}</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500 uppercase tracking-widest font-black whitespace-nowrap">
                                    <th className="p-4">{tEmp("name")}</th>
                                    <th className="p-4">{tEmp("status")}</th>
                                    <th className="p-4">{tEmp("email")}</th>
                                    <th className="p-4">{tEmp("role")}</th>
                                    <th className="p-4">{tEmp("department")}</th>
                                    <th className="p-4 text-right">{tEmp("actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400 font-bold uppercase tracking-wider text-xs">
                                            Yuklanmoqda...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400 font-bold uppercase tracking-wider text-xs">
                                            {tEmp("noUsers")}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="p-4 text-xs font-medium text-black whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                                        {u.employee?.firstName?.[0] || u.email[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">
                                                            {u.employee?.firstName} {u.employee?.lastName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-mono">
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
                                            <td className="p-4 text-xs font-medium text-gray-600 font-mono">
                                                {u.email}
                                            </td>
                                            <td className="p-4 text-xs font-bold uppercase text-gray-600">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                                    u.role === "HR_ADMIN"
                                                        ? "bg-purple-100 text-purple-800"
                                                        : u.role === "MANAGER"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : u.role === "RECRUITER"
                                                        ? "bg-amber-100 text-amber-800"
                                                        : "bg-gray-100 text-gray-700"
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs font-bold text-gray-700">
                                                {u.employee?.department?.name || "-"}
                                            </td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleLoginAs(u)}
                                                        className="px-3 py-1.5 bg-black text-white hover:bg-gray-800 text-[10px] font-black uppercase tracking-wider rounded-sm transition-colors shadow-sm flex items-center gap-1"
                                                    >
                                                        <span>🔑</span>
                                                        <span>{t("enterAccount")}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/${locale}/profile?userId=${u.id}`)}
                                                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-black hover:border-black text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
                                                    >
                                                        Profil
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditEmployee(u)}
                                                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-black hover:border-black text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
                                                    >
                                                        {tEmp("edit")}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEmployee(u.id)}
                                                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
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
                    <div className="flex items-center justify-between bg-white p-5 border border-gray-200 rounded-sm">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-black uppercase tracking-wider text-black">
                                {t("departmentsTab")}
                            </h2>
                            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                                {departments.length} ta bo'lim
                            </span>
                        </div>
                        <button
                            onClick={() => setIsDeptModalOpen(true)}
                            className="px-5 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            <span>+</span>
                            <span>{t("createDepartment")}</span>
                        </button>
                    </div>

                    {departments.length === 0 ? (
                        <div className="p-16 bg-white border border-gray-200 text-center rounded-sm">
                            <span className="text-4xl block mb-3">🏢</span>
                            <h3 className="text-sm font-black uppercase tracking-wider text-black mb-1">
                                {t("noDepartments")}
                            </h3>
                            <button
                                onClick={() => setIsDeptModalOpen(true)}
                                className="mt-4 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm"
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
                                        className="bg-white border border-gray-200 rounded-sm p-6 flex flex-col gap-4 shadow-sm hover:border-black transition-colors"
                                    >
                                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center text-xl">
                                                    🏢
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="text-base font-black text-black">
                                                        {dept.name}
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                        {deptEmployees.length} xodim biriktirilgan
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteDept(dept.id)}
                                                className="px-2.5 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
                                            >
                                                O'chirish
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                {t("departmentMembers")} ({deptEmployees.length})
                                            </span>
                                            {deptEmployees.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic py-2">
                                                    {t("noDepartmentMembers")}
                                                </p>
                                            ) : (
                                                <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto pr-1">
                                                    {deptEmployees.map((empUser) => (
                                                        <div
                                                            key={empUser.id}
                                                            className="py-2 flex items-center justify-between gap-3 hover:bg-gray-50/50 px-2 rounded-sm"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-[9px] uppercase">
                                                                    {empUser.employee?.firstName?.[0] || empUser.email[0]}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-gray-900">
                                                                        {empUser.employee?.firstName} {empUser.employee?.lastName}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-500 font-mono">
                                                                        {empUser.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleLoginAs(empUser)}
                                                                    className="px-2 py-1 bg-black text-white hover:bg-gray-800 text-[9px] font-black uppercase tracking-wider rounded-sm shadow-sm flex items-center gap-1"
                                                                >
                                                                    <span>🔑</span>
                                                                    <span>{t("enterAccount")}</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => router.push(`/${locale}/profile?userId=${empUser.id}`)}
                                                                    className="px-2 py-1 bg-white border border-gray-200 text-gray-700 hover:text-black text-[9px] font-bold uppercase tracking-wider rounded-sm"
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

            {isEmployeeModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 border border-gray-200">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
                            <h2 className="text-lg font-black uppercase tracking-wider text-black">
                                {editingUser ? tEmp("editEmployee") : tEmp("addEmployee")}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsEmployeeModalOpen(false);
                                    setEditingUser(null);
                                }}
                                className="text-gray-400 hover:text-black font-black text-lg"
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
        </div>
    );
}
