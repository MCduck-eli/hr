"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import GirihPattern from "@/src/components/ui/GirihPattern";
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="relative w-full max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
                <GirihPattern className="opacity-[0.10] rounded-3xl overflow-hidden" />

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
            </motion.div>
        </motion.div>
    );
}
