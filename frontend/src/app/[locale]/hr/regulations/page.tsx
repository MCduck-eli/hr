"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
    PolicyItem,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
} from "@/src/services/policy-service";
import RegulationCard from "@/src/components/hr/regulations/regulation-card";
import RegulationFormModal from "@/src/components/hr/regulations/regulation-form-modal";
import RegulationSignaturesModal from "@/src/components/hr/regulations/regulation-signatures-modal";
import RegulationViewerModal from "@/src/components/regulations/regulation-viewer-modal";
import Skeleton from "@/src/components/ui/Skeleton";
import { motion } from "framer-motion";
import GirihPattern from "@/src/components/ui/GirihPattern";

function CircularProgress({
    value,
    size = 48,
    strokeWidth = 4,
    color = "#9327FF",
}: {
    value: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-100"
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                    fill="transparent"
                />
            </svg>
            <span className="absolute text-[11px] font-bold" style={{ color }}>{value}%</span>
        </div>
    );
}

export default function HRRegulationsPage() {
    const t = useTranslations("HRRegulations");
    const router = useRouter();

    const [policies, setPolicies] = useState<PolicyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<PolicyItem | null>(null);

    const [viewingPolicy, setViewingPolicy] = useState<PolicyItem | null>(null);
    const [signaturesPolicy, setSignaturesPolicy] = useState<PolicyItem | null>(null);
    const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    const loadPolicies = async () => {
        try {
            const data = await fetchPolicies(search);
            setPolicies(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPolicies();
    }, [search]);

    const handleCreateOrUpdate = async (formData: FormData, editingId?: string) => {
        try {
            if (editingId) {
                await updatePolicy(editingId, formData);
                showToast("Nizom muvaffaqiyatli yangilandi", "success");
            } else {
                await createPolicy(formData);
                showToast("Nizom muvaffaqiyatli yaratildi", "success");
            }
            await loadPolicies();
        } catch (err: any) {
            showToast(err.message || "Xatolik yuz berdi", "error");
        }
    };

    const handleDelete = (id: string) => {
        setDeletingPolicyId(id);
    };

    const confirmDelete = async () => {
        if (!deletingPolicyId) return;
        setIsDeleting(true);
        try {
            await deletePolicy(deletingPolicyId);
            setDeletingPolicyId(null);
            await loadPolicies();
            showToast("Nizom muvaffaqiyatli o'chirildi", "success");
        } catch (err: any) {
            showToast(err.message || "Xatolik yuz berdi", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const totalCount = policies.length;
    const requiredCount = policies.filter((p) => p.isRequired).length;
    const avgPercentage =
        policies.length > 0
            ? Math.round(
                  policies.reduce(
                      (acc, curr) => acc + (curr.stats?.signedPercentage || 0),
                      0,
                  ) / policies.length,
              )
            : 0;

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit mb-2"
                >
                    &larr; {t("goBack")}
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {t("title")}
                        </h1>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            {t("subtitle")}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingPolicy(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#9327FF] text-white rounded-xl shadow-sm hover:opacity-90 px-5 py-2.5 font-medium transition-all self-start sm:self-auto flex items-center gap-2"
                    >
                        <span className="text-lg leading-none">+</span>
                        <span>{t("addRegulation")}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {t("totalRegulations")}
                        </span>
                        <span className="text-3xl font-bold text-gray-900">{totalCount}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-xl shrink-0">
                        📄
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {t("requiredCount")}
                        </span>
                        <span className="text-3xl font-bold text-red-600">
                            {requiredCount}
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl shrink-0">
                        ⚠️
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {t("avgSigned")}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                            Umumiy ko'rsatkich
                        </span>
                    </div>
                    <CircularProgress value={avgPercentage} color="#9327FF" size={54} strokeWidth={5} />
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className="rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 pl-10 w-full max-w-md text-sm bg-white"
                        />
                        <span className="absolute left-3.5 top-3 text-gray-400 text-sm pointer-events-none">
                            🔍
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="w-20 h-5 rounded" />
                                    <Skeleton className="w-16 h-4 rounded" />
                                </div>
                                <Skeleton className="w-3/4 h-5 rounded" />
                                <Skeleton className="w-full h-12 rounded" />
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <Skeleton className="w-24 h-4 rounded" />
                                    <Skeleton className="w-20 h-8 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : policies.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-500 text-center gap-2">
                        <span className="text-4xl mb-2">📋</span>
                        <p className="text-sm font-semibold text-gray-700">
                            {t("noRegulations")}
                        </p>
                        <p className="text-xs text-gray-400 max-w-sm">
                            Yangi nizom qo'shish uchun yuqoridagi tugmadan foydalaning.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {policies.map((policy) => (
                            <RegulationCard
                                key={policy.id}
                                policy={policy}
                                onView={(p) => setViewingPolicy(p)}
                                onViewSigners={(p) => setSignaturesPolicy(p)}
                                onEdit={(p) => {
                                    setEditingPolicy(p);
                                    setIsFormOpen(true);
                                }}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            <RegulationFormModal
                isOpen={isFormOpen}
                editingPolicy={editingPolicy}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingPolicy(null);
                }}
                onSubmit={handleCreateOrUpdate}
            />

            <RegulationSignaturesModal
                policy={signaturesPolicy}
                onClose={() => setSignaturesPolicy(null)}
            />

            <RegulationViewerModal
                policy={viewingPolicy}
                onClose={() => setViewingPolicy(null)}
                isEmployeeView={false}
            />

            {deletingPolicyId && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-100"
                    >
                        <GirihPattern className="opacity-[0.10] rounded-3xl overflow-hidden" />
                        <div className="relative z-10">
                        <div className="flex items-center gap-3.5 mb-2">
                            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Nizomni o'chirish
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Ushbu nizomni o'chirib tashlamoqchimisiz?
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingPolicyId(null)}
                                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={confirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                                {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
                            </button>
                        </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-center gap-3 transform transition-all duration-300 animate-in fade-in slide-in-from-top-4">
                    {toast.type === "error" ? (
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900">
                            {toast.message}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs ml-2 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
