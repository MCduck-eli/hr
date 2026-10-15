"use client";

import { useState } from "react";
import { createLeaveRequest, LeaveType } from "@/src/services/leave-service";

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    showToast?: (message: string, type?: "success" | "error") => void;
}

export default function LeaveRequestModal({
    isOpen,
    onClose,
    onSuccess,
    showToast,
}: LeaveRequestModalProps) {
    const [type, setType] = useState<LeaveType>("ANNUAL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localToast, setLocalToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    if (!isOpen) return null;

    const toast = {
        success: (msg: string) => {
            if (showToast) {
                showToast(msg, "success");
            }
            setLocalToast({ message: msg, type: "success" });
            setTimeout(() => setLocalToast(null), 4000);
        },
        error: (msg: string) => {
            if (showToast) {
                showToast(msg, "error");
            }
            setLocalToast({ message: msg, type: "error" });
            setTimeout(() => setLocalToast(null), 4000);
        },
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!startDate && !endDate) {
            const msg = "Boshlanish va tugash sanasini kiriting";
            setError(msg);
            toast.error(msg);
            return;
        }

        if (!startDate) {
            const msg = "Boshlanish sanasini tanlang";
            setError(msg);
            toast.error(msg);
            return;
        }

        if (!endDate) {
            const msg = "Tugash sanasini tanlang";
            setError(msg);
            toast.error(msg);
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            const msg = "Boshlanish sanasi tugash sanasidan keyin bo'lishi mumkin emas";
            setError(msg);
            toast.error(msg);
            return;
        }

        if (!reason.trim()) {
            const msg = "Ta'til sababi va izohini kiriting";
            setError(msg);
            toast.error(msg);
            return;
        }

        if (reason.trim().length < 5) {
            const msg = "Ta'til sababi kamida 5 ta belgidan iborat bo'lishi lozim";
            setError(msg);
            toast.error(msg);
            return;
        }

        setLoading(true);
        try {
            await createLeaveRequest({
                type,
                startDate,
                endDate,
                reason: reason.trim(),
            });
            toast.success("Ta'til so'rovi muvaffaqiyatli yuborildi");
            if (onSuccess) onSuccess();
            setStartDate("");
            setEndDate("");
            setReason("");
            setType("ANNUAL");
            onClose();
        } catch (err: any) {
            const message = err.message || "Xatolik yuz berdi";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
                            🏖️
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Ta&apos;til so&apos;rovi
                            </h3>
                            <p className="text-xs text-slate-500 font-normal">
                                Mehnat ta&apos;tili yoki ta&apos;til kunlari uchun rasmiy so&apos;rov
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 pt-4">
                    {localToast && (
                        <div
                            className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
                                localToast.type === "error"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span>{localToast.type === "error" ? "⚠️" : "✓"}</span>
                                <span>{localToast.message}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLocalToast(null)}
                                className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                            Ta&apos;til turi
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as LeaveType)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all cursor-pointer"
                        >
                            <option value="ANNUAL">Yillik mehnat ta&apos;tili</option>
                            <option value="UNPAID">O&apos;z hisobidan ta&apos;til (Ish haqi saqlanmagan holda)</option>
                            <option value="SICK">Kasallik ta&apos;tili (Kasallik varaqasi)</option>
                            <option value="MATERNITY">Homiladorlik va tug&apos;ruq ta&apos;tili</option>
                            <option value="OTHER">Boshqa sababli ta&apos;til</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                                Boshlanish sanasi
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all cursor-pointer"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                                Tugash sanasi
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                            Sabab / Izoh
                        </label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ta'til so'rovi sababini yozing..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? "Yuborilmoqda..." : "Yuborish"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
