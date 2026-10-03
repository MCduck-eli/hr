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
        if (editingId) {
            await updatePolicy(editingId, formData);
        } else {
            await createPolicy(formData);
        }
        await loadPolicies();
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        try {
            await deletePolicy(id);
            await loadPolicies();
        } catch (err: any) {
            alert(err.message || "Xatolik yuz berdi");
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
        </div>
    );
}
