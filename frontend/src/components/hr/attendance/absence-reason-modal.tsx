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
            <div className="relative w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-wider text-black">
                            {t("reasonModalTitle")}
                        </span>
                        {employeeName && (
                            <span className="text-[11px] text-gray-500 font-bold">
                                {t("employeeLabel")}: {employeeName}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black p-1 text-sm font-bold"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                            {t("quickReasons")}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_REASONS.map((preset) => (
                                <button
                                    type="button"
                                    key={preset}
                                    onClick={() => setReason(preset)}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-colors ${
                                        reason === preset
                                            ? "bg-black border-black text-white"
                                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                            {t("reasonNoteLabel")}
                        </label>
                        <textarea
                            rows={3}
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t("reasonPlaceholder")}
                            className="p-3 border border-gray-300 bg-white text-xs font-medium text-black rounded-sm focus:border-black outline-none resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-black text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason.trim()}
                            className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black text-xs font-black uppercase tracking-wider rounded-sm transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? t("saving") : t("saveReason")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
