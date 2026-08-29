"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SuperAdminDashboard() {
    const t = useTranslations("Dashboard");
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            const payload: any = {
                ...form,
                role: "DIRECTOR",
            };

            if (editingUserId && !payload.password) {
                delete payload.password;
            }

            const url = editingUserId
                ? `${API_URL}/users/${editingUserId}`
                : `${API_URL}/users`;

            const method = editingUserId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
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
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditDirector = (user: any) => {
        setEditingUserId(user.id);
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

    const handleDeleteDirector = async (id: string) => {
        if (!window.confirm(t("confirmDelete"))) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Error");
            }

            fetchDirectors();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleLoginAsDirector = (user: any) => {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
            localStorage.setItem("originalAdminUser", currentUser);
        }
        localStorage.setItem("user", JSON.stringify(user));
        router.push(`/${locale}/hr/dashboard`);
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8">
            <div className="border-b border-gray-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
                        <span>🏢</span>
                        <span>{t("title")}</span>
                    </h1>
                    <p className="mt-1 text-xs text-gray-500 font-bold uppercase tracking-wider">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="bg-gray-100 border border-gray-200 px-4 py-2 rounded-sm text-xs font-bold text-gray-700 flex items-center gap-2">
                    <span className="text-gray-400 font-normal uppercase">{t("totalCompanies")}:</span>
                    <span className="font-mono text-sm font-black text-black">{directors.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 bg-white p-6 border border-gray-200 shadow-sm h-fit rounded-sm">
                    <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                        <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                            <span>{editingUserId ? "✏️" : "➕"}</span>
                            <span>{editingUserId ? t("editDirector") : t("addDirector")}</span>
                        </h2>
                        {!editingUserId && (
                            <button
                                type="button"
                                onClick={generateCredentials}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-black text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors"
                            >
                                ⚡ {t("generate")}
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase rounded-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                {t("companyName")} *
                            </label>
                            <input
                                type="text"
                                value={form.companyName}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        companyName: e.target.value,
                                    })
                                }
                                placeholder={t("companyNamePlaceholder")}
                                required
                                className="p-3 border border-gray-300 bg-white text-sm font-bold text-black rounded-sm outline-none focus:border-black transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                    {t("directorFirstName")} *
                                </label>
                                <input
                                    type="text"
                                    value={form.firstName}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            firstName: e.target.value,
                                        })
                                    }
                                    required
                                    className="p-3 border border-gray-300 bg-white text-sm font-medium text-black rounded-sm outline-none focus:border-black transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                    {t("directorLastName")} *
                                </label>
                                <input
                                    type="text"
                                    value={form.lastName}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            lastName: e.target.value,
                                        })
                                    }
                                    required
                                    className="p-3 border border-gray-300 bg-white text-sm font-medium text-black rounded-sm outline-none focus:border-black transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                {t("email")} *
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                required
                                className="p-3 border border-gray-300 bg-white text-sm font-mono font-medium text-black rounded-sm outline-none focus:border-black transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                {t("phone")}
                            </label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                                placeholder={t("phonePlaceholder")}
                                className="p-3 border border-gray-300 bg-white text-sm font-mono text-black rounded-sm outline-none focus:border-black transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                {t("password")}{" "}
                                {editingUserId && (
                                    <span className="text-gray-400 font-normal lowercase">
                                        {t("passwordHint")}
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        password: e.target.value,
                                    })
                                }
                                required={!editingUserId}
                                className="p-3 border border-gray-300 bg-white text-sm font-mono font-bold text-black rounded-sm outline-none focus:border-black transition-colors"
                            />
                        </div>

                        <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-[#1a1a1a] text-white text-xs font-black uppercase tracking-wider rounded-sm hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
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
                                    className="px-5 py-3 border border-gray-300 text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-50 transition-colors"
                                >
                                    {t("cancel")}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="lg:col-span-7 bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-wider text-black">
                            {t("directorList")} ({directors.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-100/50 text-[10px] text-gray-500 uppercase tracking-widest font-black">
                                    <th className="p-4">{t("colCompany")}</th>
                                    <th className="p-4">{t("colDirector")}</th>
                                    <th className="p-4">{t("colContacts")}</th>
                                    <th className="p-4 text-right">{t("colActions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {directors.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="py-12 text-center text-gray-400 font-bold uppercase tracking-wider"
                                        >
                                            {t("noDirectors")}
                                        </td>
                                    </tr>
                                ) : (
                                    directors.map((u) => (
                                        <tr
                                            key={u.id}
                                            className="hover:bg-gray-50/80 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black text-black">
                                                        {u.companyName || u.employee?.companyName || "Standart Korxona"}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 w-fit">
                                                        {t("activeStatus")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs uppercase shrink-0">
                                                        {(u.employee?.firstName?.[0] || u.firstName?.[0] || "D")}
                                                        {(u.employee?.lastName?.[0] || u.lastName?.[0] || "")}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-black text-xs">
                                                            {u.employee?.firstName || u.firstName || ""}{" "}
                                                            {u.employee?.lastName || u.lastName || ""}
                                                        </span>
                                                        <span className="text-[10px] text-purple-700 font-bold uppercase">
                                                            {t("directorBadge")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                                                    <span className="text-gray-900 font-medium">
                                                        {u.email}
                                                    </span>
                                                    {u.phone && (
                                                        <span className="text-gray-500 text-[10px]">
                                                            {u.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditDirector(u)}
                                                        className="px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-black hover:border-black text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
                                                    >
                                                        {t("edit")}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDirector(u.id)}
                                                        className="px-2.5 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors"
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
    );
}
