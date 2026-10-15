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
import Skeleton from "@/src/components/ui/Skeleton";

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
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1.5 w-fit transition-colors mb-1"
                >
                    &larr; {t("goBack")}
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {t("title")}
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    {t("subtitle")}
                </p>
            </div>

            {unsignedRequiredCount > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-red-900">
                                {t("alertUnsigned")}
                            </span>
                            <span className="text-xs font-normal text-red-700">
                                {unsignedRequiredCount} ta majburiy nizom bilan tanishib chiqishingiz talab etiladi.
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveTab("PENDING")}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                    >
                        Ko&apos;rish
                    </button>
                </div>
            )}

            <div className="flex flex-wrap gap-2 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-xs font-medium rounded-full transition-all flex items-center gap-2 ${
                            activeTab === tab.id
                                ? "bg-purple-600 text-white rounded-full shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full"
                        }`}
                    >
                        <span>{tab.label}</span>
                        <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                                activeTab === tab.id
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-200 text-gray-700"
                            }`}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
                            <div className="flex justify-between items-center">
                                <Skeleton className="w-20 h-5 rounded-full" />
                                <Skeleton className="w-16 h-4 rounded-full" />
                            </div>
                            <Skeleton className="w-3/4 h-5 rounded-lg" />
                            <Skeleton className="w-full h-12 rounded-lg" />
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <Skeleton className="w-24 h-4 rounded-lg" />
                                <Skeleton className="w-20 h-8 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredPolicies.length === 0 ? (
                <div className="p-16 text-center bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-400 shadow-sm">
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
