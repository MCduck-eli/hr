"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { submitExitInterview } from "@/src/services/offboarding-service";

interface ExitInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    onSuccess?: () => void;
}

export default function ExitInterviewModal({
    isOpen,
    onClose,
    employeeId,
    onSuccess,
}: ExitInterviewModalProps) {
    const t = useTranslations("Offboarding");
    const [reason, setReason] = useState("ownWill");
    const [positives, setPositives] = useState("");
    const [challenges, setChallenges] = useState("");
    const [managementFeedback, setManagementFeedback] = useState("");
    const [suggestions, setSuggestions] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const reasonMap: Record<string, string> = {
        ownWill: t("reasons.ownWill"),
        anotherOffer: t("reasons.anotherOffer"),
        salaryLow: t("reasons.salaryLow"),
        limitedGrowth: t("reasons.limitedGrowth"),
        personalRelocation: t("reasons.personalRelocation"),
        educationNewField: t("reasons.educationNewField"),
        other: t("reasons.other"),
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg(null);

        const reasonText = reasonMap[reason] || reason;
        const compiledNotes = [
            `【${t("mainReasonLabel")}】: ${reasonText}`,
            positives ? `\n【${t("positivesLabel")}】:\n${positives}` : "",
            challenges ? `\n【${t("challengesLabel")}】:\n${challenges}` : "",
            managementFeedback ? `\n【${t("managementFeedbackLabel")}】:\n${managementFeedback}` : "",
            suggestions ? `\n【${t("suggestionsLabel")}】:\n${suggestions}` : "",
        ]
            .filter(Boolean)
            .join("\n");

        try {
            await submitExitInterview(employeeId, {
                reason: reasonText,
                exitInterviewNotes: compiledNotes,
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || t("errorSubmit"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-black pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📝</span>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tight text-black">
                                {t("modalTitle")}
                            </h3>
                            <p className="text-[11px] font-medium text-gray-500">
                                {t("modalSubtitle")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-sm font-bold text-gray-500 hover:text-black"
                    >
                        ✕
                    </button>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-black">
                            {t("mainReasonLabel")}
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                        >
                            <option value="ownWill">{t("reasons.ownWill")}</option>
                            <option value="anotherOffer">{t("reasons.anotherOffer")}</option>
                            <option value="salaryLow">{t("reasons.salaryLow")}</option>
                            <option value="limitedGrowth">{t("reasons.limitedGrowth")}</option>
                            <option value="personalRelocation">{t("reasons.personalRelocation")}</option>
                            <option value="educationNewField">{t("reasons.educationNewField")}</option>
                            <option value="other">{t("reasons.other")}</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-black">
                            {t("positivesLabel")}
                        </label>
                        <textarea
                            rows={2}
                            placeholder={t("positivesPlaceholder")}
                            value={positives}
                            onChange={(e) => setPositives(e.target.value)}
                            className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-black">
                            {t("challengesLabel")}
                        </label>
                        <textarea
                            rows={2}
                            placeholder={t("challengesPlaceholder")}
                            value={challenges}
                            onChange={(e) => setChallenges(e.target.value)}
                            className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-black">
                            {t("managementFeedbackLabel")}
                        </label>
                        <textarea
                            rows={2}
                            placeholder={t("managementFeedbackPlaceholder")}
                            value={managementFeedback}
                            onChange={(e) => setManagementFeedback(e.target.value)}
                            className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-black">
                            {t("suggestionsLabel")}
                        </label>
                        <textarea
                            rows={2}
                            placeholder={t("suggestionsPlaceholder")}
                            value={suggestions}
                            onChange={(e) => setSuggestions(e.target.value)}
                            className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100 transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                            {submitting ? t("submitting") : t("submit")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
