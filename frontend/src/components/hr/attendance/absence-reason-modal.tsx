"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { submitAbsenceReason } from "@/src/services/attendance-service";

interface AbsenceReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId?: string;
    employeeName?: string;
    date?: string;
    initialReason?: string | null;
    submittedBy?: "HR" | "EMPLOYEE";
    onSaved: () => void;
}

export default function AbsenceReasonModal({
    isOpen,
    onClose,
    employeeId,
    employeeName,
    date,
    initialReason,
    submittedBy = "HR",
    onSaved,
}: AbsenceReasonModalProps) {
    const t = useTranslations("HRAttendance");

    const PRESET_REASONS = [
        t("reasonSick"),
        t("reasonPersonal"),
        t("reasonTrip"),
        t("reasonRemote"),
        t("reasonFamily"),
        t("reasonTech"),
    ];

    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setReason(initialReason || "");
        setError(null);
    }, [initialReason, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setLoading(true);
        setError(null);
        try {
            await submitAbsenceReason({
                employeeId,
                date,
                reason: reason.trim(),
                submittedBy,
            });
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
                <svg
                    className="absolute inset-0 w-full h-full z-0 opacity-[0.10] pointer-events-none text-slate-300 stroke-current"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="girih-pattern-absence-reason" width="240" height="240" patternUnits="userSpaceOnUse">
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
                    <rect width="100%" height="100%" fill="url(#girih-pattern-absence-reason)" />
                </svg>

                <div className="relative z-10 flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {t("reasonModalTitle")}
                        </h3>
                        {employeeName && (
                            <span className="text-xs text-gray-500 font-medium mt-0.5">
                                {t("employeeLabel")}: {employeeName}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-base font-semibold"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-gray-700">
                            {t("quickReasons")}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_REASONS.map((preset) => (
                                <button
                                    type="button"
                                    key={preset}
                                    onClick={() => setReason(preset)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                        reason === preset
                                            ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">
                            {t("reasonNoteLabel")}
                        </label>
                        <textarea
                            rows={3}
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t("reasonPlaceholder")}
                            className="p-3 border border-gray-200 bg-white text-sm font-normal text-gray-800 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-500 hover:bg-gray-100 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason.trim()}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? t("saving") : t("saveReason")}
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );
}
