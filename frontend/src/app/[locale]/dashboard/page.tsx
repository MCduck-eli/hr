"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import EmailVerificationModal from "@/src/components/common/EmailVerificationModal";
import { sendOtpApi } from "@/src/services/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FormErrors {
    companyName?: "requiredField";
    firstName?: "requiredField" | "minLetters" | "onlyLetters";
    lastName?: "requiredField" | "minLetters" | "onlyLetters";
    email?: "requiredField" | "invalidEmail";
    password?: "requiredField" | "minPassword" | "weakPassword";
}

const NAME_REGEX = /^[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ'ʻʼ`\s-]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;

function validateRequiredField(val: string): "requiredField" | null {
    const trimmed = (val || "").trim();
    if (!trimmed) {
        return "requiredField";
    }
    return null;
}

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

export default function SuperAdminDashboard() {
    const t = useTranslations("Dashboard");
    const tErr = useTranslations("errors");
    const params = useParams();
    const router = useRouter();
    const locale = params.locale as string;

    const [directors, setDirectors] = useState<any[]>([]);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [form, setForm] = useState({
        companyName: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        role: "DIRECTOR",
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    const fetchDirectors = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                const list = data.data || data.users || [];
                const filtered = list.filter((u: any) => u.role === "DIRECTOR");
                setDirectors(filtered);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            router.push(`/${locale}/login`);
            return;
        }
        try {
            const user = JSON.parse(userStr);
            if (user.role !== "SUPER_ADMIN") {
                router.push(`/${locale}/profile`);
                return;
            }
        } catch (err) {
            router.push(`/${locale}/login`);
            return;
        }

        fetchDirectors();
    }, [locale, router]);

    const generateCredentials = () => {
        const cleanCompany = form.companyName
            ? form.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")
            : "company";
        const cleanName =
            form.firstName && form.lastName
                ? `${form.firstName.toLowerCase()}.${form.lastName.toLowerCase()}`
                : `director${Math.floor(Math.random() * 1000)}`;

        const generatedEmail = `${cleanName}@${cleanCompany}.com`;

        const chars =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let generatedPassword = "";
        for (let i = 0; i < 10; i++) {
            generatedPassword += chars.charAt(
                Math.floor(Math.random() * chars.length),
            );
        }

        setForm({
            ...form,
            email: generatedEmail,
            password: generatedPassword,
        });
        setFormErrors((prev) => ({
            ...prev,
            email: undefined,
            password: undefined,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const companyNameErr = validateRequiredField(form.companyName);
        const firstNameErr = validateNameField(form.firstName);
        const lastNameErr = validateNameField(form.lastName);
        const emailErr = validateEmailField(form.email);
        const passwordErr = validatePasswordField(form.password, !editingUserId);

        if (companyNameErr || firstNameErr || lastNameErr || emailErr || passwordErr) {
            setFormErrors({
                companyName: companyNameErr || undefined,
                firstName: firstNameErr || undefined,
                lastName: lastNameErr || undefined,
                email: emailErr || undefined,
                password: passwordErr || undefined,
            });
            const firstErr = companyNameErr || firstNameErr || lastNameErr || emailErr || passwordErr;
            showToast(tErr(firstErr as any), "error");
            return;
        }

        setFormErrors({});
        setLoading(true);
        setError("");

        if (editingUserId) {
            try {
                const token = localStorage.getItem("token");
                const payload: any = {
                    ...form,
                    role: "DIRECTOR",
                };
                if (!payload.password) {
                    delete payload.password;
                }

                const res = await fetch(`${API_URL}/users/${editingUserId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Error");

                resetForm();
                fetchDirectors();
                showToast(t("toastUpdated"), "success");
            } catch (err: any) {
                setError(err.message);
                showToast(err.message || t("toastError"), "error");
            } finally {
                setLoading(false);
            }
            return;
        }

        try {
            await sendOtpApi({ email: form.email, checkExisting: true });
            setIsVerificationModalOpen(true);
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || t("toastError"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifiedCreateDirector = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            const payload: any = {
                ...form,
                role: "DIRECTOR",
            };

            const res = await fetch(`${API_URL}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error");

            setIsVerificationModalOpen(false);
            resetForm();
            fetchDirectors();
            showToast(t("toastSaved"), "success");
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || t("toastError"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditDirector = (user: any) => {
        setEditingUserId(user.id);
        setFormErrors({});
        setForm({
            companyName: user.companyName || user.employee?.companyName || "",
            firstName: user.employee?.firstName || user.firstName || "",
            lastName: user.employee?.lastName || user.lastName || "",
            email: user.email,
            phone: user.phone || "",
            password: "",
            role: "DIRECTOR",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const resetForm = () => {
        setEditingUserId(null);
        setFormErrors({});
        setForm({
            companyName: "",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            role: "DIRECTOR",
        });
        setError("");
    };

    const handleDeleteDirector = (user: any) => {
        setDeleteModalUser(user);
    };

    const confirmDeleteDirector = async () => {
        if (!deleteModalUser) return;
        setIsDeleting(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/users/${deleteModalUser.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Error");
            }

            setDeleteModalUser(null);
            fetchDirectors();
            showToast(t("toastDeleted"), "success");
        } catch (err: any) {
            showToast(err.message || t("toastError"), "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLoginAsDirector = (user: any) => {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
            localStorage.setItem("originalAdminUser", currentUser);
        }
        localStorage.setItem("user", JSON.stringify(user));
        document.cookie = `user_role=${user.role || ""}; path=/; max-age=86400; SameSite=Lax`;
        router.push(`/${locale}/director/dashboard`);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50/60 p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-950 flex items-center gap-3">
                            <span>🏢</span>
                            <span>{t("title")}</span>
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
                            {t("subtitle")}
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-2xl shadow-sm text-xs font-bold text-slate-700 flex items-center gap-2.5 w-fit">
                        <span className="text-slate-400 font-medium uppercase">{t("totalCompanies")}:</span>
                        <span className="font-mono text-sm font-black text-slate-950">{directors.length}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <span>{editingUserId ? "✏️" : "➕"}</span>
                                <span>{editingUserId ? t("editDirector") : t("addDirector")}</span>
                            </h2>
                            {!editingUserId && (
                                <button
                                    type="button"
                                    onClick={generateCredentials}
                                    className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium rounded-xl px-3.5 py-1.5 text-xs transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>⚡</span>
                                    <span>{t("generate")}</span>
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    {t("companyName")} *
                                </label>
                                <input
                                    type="text"
                                    value={form.companyName}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setForm({
                                            ...form,
                                            companyName: val,
                                        });
                                        if (formErrors.companyName) {
                                            setFormErrors((prev) => ({
                                                ...prev,
                                                companyName: validateRequiredField(val) || undefined,
                                            }));
                                        }
                                    }}
                                    placeholder={t("companyNamePlaceholder")}
                                    className={`w-full px-4 py-3 rounded-xl border ${
                                        formErrors.companyName
                                            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                            : "border-slate-200 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                                    } bg-slate-50/50 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200`}
                                />
                                {formErrors.companyName && (
                                    <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                        {tErr(formErrors.companyName)}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        {t("directorFirstName")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.firstName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setForm({
                                                ...form,
                                                firstName: val,
                                            });
                                            if (formErrors.firstName) {
                                                setFormErrors((prev) => ({
                                                    ...prev,
                                                    firstName: validateNameField(val) || undefined,
                                                }));
                                            }
                                        }}
                                        className={`w-full px-4 py-3 rounded-xl border ${
                                            formErrors.firstName
                                                ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                                : "border-slate-200 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                                        } bg-slate-50/50 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200`}
                                    />
                                    {formErrors.firstName && (
                                        <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                            {tErr(formErrors.firstName)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        {t("directorLastName")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.lastName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setForm({
                                                ...form,
                                                lastName: val,
                                            });
                                            if (formErrors.lastName) {
                                                setFormErrors((prev) => ({
                                                    ...prev,
                                                    lastName: validateNameField(val) || undefined,
                                                }));
                                            }
                                        }}
                                        className={`w-full px-4 py-3 rounded-xl border ${
                                            formErrors.lastName
                                                ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                                : "border-slate-200 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                                        } bg-slate-50/50 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200`}
                                    />
                                    {formErrors.lastName && (
                                        <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                            {tErr(formErrors.lastName)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
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
                                    className={`w-full px-4 py-3 rounded-xl border ${
                                        formErrors.email
                                            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                            : "border-slate-200 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                                    } bg-slate-50/50 text-sm font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200`}
                                />
                                {formErrors.email && (
                                    <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                        {tErr(formErrors.email)}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    {t("phone")}
                                </label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm({ ...form, phone: e.target.value })
                                    }
                                    placeholder={t("phonePlaceholder")}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] focus:bg-white transition-all duration-200"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    {t("password")}{" "}
                                    {editingUserId && (
                                        <span className="text-slate-400 font-normal lowercase text-[11px]">
                                            {t("passwordHint")}
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={form.password}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setForm({
                                            ...form,
                                            password: val,
                                        });
                                        if (formErrors.password) {
                                            setFormErrors((prev) => ({
                                                ...prev,
                                                password: validatePasswordField(val, !editingUserId) || undefined,
                                            }));
                                        }
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl border ${
                                        formErrors.password
                                            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                            : "border-slate-200 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                                    } bg-slate-50/50 text-sm font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200`}
                                />
                                {formErrors.password && (
                                    <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                        {tErr(formErrors.password)}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 px-6 bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl text-xs md:text-sm uppercase tracking-wider transition-all duration-200 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {loading
                                        ? t("loading")
                                        : editingUserId
                                          ? t("saveChanges")
                                          : t("submit")}
                                </button>
                                {editingUserId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-5 py-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium rounded-xl text-xs uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer"
                                    >
                                        {t("cancel")}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                {t("directorList")} ({directors.length})
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                                        <th className="p-4 pl-6">{t("colCompany")}</th>
                                        <th className="p-4">{t("colDirector")}</th>
                                        <th className="p-4">{t("colContacts")}</th>
                                        <th className="p-4 pr-6 text-right">{t("colActions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {directors.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider"
                                            >
                                                {t("noDirectors")}
                                            </td>
                                        </tr>
                                    ) : (
                                        directors.map((u) => (
                                            <tr
                                                key={u.id}
                                                className="hover:bg-slate-50/80 transition-colors duration-150"
                                            >
                                                <td className="p-4 pl-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-sm font-black text-slate-950">
                                                            {u.companyName || u.employee?.companyName || "Standart Korxona"}
                                                        </span>
                                                        <span className="rounded-full px-3 py-0.5 text-xs font-medium bg-green-100 text-green-700 w-fit">
                                                            {t("activeStatus")}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                                                            {(u.employee?.firstName?.[0] || u.firstName?.[0] || "D")}
                                                            {(u.employee?.lastName?.[0] || u.lastName?.[0] || "")}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 text-xs">
                                                                {u.employee?.firstName || u.firstName || ""}{" "}
                                                                {u.employee?.lastName || u.lastName || ""}
                                                            </span>
                                                            <span className="text-[10px] text-[#9327FF] font-bold uppercase tracking-wider">
                                                                {t("directorBadge")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                                                        <span className="text-slate-900 font-medium">
                                                            {u.email}
                                                        </span>
                                                        {u.phone && (
                                                            <span className="text-slate-500 text-[10px]">
                                                                {u.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditDirector(u)}
                                                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                                                        >
                                                            {t("edit")}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDirector(u)}
                                                            className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-medium transition-colors cursor-pointer"
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
                </div>
            </div>

            {deleteModalUser && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg shrink-0">
                                ⚠️
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{t("deleteModalTitle")}</h3>
                                <p className="text-xs text-slate-500">
                                    {deleteModalUser.companyName || deleteModalUser.employee?.companyName || deleteModalUser.email}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {t("deleteModalText")}
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteModalUser(null)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl px-5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {t("cancelBtn")}
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={confirmDeleteDirector}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {isDeleting ? t("deletingBtn") : t("deleteConfirmBtn")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform translate-y-0">
                    <div
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-medium ${
                            toast.type === "success"
                                ? "bg-white border-emerald-200 text-emerald-800"
                                : "bg-white border-rose-200 text-rose-800"
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            <EmailVerificationModal
                isOpen={isVerificationModalOpen}
                email={form.email}
                onClose={() => setIsVerificationModalOpen(false)}
                onVerified={handleVerifiedCreateDirector}
                checkExisting={true}
            />
        </div>
    );
}
