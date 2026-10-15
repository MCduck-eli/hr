"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTrialRequests, TrialRequest } from "@/src/services/trial-service";
import TrialClientsTable from "@/src/components/super-admin/TrialClientsTable";
import { getTrialRemainingDays } from "@/src/utils/trial-utils";

export default function SuperAdminTrialsPage() {
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    const [trials, setTrials] = useState<TrialRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrials = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getTrialRequests();
            setTrials(data);
        } catch (err: any) {
            setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrials();
    }, []);

    const totalCount = trials.length;
    const activeCount = trials.filter((t) => t.status !== "REJECTED" && !getTrialRemainingDays(t.trialEndDate).isExpired).length;
    const expiredCount = trials.filter((t) => t.status !== "REJECTED" && getTrialRemainingDays(t.trialEndDate).isExpired).length;
    const endingSoonCount = trials.filter((t) => {
        if (t.status === "REJECTED") return false;
        const res = getTrialRemainingDays(t.trialEndDate);
        return !res.isExpired && res.daysRemaining <= 3;
    }).length;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50/60 p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href={`/${locale}/dashboard`}
                                className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span>Boshqaruv paneli</span>
                            </Link>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-950 flex items-center gap-3">
                            <span>🚀</span>
                            <span>Sinov Muddati So'rovlari</span>
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
                            Landing page orqali bepul kirish uchun ariza qoldirgan foydalanuvchilar ro'yxati
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={fetchTrials}
                            disabled={isLoading}
                            className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-2xl text-xs font-bold shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#e2e8f0,inset_-2px_-2px_4px_#ffffff] transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Yangilash</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden">
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.05]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: "240px 240px",
                            }}
                        />
                        <div className="relative z-10">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jami so'rovlar</div>
                            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalCount}</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden">
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.05]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: "240px 240px",
                            }}
                        />
                        <div className="relative z-10">
                            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Faol sinovlar</div>
                            <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{activeCount}</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden">
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.05]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: "240px 240px",
                            }}
                        />
                        <div className="relative z-10">
                            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Tez orada tugaydigan</div>
                            <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{endingSoonCount}</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden">
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.05]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: "240px 240px",
                            }}
                        />
                        <div className="relative z-10">
                            <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Muddati tugagan</div>
                            <div className="text-2xl font-black text-rose-600 mt-1 font-mono">{expiredCount}</div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError(null)}
                            className="text-rose-500 hover:text-rose-700 font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <TrialClientsTable trials={trials} isLoading={isLoading} onApproveSuccess={fetchTrials} />
            </div>
        </div>
    );
}
