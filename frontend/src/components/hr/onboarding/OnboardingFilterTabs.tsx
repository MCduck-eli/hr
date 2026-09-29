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
        <div className="flex flex-wrap gap-2 pb-1">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-xs font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === tab.id
                            ? "bg-violet-100 text-violet-700 font-medium"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                    <span>{tab.label}</span>
                    <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            activeTab === tab.id
                                ? "bg-violet-200 text-violet-800"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {tab.count}
                    </span>
                </button>
            ))}
        </div>
    );
}
