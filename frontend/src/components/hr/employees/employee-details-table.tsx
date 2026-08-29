"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import StatusBadge from "./status-badge";

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

    const handleLoginAs = (u: any) => {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
            localStorage.setItem("originalAdminUser", currentUser);
        }
        localStorage.setItem("user", JSON.stringify(u));

        const locale = window.location.pathname.split("/")[1] || "uz";
        if (u.role === "HR_ADMIN") {
            router.push(`/${locale}/hr/dashboard`);
        } else if (u.role === "MANAGER") {
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
                                    <td className="p-3 text-xs font-bold uppercase text-gray-600">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
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
        </div>
    );
}
