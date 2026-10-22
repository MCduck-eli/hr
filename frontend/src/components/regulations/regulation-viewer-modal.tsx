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
            <div className="relative bg-white w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                <svg
                    className="absolute inset-0 w-full h-full z-0 opacity-[0.10] pointer-events-none text-slate-300 stroke-current"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="girih-pattern-regulation-viewer" width="240" height="240" patternUnits="userSpaceOnUse">
                            <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z" />
                                <path d="M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z" />
                                <circle cx="120" cy="120" r="10" />
                                <path d="M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180" />
                                <path d="M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216" />
                                <path d="M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230" />
                                <path d="M120 0V60M120 180V240M0 120H60M180 120H240" />
                                <path d="M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240" />
                                <path d="M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198" />
                                <path d="M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60" />
                                <path d="M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90" />
                            </g>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#girih-pattern-regulation-viewer)" />
                </svg>

                <div className="relative z-10 flex flex-col flex-1 min-h-0">
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

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 min-h-0">
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
        </div>
    );
}
