import React, { useState } from "react";
import { TrialRequest, approveTrialRequest, rejectTrialRequest, extendTrialRequest } from "@/src/services/trial-service";

interface TrialClientsTableProps {
    trials: TrialRequest[];
    isLoading?: boolean;
    onApproveSuccess?: () => void;
}

export default function TrialClientsTable({ trials, isLoading, onApproveSuccess }: TrialClientsTableProps) {
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [rejectModalTrial, setRejectModalTrial] = useState<TrialRequest | null>(null);
    const [extendModalTrial, setExtendModalTrial] = useState<TrialRequest | null>(null);
    const [newEndDate, setNewEndDate] = useState<string>("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    const handleOpenExtendModal = (item: TrialRequest) => {
        setExtendModalTrial(item);
        const date = new Date();
        date.setDate(date.getDate() + 30);
        setNewEndDate(date.toISOString().split("T")[0]);
    };

    const handleExtend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!extendModalTrial || !newEndDate) return;
        try {
            setActionLoadingId(`${extendModalTrial.id}-extend`);
            const targetDate = newEndDate.includes("T") ? new Date(newEndDate) : new Date(`${newEndDate}T23:59:59`);
            await extendTrialRequest(extendModalTrial.id, targetDate.toISOString());
            showToast("Sinov muddati muvaffaqiyatli uzaytirildi va tizim blokdan chiqarildi", "success");
            setExtendModalTrial(null);
            if (onApproveSuccess) {
                onApproveSuccess();
            }
        } catch (err: any) {
            showToast(err.message || "Muddatni uzaytirishda xatolik yuz berdi", "error");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            setActionLoadingId(`${id}-approve`);
            await approveTrialRequest(id);
            showToast("Mijoz tasdiqlandi va parol pochtaga yuborildi", "success");
            if (onApproveSuccess) {
                onApproveSuccess();
            }
        } catch (err: any) {
            showToast(err.message || "Xatolik yuz berdi", "error");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleReject = async (id: string) => {
        try {
            setActionLoadingId(`${id}-reject`);
            await rejectTrialRequest(id);
            showToast("Mijoz so'rovi rad etildi", "success");
            setRejectModalTrial(null);
            if (onApproveSuccess) {
                onApproveSuccess();
            }
        } catch (err: any) {
            showToast(err.message || "Rad etishda xatolik yuz berdi", "error");
        } finally {
            setActionLoadingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full bg-white rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden">
                <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!trials || trials.length === 0) {
        return (
            <div className="w-full bg-white rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden p-12 text-center">
                <div
                    className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.11]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: "240px 240px",
                    }}
                />
                <div className="relative z-10">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Hozircha hech qanday sinov so'rovi yo'q</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Landing page orqali bepul sinab ko'rish uchun yuborilgan arizalar shu yerda ko'rinadi.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden">
            <div
                className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.11]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: "240px 240px",
                }}
            />
            <div className="relative z-10 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                            <th className="py-4 px-5">Ism-Familiya</th>
                            <th className="py-4 px-5">Email</th>
                            <th className="py-4 px-5">Telefon raqam</th>
                            <th className="py-4 px-5">Holati</th>
                            <th className="py-4 px-5">Sinov muddati tugashiga qoldi</th>
                            <th className="py-4 px-5 text-right">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {trials.map((item) => {
                            const now = new Date();
                            const end = item.trialEndDate ? new Date(item.trialEndDate) : null;
                            const diffDays = end ? Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            const isExpired = !end || diffDays <= 0;
                            const isApproved = item.status === "APPROVED";
                            const isRejected = item.status === "REJECTED";

                            return (
                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                {item.firstName?.[0]?.toUpperCase() || "U"}
                                                {item.lastName?.[0]?.toUpperCase() || ""}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {item.firstName} {item.lastName}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-normal">
                                                    {new Date(item.createdAt).toLocaleDateString("uz-UZ", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5">
                                        <span className="font-mono text-slate-600 select-all">{item.email}</span>
                                    </td>
                                    <td className="py-4 px-5">
                                        <span className="font-mono text-slate-600">{item.phone}</span>
                                    </td>
                                    <td className="py-4 px-5">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                isApproved
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                                    : isRejected
                                                      ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                                      : item.status === "TRIAL_ACTIVE"
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    isApproved
                                                        ? "bg-emerald-500"
                                                        : isRejected
                                                          ? "bg-rose-500"
                                                          : item.status === "TRIAL_ACTIVE"
                                                            ? "bg-blue-500"
                                                            : "bg-slate-400"
                                                }`}
                                            />
                                            {isApproved
                                                ? "Tasdiqlangan"
                                                : isRejected
                                                  ? "Rad etilgan"
                                                  : item.status === "TRIAL_ACTIVE"
                                                    ? "Faol sinov"
                                                    : item.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5">
                                        {isRejected ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                                Bekor qilingan
                                            </span>
                                        ) : isExpired ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200">
                                                Muddati tugagan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200/80">
                                                {diffDays} kun qoldi
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {isApproved ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span>Tasdiqlangan</span>
                                                </span>
                                            ) : isRejected ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    <span>Rad etilgan</span>
                                                </span>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(item.id)}
                                                        disabled={!!actionLoadingId}
                                                        className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg px-3 py-1.5 font-medium text-xs inline-flex items-center gap-1.5 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#e2e8f0,inset_-2px_-2px_4px_#ffffff] transition-all duration-200 cursor-pointer"
                                                    >
                                                        {actionLoadingId === `${item.id}-approve` ? (
                                                            <>
                                                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                                </svg>
                                                                <span>Tasdiqlanmoqda...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>Tasdiqlash</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRejectModalTrial(item)}
                                                        disabled={!!actionLoadingId}
                                                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-3 py-1.5 font-medium text-xs inline-flex items-center gap-1.5 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#e2e8f0,inset_-2px_-2px_4px_#ffffff] transition-all duration-200 cursor-pointer"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        <span>Rad etish</span>
                                                    </button>
                                                </>
                                            )}

                                            {isExpired && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenExtendModal(item)}
                                                    className="bg-white hover:bg-slate-50 text-purple-700 hover:text-purple-900 rounded-xl px-3 py-1.5 font-bold text-xs inline-flex items-center gap-1.5 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#e2e8f0,inset_-2px_-2px_4px_#ffffff] transition-all duration-200 cursor-pointer border border-purple-100/80"
                                                >
                                                    <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    <span>Muddatni uzaytirish</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {rejectModalTrial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 max-w-md w-full p-6 relative overflow-hidden">
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.11]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E\")`,
                                backgroundSize: "240px 240px",
                            }}
                        />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100/60 shadow-sm">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">
                                Sinov so'rovini rad etish
                            </h3>
                            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                Haqiqatan ham <strong className="text-slate-800">{rejectModalTrial.firstName} {rejectModalTrial.lastName}</strong> ({rejectModalTrial.email}) ning sinov so'rovini rad etmoqchimisiz?
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRejectModalTrial(null)}
                                    disabled={!!actionLoadingId}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReject(rejectModalTrial.id)}
                                    disabled={!!actionLoadingId}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 transition-all duration-200 disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                    {actionLoadingId === `${rejectModalTrial.id}-reject` ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            <span>Rad etilmoqda...</span>
                                        </>
                                    ) : (
                                        <span>Rad etish</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {extendModalTrial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 max-w-md w-full p-6 relative overflow-hidden">
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.11]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E\")`,
                                backgroundSize: "240px 240px",
                            }}
                        />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100/60 shadow-sm">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">
                                Muddatni uzaytirish
                            </h3>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                <strong className="text-slate-800">{extendModalTrial.firstName} {extendModalTrial.lastName}</strong> ({extendModalTrial.email}) uchun yangi tugash sanasini belgilang va tizimni blokdan chiqaring.
                            </p>

                            <form onSubmit={handleExtend} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        Yangi tugash sanasi *
                                    </label>
                                    <input
                                        type="date"
                                        value={newEndDate}
                                        onChange={(e) => setNewEndDate(e.target.value)}
                                        min={new Date().toISOString().split("T")[0]}
                                        required
                                        className="w-full px-4 py-2.5 rounded-2xl bg-white shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] text-slate-800 font-semibold text-xs outline-none focus:ring-2 focus:ring-purple-600/30 transition-all"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setExtendModalTrial(null)}
                                        disabled={!!actionLoadingId}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!!actionLoadingId || !newEndDate}
                                        className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md active:scale-95 transition-all duration-200 disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                        {actionLoadingId === `${extendModalTrial.id}-extend` ? (
                                            <>
                                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                                <span>Saqlanmoqda...</span>
                                            </>
                                        ) : (
                                            <span>Saqlash</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed top-6 right-6 z-50 transition-all duration-300">
                    <div
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-medium ${
                            toast.type === "success"
                                ? "bg-white border-emerald-200 text-emerald-800"
                                : "bg-white border-rose-200 text-rose-800"
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
