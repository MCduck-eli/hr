"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface OnboardingFilterTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    statuses?: any[];
    templates: any[];
}

export default function OnboardingFilterTabs({
    activeTab,
    setActiveTab,
    statuses = [],
    templates = [],
}: OnboardingFilterTabsProps) {
    const t = useTranslations("HROnboardingPage");

    const tabs = [
        { id: "ALL", label: t("tabAll"), count: templates.length },
        ...statuses.map((s) => ({
            id: s.id,
            label: s.name,
            count: templates.filter(
                (tmpl) =>
                    tmpl.targetStatusConfigId === s.id ||
                    tmpl.targetStatus === s.code ||
                    tmpl.targetStatusConfig?.id === s.id,
            ).length,
        })),
    ];

    return (
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
    );
}
