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
        let currentUserId = "";
        let currentUserRole = "";
        let currentCompany = "";
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const parsed = JSON.parse(userStr);
                currentUserId = parsed.id || "";
                currentUserRole = parsed.role || "";
                currentCompany = parsed.companyName || parsed.companyId || parsed.employee?.companyName || "";
            }
        } catch (e) {}

        const cacheKey = currentCompany ? `hr:${currentCompany}:users` : "hr:users";
        const cached = getQueryData<any[]>(cacheKey);
        const isStale = isQueryStale(cacheKey);

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

            const filteredUsers = (data || []).filter(
                (user: any) =>
                    user.role !== "SUPER_ADMIN" &&
                    user.role !== "DIRECTOR" &&
                    user.id !== currentUserId &&
                    (!currentCompany || user.companyName === currentCompany) &&
                    user.employee?.status !== "TERMINATED" &&
                    user.employee?.offboarding?.status !== "COMPLETED",
            );
            setUsers(filteredUsers);
            setQueryData(cacheKey, filteredUsers);
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

        let currentCompany = "";
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const parsed = JSON.parse(userStr);
                currentCompany = parsed.companyName || parsed.companyId || parsed.employee?.companyName || "";
            }
        } catch (e) {}

        if (editingUser) {
            setLoading(true);
            try {
                const payload = {
                    ...formData,
                    ...(currentCompany ? { companyId: currentCompany, companyName: currentCompany } : {}),
                };
                if (!payload.password) {
                    delete payload.password;
                }
                await updateUser(editingUser.id, payload);
                setEditingUser(null);
                invalidateQuery("hr");
                invalidateQuery("director");
                loadUsers();
                showToast("Xodim ma'lumotlari muvaffaqiyatli yangilandi!", "success");
            } catch (err: any) {
                setError(err.message);
                showToast("Xatolik yuz berdi, qayta urinib ko'ring", "error");
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                ...(currentCompany ? { companyId: currentCompany, companyName: currentCompany } : {}),
            };
            await createUser(payload);
            if (candidateData) {
                setCandidateData(null);
                router.replace(window.location.pathname);
            }
            setEditingUser(null);
            invalidateQuery("hr");
            invalidateQuery("director");
            loadUsers();
            showToast("Xodim muvaffaqiyatli yaratildi!", "success");
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || "Xatolik yuz berdi, qayta urinib ko'ring", "error");
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
            showToast("Xodim muvaffaqiyatli o'chirildi!", "success");
        } catch (err: any) {
            showToast("Xatolik yuz berdi, qayta urinib ko'ring", "error");
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
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex flex-col gap-2"
            >
                <button 
                    onClick={() => router.back()} 
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-4"
                >
                    &larr; {t("goBack") || "Orqaga"}
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-black">
                    {t("title")}
                </h1>
            </motion.div>

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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                    className="flex flex-col"
                >
                    <EmployeeForm
                        initialData={editingUser || candidateData}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        loading={loading}
                    />
                </motion.div>
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
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full flex flex-col gap-4 overflow-hidden">
                        <svg
                            className="absolute inset-0 w-full h-full z-0 opacity-[0.10] pointer-events-none text-slate-300 stroke-current"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <pattern id="girih-pattern-employee-delete" width="240" height="240" patternUnits="userSpaceOnUse">
                                    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z" />
                                        <path d="M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z" />
                                        <circle cx="120" cy="120" r="10" />
                                        <path d="M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180" />
                                        <path d="M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216" />
                                        <path d="M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230" />
                                        <path d="M120 0V60M120 180V240M0 120H60M180 120H240" />
                                        <path d="M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240" />
                                        <path d="M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198" />
                                        <path d="M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60" />
                                        <path d="M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90" />
                                    </g>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#girih-pattern-employee-delete)" />
                        </svg>

                        <div className="relative z-10 flex flex-col gap-4">
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
                </div>
            )}

            {toast && (
                <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform translate-y-0">
                    <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-medium ${
                            toast.type === "success"
                                ? "bg-white border-emerald-200 text-emerald-800"
                                : "bg-white border-rose-200 text-rose-800"
                        }`}
                    >
                        {toast.type === "success" ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                        <span>{toast.message}</span>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="text-gray-400 hover:text-gray-600 ml-2 cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
