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
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Yangilash</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jami so'rovlar</div>
                        <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalCount}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                        <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Faol sinovlar</div>
                        <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{activeCount}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                        <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Tez orada tugaydigan</div>
                        <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{endingSoonCount}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                        <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Muddati tugagan</div>
                        <div className="text-2xl font-black text-rose-600 mt-1 font-mono">{expiredCount}</div>
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
