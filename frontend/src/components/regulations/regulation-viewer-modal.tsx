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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[92vh] flex flex-col rounded-sm shadow-2xl overflow-hidden border border-gray-200">
                <div className="p-6 bg-[#fcfcfc] border-b border-gray-200 flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-sm">
                                v{policy.version}
                            </span>
                            {policy.isRequired && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-wider rounded-sm">
                                    {t("tabRequired")}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-black text-black uppercase tracking-tight mt-1">
                            {policy.title}
                        </h2>
                        {policy.description && (
                            <p className="text-xs text-gray-500 font-medium">
                                {policy.description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black text-xl font-bold p-1 leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {policy.content && (
                        <div className="bg-gray-50 p-6 border border-gray-200 rounded-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
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
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                                    Biriktirilgan Hujjat
                                </span>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <span>↗</span> {t("download")}
                                </a>
                            </div>

                            {isPdf ? (
                                <div className="w-full h-[450px] border border-gray-300 rounded-sm overflow-hidden bg-gray-100">
                                    <iframe
                                        src={fileUrl}
                                        className="w-full h-full"
                                        title={policy.title}
                                    />
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-gray-300 rounded-sm flex flex-col items-center justify-center gap-3 bg-gray-50">
                                    <span className="text-4xl">📄</span>
                                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Hujjat fayli yuklangan
                                    </p>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors"
                                    >
                                        {t("download")}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-[#fcfcfc] border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {isEmployeeView && (
                        <div className="flex-1 flex flex-col gap-2">
                            {policy.isUpToDateSigned ? (
                                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-sm border border-green-200">
                                    <span className="text-sm font-bold">✓</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-wider">
                                            {t("alreadySigned")}
                                        </span>
                                        {policy.signedAt && (
                                            <span className="text-[10px] text-green-600 font-medium">
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
                                        className="w-4 h-4 text-black border-gray-300 rounded cursor-pointer accent-black"
                                    />
                                    <label
                                        htmlFor="confirmPolicy"
                                        className="text-xs font-bold text-gray-700 cursor-pointer select-none"
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
                            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:text-black hover:border-black text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                        >
                            {t("close")}
                        </button>

                        {isEmployeeView && !policy.isUpToDateSigned && onSign && (
                            <button
                                onClick={handleSign}
                                disabled={!confirmed || signing}
                                className="px-6 py-2.5 bg-black text-white disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors shadow-sm"
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
