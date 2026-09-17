"use client";

import { useState, useEffect } from "react";
import {
    ExecutiveSummaryResponse,
    fetchExecutiveSummary,
} from "@/src/services/analytics-service";
import NineBoxGrid from "./NineBoxGrid";
import AnalyticsExport from "./AnalyticsExport";
import EnpsQuestionManagerModal from "./EnpsQuestionManagerModal";

interface ExecutiveAnalyticsDashboardProps {
    initialDepartmentId?: string;
}

export default function ExecutiveAnalyticsDashboard({
    initialDepartmentId,
}: ExecutiveAnalyticsDashboardProps) {
    const [data, setData] = useState<ExecutiveSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [departmentFilter, setDepartmentFilter] = useState(initialDepartmentId || "");
    const [timeframe, setTimeframe] = useState("year");
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

    const loadAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchExecutiveSummary({
                timeframe,
                departmentId: departmentFilter || undefined,
            });
            setData(res);
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
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Executive BI Analitika yuklanmoqda...
                </span>
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

    return (
        <div className="flex flex-col gap-8 w-full print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                            <span>Executive BI Dashboard</span>
                            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-50 border border-blue-200 text-blue-800">
                                🏢 {data.companyName}
                            </span>
                        </h2>
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                        Rahbariyat va HR uchun chuqur korporativ tahlillar, kadrlar qo'nimsizligi, eNPS va 9-Box matritsasi
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-300 text-xs font-bold uppercase text-black focus:outline-none focus:border-black"
                    >
                        <option value="year">Joriy Yil (2026)</option>
                        <option value="quarter">Oxirgi Kvartal</option>
                        <option value="month">Oxirgi Oy</option>
                    </select>

                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border-2 border-black p-5 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Jami Xodimlar Soni
                        </span>
                        <span className="text-lg">👥</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-black">
                            {data.headcount.totalActive}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                            +{data.headcount.newHiresYear} yangi
                        </span>
                    </div>
                    <div className="text-[10px] font-medium text-gray-500 border-t border-gray-100 pt-2 flex items-center justify-between">
                        <span>O'rtacha staj:</span>
                        <span className="font-bold text-black">{data.headcount.avgTenureMonths} oy</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-black p-5 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Turnover Rate (Qo'nimsizlik)
                        </span>
                        <span className="text-lg">🔄</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span
                            className={`text-3xl font-black font-mono ${
                                data.turnover.turnoverRate > 15
                                    ? "text-red-700"
                                    : data.turnover.turnoverRate > 8
                                    ? "text-amber-700"
                                    : "text-emerald-700"
                            }`}
                        >
                            {data.turnover.turnoverRate}%
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                            (Yillik)
                        </span>
                    </div>
                    <div className="text-[10px] font-medium text-gray-500 border-t border-gray-100 pt-2 flex items-center justify-between">
                        <span>Retention (Saqlash):</span>
                        <span className="font-bold text-emerald-700">{data.turnover.retentionRate}%</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-black p-5 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            eNPS (Xodimlar Sodiqligi)
                        </span>
                        <span className="text-lg">🌟</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span
                            className={`text-3xl font-black font-mono ${
                                (data.enps.avgScore ?? 0) >= 8
                                    ? "text-emerald-700"
                                    : (data.enps.avgScore ?? 0) >= 6
                                    ? "text-blue-700"
                                    : "text-red-700"
                            }`}
                        >
                            {data.enps.avgScore ?? 0}
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                            / 10 (O'rtacha)
                        </span>
                    </div>
                    <div className="text-[10px] font-medium text-gray-500 border-t border-gray-100 pt-2 flex items-center justify-between">
                        <span>eNPS: <b className="text-black">{data.enps.score > 0 ? `+${data.enps.score}` : data.enps.score}</b> ({data.enps.promotersPct}% / {data.enps.detractorsPct}%)</span>
                        <span className="font-bold text-black">{data.enps.totalResponses} nafar</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-black p-5 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Iste'dodlar (High Potentials)
                        </span>
                        <span className="text-lg">⭐</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-purple-700">
                            {data.nineBoxSummary.highPotentialCount}
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                            ({data.nineBoxSummary.highPotentialPct}%)
                        </span>
                    </div>
                    <div className="text-[10px] font-medium text-gray-500 border-t border-gray-100 pt-2 flex items-center justify-between">
                        <span>Xavf guruhi:</span>
                        <span className="font-bold text-rose-700">{data.nineBoxSummary.riskCount} nafar</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-black p-6 flex flex-col gap-4 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-wider text-black">
                                📈 Kadrlar Qo'nimsizligi Dinamikasi
                            </span>
                            <span className="text-[10px] font-medium text-gray-500">
                                Oxirgi 6 oylik qabul, ketish va turnover ko'rsatkichi
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-2">
                        <div className="grid grid-cols-6 gap-2 items-end h-44 border-b border-gray-300 pb-2">
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
                                                        : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                {t.turnoverRate}%
                                            </span>
                                        </div>
                                        <div className="w-full flex items-end justify-center gap-1 h-28">
                                            <div
                                                className="w-1/2 bg-emerald-600 hover:bg-emerald-700 transition-all flex items-end justify-center"
                                                style={{ height: `${t.hires > 0 ? hireHeight : 4}%` }}
                                                title={`Yangi qabul: ${t.hires} nafar`}
                                            >
                                                {t.hires > 0 && (
                                                    <span className="text-[8px] font-mono text-white font-bold pb-0.5 opacity-0 group-hover:opacity-100">
                                                        {t.hires}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                className="w-1/2 bg-rose-600 hover:bg-rose-700 transition-all flex items-end justify-center"
                                                style={{ height: `${t.exits > 0 ? exitHeight : 4}%` }}
                                                title={`Bo'shatilgan: ${t.exits} nafar`}
                                            >
                                                {t.exits > 0 && (
                                                    <span className="text-[8px] font-mono text-white font-bold pb-0.5 opacity-0 group-hover:opacity-100">
                                                        {t.exits}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-bold uppercase text-gray-600 truncate w-full text-center">
                                            {t.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-gray-600 gap-2">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 bg-emerald-600 inline-block rounded-xs" />
                                    <span>Qabul</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 bg-rose-600 inline-block rounded-xs" />
                                    <span>Ketish</span>
                                </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-black">
                                Yillik O'rtacha: {data.turnover.turnoverRate}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-2 border-black p-6 flex flex-col gap-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-wider text-black">
                                💬 eNPS Qoniqish Tuzilmasi
                            </span>
                            <span className="text-[10px] font-medium text-gray-500">
                                Xodimlarning kompaniyaga sodiqlik va tavsiya qilish darajasi
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-black text-black">
                                O'rtacha: {data.enps.avgScore ?? 0}/10 &bull; eNPS: {data.enps.score > 0 ? `+${data.enps.score}` : data.enps.score}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsQuestionModalOpen(true)}
                                className="px-3 py-1.5 bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                                <span>⚙️</span>
                                <span>Savollarni Boshqarish</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 pt-2">
                        <div className="flex flex-col gap-1.5">
                            <div className="w-full h-7 bg-gray-200 flex overflow-hidden border border-gray-300">
                                <div
                                    className="bg-emerald-600 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                                    style={{ width: `${data.enps.promotersPct}%` }}
                                    title={`Promoters: ${data.enps.promotersPct}%`}
                                >
                                    {data.enps.promotersPct > 10 ? `${data.enps.promotersPct}%` : ""}
                                </div>
                                <div
                                    className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                                    style={{ width: `${data.enps.passivesPct}%` }}
                                    title={`Passives: ${data.enps.passivesPct}%`}
                                >
                                    {data.enps.passivesPct > 10 ? `${data.enps.passivesPct}%` : ""}
                                </div>
                                <div
                                    className="bg-rose-600 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                                    style={{ width: `${data.enps.detractorsPct}%` }}
                                    title={`Detractors: ${data.enps.detractorsPct}%`}
                                >
                                    {data.enps.detractorsPct > 10 ? `${data.enps.detractorsPct}%` : ""}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-3 bg-emerald-50 border border-emerald-200 flex flex-col">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase">
                                    Promoters (9-10)
                                </span>
                                <span className="text-xl font-black font-mono text-emerald-900 mt-1">
                                    {data.enps.promotersPct}%
                                </span>
                                <span className="text-[9px] text-gray-500">
                                    {data.enps.promotersCount} nafar xodim
                                </span>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 flex flex-col">
                                <span className="text-[10px] font-bold text-amber-800 uppercase">
                                    Passives (7-8)
                                </span>
                                <span className="text-xl font-black font-mono text-amber-900 mt-1">
                                    {data.enps.passivesPct}%
                                </span>
                                <span className="text-[9px] text-gray-500">
                                    {data.enps.passivesCount} nafar xodim
                                </span>
                            </div>

                            <div className="p-3 bg-rose-50 border border-rose-200 flex flex-col">
                                <span className="text-[10px] font-bold text-rose-800 uppercase">
                                    Detractors (0-6)
                                </span>
                                <span className="text-xl font-black font-mono text-rose-900 mt-1">
                                    {data.enps.detractorsPct}%
                                </span>
                                <span className="text-[9px] text-gray-500">
                                    {data.enps.detractorsCount} nafar xodim
                                </span>
                            </div>
                        </div>

                        {data.enps.recentResponses && data.enps.recentResponses.length > 0 && (
                            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 flex items-center justify-between">
                                    <span>Xodimlar Baholari va Izohlari ({data.enps.recentResponses.length})</span>
                                </span>
                                <div className="max-h-48 overflow-y-auto flex flex-col gap-2 pr-1">
                                    {data.enps.recentResponses.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-2.5 bg-gray-50 border border-gray-200 flex flex-col gap-1 text-xs"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`px-1.5 py-0.5 text-[10px] font-mono font-black ${
                                                            item.score >= 9
                                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                                : item.score >= 7
                                                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                                                : "bg-rose-100 text-rose-800 border border-rose-300"
                                                        }`}
                                                    >
                                                        ⭐ {item.score}/10
                                                    </span>
                                                    <span className="font-bold text-black">{item.employeeName}</span>
                                                    <span className="text-[10px] text-gray-500">
                                                        ({item.department} - {item.position})
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-mono">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {item.comment && (
                                                <p className="text-[11px] text-gray-700 italic bg-white p-1.5 border border-gray-100">
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

            <div className="bg-white border-2 border-black p-6 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-black">
                            🏢 Bo'limlar Kesimidagi Metrikalar
                        </h3>
                        <p className="text-xs font-medium text-gray-500">
                            Har bir departament bo'yicha xodimlar soni, OKR ijrosi va turnover darajasi
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="p-3 font-black uppercase text-gray-700">Bo'lim Nomi</th>
                                <th className="p-3 font-black uppercase text-gray-700">Xodimlar Soni</th>
                                <th className="p-3 font-black uppercase text-gray-700">Kompaniya Ulushi</th>
                                <th className="p-3 font-black uppercase text-gray-700">O'rtacha OKR</th>
                                <th className="p-3 font-black uppercase text-gray-700">Turnover Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.departmentAnalytics.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">
                                        Bo'limlar ma'lumotlari mavjud emas
                                    </td>
                                </tr>
                            ) : (
                                data.departmentAnalytics.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-bold text-black">{dept.name}</td>
                                        <td className="p-3 font-mono font-bold text-gray-800">
                                            {dept.headcount} nafar
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-black"
                                                        style={{ width: `${dept.headcountPercentage}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-gray-600">{dept.headcountPercentage}%</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`font-mono font-bold ${
                                                    dept.avgOkr >= 75
                                                        ? "text-emerald-700"
                                                        : dept.avgOkr >= 50
                                                        ? "text-blue-700"
                                                        : "text-amber-700"
                                                }`}
                                            >
                                                {dept.avgOkr}%
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`font-mono font-bold ${
                                                    dept.turnoverRate > 15
                                                        ? "text-red-700"
                                                        : dept.turnoverRate > 8
                                                        ? "text-amber-700"
                                                        : "text-emerald-700"
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
