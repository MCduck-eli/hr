"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
    phone?: "requiredField";
    hireDate?: "requiredField";
}

function toDateInputValue(val: any): string {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}

const MONTHS_UZ = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
];

const WEEKDAYS_UZ = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

function parseDateValue(value: string): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
}

function formatDisplayDate(value: string): string {
    const date = parseDateValue(value);
    if (!date) return "";
    return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function parseDisplayDate(text: string): string | null {
    const match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return toDateInputValue(date);
}

function DateField({
    value,
    onChange,
    error,
}: {
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(() => parseDateValue(value) || new Date());
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [inputText, setInputText] = useState(() => formatDisplayDate(value));
    const [inputInvalid, setInputInvalid] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputText(formatDisplayDate(value));
    }, [value]);

    useEffect(() => {
        if (!open) return;

        setViewDate(parseDateValue(value) || new Date());

        const updatePosition = () => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const width = 292;
            const height = 348;
            const openAbove = rect.bottom + height + 12 > window.innerHeight && rect.top > height + 12;
            setPosition({
                top: openAbove ? rect.top - height - 8 : rect.bottom + 8,
                left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
            });
        };

        updatePosition();

        const handlePointerDown = (event: MouseEvent) => {
            if (
                popoverRef.current?.contains(event.target as Node) ||
                containerRef.current?.contains(event.target as Node)
            ) {
                return;
            }
            setOpen(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        window.addEventListener("resize", updatePosition);
        document.addEventListener("scroll", updatePosition, true);
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("resize", updatePosition);
            document.removeEventListener("scroll", updatePosition, true);
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, value]);

    const selected = parseDateValue(value);
    const today = new Date();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const selectDate = (date: Date) => {
        onChange(toDateInputValue(date));
        setOpen(false);
    };

    const openPicker = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const width = 292;
            const height = 348;
            const openAbove = rect.bottom + height + 12 > window.innerHeight && rect.top > height + 12;
            setPosition({
                top: openAbove ? rect.top - height - 8 : rect.bottom + 8,
                left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
            });
        }
        setOpen(true);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value.replace(/[^\d.]/g, "").slice(0, 10);
        const digits = raw.replace(/\D/g, "");
        let formatted = raw;
        if (!raw.includes(".") && digits.length > 4) {
            formatted = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
        } else if (!raw.includes(".") && digits.length > 2) {
            formatted = `${digits.slice(0, 2)}.${digits.slice(2, 8)}`;
        }
        setInputText(formatted);
        const parsed = parseDisplayDate(formatted);
        if (parsed) {
            setInputInvalid(false);
            onChange(parsed);
        } else {
            const complete = /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(formatted);
            setInputInvalid(complete);
        }
    };

    const handleInputBlur = () => {
        setInputText(formatDisplayDate(value));
        setInputInvalid(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder="kun.oy.yil"
                value={inputText}
                onChange={handleInputChange}
                onFocus={(event) => event.target.select()}
                onBlur={handleInputBlur}
                onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault();
                }}
                className={`w-full p-3 pr-11 border ${
                    error || inputInvalid
                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                        : open
                        ? "border-[#9327FF] ring-2 ring-[#9327FF]/10"
                        : "border-slate-200 focus:ring-[#9327FF]/10 focus:border-[#9327FF]"
                } text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 transition-all font-mono font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal`}
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => (open ? setOpen(false) : openPicker())}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    open ? "bg-purple-50 text-[#9327FF]" : "text-slate-400 hover:text-[#9327FF] hover:bg-purple-50"
                }`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>

            {open &&
                createPortal(
                    <div
                        ref={popoverRef}
                        style={{ position: "fixed", top: position.top, left: position.left, width: 292 }}
                        className="z-[120] bg-white rounded-2xl border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.18)] p-3.5 flex flex-col gap-2.5"
                    >
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                {MONTHS_UZ[month]} {year}
                            </span>
                            <button
                                type="button"
                                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {WEEKDAYS_UZ.map((day) => (
                                <span key={day} className="text-[10px] font-bold text-slate-400 text-center uppercase">
                                    {day}
                                </span>
                            ))}
                            {cells.map((date, index) => {
                                if (!date) return <span key={`empty-${index}`} />;
                                const isSelected =
                                    selected &&
                                    date.getFullYear() === selected.getFullYear() &&
                                    date.getMonth() === selected.getMonth() &&
                                    date.getDate() === selected.getDate();
                                const isToday =
                                    date.getFullYear() === today.getFullYear() &&
                                    date.getMonth() === today.getMonth() &&
                                    date.getDate() === today.getDate();
                                return (
                                    <button
                                        key={date.toISOString()}
                                        type="button"
                                        onClick={() => selectDate(date)}
                                        className={`h-8 w-8 mx-auto rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                            isSelected
                                                ? "bg-[#9327FF] text-white shadow-sm"
                                                : isToday
                                                ? "bg-purple-50 text-[#9327FF] border border-purple-200"
                                                : "text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    const now = new Date();
                                    onChange(toDateInputValue(now));
                                    setOpen(false);
                                }}
                                className="text-[11px] font-bold text-[#9327FF] hover:underline cursor-pointer"
                            >
                                Bugun
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
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

