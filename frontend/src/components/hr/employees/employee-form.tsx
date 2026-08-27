import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchDepartments, createDepartment } from "@/src/services/department-service";
import { fetchAllStatuses } from "@/src/services/employee-status-service";
import DepartmentModal from "./department-modal";
import StatusManagementModal from "./status-management-modal";

interface EmployeeFormProps {
    initialData: any;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    loading: boolean;
}

export default function EmployeeForm({
    initialData,
    onSubmit,
    onCancel,
    loading,
}: EmployeeFormProps) {
    const t = useTranslations("HREmployees");

    const [departments, setDepartments] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [isCreatingDept, setIsCreatingDept] = useState(false);
    const [isManagingStatus, setIsManagingStatus] = useState(false);
    const [isDeptLoading, setIsDeptLoading] = useState(false);

    const loadDepartments = async () => {
        try {
            const data = await fetchDepartments();
            setDepartments(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadStatuses = async () => {
        try {
            const data = await fetchAllStatuses();
            setStatuses(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadDepartments();
        loadStatuses();
    }, []);

    const [form, setForm] = useState<any>({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "EMPLOYEE",
        status: "NEW",
        statusConfigId: "",
        departmentId: "",
        positionId: "",
        leaveBalance: "",
    });

    useEffect(() => {
        if (initialData) {
            let defaultPass = "";
            if (initialData.candidateId && !initialData.password) {
                const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                for (let i = 0; i < 10; i++) {
                    defaultPass += chars.charAt(Math.floor(Math.random() * chars.length));
                }
            }

            setForm({
                candidateId: initialData.candidateId || undefined,
                email: initialData.email || "",
                password: defaultPass,
                firstName:
                    initialData.firstName ||
                    initialData.employee?.firstName ||
                    "",
                lastName:
                    initialData.lastName ||
                    initialData.employee?.lastName ||
                    "",
                role: initialData.role || "EMPLOYEE",
                status: initialData.status || initialData.employee?.status || "NEW",
                statusConfigId:
                    initialData.statusConfigId ||
                    initialData.employee?.statusConfigId ||
                    "",
                departmentId:
                    initialData.departmentId ||
                    initialData.employee?.departmentId ||
                    "",
                positionId:
                    initialData.positionId ||
                    initialData.employee?.positionId ||
                    "",
                leaveBalance: initialData.employee?.leaveBalance ?? "",
            });
        } else {
            setForm({
                email: "",
                password: "",
                firstName: "",
                lastName: "",
                role: "EMPLOYEE",
                status: "NEW",
                statusConfigId: "",
                departmentId: "",
                positionId: "",
                leaveBalance: "",
            });
        }
    }, [initialData]);

    const generateCredentials = () => {
        const generatedEmail =
            form.email ||
            (form.firstName && form.lastName
                ? `${form.firstName.toLowerCase()}.${form.lastName.toLowerCase()}@hrplatform.com`
                : `user${Math.floor(Math.random() * 10000)}@hrplatform.com`);

        const chars =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let generatedPassword = "";
        for (let i = 0; i < 10; i++) {
            generatedPassword += chars.charAt(
                Math.floor(Math.random() * chars.length),
            );
        }

        setForm((prev: any) => ({
            ...prev,
            email: generatedEmail,
            password: generatedPassword,
        }));
    };

    const handleCreateDept = async (name: string, parentId?: string) => {
        setIsDeptLoading(true);
        try {
            const dept = await createDepartment({ name, parentId });
            setDepartments([...departments, dept]);
            setForm({ ...form, departmentId: dept.id });
            setIsCreatingDept(false);
        } catch (e: any) {
            console.error(e);
            throw e;
        } finally {
            setIsDeptLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...form,
            leaveBalance:
                form.leaveBalance === "" ? 0 : Number(form.leaveBalance),
        };

        onSubmit(payload);
    };

    const isEditMode = Boolean(initialData && !initialData.candidateId && initialData.id);

    return (
        <div className="bg-white p-6 border border-gray-200 h-fit">
            {initialData?.candidateId && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2">
                    <span>🎉</span>
                    <span>Nomzod: {form.firstName} {form.lastName} ({form.email}) ishga qabul qilinmoqda</span>
                </div>
            )}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold uppercase tracking-wider text-black">
                    {isEditMode ? t("editEmployee") : t("addEmployee")}
                </h2>
                {!isEditMode && (
                    <button
                        type="button"
                        onClick={generateCredentials}
                        className="px-3 py-1 bg-gray-200 text-black text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-gray-300 transition-colors"
                    >
                        {t("generate")}
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            {t("firstName")}
                        </label>
                        <input
                            type="text"
                            value={form.firstName}
                            onChange={(e) =>
                                setForm({ ...form, firstName: e.target.value })
                            }
                            required
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            {t("lastName")}
                        </label>
                        <input
                            type="text"
                            value={form.lastName}
                            onChange={(e) =>
                                setForm({ ...form, lastName: e.target.value })
                            }
                            required
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            {t("email")}
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            required
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            {t("password")}
                        </label>
                        <input
                            type="text"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                            required={!initialData}
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            {t("role")}
                        </label>
                        <select
                            value={form.role}
                            onChange={(e) =>
                                setForm({ ...form, role: e.target.value })
                            }
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                        >
                            <option value="EMPLOYEE">{t("employee")}</option>
                            <option value="MANAGER">{t("manager")}</option>
                            <option value="RECRUITER">{t("recruiter")}</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                {t("status")}
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsManagingStatus(true)}
                                className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                + Sozlash
                            </button>
                        </div>
                        <select
                            value={form.statusConfigId || form.status || ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                const matchedConfig = statuses.find(
                                    (s) => s.id === val || s.code === val,
                                );
                                setForm({
                                    ...form,
                                    statusConfigId: matchedConfig?.id || val,
                                    status: matchedConfig?.code || val,
                                });
                            }}
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black font-bold"
                        >
                            {statuses.length > 0 ? (
                                statuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.durationDays ? `(${s.durationDays} kun)` : ""}
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="NEW">✨ {t("statusNew")}</option>
                                    <option value="ACTIVE">🟢 {t("statusActive")}</option>
                                    <option value="INACTIVE">⚪ {t("statusInactive")}</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            {t("leaveBalance")}
                        </label>
                        <input
                            type="number"
                            value={form.leaveBalance}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    leaveBalance:
                                        e.target.value === ""
                                            ? ""
                                            : Number(e.target.value),
                                })
                            }
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                {t("department")}
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsCreatingDept(true)}
                                className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                {t("createDeptBtn")}
                            </button>
                        </div>
                        <select
                            value={form.departmentId}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    departmentId: e.target.value,
                                })
                            }
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black w-full"
                        >
                            <option value="">-- Tanlang --</option>
                            {departments.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            {t("position")}
                        </label>
                        <input
                            type="text"
                            value={form.positionId}
                            onChange={(e) =>
                                setForm({ ...form, positionId: e.target.value })
                            }
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {loading ? t("loading") : t("submit")}
                    </button>
                    {initialData && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 border border-gray-300 text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-50 transition-colors"
                        >
                            {t("cancel")}
                        </button>
                    )}
                </div>
            </form>
            <DepartmentModal
                isOpen={isCreatingDept}
                onClose={() => setIsCreatingDept(false)}
                onSave={handleCreateDept}
                departments={departments}
            />
            <StatusManagementModal
                isOpen={isManagingStatus}
                onClose={() => setIsManagingStatus(false)}
                statuses={statuses}
                onRefresh={loadStatuses}
            />
        </div>
    );
}
