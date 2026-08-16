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

    const [users, setUsers] = useState<any[]>([]);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [form, setForm] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "HR_ADMIN",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(data.data || data.users || []);
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

        fetchUsers();
    }, [locale, router]);

    const generateCredentials = () => {
        const generatedEmail =
            form.firstName && form.lastName
                ? `${form.firstName.toLowerCase()}.${form.lastName.toLowerCase()}@hrplatform.com`
                : `user${Math.floor(Math.random() * 10000)}@hrplatform.com`;

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

            const payload: any = { ...form };
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
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user: any) => {
        setEditingUserId(user.id);
        setForm({
            email: user.email,
            password: "",
            firstName: user.employee?.firstName || "",
            lastName: user.employee?.lastName || "",
            role: user.role,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const resetForm = () => {
        setEditingUserId(null);
        setForm({
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            role: "HR_ADMIN",
        });
        setError("");
    };

    const handleDeleteUser = async (id: string) => {
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

            fetchUsers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleLoginAs = (user: any) => {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
            localStorage.setItem("originalAdminUser", currentUser);
        }
        localStorage.setItem("user", JSON.stringify(user));

        if (user.role === "SUPER_ADMIN") {
            router.push(`/${locale}/dashboard`);
        } else if (user.role === "HR_ADMIN") {
            router.push(`/${locale}/hr/dashboard`);
        } else if (user.role === "MANAGER") {
            router.push(`/${locale}/manager/okr`);
        } else if (user.role === "RECRUITER") {
            router.push(`/${locale}/recruiter/vacancies`);
        } else {
            router.push(`/${locale}/profile`);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8 text-black">
                {t("title")}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 border border-gray-200 h-fit">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold uppercase tracking-wider text-black">
                            {editingUserId ? t("editUser") : t("addUser")}
                        </h2>
                        {!editingUserId && (
                            <button
                                type="button"
                                onClick={generateCredentials}
                                className="px-3 py-1 bg-gray-200 text-black text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-gray-300 transition-colors"
                            >
                                {t("generate")}
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold uppercase">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                    {t("firstName")}
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
                                        setForm({
                                            ...form,
                                            lastName: e.target.value,
                                        })
                                    }
                                    required
                                    className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                                />
                            </div>
                        </div>

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
                                {t("password")}{" "}
                                {editingUserId &&
                                    "(O'zgartirmaslik uchun bo'sh qoldiring)"}
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
                                className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                            />
                        </div>

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
                                <option value="HR_ADMIN">{t("hrAdmin")}</option>
                                <option value="MANAGER">{t("manager")}</option>
                                <option value="RECRUITER">
                                    {t("recruiter")}
                                </option>
                                <option value="EMPLOYEE">
                                    {t("employee")}
                                </option>
                            </select>
                        </div>

                        <div className="flex gap-4 mt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors disabled:opacity-50"
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
                                    className="flex-1 py-3 border border-gray-300 text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-50 transition-colors"
                                >
                                    {t("cancel")}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

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
                                    <th className="p-3 text-right">
                                        {t("actions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
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
                                            <td className="p-3 text-right flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() =>
                                                        handleLoginAs(u)
                                                    }
                                                    className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    {t("loginAs")}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleEditUser(u)
                                                    }
                                                    className="text-[10px] font-bold uppercase tracking-widest text-green-600 hover:text-green-800 transition-colors"
                                                >
                                                    {t("edit")}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteUser(u.id)
                                                    }
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
            </div>
        </div>
    );
}
