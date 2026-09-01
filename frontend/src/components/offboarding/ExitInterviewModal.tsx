"use client";

import { useState } from "react";
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
    const [reason, setReason] = useState("O'z xohishiga ko'ra");
    const [positives, setPositives] = useState("");
    const [challenges, setChallenges] = useState("");
    const [managementFeedback, setManagementFeedback] = useState("");
    const [suggestions, setSuggestions] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg(null);

        const compiledNotes = [
            `【Ketish Sababi】: ${reason}`,
            positives ? `\n【Kompaniyadagi ijobiy tajribalar】:\n${positives}` : "",
            challenges ? `\n【Qiyinchiliklar va sabablar】:\n${challenges}` : "",
            managementFeedback ? `\n【Rahbariyat va jamoa haqida fikr】:\n${managementFeedback}` : "",
            suggestions ? `\n【Kompaniyani yaxshilash bo'yicha takliflar】:\n${suggestions}` : "",
        ]
            .filter(Boolean)
            .join("\n");

        try {
            await submitExitInterview(employeeId, {
                reason,
                exitInterviewNotes: compiledNotes,
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || "Exit interview topshirishda xatolik");
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
                                Exit Interview So'rovnomasi
                            </h3>
                            <p className="text-[11px] font-medium text-gray-500">
                                Sizning samimiy fikrlaringiz kompaniyani yanada rivojlantirish uchun juda muhim
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
                            Ishdan ketishingizning asosiy sababi *
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                        >
                            <option value="O'z xohishiga ko'ra">O'z xohishiga ko'ra</option>
                            <option value="Boshqa kompaniyadan taklif oldim">Boshqa kompaniyadan taklif oldim</option>
                            <option value="Maosh va kompensatsiya yetarli emas">Maosh va kompensatsiya yetarli emas</option>
                            <option value="Karyera o'sishi imkoniyati cheklangan">Karyera o'sishi imkoniyati cheklangan</option>
                            <option value="Shaxsiy sabablar / Oila / Ko'chish">Shaxsiy sabablar / Oila / Ko'chish</option>
                            <option value="O'qish yoki yangi sohani o'rganish">O'qish yoki yangi sohani o'rganish</option>
                            <option value="Boshqa">Boshqa</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-black">
                            Kompaniyada ishlagan davringizdagi eng ijobiy jihatlar
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Sizga yoqqan loyihalar, jamoa muhiti yoki imkoniyatlar..."
                            value={positives}
                            onChange={(e) => setPositives(e.target.value)}
                            className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-black">
                            Qanday qiyinchiliklar yoki kamchiliklarga duch keldingiz?
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Jarayonlar, boshqaruv yoki vositalardagi kamchiliklar..."
                            value={challenges}
                            onChange={(e) => setChallenges(e.target.value)}
                            className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-black">
                            Rahbariyat va jamoa bilan ishlash bo'yicha fikringiz
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Muloqot, vazifalar taqsimoti va qo'llab-quvvatlash..."
                            value={managementFeedback}
                            onChange={(e) => setManagementFeedback(e.target.value)}
                            className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-black">
                            Kompaniyani yaxshilash bo'yicha takliflaringiz
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Kelgusi xodimlar uchun qanday tavsiyalar berasiz..."
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
                            Bekor Qilish
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Yuborilmoqda..." : "So'rovnomani Yuborish"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