function validatePhoneField(val: string): "requiredField" | null {
    const trimmed = (val || "").trim();
    if (!trimmed) {
        return "requiredField";
    }
    return null;
}

const PLATFORM_PERMISSIONS = [
    { key: "hr_dashboard", label: "HR Dashboard", description: "HR boshqaruv paneli va monitoring" },
    { key: "employees", label: "Xodimlar Ro'yxati", description: "Xodimlarni ko'rish va boshqarish" },
    { key: "attendance", label: "Davomat Tizimi", description: "Xodimlar davomatini nazorat qilish" },
    { key: "payroll", label: "Bugalteriya (Payroll)", description: "Ish haqi, avans va hisob-kitoblar" },
    { key: "org_chart", label: "Tashkiliy Tuzilma", description: "Kompaniya ierarxik daraxti" },
    { key: "analytics", label: "BI & 9-Box Analitika", description: "Kompaniya ko'rsatkichlari va tahlillar" },
    { key: "okr", label: "OKR Maqsadlar", description: "Maqsadlar va kalit natijalar tizimi" },
    { key: "grading", label: "Greyding Tizimi", description: "Darajalar va lavozimlar mezonlari" },
    { key: "disc", label: "DISC Modeli", description: "Psixologik xarakter tahlili" },
    { key: "feedback360", label: "360° Baholash", description: "360 darajali so'rovnoma va baholashlar" },
    { key: "recruiting", label: "Rekruting", description: "Vakansiyalar va nomzodlar boshqaruvi" },
    { key: "onboarding", label: "Onboarding", description: "Yangi xodimlarni moslashtirish dasturi" },
    { key: "offboarding", label: "Offboarding", description: "Xodimni ishdan bo'shatish jarayoni" },
    { key: "academy", label: "Akademiya", description: "Ta'lim kurslari va video darsliklar" },
    { key: "regulations", label: "Ichki Nizomlar", description: "Kompaniya qoidalari va nizomlari" },
    { key: "ejm", label: "EJM Roadmap", description: "Xodim sayohati xaritasi" },
];

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

    const getFormattedAvatarUrl = (raw: string) => {
        if (!raw) return "";
        if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:") || raw.startsWith("blob:")) {
            return raw;
        }
        const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const baseOrigin = rawApi.replace(/\/api(\/v\d+)?\/?$/, "").replace(/\/+$/, "");
        const cleanPath = raw.startsWith("/") ? raw : `/${raw}`;
        return `${baseOrigin}${cleanPath}`;
    };

    const [avatarError, setAvatarError] = useState(false);
    const [form, setForm] = useState<any>({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        avatar: null,
        avatarPreview: "",
        role: "EMPLOYEE",
        customRoleId: "",
        status: "NEW",
        statusConfigId: "",
        departmentId: "",
        positionId: "",
        leaveBalance: "",
        hireDate: toDateInputValue(new Date()),
        permissions: [],
    });

    useEffect(() => {
        setFormErrors({});
        setAvatarError(false);
        if (initialData) {
            let defaultPass = "";
            if (initialData.candidateId && !initialData.password) {
                const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                for (let i = 0; i < 10; i++) {
                    defaultPass += chars.charAt(Math.floor(Math.random() * chars.length));
                }
            }

            const existingAvatar = initialData.avatar || initialData.employee?.avatar || initialData.image || initialData.employee?.image || initialData.photo || initialData.employee?.photo || "";
            const formattedAvatarUrl = getFormattedAvatarUrl(existingAvatar);

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
                phone:
                    initialData.phone ||
                    initialData.employee?.phone ||
                    "",
                avatar: null,
                avatarPreview: formattedAvatarUrl,
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
                hireDate: toDateInputValue(
                    initialData.hireDate ||
                        initialData.employee?.hireDate ||
                        initialData.employee?.createdAt ||
                        new Date(),
                ),
                permissions: initialData.permissions || initialData.employee?.user?.permissions || initialData.user?.permissions || [],
            });
        } else {
            setForm({
                email: "",
                password: "",
                firstName: "",
                lastName: "",
                phone: "",
                avatar: null,
                avatarPreview: "",
                role: "EMPLOYEE",
                customRoleId: "",
                status: "NEW",
                statusConfigId: "",
                departmentId: "",
                positionId: "",
                leaveBalance: "",
                hireDate: toDateInputValue(new Date()),
                permissions: [],
            });
        }
    }, [initialData]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarError(false);
            const previewUrl = URL.createObjectURL(file);
            setForm((prev: any) => ({
                ...prev,
                avatar: file,
                avatarPreview: previewUrl,
            }));
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarError(false);
        setForm((prev: any) => ({
            ...prev,
            avatar: null,
            avatarPreview: "",
        }));
    };

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
        const phoneErr = validatePhoneField(form.phone);
        const hireDateErr = form.hireDate ? null : "requiredField";

        if (firstNameErr || lastNameErr || emailErr || passwordErr || phoneErr || hireDateErr) {
            setFormErrors({
                firstName: firstNameErr || undefined,
                lastName: lastNameErr || undefined,
                email: emailErr || undefined,
                password: passwordErr || undefined,
                phone: phoneErr || undefined,
                hireDate: hireDateErr || undefined,
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

        const payload: any = {
            ...form,
            role: payloadRole,
            customRoleId: payloadCustomRoleId,
            leaveBalance:
                form.leaveBalance === "" ? 0 : Number(form.leaveBalance),
        };

        delete payload.avatarPreview;

        payload.permissions = Array.isArray(form.permissions) ? form.permissions : [];

        if (form.avatar instanceof File) {
            payload.avatar = form.avatar;
        } else if (!form.avatarPreview && initialData) {
            payload.avatar = null;
        } else {
            delete payload.avatar;
        }

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
                <div className="flex items-center gap-4 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                    <div className="relative w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-purple-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                        {form.avatarPreview && !avatarError ? (
                            <img
                                src={form.avatarPreview}
                                alt="Avatar"
                                onError={() => setAvatarError(true)}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400">
                                {form.firstName ? (
                                    <span className="text-base font-bold text-[#9327FF] uppercase">
                                        {form.firstName[0]}
                                    </span>
                                ) : (
                                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-xs font-bold text-slate-800 block">
                            Rasm yuklash
                        </label>
                        <p className="text-[11px] text-slate-500 mb-2">
                            PNG, JPG yoki WEBP formatda (ixtiyoriy)
                        </p>
                        <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-white border border-purple-200 hover:bg-purple-50 text-[#9327FF] text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span>{form.avatarPreview ? "O'zgartirish" : "Fayl tanlash"}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </label>
                            {form.avatarPreview && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    O'chirish
                                </button>
                            )}
                        </div>
                    </div>
                </div>

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
                        <label className="text-xs font-bold text-slate-700">
                            Telefon raqami *
                        </label>
                        <input
                            type="tel"
                            value={form.phone}
                            placeholder="+998 90 123 45 67"
                            onChange={(e) => {
                                const val = e.target.value;
                                setForm({ ...form, phone: val });
                                if (formErrors.phone) {
                                    setFormErrors((prev) => ({
                                        ...prev,
                                        phone: validatePhoneField(val) || undefined,
                                    }));
                                }
                            }}
                            className={`p-3 border ${
                                formErrors.phone
                                    ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-slate-200 focus:ring-[#9327FF]/10 focus:border-[#9327FF]"
                            } text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 transition-all`}
                        />
                        {formErrors.phone && (
                            <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                {tErr(formErrors.phone)}
                            </span>
                        )}
                    </div>

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
                            Ish boshlash sanasi *
                        </label>
                        <DateField
                            value={form.hireDate}
                            error={Boolean(formErrors.hireDate)}
                            onChange={(val) => {
                                setForm({ ...form, hireDate: val });
                                if (formErrors.hireDate) {
                                    setFormErrors((prev) => ({
                                        ...prev,
                                        hireDate: val ? undefined : "requiredField",
                                    }));
                                }
                            }}
                        />
                        {formErrors.hireDate && (
                            <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                {tErr(formErrors.hireDate)}
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

                {(currentUserRole === "DIRECTOR" || currentUserRole === "SUPER_ADMIN") && (
                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900">
                                    Qo'shimcha Ruxsatlar (Permissions)
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    Xodimga individual ochib beriladigan platforma modullari
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm((prev: any) => ({
                                            ...prev,
                                            permissions: PLATFORM_PERMISSIONS.map((p) => p.key),
                                        }))
                                    }
                                    className="text-[11px] font-bold text-[#9327FF] hover:underline"
                                >
                                    Hammasini tanlash
                                </button>
                                <span className="text-slate-300">•</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm((prev: any) => ({
                                            ...prev,
                                            permissions: [],
                                        }))
                                    }
                                    className="text-[11px] font-bold text-slate-500 hover:underline"
                                >
                                    Tozalash
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 max-h-64 overflow-y-auto">
                            {PLATFORM_PERMISSIONS.map((perm) => {
                                const isChecked = (form.permissions || []).includes(perm.key);
                                return (
                                    <label
                                        key={perm.key}
                                        onClick={() => {
                                            const current = form.permissions || [];
                                            setForm((prev: any) => ({
                                                ...prev,
                                                permissions: isChecked
                                                    ? current.filter((k: string) => k !== perm.key)
                                                    : [...current, perm.key],
                                            }));
                                        }}
                                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                            isChecked
                                                ? "bg-purple-50/60 border-purple-200 text-purple-950 shadow-2xs"
                                                : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}}
                                            className="mt-0.5 rounded border-gray-300 text-[#9327FF] focus:ring-[#9327FF] w-4 h-4 cursor-pointer"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold leading-snug">
                                                {perm.label}
                                            </span>
                                            <span className="text-[10px] text-slate-500 leading-tight">
                                                {perm.description}
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}

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
