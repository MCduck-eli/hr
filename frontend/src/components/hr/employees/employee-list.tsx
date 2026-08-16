import { useTranslations } from "next-intl";

interface EmployeeListProps {
    users: any[];
    onEdit: (user: any) => void;
    onDelete: (id: string) => void;
}

export default function EmployeeList({
    users,
    onEdit,
    onDelete,
}: EmployeeListProps) {
    const t = useTranslations("HREmployees");

    const handleDelete = (id: string) => {
        if (window.confirm(t("confirmDelete"))) {
            onDelete(id);
        }
    };

    return (
        <div className="bg-white p-6 border border-gray-200 h-fit">
            <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-black">
                {t("userList")}
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 text-[11px] text-gray-500 uppercase tracking-widest">
                            <th className="p-3">{t("name")}</th>
                            <th className="p-3">{t("email")}</th>
                            <th className="p-3">{t("role")}</th>
                            <th className="p-3">{t("department")}</th>
                            <th className="p-3 text-right">{t("actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
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
                                    <td className="p-3 text-xs font-medium text-black">
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
                                        {u.employee?.departmentId || "-"}
                                    </td>
                                    <td className="p-3 text-right flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => onEdit(u)}
                                            className="text-[10px] font-bold uppercase tracking-widest text-green-600 hover:text-green-800 transition-colors"
                                        >
                                            {t("edit")}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors"
                                        >
                                            {t("delete")}
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
