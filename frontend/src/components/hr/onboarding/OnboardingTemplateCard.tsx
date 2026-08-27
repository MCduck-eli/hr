"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface OnboardingTemplateCardProps {
    template: any;
    statuses?: any[];
    onEdit: (template: any) => void;
    onDelete: (id: string) => void;
}

export default function OnboardingTemplateCard({
    template,
    statuses = [],
    onEdit,
    onDelete,
}: OnboardingTemplateCardProps) {
    const t = useTranslations("HROnboardingPage");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const baseUrl = API_URL.replace(/\/api\/?$/, "");

    const getMediaUrl = (url?: string | null) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    const getTargetBadge = () => {
        const config =
            template.targetStatusConfig ||
            statuses.find(
                (s) =>
                    s.id === template.targetStatusConfigId ||
                    s.code === template.targetStatus ||
                    s.id === template.targetStatus,
            );

        if (config) {
            return (
                <span
                    style={{
                        backgroundColor: `${config.color || "#3b82f6"}18`,
                        color: config.color || "#3b82f6",
                        borderColor: `${config.color || "#3b82f6"}40`,
                    }}
                    className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm border shadow-sm inline-flex items-center gap-1.5"
                >
                    <span
                        style={{ backgroundColor: config.color || "#3b82f6" }}
                        className="w-1.5 h-1.5 rounded-full"
                    />
                    <span>{config.name}</span>
                </span>
            );
        }

        if (template.targetStatus === "NEW") {
            return (
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm bg-amber-100 text-amber-800 border border-amber-300 shadow-sm inline-flex items-center gap-1">
                    <span>✨</span>
                    <span>{t("badgeNew")}</span>
                </span>
            );
        }
        if (template.targetStatus === "ACTIVE") {
            return (
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm inline-flex items-center gap-1">
                    <span>🟢</span>
                    <span>{t("badgeActive")}</span>
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm bg-gray-100 text-gray-800 border border-gray-300 shadow-sm inline-flex items-center gap-1">
                <span>🌐</span>
                <span>{t("badgeAll")}</span>
            </span>
        );
    };

    return (
        <div className="p-6 bg-white border border-gray-200 flex flex-col justify-between gap-5 shadow-sm hover:shadow-md transition-shadow rounded-sm">
            <div className="flex flex-col gap-3">
                {template.videoUrl ? (
                    <div className="w-full rounded-sm overflow-hidden bg-black/5 border border-gray-200">
                        <video
                            controls
                            preload="metadata"
                            poster={template.coverUrl ? getMediaUrl(template.coverUrl) : undefined}
                            src={getMediaUrl(template.videoUrl)}
                            className="w-full h-44 object-cover bg-black"
                        />
                    </div>
                ) : template.coverUrl ? (
                    <img
                        src={getMediaUrl(template.coverUrl)}
                        alt={template.title}
                        className="w-full h-44 object-cover rounded-sm mb-1"
                    />
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {getTargetBadge()}
                        {template.isRequired && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-sm border border-red-200">
                                {t("requiredBadge")}
                            </span>
                        )}
                    </div>
                    {template.videoUrl && (
                        <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                            <span>🎥</span> Video
                        </span>
                    )}
                </div>

                <div>
                    <h3 className="font-black text-base text-black uppercase tracking-tight">
                        {template.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-3 leading-relaxed">
                        {template.description || (
                            <span className="italic text-gray-400">
                                {t("noDesc")}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                    onClick={() => onEdit(template)}
                    className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-gray-100 hover:bg-black hover:text-white transition-colors rounded-sm text-gray-800"
                >
                    {t("editBtn")}
                </button>
                <button
                    onClick={() => onDelete(template.id)}
                    className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors rounded-sm"
                >
                    {t("deleteBtn")}
                </button>
            </div>
        </div>
    );
}
