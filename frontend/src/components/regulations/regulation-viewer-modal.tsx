"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PolicyItem } from "@/src/services/policy-service";

interface RegulationViewerModalProps {
    policy: PolicyItem | null;
    onClose: () => void;
    onSign?: (policyId: string) => Promise<void>;
    isEmployeeView?: boolean;
}

export default function RegulationViewerModal({
    policy,
    onClose,
    onSign,
    isEmployeeView = false,
}: RegulationViewerModalProps) {
    const t = useTranslations("RegulationsPage");
    const [confirmed, setConfirmed] = useState(false);
    const [signing, setSigning] = useState(false);

    if (!policy) return null;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const baseUrl = API_URL.replace(/\/api\/?$/, "");

    const getFileUrl = (url?: string | null) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    const fileUrl = getFileUrl(policy.documentUrl);
    const isPdf = policy.documentUrl?.toLowerCase().endsWith(".pdf");

    const handleSign = async () => {
        if (!confirmed || !onSign || signing) return;
        setSigning(true);
        try {
            await onSign(policy.id);
        } catch (err: any) {
            alert(err.message || "Xatolik yuz berdi");
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="p-6 bg-white border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-violet-100 text-violet-700 text-[11px] font-semibold rounded-lg">
                                v{policy.version}
                            </span>
                            {policy.isRequired && (
                                <span className="px-2.5 py-0.5 bg-red-50 text-red-600 border border-red-100 text-[11px] font-semibold rounded-lg">
                                    {t("tabRequired")}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mt-1">
                            {policy.title}
                        </h2>
                        {policy.description && (
                            <p className="text-xs text-gray-500 font-normal">
                                {policy.description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1 leading-none rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {policy.content && (
                        <div className="bg-gray-50/70 p-6 border border-gray-100 rounded-2xl">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                                Nizom Matni
                            </h3>
                            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                                {policy.content}
                            </div>
                        </div>
                    )}

                    {fileUrl && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Biriktirilgan Hujjat
                                </span>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors"
                                >
                                    <span>↗</span> {t("download")}
                                </a>
                            </div>

                            {isPdf ? (
                                <div className="w-full h-[450px] border border-gray-200 rounded-2xl overflow-hidden bg-gray-100">
                                    <iframe
                                        src={fileUrl}
                                        className="w-full h-full"
                                        title={policy.title}
                                    />
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 bg-gray-50/50">
                                    <span className="text-4xl">📄</span>
                                    <p className="text-xs font-semibold text-gray-600">
                                        Hujjat fayli yuklangan
                                    </p>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-5 py-2.5 bg-[#9327FF] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm"
                                    >
                                        {t("download")}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {isEmployeeView && (
                        <div className="flex-1 flex flex-col gap-2">
                            {policy.isUpToDateSigned ? (
                                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                    <span className="text-sm font-bold">✓</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            {t("alreadySigned")}
                                        </span>
                                        {policy.signedAt && (
                                            <span className="text-[10px] text-emerald-600 font-medium">
                                                {t("signedDate")}:{" "}
                                                {new Date(policy.signedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="confirmPolicy"
                                        checked={confirmed}
                                        onChange={(e) => setConfirmed(e.target.checked)}
                                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-gray-300 cursor-pointer"
                                    />
                                    <label
                                        htmlFor="confirmPolicy"
                                        className="text-xs font-medium text-gray-700 cursor-pointer select-none"
                                    >
                                        {t("confirmCheckbox")}
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all shadow-sm"
                        >
                            {t("close")}
                        </button>

                        {isEmployeeView && !policy.isUpToDateSigned && onSign && (
                            <button
                                onClick={handleSign}
                                disabled={!confirmed || signing}
                                className="px-6 py-2.5 bg-[#9327FF] text-white disabled:opacity-50 text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm"
                            >
                                {signing ? t("signing") : t("confirmButton")}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
