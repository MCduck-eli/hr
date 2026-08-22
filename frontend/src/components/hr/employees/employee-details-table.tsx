import { useTranslations } from "next-intl";

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

    return (
        <div className="bg-white p-6 border border-gray-200 h-fit lg:col-span-2">
            <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-black">
                {t("userList")}
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 text-[11px] text-gray-500 uppercase tracking-widest whitespace-nowrap">
                            <th className="p-3">{t("name")}</th>
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
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="p-4 text-center text-gray-500 text-xs"
                                >
                                    {t("noUsers")}
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr
                                    key={u.id}
                                    className="border-b border-gray-100 hover:bg-[#f8f8f8]"
                                >
                                    <td className="p-3 text-xs font-medium text-black whitespace-nowrap">
                                        {u.employee?.firstName}{" "}
                                        {u.employee?.lastName}
                                    </td>
                                    <td className="p-3 text-xs font-medium text-gray-600">
                                        {u.email}
                                    </td>
                                    <td className="p-3 text-xs font-bold uppercase text-gray-600">
                                        {u.role}
                                    </td>
                                    <td className="p-3 text-xs font-medium text-gray-600">
                                        {u.employee?.department?.name || "-"}
                                    </td>
                                    <td className="p-3 text-xs font-medium text-gray-600">
                                        {u.employee?.grade?.name || "-"}
                                    </td>
                                    <td className="p-3 text-xs font-bold text-gray-600">
                                        {u.employee?.leaveBalance !== undefined ? `${u.employee.leaveBalance} Days` : "-"}
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
                                    <td className="p-3 text-right flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => {
                                                const locale = window.location.pathname.split("/")[1] || "uz";
                                                window.location.href = `/${locale}/profile?userId=${u.id}`;
                                            }}
                                            className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline"
                                        >
                                            Profil
                                        </button>
                                        <button
                                            onClick={() => onEdit(u)}
                                            className="text-[10px] font-bold uppercase tracking-widest text-green-600 hover:underline"
                                        >
                                            {t("edit")}
                                        </button>
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
