"use client";

import { useState, useEffect } from "react";
import {
    ExecutiveSummaryResponse,
    fetchExecutiveSummary,
} from "@/src/services/analytics-service";
import NineBoxGrid from "./NineBoxGrid";
import AnalyticsExport from "./AnalyticsExport";
import EnpsQuestionManagerModal from "./EnpsQuestionManagerModal";
import Skeleton from "@/src/components/ui/Skeleton";
import { getQueryData, setQueryData, isQueryStale } from "@/src/utils/query-cache";
import { motion } from "framer-motion";
import AnimatedNumber from "@/src/components/ui/AnimatedNumber";

interface ExecutiveAnalyticsDashboardProps {
    initialDepartmentId?: string;
}

export default function ExecutiveAnalyticsDashboard({
    initialDepartmentId,
}: ExecutiveAnalyticsDashboardProps) {
    const [departmentFilter, setDepartmentFilter] = useState(initialDepartmentId || "");
    const [timeframe, setTimeframe] = useState("year");
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

    const cacheKey = `analytics:${departmentFilter}:${timeframe}`;
    const [data, setData] = useState<ExecutiveSummaryResponse | null>(() => getQueryData<ExecutiveSummaryResponse>(`analytics:${initialDepartmentId || ""}:year`));
    const [loading, setLoading] = useState(() => !getQueryData(`analytics:${initialDepartmentId || ""}:year`));
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadAnalytics = async () => {
        const cached = getQueryData<ExecutiveSummaryResponse>(cacheKey);
        const isStale = isQueryStale(cacheKey);

        if (cached) {
            setData(cached);
        } else {
            setLoading(true);
        }
        setError(null);

        if (cached && !isStale) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetchExecutiveSummary({
                timeframe,
                departmentId: departmentFilter || undefined,
            });
            setData(res);
            setQueryData(cacheKey, res);
        } catch (err: any) {
            setError(err.message || "Analitika ma'lumotlarini yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [departmentFilter, timeframe]);

    if (loading && !data) {
        return (
            <div className="flex flex-col gap-6 w-full animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="w-64 h-8 rounded-xl" />
                        <Skeleton className="w-96 h-4 rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-32 h-10 rounded-xl" />
                        <Skeleton className="w-28 h-10 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 shadow-xs">
                            <Skeleton className="w-24 h-3.5 rounded-md" />
                            <Skeleton className="w-16 h-8 rounded-lg" />
                            <Skeleton className="w-36 h-3 rounded-md" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 shadow-xs">
                        <Skeleton className="w-48 h-6 rounded-lg" />
                        <Skeleton className="w-full h-64 rounded-xl" />
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 shadow-xs">
                        <Skeleton className="w-48 h-6 rounded-lg" />
                        <Skeleton className="w-full h-64 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="p-6 bg-red-50 border border-red-300 flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                    {error}
                </span>
                <button
                    onClick={loadAnalytics}
                    className="self-start px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase"
                >
                    Qayta urinish
                </button>
            </div>
        );
    }

    if (!data) return null;

    const maxMonthlyTurnover = Math.max(...data.turnover.trend.map((t) => t.turnoverRate), 5);
    const periodLabel =
        timeframe === "quarter" ? "Kvartallik" : timeframe === "month" ? "Oylik" : "Yillik";

    return (
        <div className="flex flex-col gap-8 w-full print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950 flex items-center gap-2">
                            <span>Executive BI Dashboard</span>
                            <span className="px-3 py-1 text-xs font-mono font-bold uppercase bg-purple-50 border border-purple-200 text-purple-800 rounded-xl">
                                🏢 {data.companyName}
                            </span>
                        </h2>
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                        Rahbariyat va HR uchun chuqur korporativ tahlillar, kadrlar qo'nimsizligi, eNPS va 9-Box matritsasi
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] transition-all shadow-xs"
                    >
                        <option value="year">Joriy Yil (2026)</option>
                        <option value="quarter">Oxirgi Kvartal</option>
                        <option value="month">Oxirgi Oy</option>
                    </select>

                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] transition-all shadow-xs"
                    >
                        <option value="">Barcha Bo'limlar</option>
                        {data.departmentAnalytics.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name} ({dept.headcount} nafar)
                            </option>
                        ))}
                    </select>

                    <AnalyticsExport data={data} />
                </div>
            </div>

            <motion.div
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.08,
                        },
                    },
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                    }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Jami Xodimlar
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-purple-50 text-[#9327FF] flex items-center justify-center text-sm font-bold">
                            👥
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-3xl font-black font-mono text-slate-950">
                                <AnimatedNumber value={data.headcount.totalActive} />
                            </span>
                            <span className="text-xs font-bold text-emerald-600 mt-0.5">
                                <AnimatedNumber value={data.headcount.newHiresYear} prefix="+" /> yangi qabul
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
                            100%
                        </div>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        <span>O'rtacha staj:</span>
                        <span className="font-bold text-slate-900">
                            <AnimatedNumber value={data.headcount.avgTenureMonths} /> oy
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                    }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Turnover Rate
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold">
                            🔄
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span
                                className={`text-3xl font-black font-mono ${
                                    data.turnover.turnoverRate > 15
                                        ? "text-rose-600"
                                        : data.turnover.turnoverRate > 8
                                        ? "text-amber-600"
                                        : "text-emerald-600"
                                }`}
                            >
                                <AnimatedNumber value={data.turnover.turnoverRate} suffix="%" />
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                                ({periodLabel} qo'nimsizlik)
                            </span>
                        </div>

                        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-100"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className={`transition-all duration-1000 ease-out ${
                                        data.turnover.turnoverRate > 15
                                            ? "text-rose-500"
                                            : data.turnover.turnoverRate > 8
                                            ? "text-amber-500"
                                            : "text-emerald-500"
                                    }`}
                                    strokeDasharray={`${Math.min(100, Math.max(5, (mounted ? data.turnover.turnoverRate * 3 : 0)))}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <span className="absolute font-mono text-[10px] font-black text-slate-800">
                                <AnimatedNumber value={data.turnover.turnoverRate} suffix="%" />
                            </span>
                        </div>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        <span>Retention (Saqlash):</span>
                        <span className="font-bold text-emerald-600">
                            <AnimatedNumber value={data.turnover.retentionRate} suffix="%" />
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                    }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            eNPS Sodiqlik
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                            🌟
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span
                                className={`text-3xl font-black font-mono ${
                                    (data.enps.avgScore ?? 0) >= 8
                                        ? "text-emerald-600"
                                        : (data.enps.avgScore ?? 0) >= 6
                                        ? "text-violet-600"
                                        : "text-rose-600"
                                }`}
                            >
                                <AnimatedNumber value={data.enps.avgScore ?? 0} decimals={1} />
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                                / 10 o'rtacha ball
                            </span>
                        </div>

                        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-100"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className={`transition-all duration-1000 ease-out ${
                                        (data.enps.avgScore ?? 0) >= 8
                                            ? "text-emerald-500"
                                            : (data.enps.avgScore ?? 0) >= 6
                                            ? "text-[#9327FF]"
                                            : "text-rose-500"
                                    }`}
                                    strokeDasharray={`${Math.min(100, Math.max(5, (mounted ? ((data.enps.avgScore ?? 0) / 10) * 100 : 0)))}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <span className="absolute font-mono text-[10px] font-black text-slate-800">
                                <AnimatedNumber value={data.enps.score} prefix={data.enps.score > 0 ? "+" : ""} />
                            </span>
                        </div>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        <span>Ishtirokchilar:</span>
                        <span className="font-bold text-slate-900">
                            <AnimatedNumber value={data.enps.totalResponses} /> nafar
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                    }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            High Potentials
                        </span>
                        <span className="w-8 h-8 rounded-xl bg-purple-50 text-[#9327FF] flex items-center justify-center text-sm font-bold">
                            ⭐
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-3xl font-black font-mono text-[#9327FF]">
                                <AnimatedNumber value={data.nineBoxSummary.highPotentialCount} />
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                                (<AnimatedNumber value={data.nineBoxSummary.highPotentialPct} suffix="%" /> jami xodimlar)
                            </span>
                        </div>

                        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-100"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-[#9327FF] transition-all duration-1000 ease-out"
                                    strokeDasharray={`${Math.min(100, Math.max(5, (mounted ? data.nineBoxSummary.highPotentialPct : 0)))}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <span className="absolute font-mono text-[10px] font-black text-slate-800">
                                <AnimatedNumber value={data.nineBoxSummary.highPotentialPct} suffix="%" />
                            </span>
                        </div>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        <span>Xavf guruhi:</span>
                        <span className="font-bold text-rose-600">
                            <AnimatedNumber value={data.nineBoxSummary.riskCount} /> nafar
                        </span>
                    </div>
                </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                📈 Kadrlar Qo'nimsizligi Dinamikasi
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                                Oxirgi 6 oylik qabul, ketish va turnover ko'rsatkichi
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-2">
                        <div className="grid grid-cols-6 gap-2 items-end h-44 border-b border-slate-100 pb-2">
                            {data.turnover.trend.map((t, idx) => {
                                const maxVal = Math.max(
                                    ...data.turnover.trend.map((item) => Math.max(item.hires, item.exits, 1)),
                                );
                                const hireHeight = Math.min(100, Math.max(8, Math.round((t.hires / maxVal) * 100)));
                                const exitHeight = Math.min(100, Math.max(8, Math.round((t.exits / maxVal) * 100)));

                                return (
                                    <div
                                        key={`trend-${idx}`}
                                        className="flex flex-col items-center justify-end h-full gap-1.5 group"
                                    >
                                        <div className="flex flex-col items-center opacity-75 group-hover:opacity-100 transition-opacity">
                                            <span
                                                className={`text-[9px] font-mono font-black px-1 rounded-xs ${
                                                    t.turnoverRate > 0
                                                        ? "bg-rose-100 text-rose-800"
                                                        : "bg-slate-100 text-slate-700"
                                                }`}
                                            >
                                                {t.turnoverRate}%
                                            </span>
                                        </div>
                                        <div className="w-full flex items-end justify-center gap-1 h-28">
                                            <div
                                                className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-1000 ease-out flex items-end justify-center"
                                                style={{ height: `${mounted ? (t.hires > 0 ? hireHeight : 4) : 0}%` }}
                                                title={`Yangi qabul: ${t.hires} nafar`}
                                            >
                                                {t.hires > 0 && (
                                                    <span className="text-[8px] font-mono text-white font-bold pb-0.5 opacity-0 group-hover:opacity-100">
                                                        {t.hires}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                className="w-1/2 bg-rose-500 hover:bg-rose-600 rounded-t-md transition-all duration-1000 ease-out flex items-end justify-center"
                                                style={{ height: `${mounted ? (t.exits > 0 ? exitHeight : 4) : 0}%` }}
                                                title={`Bo'shatilgan: ${t.exits} nafar`}
                                            >
                                                {t.exits > 0 && (
                                                    <span className="text-[8px] font-mono text-white font-bold pb-0.5 opacity-0 group-hover:opacity-100">
                                                        {t.exits}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-bold uppercase text-slate-500 truncate w-full text-center">
                                            {t.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-600 gap-2">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 inline-block rounded-full" />
                                    <span>Qabul</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 bg-rose-500 inline-block rounded-full" />
                                    <span>Ketish</span>
                                </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-900">
                                {periodLabel} O'rtacha: {data.turnover.turnoverRate}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                💬 eNPS Qoniqish Tuzilmasi
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                                Xodimlarning kompaniyaga sodiqlik va tavsiya qilish darajasi
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-black text-slate-900">
                                O'rtacha: {data.enps.avgScore ?? 0}/10 &bull; eNPS: {data.enps.score > 0 ? `+${data.enps.score}` : data.enps.score}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsQuestionModalOpen(true)}
                                className="px-3.5 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                                <span>⚙️</span>
                                <span>Savollarni Boshqarish</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 pt-2">
                        <div className="flex flex-col gap-1.5">
                            <div className="w-full h-7 bg-slate-100 rounded-xl flex overflow-hidden border border-slate-200/80">
                                <div
                                    className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000 ease-out"
                                    style={{ width: `${mounted ? data.enps.promotersPct : 0}%` }}
                                    title={`Promoters: ${data.enps.promotersPct}%`}
                                >
                                    {data.enps.promotersPct > 10 ? `${data.enps.promotersPct}%` : ""}
                                </div>
                                <div
                                    className="bg-amber-400 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000 ease-out"
                                    style={{ width: `${mounted ? data.enps.passivesPct : 0}%` }}
                                    title={`Passives: ${data.enps.passivesPct}%`}
                                >
                                    {data.enps.passivesPct > 10 ? `${data.enps.passivesPct}%` : ""}
                                </div>
                                <div
                                    className="bg-rose-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000 ease-out"
                                    style={{ width: `${mounted ? data.enps.detractorsPct : 0}%` }}
                                    title={`Detractors: ${data.enps.detractorsPct}%`}
                                >
                                    {data.enps.detractorsPct > 10 ? `${data.enps.detractorsPct}%` : ""}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase">
                                    Promoters (9-10)
                                </span>
                                <span className="text-xl font-black font-mono text-emerald-900 mt-1">
                                    <AnimatedNumber value={data.enps.promotersPct} suffix="%" />
                                </span>
                                <span className="text-[10px] text-emerald-700/70">
                                    <AnimatedNumber value={data.enps.promotersCount} /> nafar xodim
                                </span>
                            </div>

                            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 flex flex-col">
                                <span className="text-[10px] font-bold text-amber-800 uppercase">
                                    Passives (7-8)
                                </span>
                                <span className="text-xl font-black font-mono text-amber-900 mt-1">
                                    <AnimatedNumber value={data.enps.passivesPct} suffix="%" />
                                </span>
                                <span className="text-[10px] text-amber-700/70">
                                    <AnimatedNumber value={data.enps.passivesCount} /> nafar xodim
                                </span>
                            </div>

                            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-100 flex flex-col">
                                <span className="text-[10px] font-bold text-rose-800 uppercase">
                                    Detractors (0-6)
                                </span>
                                <span className="text-xl font-black font-mono text-rose-900 mt-1">
                                    <AnimatedNumber value={data.enps.detractorsPct} suffix="%" />
                                </span>
                                <span className="text-[10px] text-rose-700/70">
                                    <AnimatedNumber value={data.enps.detractorsCount} /> nafar xodim
                                </span>
                            </div>
                        </div>

                        {data.enps.recentResponses && data.enps.recentResponses.length > 0 && (
                            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                                    <span>Xodimlar Baholari va Izohlari ({data.enps.recentResponses.length})</span>
                                </span>
                                <div className="max-h-48 overflow-y-auto flex flex-col gap-2 pr-1">
                                    {data.enps.recentResponses.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                                                            item.score >= 9
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : item.score >= 7
                                                                ? "bg-amber-100 text-amber-800"
                                                                : "bg-rose-100 text-rose-800"
                                                        }`}
                                                    >
                                                        ⭐ {item.score}/10
                                                    </span>
                                                    <span className="font-bold text-slate-900">{item.employeeName}</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        ({item.department} - {item.position})
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {item.comment && (
                                                <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                                                    &ldquo;{item.comment}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
                            🏢 Bo'limlar Kesimidagi Metrikalar
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                            Har bir departament bo'yicha xodimlar soni, OKR ijrosi va turnover darajasi
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                <th className="p-3.5 pl-4 font-bold">Bo'lim Nomi</th>
                                <th className="p-3.5 font-bold">Xodimlar Soni</th>
                                <th className="p-3.5 font-bold">Kompaniya Ulushi</th>
                                <th className="p-3.5 font-bold">O'rtacha OKR</th>
                                <th className="p-3.5 pr-4 font-bold">Turnover Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.departmentAnalytics.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                                        Bo'limlar ma'lumotlari mavjud emas
                                    </td>
                                </tr>
                            ) : (
                                data.departmentAnalytics.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3.5 pl-4 font-bold text-slate-900">{dept.name}</td>
                                        <td className="p-3.5 font-mono font-bold text-slate-700">
                                            {dept.headcount} nafar
                                        </td>
                                        <td className="p-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#9327FF] rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: `${mounted ? dept.headcountPercentage : 0}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-slate-600">
                                                    <AnimatedNumber value={dept.headcountPercentage} suffix="%" />
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3.5">
                                            <span
                                                className={`font-mono font-bold ${
                                                    dept.avgOkr >= 75
                                                        ? "text-emerald-600"
                                                        : dept.avgOkr >= 50
                                                        ? "text-blue-600"
                                                        : "text-amber-600"
                                                }`}
                                            >
                                                {dept.avgOkr}%
                                            </span>
                                        </td>
                                        <td className="p-3.5 pr-4">
                                            <span
                                                className={`font-mono font-bold ${
                                                    dept.turnoverRate > 15
                                                        ? "text-rose-600"
                                                        : dept.turnoverRate > 8
                                                        ? "text-amber-600"
                                                        : "text-emerald-600"
                                                }`}
                                            >
                                                {dept.turnoverRate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <NineBoxGrid
                matrix={data.nineBoxMatrix}
                selectedDepartment={departmentFilter}
            />

            <EnpsQuestionManagerModal
                isOpen={isQuestionModalOpen}
                onClose={() => setIsQuestionModalOpen(false)}
                onQuestionsUpdated={loadAnalytics}
            />
        </div>
    );
}
