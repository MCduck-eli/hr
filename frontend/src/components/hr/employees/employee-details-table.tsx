"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import StatusBadge from "./status-badge";
import EmployeeJourneyTimeline from "@/src/components/lifecycle/EmployeeJourneyTimeline";
import Skeleton from "@/src/components/ui/Skeleton";

interface EmployeeDetailsTableProps {
    users: any[];
    loading?: boolean;
    onEdit: (user: any) => void;
    onDelete: (user: any) => void;
}

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
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs overflow-hidden shrink-0">
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

export default function EmployeeDetailsTable({
    users,
    loading = false,
    onEdit,
    onDelete,
}: EmployeeDetailsTableProps) {
    const t = useTranslations("HREmployees");
    const router = useRouter();
    const [selectedEjmEmployee, setSelectedEjmEmployee] = useState<any>(null);

    const handleLoginAs = (u: any) => {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
            localStorage.setItem("originalAdminUser", currentUser);
        }
        localStorage.setItem("user", JSON.stringify(u));
        document.cookie = `user_role=${u.role || ""}; path=/; max-age=86400; SameSite=Lax`;

        const locale = window.location.pathname.split("/")[1] || "uz";
        if (u.role === "HR_ADMIN") {
            router.push(`/${locale}/hr/dashboard`);
        } else if (u.role === "ACCOUNTANT") {
            router.push(`/${locale}/profile?tab=payroll`);
        } else if (u.role === "MANAGER" || u.role === "DEPARTMENT_HEAD") {
            router.push(`/${locale}/manager/okr`);
        } else if (u.role === "RECRUITER") {
            router.push(`/${locale}/recruiter/vacancies`);
        } else {
            router.push(`/${locale}/profile`);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-fit lg:col-span-2">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-slate-900">
                        {t("userList")}
                    </h2>
                    {loading ? (
                        <Skeleton className="w-20 h-6 rounded-full" />
                    ) : (
                        <span className="px-3 py-1 bg-purple-50 text-[#9327FF] text-xs font-bold rounded-full">
                            {users.length} ta xodim
                        </span>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] text-slate-400 uppercase tracking-wider font-bold whitespace-nowrap">
                            <th className="p-4 pl-6">{t("name")}</th>
                            <th className="p-4">{t("status")}</th>
                            <th className="p-4">{t("email")}</th>
                            <th className="p-4">{t("role")}</th>
                            <th className="p-4">{t("department")}</th>
                            <th className="p-4">{t("grade")}</th>
                            <th className="p-4">{t("leaveBalance")}</th>
                            <th className="p-4">{t("attendance")}</th>
                            <th className="p-4">{t("okrProgress")}</th>
                            <th className="p-4">{t("feedbacks")}</th>
                            <th className="p-4 pr-6 text-right">{t("actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={`skel-row-${idx}`} className="animate-pulse">
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
                                    <td className="p-4">
                                        <Skeleton className="w-16 h-4 rounded-md" />
                                    </td>
                                    <td className="p-4">
                                        <Skeleton className="w-14 h-4 rounded-md" />
                                    </td>
                                    <td className="p-4">
                                        <Skeleton className="w-14 h-4 rounded-md" />
                                    </td>
                                    <td className="p-4">
                                        <Skeleton className="w-16 h-4 rounded-md" />
                                    </td>
                                    <td className="p-4">
                                        <Skeleton className="w-12 h-4 rounded-md" />
                                    </td>
                                    <td className="p-4 pr-6 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Skeleton className="w-16 h-7 rounded-lg" />
                                            <Skeleton className="w-14 h-7 rounded-lg" />
                                            <Skeleton className="w-14 h-7 rounded-lg" />
                                            <Skeleton className="w-14 h-7 rounded-lg" />
                                            <Skeleton className="w-14 h-7 rounded-lg" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={11}
                                    className="p-12 text-center text-slate-400 font-semibold text-xs"
                                >
                                    {t("noUsers")}
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr
                                    key={u.id}
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
                                    <td className="p-4 text-xs font-semibold uppercase text-slate-600 whitespace-nowrap">
                                        {u.customRole ? (
                                            <span
                                                style={{
                                                    backgroundColor: `${u.customRole.color || "#6366f1"}15`,
                                                    color: u.customRole.color || "#6366f1",
                                                    borderColor: `${u.customRole.color || "#6366f1"}35`,
                                                }}
                                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide border inline-flex items-center gap-1.5"
                                            >
                                                <span
                                                    style={{ backgroundColor: u.customRole.color || "#6366f1" }}
                                                    className="w-1.5 h-1.5 rounded-full"
                                                />
                                                {u.customRole.name}
                                            </span>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                                u.role === "HR_ADMIN"
                                                    ? "bg-purple-100 text-[#9327FF]"
                                                    : u.role === "ACCOUNTANT"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : u.role === "DEPARTMENT_HEAD"
                                                    ? "bg-indigo-100 text-indigo-700"
                                                    : u.role === "MANAGER"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : u.role === "RECRUITER"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : u.role === "DIRECTOR"
                                                    ? "bg-rose-100 text-rose-700"
                                                    : "bg-slate-100 text-slate-700"
                                            }`}>
                                                {u.role === "HR_ADMIN"
                                                    ? (t("hrAdmin") || "HR Admin")
                                                    : u.role === "ACCOUNTANT"
                                                    ? (t("accountant") || "Bugalter")
                                                    : u.role === "DEPARTMENT_HEAD"
                                                    ? (t("departmentHead") || "Bo'lim boshlig'i")
                                                    : u.role === "MANAGER"
                                                    ? (t("manager") || "Menejer")
                                                    : u.role === "RECRUITER"
                                                    ? (t("recruiter") || "Rekruter")
                                                    : u.role === "DIRECTOR"
                                                    ? (t("director") || "Direktor")
                                                    : (t("employee") || "Xodim")}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs font-semibold text-slate-700">
                                        {u.employee?.department?.name || "-"}
                                    </td>
                                    <td className="p-4 text-xs font-semibold text-slate-700">
                                        {u.employee?.grade?.name || "-"}
                                    </td>
                                    <td className="p-4 text-xs font-bold text-slate-700">
                                        {u.employee?.leaveBalance !== undefined ? `${u.employee.leaveBalance} d` : "-"}
                                    </td>
                                    <td className="p-4 text-xs font-bold text-slate-700">
                                        {u.employee?.attendanceHours !== undefined ? `${u.employee.attendanceHours}h` : u.employee?.totalHours !== undefined ? `${u.employee.totalHours}h` : u.attendanceHours !== undefined ? `${u.attendanceHours}h` : "0h"}
                                    </td>
                                    <td className="p-4 text-xs font-bold text-emerald-600">
                                        {u.employee?.okrProgress !== undefined ? `${u.employee.okrProgress}%` : "0%"}
                                    </td>
                                    <td className="p-4 text-xs font-bold text-amber-600">
                                        {u.employee?.feedbackReviewers?.length || 0}
                                    </td>
                                    <td className="p-4 pr-6 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => handleLoginAs(u)}
                                                className="px-3 py-1.5 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-[11px] font-medium rounded-lg transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>🔑</span>
                                                <span>{t("loginAs") || "Kirish"}</span>
                                            </button>
                                            <button
                                                onClick={() => setSelectedEjmEmployee(u)}
                                                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#9327FF] border border-purple-200 text-[11px] font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
                                            >
                                                EJM
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const locale = window.location.pathname.split("/")[1] || "uz";
                                                    router.push(`/${locale}/profile?userId=${u.id}`);
                                                }}
                                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
                                            >
                                                Profil
                                            </button>
                                            <button
                                                onClick={() => onEdit(u)}
                                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
                                            >
                                                {t("edit")}
                                            </button>
                                            <button
                                                onClick={() => onDelete(u)}
                                                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
                                            >
                                                {t("delete")}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedEjmEmployee && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">
                                    Xodim:
                                </span>
                                <span className="text-base font-bold text-slate-900">
                                    {selectedEjmEmployee.employee?.firstName} {selectedEjmEmployee.employee?.lastName}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedEjmEmployee(null)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                            >
                                Yopish ✕
                            </button>
                        </div>

                        <EmployeeJourneyTimeline
                            employeeId={selectedEjmEmployee.employee?.id || selectedEjmEmployee.id}
                            employeeName={`${selectedEjmEmployee.employee?.firstName || ""} ${selectedEjmEmployee.employee?.lastName || selectedEjmEmployee.email}`.trim()}
                            canManage={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
