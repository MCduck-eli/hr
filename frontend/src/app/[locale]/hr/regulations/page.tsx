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
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-2"
                >
                    &larr; {t("goBack")}
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-black">
                            {t("title")}
                        </h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                            {t("subtitle")}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingPolicy(null);
                            setIsFormOpen(true);
                        }}
                        className="px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors shadow-sm self-start sm:self-auto flex items-center gap-2"
                    >
                        <span>+</span>
                        <span>{t("addRegulation")}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {t("totalRegulations")}
                    </span>
                    <span className="text-3xl font-black text-black">{totalCount}</span>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {t("requiredCount")}
                    </span>
                    <span className="text-3xl font-black text-red-600">
                        {requiredCount}
                    </span>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {t("avgSigned")}
                    </span>
                    <span className="text-3xl font-black text-green-600">
                        {avgPercentage}%
                    </span>
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
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 text-xs font-medium focus:outline-none focus:border-black rounded-sm"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">
                            🔍
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                        Yuklanmoqda...
                    </div>
                ) : policies.length === 0 ? (
                    <div className="p-16 text-center bg-white border border-gray-200 rounded-sm text-xs font-bold uppercase tracking-widest text-gray-400">
                        {t("noRegulations")}
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
