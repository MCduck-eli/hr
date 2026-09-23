import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchDepartments, createDepartment } from "@/src/services/department-service";
import { fetchAllStatuses } from "@/src/services/employee-status-service";
import { fetchAllRoles } from "@/src/services/role-service";
import DepartmentModal from "./department-modal";
import StatusManagementModal from "./status-management-modal";
import RoleManagementModal from "./role-management-modal";

interface EmployeeFormProps {
    initialData: any;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    loading: boolean;
}

interface FormErrors {
    firstName?: "requiredField" | "minLetters" | "onlyLetters";
    lastName?: "requiredField" | "minLetters" | "onlyLetters";
    email?: "requiredField" | "invalidEmail";
    password?: "requiredField" | "minPassword" | "weakPassword";
}

const NAME_REGEX = /^[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ'ʻʼ`\s-]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;

function validateNameField(val: string): "requiredField" | "minLetters" | "onlyLetters" | null {
    const trimmed = (val || "").trim();
    if (!trimmed) {
        return "requiredField";
    }
    if (trimmed.length < 3) {
        return "minLetters";
    }
    if (!NAME_REGEX.test(trimmed)) {
        return "onlyLetters";
    }
    return null;
}

function validateEmailField(val: string): "requiredField" | "invalidEmail" | null {
    const trimmed = (val || "").trim();
    if (!trimmed) {
        return "requiredField";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return "invalidEmail";
    }
    return null;
}

function validatePasswordField(val: string, isRequired: boolean): "requiredField" | "minPassword" | "weakPassword" | null {
    const trimmed = (val || "").trim();
    if (isRequired && !trimmed) {
        return "requiredField";
    }
    if (trimmed) {
        if (trimmed.length < 5) {
            return "minPassword";
        }
        if (!STRONG_PASSWORD_REGEX.test(trimmed)) {
            return "weakPassword";
        }
    }
    return null;
}

export default function EmployeeForm({
    initialData,
    onSubmit,
    onCancel,
    loading,
}: EmployeeFormProps) {
    const t = useTranslations("HREmployees");
    const tErr = useTranslations("errors");

    const [departments, setDepartments] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [isCreatingDept, setIsCreatingDept] = useState(false);
    const [isManagingStatus, setIsManagingStatus] = useState(false);
    const [isManagingRoles, setIsManagingRoles] = useState(false);
    const [isDeptLoading, setIsDeptLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

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

    const loadRoles = async () => {
        try {
            const data = await fetchAllRoles();
            setRoles(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const [currentUserRole, setCurrentUserRole] = useState("");

    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const parsed = JSON.parse(userStr);
                setCurrentUserRole(parsed.role || "");
            }
        } catch (e) {}
        loadDepartments();
        loadStatuses();
        loadRoles();
    }, []);

    const [form, setForm] = useState<any>({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "EMPLOYEE",
        customRoleId: "",
        status: "NEW",
        statusConfigId: "",
        departmentId: "",
        positionId: "",
        leaveBalance: "",
    });

    useEffect(() => {
        setFormErrors({});
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
                role: initialData.customRoleId || initialData.role || "EMPLOYEE",
                customRoleId: initialData.customRoleId || "",
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
                customRoleId: "",
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
        setFormErrors((prev) => ({
            ...prev,
            email: undefined,
            password: undefined,
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

        const firstNameErr = validateNameField(form.firstName);
        const lastNameErr = validateNameField(form.lastName);
        const emailErr = validateEmailField(form.email);
        const passwordErr = validatePasswordField(form.password, !initialData);

        if (firstNameErr || lastNameErr || emailErr || passwordErr) {
            setFormErrors({
                firstName: firstNameErr || undefined,
                lastName: lastNameErr || undefined,
                email: emailErr || undefined,
                password: passwordErr || undefined,
            });
            return;
        }

        setFormErrors({});

        let payloadRole = form.role || "EMPLOYEE";
        let payloadCustomRoleId = form.customRoleId || null;

        const matchedRole = roles.find((r) => r.id === form.customRoleId || r.id === form.role || r.code === form.role);
        if (matchedRole) {
            if (matchedRole.isSystem) {
                payloadRole = matchedRole.code;
                payloadCustomRoleId = null;
            } else {
                payloadRole = matchedRole.baseRole;
                payloadCustomRoleId = matchedRole.id;
            }
        }

        const payload = {
            ...form,
            role: payloadRole,
            customRoleId: payloadCustomRoleId,
            leaveBalance:
                form.leaveBalance === "" ? 0 : Number(form.leaveBalance),
        };

        onSubmit(payload);
    };

    const isEditMode = Boolean(initialData && !initialData.candidateId && initialData.id);

    return (
        <div className="flex flex-col gap-6">
            {initialData?.candidateId && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <span>🎉</span>
                    <span>Nomzod: {form.firstName} {form.lastName} ({form.email}) ishga qabul qilinmoqda</span>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900">
                        {isEditMode ? t("editEmployee") : t("addEmployee")}
                    </h3>
                    <p className="text-xs text-slate-500">
                        Xodim ma'lumotlarini to'ldiring va tizim ruxsatlarini belgilang
                    </p>
                </div>
                {!isEditMode && (
                    <button
                        type="button"
                        onClick={generateCredentials}
                        className="px-3.5 py-1.5 bg-purple-50 text-[#9327FF] hover:bg-purple-100 text-xs font-bold rounded-xl transition-colors"
                    >
                        ⚡ {t("generate")}
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">
                            {t("firstName")} *
                        </label>
                        <input
                            type="text"
                            value={form.firstName}
                            onChange={(e) => {
                                const val = e.target.value;
                                setForm({ ...form, firstName: val });
                                if (formErrors.firstName) {
                                    setFormErrors((prev) => ({
                                        ...prev,
                                        firstName: validateNameField(val) || undefined,
                                    }));
                                }
                            }}
                            className={`p-3 border ${
                                formErrors.firstName
                                    ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-slate-200 focus:ring-[#9327FF]/10 focus:border-[#9327FF]"
                            } text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 transition-all`}
                        />
                        {formErrors.firstName && (
                            <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                {tErr(formErrors.firstName)}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">
                            {t("lastName")} *
                        </label>
                        <input
                            type="text"
                            value={form.lastName}
                            onChange={(e) => {
                                const val = e.target.value;
                                setForm({ ...form, lastName: val });
                                if (formErrors.lastName) {
                                    setFormErrors((prev) => ({
                                        ...prev,
                                        lastName: validateNameField(val) || undefined,
                                    }));
                                }
                            }}
                            className={`p-3 border ${
                                formErrors.lastName
                                    ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-slate-200 focus:ring-[#9327FF]/10 focus:border-[#9327FF]"
                            } text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 transition-all`}
                        />
                        {formErrors.lastName && (
                            <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                {tErr(formErrors.lastName)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">
                            {t("email")} *
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => {
                                const val = e.target.value;
                                setForm({ ...form, email: val });
                                if (formErrors.email) {
                                    setFormErrors((prev) => ({
                                        ...prev,
                                        email: validateEmailField(val) || undefined,
                                    }));
                                }
                            }}
                            className={`p-3 border ${
                                formErrors.email
                                    ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-slate-200 focus:ring-[#9327FF]/10 focus:border-[#9327FF]"
                            } text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 transition-all`}
                        />
                        {formErrors.email && (
                            <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                {tErr(formErrors.email)}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">
                            {t("password")} {!initialData && "*"}
                        </label>
                        <input
                            type="text"
                            value={form.password}
                            onChange={(e) => {
                                const val = e.target.value;
                                setForm({ ...form, password: val });
                                if (formErrors.password) {
                                    setFormErrors((prev) => ({
                                        ...prev,
                                        password: validatePasswordField(val, !initialData) || undefined,
                                    }));
                                }
                            }}
                            placeholder={initialData ? "O'zgartirmaslik uchun bo'sh qoldiring" : ""}
                            className={`p-3 border ${
                                formErrors.password
                                    ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-slate-200 focus:ring-[#9327FF]/10 focus:border-[#9327FF]"
                            } text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 transition-all font-mono`}
                        />
                        {formErrors.password && (
                            <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                {tErr(formErrors.password)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">
                                {t("role")}
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsManagingRoles(true)}
                                className="text-[10px] font-bold text-[#9327FF] hover:underline"
                            >
                                + Sozlash
                            </button>
                        </div>
                        <select
                            value={form.customRoleId || form.role || "EMPLOYEE"}
                            onChange={(e) => {
                                const val = e.target.value;
                                const matched = roles.find((r) => r.id === val || r.code === val);
                                if (matched) {
                                    if (matched.isSystem) {
                                        setForm({
                                            ...form,
                                            role: matched.code,
                                            customRoleId: "",
                                        });
                                    } else {
                                        setForm({
                                            ...form,
                                            role: matched.baseRole,
                                            customRoleId: matched.id,
                                        });
                                    }
                                } else {
                                    setForm({
                                        ...form,
                                        role: val,
                                        customRoleId: "",
                                    });
                                }
                            }}
                            className="p-3 border border-slate-200 text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-[#9327FF] font-semibold"
                        >
                            {roles.length > 0 ? (
                                roles
                                    .filter((r) => {
                                        if (r.code === "DIRECTOR" && currentUserRole !== "DIRECTOR" && currentUserRole !== "SUPER_ADMIN") {
                                            return false;
                                        }
                                        return true;
                                    })
                                    .map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.isSystem ? `🛡️ ${r.name}` : `✨ ${r.name}`}
                                        </option>
                                    ))
                            ) : (
                                <>
                                    <option value="EMPLOYEE">{t("employee") || "Xodim"}</option>
                                    <option value="DEPARTMENT_HEAD">{t("departmentHead") || "Bo'lim boshlig'i"}</option>
                                    <option value="HR_ADMIN">{t("hrAdmin") || "HR Admin"}</option>
                                    <option value="ACCOUNTANT">{t("accountant") || "Bugalter / Hisobchi"}</option>
                                    <option value="RECRUITER">{t("recruiter") || "Rekruter"}</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">
                                {t("status")}
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsManagingStatus(true)}
                                className="text-[10px] font-bold text-[#9327FF] hover:underline"
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
                            className="p-3 border border-slate-200 text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-[#9327FF] font-semibold"
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
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">
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
                            className="p-3 border border-slate-200 text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-[#9327FF] transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">
                                {t("department")}
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsCreatingDept(true)}
                                className="text-[10px] font-bold text-[#9327FF] hover:underline"
                            >
                                + Yangi
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
                            className="p-3 border border-slate-200 text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-[#9327FF] w-full"
                        >
                            <option value="">-- Tanlang --</option>
                            {departments.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">
                            {t("position")}
                        </label>
                        <input
                            type="text"
                            value={form.positionId}
                            onChange={(e) =>
                                setForm({ ...form, positionId: e.target.value })
                            }
                            className="p-3 border border-slate-200 text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-[#9327FF] transition-all"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                    {initialData && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium rounded-xl text-xs transition-colors"
                        >
                            {t("cancel")}
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl text-xs transition-all duration-200 shadow-sm disabled:opacity-50"
                    >
                        {loading ? t("loading") : t("submit")}
                    </button>
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
            <RoleManagementModal
                isOpen={isManagingRoles}
                onClose={() => setIsManagingRoles(false)}
                roles={roles}
                onRefresh={loadRoles}
            />
        </div>
    );
}
