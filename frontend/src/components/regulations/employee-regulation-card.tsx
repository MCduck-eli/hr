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
                <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 text-[10px] font-black uppercase tracking-wider rounded-sm inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    {t("signedBadge")} (v{policy.signedVersion})
                </span>
            );
        }

        if (policy.isSigned && !policy.isUpToDateSigned) {
            return (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black uppercase tracking-wider rounded-sm inline-flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    {t("updateBadge")} (v{policy.version})
                </span>
            );
        }

        return (
            <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 text-[10px] font-black uppercase tracking-wider rounded-sm inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {t("pendingBadge")}
            </span>
        );
    };

    return (
        <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:shadow-md hover:border-black transition-all flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-black uppercase tracking-wider rounded-sm">
                            v{policy.version}
                        </span>
                        {policy.isRequired && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 text-[10px] font-black uppercase tracking-wider rounded-sm">
                                {t("tabRequired")}
                            </span>
                        )}
                    </div>
                    {getStatusBadge()}
                </div>

                <div>
                    <h3 className="text-base font-black text-black uppercase tracking-tight line-clamp-2">
                        {policy.title}
                    </h3>
                    {policy.description && (
                        <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1">
                            {policy.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100">
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
                    <span className="ml-auto text-[10px] text-gray-400">
                        {new Date(policy.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            <button
                onClick={() => onOpen(policy)}
                className={`w-full py-2.5 px-4 text-xs font-black uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 ${
                    policy.isUpToDateSigned
                        ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        : "bg-black text-white hover:bg-gray-800 shadow-sm"
                }`}
            >
                <span>{policy.isUpToDateSigned ? "Ko'rish" : t("readAndConfirm")}</span>
                <span>&rarr;</span>
            </button>
        </div>
    );
}
