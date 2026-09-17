"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { startOffboarding } from "@/src/services/offboarding-service";

interface EmployeeResignationModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    onSuccess?: () => void;
}

export default function EmployeeResignationModal({
    isOpen,
    onClose,
    employeeId,
    onSuccess,
}: EmployeeResignationModalProps) {
    const t = useTranslations("DashboardProfile");

    const defaultReasons = [
        "O'z xohishiga ko'ra (Own will)",
        "Boshqa kompaniyaga o'tish (Career change)",
        "Ta'lim / O'qish (Education)",
        "Oila / Shaxsiy sabablar (Personal / Family)",
        "Salomatlik sababli (Health reasons)",
        "Boshqa sabab (Other)",
    ];

    const todayStr = new Date().toISOString().split("T")[0];
    const defaultLastDay = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const [reason, setReason] = useState<string>(defaultReasons[0]);
    const [lastWorkingDay, setLastWorkingDay] = useState<string>(defaultLastDay);
    const [exitNotes, setExitNotes] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId) return;

        setLoading(true);
        setErrorMsg(null);

        try {
            await startOffboarding(employeeId, {
                reason,
                lastWorkingDay,
                exitInterviewNotes: exitNotes.trim() || undefined,
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || "Arizani yuborishda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-black pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🏁</span>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tight text-black">
                                {t("resignationModalTitle") || "Ishdan Ketish Arizasi (Offboarding)"}
                            </h3>
                            <p className="text-[11px] font-medium text-gray-500">
                                {t("resignationModalSubtitle") || "Arizangiz faqat o'zingizning kompaniyangiz HR bo'limiga yuboriladi"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-sm font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-bold">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] uppercase tracking-wider text-black">
                            {t("resignationReason") || "Ketish Sababi"} *
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                        >
                            {defaultReasons.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] uppercase tracking-wider text-black">
                            {t("resignationLastDay") || "Oxirgi rejalashtirilgan ish kuni"} *
                        </label>
                        <input
                            type="date"
                            value={lastWorkingDay}
                            min={todayStr}
                            onChange={(e) => setLastWorkingDay(e.target.value)}
                            required
                            className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                        />
                        <p className="text-[10px] text-gray-400 font-normal">
                            Standart 2 haftalik ogohlantirish muddati tavsiya etiladi.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] uppercase tracking-wider text-black">
                            {t("resignationNotes") || "Izoh yoki sabab tafsilotlari (Ixtiyoriy)"}
                        </label>
                        <textarea
                            value={exitNotes}
                            onChange={(e) => setExitNotes(e.target.value)}
                            rows={3}
                            placeholder="Qo'shimcha izoh yoki minnatdorchilik xati..."
                            className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                        />
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium leading-relaxed">
                        ⚠️ <strong>Eslatma:</strong> Ushbu ariza yuborilgach, kompaniyangiz HR bo'limi aylanma varaqasini (Checklist) taqdim etadi va aktivlar topshirilgach hisob yakunlanadi.
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold uppercase hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? "Yuborilmoqda..." : (t("submitResignation") || "Arizani Yuborish")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
