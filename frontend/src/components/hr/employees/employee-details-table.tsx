"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import StatusBadge from "./status-badge";
import EmployeeJourneyTimeline from "@/src/components/lifecycle/EmployeeJourneyTimeline";

interface EmployeeDetailsTableProps {
    users: any[];
    onEdit: (user: any) => void;
    onDelete: (id: string) => void;
}

export default function EmployeeDetailsTable({
    users,
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
        <div className="bg-white p-6 border border-gray-200 h-fit lg:col-span-2 shadow-sm rounded-sm">
            <h2 className="text-sm font-black uppercase tracking-wider mb-4 text-black">
                {t("userList")} ({users.length})
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500 uppercase tracking-widest font-black whitespace-nowrap">
                            <th className="p-3">{t("name")}</th>
                            <th className="p-3">{t("status")}</th>
                            <th className="p-3">{t("email")}</th>
                            <th className="p-3">{t("role")}</th>
                            <th className="p-3">{t("department")}</th>
                            <th className="p-3">{t("grade")}</th>
                            <th className="p-3">{t("leaveBalance")}</th>
                            <th className="p-3">{t("attendance")}</th>
                            <th className="p-3">{t("okrProgress")}</th>
                            <th className="p-3">{t("feedbacks")}</th>
                            <th className="p-3 text-right">{t("actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={11}
                                    className="p-8 text-center text-gray-400 font-bold uppercase tracking-wider text-xs"
                                >
                                    {t("noUsers")}
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr
                                    key={u.id}
                                    className="hover:bg-gray-50/80 transition-colors"
                                >
                                    <td className="p-3 text-xs font-medium text-black whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">
                                                {u.employee?.firstName} {u.employee?.lastName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        <StatusBadge
                                            status={u.employee?.status}
                                            statusConfig={u.employee?.statusConfig}
                                            statusExpiresAt={u.employee?.statusExpiresAt}
                                        />
                                    </td>
                                    <td className="p-3 text-xs font-medium text-gray-600 font-mono">
                                        {u.email}
                                    </td>
                                    <td className="p-3 text-xs font-bold uppercase text-gray-600 whitespace-nowrap">
                                        {u.customRole ? (
                                            <span
                                                style={{
                                                    backgroundColor: `${u.customRole.color || "#6366f1"}15`,
                                                    color: u.customRole.color || "#6366f1",
                                                    borderColor: `${u.customRole.color || "#6366f1"}35`,
                                                }}
                                                className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide border inline-flex items-center gap-1"
                                            >
                                                <span
                                                    style={{ backgroundColor: u.customRole.color || "#6366f1" }}
                                                    className="w-1.5 h-1.5 rounded-full"
                                                />
                                                {u.customRole.name}
                                            </span>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${
                                                u.role === "HR_ADMIN"
                                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                                : u.role === "ACCOUNTANT"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : u.role === "DEPARTMENT_HEAD"
                                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : u.role === "MANAGER"
                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : u.role === "RECRUITER"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : u.role === "DIRECTOR"
                                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                                : "bg-gray-50 text-gray-700 border-gray-200"
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
                                    <td className="p-3 text-xs font-medium text-gray-600">
                                        {u.employee?.department?.name || "-"}
                                    </td>
                                    <td className="p-3 text-xs font-medium text-gray-600">
                                        {u.employee?.grade?.name || "-"}
                                    </td>
                                    <td className="p-3 text-xs font-bold text-gray-600">
                                        {u.employee?.leaveBalance !== undefined ? `${u.employee.leaveBalance} d` : "-"}
                                    </td>
                                    <td className="p-3 text-xs font-bold text-gray-600">
                                        38h
                                    </td>
                                    <td className="p-3 text-xs font-bold text-green-600">
                                        {u.employee?.okrProgress !== undefined ? `${u.employee.okrProgress}%` : "0%"}
                                    </td>
                                    <td className="p-3 text-xs font-bold text-orange-500">
                                        {u.employee?.feedbackReviewers?.length || 0}
                                    </td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleLoginAs(u)}
                                                className="px-2 py-1 bg-black text-white hover:bg-gray-800 text-[10px] font-black uppercase tracking-wider rounded-sm transition-colors shadow-sm"
                                            >
                                                {t("loginAs") || "Kirish"}
                                            </button>
                                            <button
                                                onClick={() => setSelectedEjmEmployee(u)}
                                                className="px-2 py-1 bg-white border border-purple-300 text-purple-700 hover:bg-purple-700 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
                                            >
                                                EJM
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const locale = window.location.pathname.split("/")[1] || "uz";
                                                    router.push(`/${locale}/profile?userId=${u.id}`);
                                                }}
                                                className="px-2 py-1 bg-white border border-gray-200 text-gray-700 hover:text-black hover:border-black text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
                                            >
                                                Profil
                                            </button>
                                            <button
                                                onClick={() => onEdit(u)}
                                                className="px-2 py-1 bg-white border border-gray-200 text-gray-700 hover:text-black hover:border-black text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
                                            >
                                                {t("edit")}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Haqiqatan ham bu xodimni o'chirmoqchimisiz?")) {
                                                        onDelete(u.id);
                                                    }
                                                }}
                                                className="px-2 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
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
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Xodim:
                                </span>
                                <span className="text-base font-black text-black uppercase">
                                    {selectedEjmEmployee.employee?.firstName} {selectedEjmEmployee.employee?.lastName}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedEjmEmployee(null)}
                                className="px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800"
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
