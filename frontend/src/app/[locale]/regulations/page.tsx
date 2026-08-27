"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
    PolicyItem,
    fetchPolicies,
    signPolicy,
} from "@/src/services/policy-service";
import EmployeeRegulationCard from "@/src/components/regulations/employee-regulation-card";
import RegulationViewerModal from "@/src/components/regulations/regulation-viewer-modal";

export default function EmployeeRegulationsPage() {
    const t = useTranslations("RegulationsPage");
    const router = useRouter();

    const [policies, setPolicies] = useState<PolicyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("ALL");
    const [selectedPolicy, setSelectedPolicy] = useState<PolicyItem | null>(null);

    const loadPolicies = async () => {
        try {
            const data = await fetchPolicies();
            setPolicies(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPolicies();
    }, []);

    const handleSign = async (policyId: string) => {
        await signPolicy(policyId);
        await loadPolicies();
        setSelectedPolicy(null);
    };

    const unsignedRequiredCount = policies.filter(
        (p) => p.isRequired && !p.isUpToDateSigned,
    ).length;

    const filteredPolicies = policies.filter((p) => {
        if (activeTab === "REQUIRED") return p.isRequired;
        if (activeTab === "SIGNED") return p.isUpToDateSigned;
        if (activeTab === "PENDING") return !p.isUpToDateSigned;
        return true;
    });

    const tabs = [
        { id: "ALL", label: t("tabAll"), count: policies.length },
        {
            id: "REQUIRED",
            label: t("tabRequired"),
            count: policies.filter((p) => p.isRequired).length,
        },
        {
            id: "PENDING",
            label: t("tabPending"),
            count: policies.filter((p) => !p.isUpToDateSigned).length,
        },
        {
            id: "SIGNED",
            label: t("tabSigned"),
            count: policies.filter((p) => p.isUpToDateSigned).length,
        },
    ];

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => router.back()}
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-2"
                >
                    &larr; {t("goBack")}
                </button>
                <h1 className="text-3xl font-black uppercase tracking-tight text-black">
                    {t("title")}
                </h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    {t("subtitle")}
                </p>
            </div>

            {unsignedRequiredCount > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-wider text-red-800">
                                {t("alertUnsigned")}
                            </span>
                            <span className="text-[11px] font-medium text-red-600">
                                {unsignedRequiredCount} ta majburiy nizom bilan tanishib chiqishingiz talab etiladi.
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveTab("PENDING")}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-sm transition-colors shrink-0"
                    >
                        Ko'rish
                    </button>
                </div>
            )}

            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 ${
                            activeTab === tab.id
                                ? "bg-black text-white shadow-sm"
                                : "bg-white text-gray-600 border border-gray-200 hover:border-black"
                        }`}
                    >
                        <span>{tab.label}</span>
                        <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                activeTab === tab.id
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                    Yuklanmoqda...
                </div>
            ) : filteredPolicies.length === 0 ? (
                <div className="p-16 text-center bg-white border border-gray-200 rounded-sm text-xs font-bold uppercase tracking-widest text-gray-400">
                    {t("noRegulations")}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPolicies.map((policy) => (
                        <EmployeeRegulationCard
                            key={policy.id}
                            policy={policy}
                            onOpen={(p) => setSelectedPolicy(p)}
                        />
                    ))}
                </div>
            )}

            <RegulationViewerModal
                policy={selectedPolicy}
                onClose={() => setSelectedPolicy(null)}
                onSign={handleSign}
                isEmployeeView={true}
            />
        </div>
    );
}
