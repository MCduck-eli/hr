"use client";

import { useTranslations } from "next-intl";
import { PolicyItem } from "@/src/services/policy-service";

interface RegulationCardProps {
    policy: PolicyItem;
    onView: (policy: PolicyItem) => void;
    onViewSigners: (policy: PolicyItem) => void;
    onEdit: (policy: PolicyItem) => void;
    onDelete: (id: string) => void;
}

export default function RegulationCard({
    policy,
    onView,
    onViewSigners,
    onEdit,
    onDelete,
}: RegulationCardProps) {
    const t = useTranslations("HRRegulations");

    const signedPercentage = policy.stats?.signedPercentage || 0;
    const signedCount = policy.stats?.signedCount || 0;
    const totalEmployees = policy.stats?.totalEmployees || 0;

    return (
        <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:shadow-md hover:border-black transition-all flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-sm">
                            v{policy.version}
                        </span>
                        {policy.isRequired ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-wider rounded-sm">
                                {t("required")}
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-black uppercase tracking-wider rounded-sm">
                                {t("optional")}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                        {new Date(policy.createdAt).toLocaleDateString()}
                    </span>
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

                <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-gray-500 uppercase tracking-wider">
                            Tanishish ko'rsatkichi:
                        </span>
                        <span className="text-black font-extrabold">
                            {signedCount} / {totalEmployees} ({signedPercentage}%)
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${
                                signedPercentage >= 80
                                    ? "bg-green-600"
                                    : signedPercentage >= 40
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                            }`}
                            style={{ width: `${signedPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {policy.documentUrl && (
                        <span className="flex items-center gap-1 text-gray-600">
                            <span>📄</span> Hujjat mavjud
                        </span>
                    )}
                    {policy.content && (
                        <span className="flex items-center gap-1 text-gray-600">
                            <span>📝</span> Matn kiritilgan
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onView(policy)}
                        className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-black uppercase tracking-wider rounded-sm transition-colors"
                    >
                        {t("viewDoc")}
                    </button>
                    <button
                        onClick={() => onViewSigners(policy)}
                        className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-black uppercase tracking-wider rounded-sm transition-colors"
                    >
                        {t("viewSigners")} ({signedCount})
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onEdit(policy)}
                        className="py-2 px-3 bg-white border border-gray-300 hover:border-black text-gray-800 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                    >
                        {t("edit")}
                    </button>
                    <button
                        onClick={() => onDelete(policy.id)}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                    >
                        {t("delete")}
                    </button>
                </div>
            </div>
        </div>
    );
}
