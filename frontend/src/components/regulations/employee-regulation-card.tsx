"use client";

import { useTranslations } from "next-intl";
import { PolicyItem } from "@/src/services/policy-service";

interface EmployeeRegulationCardProps {
    policy: PolicyItem;
    onOpen: (policy: PolicyItem) => void;
}

export default function EmployeeRegulationCard({
    policy,
    onOpen,
}: EmployeeRegulationCardProps) {
    const t = useTranslations("RegulationsPage");

    const getStatusBadge = () => {
        if (policy.isUpToDateSigned) {
            return (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t("signedBadge")} (v{policy.signedVersion})
                </span>
            );
        }

        if (policy.isSigned && !policy.isUpToDateSigned) {
            return (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-semibold rounded-full inline-flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {t("updateBadge")} (v{policy.version})
                </span>
            );
        }

        return (
            <span className="px-2.5 py-1 bg-red-100 text-red-600 text-[11px] font-semibold rounded-full inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {t("pendingBadge")}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-shadow p-6 flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-full">
                            v{policy.version}
                        </span>
                        {policy.isRequired && (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-semibold">
                                {t("tabRequired")}
                            </span>
                        )}
                    </div>
                    {getStatusBadge()}
                </div>

                <div>
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                        {policy.title}
                    </h3>
                    {policy.description && (
                        <p className="text-xs text-gray-500 font-normal line-clamp-2 mt-1">
                            {policy.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 text-xs font-medium text-gray-400 pt-3 border-t border-gray-100">
                    {policy.documentUrl && (
                        <span className="flex items-center gap-1">
                            <span>📄</span> Hujjat
                        </span>
                    )}
                    {policy.content && (
                        <span className="flex items-center gap-1">
                            <span>📝</span> Matn
                        </span>
                    )}
                    <span className="ml-auto text-[11px] text-gray-400">
                        {new Date(policy.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            <button
                onClick={() => onOpen(policy)}
                className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    policy.isUpToDateSigned
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                }`}
            >
                <span>{policy.isUpToDateSigned ? "Ko'rish" : t("readAndConfirm")}</span>
                <span>&rarr;</span>
            </button>
        </div>
    );
}
