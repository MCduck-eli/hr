"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import EmployeeForm from "@/src/components/hr/employees/employee-form";
import EmployeeDetailsTable from "@/src/components/hr/employees/employee-details-table";

import {
    createUser,
    deleteUser,
    fetchAllUsers,
    updateUser,
} from "@/src/services/user-service";
import { getQueryData, setQueryData, isQueryStale, invalidateQuery } from "@/src/utils/query-cache";

function isEmailExists(msg: string): boolean {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return lower.includes("email") || lower.includes("allaqachon") || lower.includes("already exists") || lower.includes("существует");
}

export default function HREmployeesPage() {
    const t = useTranslations("HREmployees");
    const tErr = useTranslations("errors");
    const router = useRouter();
    const searchParams = useSearchParams();

    const candidateId = searchParams.get("candidateId");
    const emailParam = searchParams.get("email");
    const firstNameParam = searchParams.get("firstName");
    const lastNameParam = searchParams.get("lastName");
    const phoneParam = searchParams.get("phone");
    const departmentIdParam = searchParams.get("departmentId");

    const [candidateData, setCandidateData] = useState<any>(() => {
        if (emailParam || candidateId) {
            return {
                candidateId: candidateId || undefined,
                email: emailParam || "",
                firstName: firstNameParam || "",
                lastName: lastNameParam || "",
                phone: phoneParam || "",
                departmentId: departmentIdParam || "",
            };
        }
        return null;
    });

    const [users, setUsers] = useState<any[]>(() => getQueryData<any[]>("hr:users") || []);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(() => !getQueryData("hr:users"));
    const [error, setError] = useState("");

    const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => {
            setError("");
        }, 4000);
        return () => clearTimeout(timer);
    }, [error]);

    const loadUsers = async () => {
        const cached = getQueryData<any[]>("hr:users");
        const isStale = isQueryStale("hr:users");

        if (cached) {
            setUsers(cached);
        } else {
            setTableLoading(true);
        }

        if (cached && !isStale) {
            setTableLoading(false);
            return;
        }

        try {
            const data = await fetchAllUsers();
            let currentUserId = "";
            let currentUserRole = "";
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    const parsed = JSON.parse(userStr);
                    currentUserId = parsed.id;
                    currentUserRole = parsed.role;
                }
            } catch (e) {}

            const filteredUsers = (data || []).filter(
                (user: any) =>
                    user.role !== "SUPER_ADMIN" &&
                    user.role !== "DIRECTOR" &&
                    user.id !== currentUserId &&
                    user.employee?.status !== "TERMINATED" &&
                    user.employee?.offboarding?.status !== "COMPLETED",
            );
            setUsers(filteredUsers);
            setQueryData("hr:users", filteredUsers);
        } catch (err: any) {
            console.error(err);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleSubmit = async (formData: any) => {
        setError("");

        if (editingUser) {
            setLoading(true);
            try {
                const payload = { ...formData };
                if (!payload.password) {
                    delete payload.password;
                }
                await updateUser(editingUser.id, payload);
                setEditingUser(null);
                invalidateQuery("hr");
                invalidateQuery("director");
                loadUsers();
                showToast("Muvaffaqiyatli saqlandi", "success");
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            await createUser(formData);
            if (candidateData) {
                setCandidateData(null);
                router.replace(window.location.pathname);
            }
            setEditingUser(null);
            invalidateQuery("hr");
            invalidateQuery("director");
            loadUsers();
            showToast("Xodim muvaffaqiyatli yaratildi", "success");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (user: any) => {
        setDeleteModalUser(user);
    };

    const confirmDeleteEmployee = async () => {
        if (!deleteModalUser) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${deleteModalUser.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || t("deleteError") || "Error");
            }

            setDeleteModalUser(null);
            invalidateQuery("hr");
            invalidateQuery("director");
            loadUsers();
            showToast(t("deletedSuccess") || "Xodim muvaffaqiyatli o'chirildi", "success");
        } catch (err: any) {
            showToast(err.message || t("deleteError") || "Xatolik yuz berdi", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancel = () => {
        setEditingUser(null);
        setCandidateData(null);
    };

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => router.back()} 
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-4"
                >
                    &larr; {t("goBack") || "Orqaga"}
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-black">
                    {t("title")}
                </h1>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: [50, -10, 10, -10, 10, 0] }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.5 }}
                        className="fixed top-4 right-4 z-50 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 max-w-md"
                    >
                        <span className="text-base">⚠️</span>
                        <span className="text-xs font-bold leading-snug">
                            {isEmailExists(error) ? tErr("emailExists") : error}
                        </span>
                        <button
                            onClick={() => setError("")}
                            className="ml-auto text-red-400 hover:text-red-700 text-xs font-bold p-1 cursor-pointer"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <EmployeeForm
                    initialData={editingUser || candidateData}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                />
                <EmployeeDetailsTable
                    users={users}
                    loading={tableLoading}
                    onEdit={(user) => {
                        setEditingUser(user);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onDelete={handleDeleteClick}
                />
            </div>


            {deleteModalUser && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg shrink-0">
                                ⚠️
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {t("deleteModalTitle")}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {deleteModalUser.employee?.firstName ? `${deleteModalUser.employee.firstName} ${deleteModalUser.employee.lastName}` : deleteModalUser.email}
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
                                onClick={confirmDeleteEmployee}
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
        </div>
    );
}
