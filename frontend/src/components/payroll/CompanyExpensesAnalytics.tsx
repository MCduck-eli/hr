"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchCompanyExpensesAnalytics } from "@/src/services/payroll-service";

export default function CompanyExpensesAnalytics() {
    const t = useTranslations("Payroll");
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(currentDate.getMonth() + 1);
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [selectedDrilldownMonth, setSelectedDrilldownMonth] = useState<any | null>(null);
    const [isDrilldownModalOpen, setIsDrilldownModalOpen] = useState(false);

    const loadAnalytics = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetchCompanyExpensesAnalytics({ year: selectedYear });
            setData(res);
            if (res?.monthlyAnalytics && res.monthlyAnalytics.length > 0) {
                const curMonth = res.monthlyAnalytics.find((m: any) => m.month === selectedMonthIndex) || res.monthlyAnalytics[0];
                setSelectedDrilldownMonth(curMonth);
            }
        } catch (err: any) {
            setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [selectedYear]);

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString("uz-UZ") + " UZS";
    };

    const handleSelectMonth = (monthItem: any) => {
        setSelectedMonthIndex(monthItem.month);
        setSelectedDrilldownMonth(monthItem);
        setIsDrilldownModalOpen(true);
    };

    const handleExportMonthPdf = (monthData: any) => {
        if (!monthData) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("Iltimos, brauzerda pop-up oynalarga ruxsat bering.");
            return;
        }

        const dateStr = new Date().toLocaleDateString("uz-UZ");
        const rowsHtml = (monthData.employeeList || []).map((emp: any, idx: number) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.department || "-"}</td>
                <td>${emp.position || "-"}</td>
                <td style="text-align: right;">${Number(emp.baseSalary || 0).toLocaleString()} UZS</td>
                <td style="text-align: right; color: #047857;">+${Number(emp.bonus || 0).toLocaleString()} UZS</td>
                <td style="text-align: right; color: #b91c1c;">-${Number(emp.deductions || 0).toLocaleString()} UZS</td>
                <td style="text-align: right; color: #4338ca;">${Number(emp.advances || 0).toLocaleString()} UZS</td>
                <td style="text-align: right; font-weight: bold; color: #111827;">${Number(emp.totalExpense || 0).toLocaleString()} UZS</td>
            </tr>
        `).join("");

        const deptRowsHtml = (monthData.departmentBreakdown || []).map((dept: any) => `
            <tr>
                <td><strong>${dept.departmentName}</strong></td>
                <td style="text-align: center;">${dept.employeesCount} ta xodim</td>
                <td style="text-align: right; font-weight: bold;">${Number(dept.totalExpense || 0).toLocaleString()} UZS</td>
                <td style="text-align: center; font-weight: bold; color: #4338ca;">${dept.percentage}%</td>
            </tr>
        `).join("");

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="uz">
            <head>
                <meta charset="UTF-8">
                <title>${data?.companyName || "Kompaniya"} - ${monthData.monthName} ${selectedYear} Xarajatlar Tahlili</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 24px; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 20px; }
                    .title { font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 0.02em; }
                    .subtitle { font-size: 12px; color: #4b5563; margin: 0; }
                    .meta { text-align: right; font-size: 11px; color: #4b5563; }
                    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
                    .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 4px; }
                    .stat-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #6b7280; }
                    .stat-value { font-size: 15px; font-weight: 900; color: #111827; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
                    th { background: #f3f4f6; color: #374151; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 8px 10px; text-align: left; border-bottom: 2px solid #d1d5db; }
                    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
                    .section-title { font-size: 13px; font-weight: 900; text-transform: uppercase; margin: 20px 0 10px 0; border-left: 3px solid #111827; padding-left: 8px; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db; font-size: 11px; page-break-inside: avoid; }
                    .sign-line { width: 180px; border-bottom: 1px solid #000; margin-top: 25px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 class="title">${data?.companyName || "Kompaniya"} — Moliyaviy Xarajatlar Tahlili</h1>
                        <p class="subtitle">${monthData.monthName} ${selectedYear} oylik hisoboti va taqsimoti</p>
                    </div>
                    <div class="meta">
                        <div><strong>Hujjat sanasi:</strong> ${dateStr}</div>
                        <div><strong>Kompaniya:</strong> ${data?.companyName || "-"}</div>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Jami Oylik Xarajat</div>
                        <div class="stat-value" style="color: #b91c1c;">${Number(monthData.totalExpense || 0).toLocaleString()} UZS</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Asosiy Oyliklar (${monthData.percentages?.baseSalary || 0}%)</div>
                        <div class="stat-value">${Number(monthData.baseSalary || 0).toLocaleString()} UZS</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Bonus va Mukofotlar (${monthData.percentages?.bonuses || 0}%)</div>
                        <div class="stat-value" style="color: #047857;">+${Number(monthData.bonuses || 0).toLocaleString()} UZS</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Berilgan Avanslar (${monthData.percentages?.advances || 0}%)</div>
                        <div class="stat-value" style="color: #4338ca;">${Number(monthData.advances || 0).toLocaleString()} UZS</div>
                    </div>
                </div>

                <div class="section-title">1. Bo'limlar Kesimida Xarajatlar Taqsimoti</div>
                <table>
                    <thead>
                        <tr>
                            <th>Bo'lim nomi</th>
                            <th style="text-align: center;">Xodimlar soni</th>
                            <th style="text-align: right;">Jami xarajat summasi</th>
                            <th style="text-align: center;">Ushbu oydagi ulushi (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${deptRowsHtml || '<tr><td colspan="4" style="text-align: center;">Bo\'limlar ma\'lumoti yo\'q</td></tr>'}
                    </tbody>
                </table>

                <div class="section-title">2. Xodimlar Kesimida Oylik Xarajatlar Tafsilotlari</div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center; width: 25px;">№</th>
                            <th>Xodim (F.I.SH)</th>
                            <th>Bo'lim</th>
                            <th>Lavozim</th>
                            <th style="text-align: right;">Asosiy oylik</th>
                            <th style="text-align: right;">Bonus</th>
                            <th style="text-align: right;">Ushlanma</th>
                            <th style="text-align: right;">Avans</th>
                            <th style="text-align: right;">Jami Xarajat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="9" style="text-align: center;">Xodimlar ma\'lumoti yo\'q</td></tr>'}
                    </tbody>
                </table>

                <div class="signatures">
                    <div>
                        <div><strong>Bosh Direktor:</strong></div>
                        <div class="sign-line"></div>
                        <div style="font-size: 9px; color: #6b7280; margin-top: 4px;">(imzo / F.I.SH)</div>
                    </div>
                    <div>
                        <div><strong>Bosh Buxgalter / Moliya rahbari:</strong></div>
                        <div class="sign-line"></div>
                        <div style="font-size: 9px; color: #6b7280; margin-top: 4px;">(imzo / F.I.SH)</div>
                    </div>
                    <div>
                        <div><strong>M.O'.:</strong></div>
                        <div style="width: 60px; height: 60px; border: 1px dashed #9ca3af; border-radius: 50%; margin-top: 6px;"></div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 250);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-xs font-bold uppercase tracking-wider text-gray-400 bg-white border border-gray-200">
                Kompaniya moliyaviy tahlil ma'lumotlari yuklanmoqda...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {error}
                <button
                    onClick={loadAnalytics}
                    className="ml-3 underline uppercase cursor-pointer"
                >
                    Qayta urinish
                </button>
            </div>
        );
    }

    const monthlyList = data?.monthlyAnalytics || [];
    const maxBarValue = Math.max(...monthlyList.map((m: any) => m.totalExpense || 0), 1);
    const activeDrillMonth = selectedDrilldownMonth || monthlyList.find((m: any) => m.month === selectedMonthIndex) || monthlyList[0];

    const filteredEmployeeList = (activeDrillMonth?.employeeList || []).filter((emp: any) => {
        if (!employeeSearch.trim()) return true;
        const q = employeeSearch.toLowerCase();
        return (
            emp.name.toLowerCase().includes(q) ||
            (emp.email || "").toLowerCase().includes(q) ||
            (emp.department || "").toLowerCase().includes(q) ||
            (emp.position || "").toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex flex-col gap-8 w-full animate-in fade-in duration-150">
            {/* Top Controls & Company Isolation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                            <span>📊</span> Kompaniya Xarajatlari & Moliya Tahlili
                        </h2>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-bold rounded-xs uppercase tracking-wider">
                            🔒 {data?.companyName || "Aktiv Kompaniya"}
                        </span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">
                        Oylik va yillik xarajatlar dinamikasi, taqsimot foizlari va eng yuqori/past xarajat oylari tahlili
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-300 p-1">
                        <span className="text-[11px] font-bold uppercase text-gray-500 px-2">Yil:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="text-xs font-bold uppercase p-1.5 bg-transparent focus:outline-none cursor-pointer border-l border-gray-200"
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>
                                    {y} Yil
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={loadAnalytics}
                        className="px-3.5 py-2 bg-white text-black border border-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    >
                        <span>🔄</span> Yangilash
                    </button>

                    <button
                        onClick={() => handleExportMonthPdf(activeDrillMonth)}
                        className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                    >
                        <span>🖨️</span> {activeDrillMonth?.monthName} Hisoboti (PDF)
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards (Max & Min Highlights) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Annual Cost */}
                <div className="bg-white border border-gray-200 p-5 flex flex-col justify-between shadow-xs hover:border-black transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Yillik Jami Xarajat ({selectedYear})
                        </span>
                        <span className="text-xl">💳</span>
                    </div>
                    <div className="my-3">
                        <span className="text-2xl font-black text-black tracking-tight">
                            {formatMoney(data?.yearlyTotalExpense || 0)}
                        </span>
                    </div>
                    <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
                        <span>O'rtacha oylik:</span>
                        <span className="font-bold text-gray-800">{formatMoney(data?.averageMonthlyExpense || 0)}</span>
                    </div>
                </div>

                {/* Monthly Average */}
                <div className="bg-white border border-gray-200 p-5 flex flex-col justify-between shadow-xs hover:border-black transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Oylik O'rtacha Xarajat
                        </span>
                        <span className="text-xl">📈</span>
                    </div>
                    <div className="my-3">
                        <span className="text-2xl font-black text-indigo-950 tracking-tight">
                            {formatMoney(data?.averageMonthlyExpense || 0)}
                        </span>
                    </div>
                    <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
                        <span>Xodimlar soni:</span>
                        <span className="font-bold text-gray-800">{data?.totalEmployeesCount || 0} ta</span>
                    </div>
                </div>

                {/* Max Expense Month Card */}
                <div
                    onClick={() => {
                        const m = monthlyList.find((x: any) => x.month === data?.maxExpenseMonth?.month);
                        if (m) handleSelectMonth(m);
                    }}
                    className="bg-rose-50/70 border-2 border-rose-300 p-5 flex flex-col justify-between shadow-xs hover:border-rose-600 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                            <span>🔴</span> Eng Ko'p Xarajat Bo'lgan Oy
                        </span>
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded">
                            {data?.maxExpenseMonth?.monthName || "-"}
                        </span>
                    </div>
                    <div className="my-3">
                        <span className="text-2xl font-black text-rose-900 tracking-tight">
                            {formatMoney(data?.maxExpenseMonth?.totalExpense || 0)}
                        </span>
                    </div>
                    <div className="text-[11px] font-bold text-rose-700 flex items-center justify-between border-t border-rose-200 pt-2">
                        <span>Yillik ulushi: {data?.maxExpenseMonth?.percentageOfYear || 0}%</span>
                        <span className="group-hover:translate-x-1 transition-transform">Tafsilotlar &rarr;</span>
                    </div>
                </div>

                {/* Min Expense Month Card */}
                <div
                    onClick={() => {
                        const m = monthlyList.find((x: any) => x.month === data?.minExpenseMonth?.month);
                        if (m) handleSelectMonth(m);
                    }}
                    className="bg-emerald-50/70 border-2 border-emerald-300 p-5 flex flex-col justify-between shadow-xs hover:border-emerald-600 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                            <span>🟢</span> Eng Kam Xarajat Bo'lgan Oy
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded">
                            {data?.minExpenseMonth?.monthName || "-"}
                        </span>
                    </div>
                    <div className="my-3">
                        <span className="text-2xl font-black text-emerald-950 tracking-tight">
                            {formatMoney(data?.minExpenseMonth?.totalExpense || 0)}
                        </span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-between border-t border-emerald-200 pt-2">
                        <span>Yillik ulushi: {data?.minExpenseMonth?.percentageOfYear || 0}%</span>
                        <span className="group-hover:translate-x-1 transition-transform">Tafsilotlar &rarr;</span>
                    </div>
                </div>
            </div>

            {/* Interactive Visual Bar Diagram Section */}
            <div className="bg-white border border-gray-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4 mb-6">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                            <span>📈</span> {selectedYear} Yil Oylik Xarajatlar Diagrammasi
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Ixtiyoriy oy ustuniga bosib, o'sha oyning foiz taqsimoti va xodimlar kesimini ko'rishingiz mumkin
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-rose-600 inline-block rounded-xs"></span>
                            <span className="text-gray-600">Eng ko'p xarajat</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-emerald-600 inline-block rounded-xs"></span>
                            <span className="text-gray-600">Eng kam xarajat</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-indigo-900 inline-block rounded-xs"></span>
                            <span className="text-gray-600">Tanlangan oy</span>
                        </div>
                    </div>
                </div>

                {/* 12 Months Histogram Diagram */}
                <div className="grid grid-cols-12 gap-2 sm:gap-3 items-end pt-12 pb-2 h-64 border-b border-gray-200 px-2">
                    {monthlyList.map((mItem: any) => {
                        const isMax = data?.maxExpenseMonth?.month === mItem.month;
                        const isMin = data?.minExpenseMonth?.month === mItem.month;
                        const isSelected = activeDrillMonth?.month === mItem.month;
                        const heightPct = maxBarValue > 0 ? Math.max(8, Math.round((mItem.totalExpense / maxBarValue) * 100)) : 8;

                        let barColor = "bg-gray-200 hover:bg-gray-300";
                        if (isSelected) {
                            barColor = "bg-black";
                        } else if (isMax) {
                            barColor = "bg-rose-500 hover:bg-rose-600";
                        } else if (isMin) {
                            barColor = "bg-emerald-500 hover:bg-emerald-600";
                        } else if (mItem.totalExpense > 0) {
                            barColor = "bg-blue-600/80 hover:bg-blue-700";
                        }

                        return (
                            <div
                                key={mItem.month}
                                onClick={() => handleSelectMonth(mItem)}
                                className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                            >
                                {/* Tooltip on Hover */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-black text-white text-[10px] font-bold py-1 px-2 whitespace-nowrap shadow-lg rounded">
                                    <div>{mItem.monthName}: {formatMoney(mItem.totalExpense)}</div>
                                    <div className="text-[9px] text-gray-300">Bosish orqali ochish</div>
                                </div>

                                {isMax && (
                                    <span className="text-[9px] font-black text-rose-700 uppercase tracking-tighter mb-1 hidden sm:block">
                                        MAX
                                    </span>
                                )}
                                {isMin && (
                                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter mb-1 hidden sm:block">
                                        MIN
                                    </span>
                                )}

                                <div className="w-full bg-gray-100 rounded-t-xs relative flex items-end h-full">
                                    <div
                                        style={{ height: `${heightPct}%` }}
                                        className={`w-full rounded-t-xs transition-all duration-300 ${barColor}`}
                                    ></div>
                                </div>

                                <div className="mt-2 text-center">
                                    <div className={`text-[10px] font-black uppercase truncate ${isSelected ? "text-black underline font-black" : "text-gray-600"}`}>
                                        {mItem.monthName.slice(0, 3)}
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-semibold hidden md:block">
                                        {mItem.totalExpense > 0 ? `${Math.round(mItem.totalExpense / 1000000)}M` : "0"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Active Selected Month Drilldown Section (O'sha oyga bosganda chiqadigan batafsil taqsimot) */}
            {activeDrillMonth && (
                <div className="bg-white border-2 border-black p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔍</span>
                                <h3 className="text-base font-black uppercase tracking-wider text-black">
                                    {activeDrillMonth.monthName} {selectedYear} — Xarajatlarining Foizli Taqsimoti
                                </h3>
                                {data?.maxExpenseMonth?.month === activeDrillMonth.month && (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold rounded uppercase">
                                        🔴 Eng ko'p xarajatli oy
                                    </span>
                                )}
                                {data?.minExpenseMonth?.month === activeDrillMonth.month && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded uppercase">
                                        🟢 Eng kam xarajatli oy
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 font-semibold mt-1">
                                Ushbu oyda qaysi toifalarga va qaysi bo'limlarga qancha foizda mablag' ajratilganligi
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="text-[10px] font-bold uppercase text-gray-400">Jami Oylik Xarajat</div>
                            <div className="text-xl font-black text-rose-600">
                                {formatMoney(activeDrillMonth.totalExpense)}
                            </div>
                        </div>
                    </div>

                    {/* Category Percentage Breakdown (Foizlar bo'yicha) */}
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-gray-700 mb-3">
                            1. Xarajat Turlari Bo'yicha Foizlar Taqsimoti
                        </div>

                        {/* Visual Proportion Bar */}
                        <div className="h-5 w-full bg-gray-100 rounded flex overflow-hidden border border-gray-200 mb-4">
                            <div
                                style={{ width: `${activeDrillMonth.percentages?.baseSalary || 0}%` }}
                                title={`Asosiy ish haqi: ${activeDrillMonth.percentages?.baseSalary || 0}%`}
                                className="bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                            >
                                {activeDrillMonth.percentages?.baseSalary > 15 ? `${activeDrillMonth.percentages?.baseSalary}%` : ""}
                            </div>
                            <div
                                style={{ width: `${activeDrillMonth.percentages?.bonuses || 0}%` }}
                                title={`Bonuslar: ${activeDrillMonth.percentages?.bonuses || 0}%`}
                                className="bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                            >
                                {activeDrillMonth.percentages?.bonuses > 10 ? `${activeDrillMonth.percentages?.bonuses}%` : ""}
                            </div>
                            <div
                                style={{ width: `${activeDrillMonth.percentages?.advances || 0}%` }}
                                title={`Avanslar: ${activeDrillMonth.percentages?.advances || 0}%`}
                                className="bg-purple-600 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                            >
                                {activeDrillMonth.percentages?.advances > 10 ? `${activeDrillMonth.percentages?.advances}%` : ""}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-3 bg-blue-50/70 border border-blue-200">
                                <div className="text-[10px] font-bold uppercase text-blue-900 flex items-center justify-between">
                                    <span>💼 Asosiy Oyliklar</span>
                                    <span className="font-black text-sm">{activeDrillMonth.percentages?.baseSalary || 0}%</span>
                                </div>
                                <div className="text-sm font-black text-blue-950 mt-1">
                                    {formatMoney(activeDrillMonth.baseSalary)}
                                </div>
                            </div>

                            <div className="p-3 bg-emerald-50/70 border border-emerald-200">
                                <div className="text-[10px] font-bold uppercase text-emerald-900 flex items-center justify-between">
                                    <span>🎁 Bonus & Mukofotlar</span>
                                    <span className="font-black text-sm">{activeDrillMonth.percentages?.bonuses || 0}%</span>
                                </div>
                                <div className="text-sm font-black text-emerald-950 mt-1">
                                    +{formatMoney(activeDrillMonth.bonuses)}
                                </div>
                            </div>

                            <div className="p-3 bg-purple-50/70 border border-purple-200">
                                <div className="text-[10px] font-bold uppercase text-purple-900 flex items-center justify-between">
                                    <span>⚡ Berilgan Avanslar</span>
                                    <span className="font-black text-sm">{activeDrillMonth.percentages?.advances || 0}%</span>
                                </div>
                                <div className="text-sm font-black text-purple-950 mt-1">
                                    {formatMoney(activeDrillMonth.advances)}
                                </div>
                            </div>

                            <div className="p-3 bg-rose-50/70 border border-rose-200">
                                <div className="text-[10px] font-bold uppercase text-rose-900 flex items-center justify-between">
                                    <span>⚖️ Jarimalar & Ushlanmalar</span>
                                    <span className="font-black text-sm">{activeDrillMonth.percentages?.penalties || 0}%</span>
                                </div>
                                <div className="text-sm font-black text-rose-950 mt-1">
                                    -{formatMoney(activeDrillMonth.penalties || activeDrillMonth.deductions || 0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Distribution */}
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-gray-700 mb-3">
                            2. Bo'limlar Kesimida Taqsimot ({activeDrillMonth.departmentBreakdown?.length || 0} ta bo'lim)
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(activeDrillMonth.departmentBreakdown || []).map((dept: any, idx: number) => (
                                <div key={idx} className="p-3.5 bg-gray-50 border border-gray-200 flex flex-col justify-between gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-xs text-black">{dept.departmentName}</span>
                                        <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black rounded">
                                            {dept.percentage}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                                        <div
                                            style={{ width: `${dept.percentage}%` }}
                                            className="bg-black h-full"
                                        ></div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                                        <span>{dept.employeesCount} ta xodim</span>
                                        <span className="font-bold text-gray-900">{formatMoney(dept.totalExpense)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Itemized Employees Table */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="text-xs font-black uppercase tracking-wider text-gray-700">
                                3. Xodimlar Ro'yxati ({filteredEmployeeList.length} ta xodim)
                            </div>
                            <input
                                type="text"
                                placeholder="Xodim ismi, lavozimi yoki bo'limi bo'yicha qidirish..."
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                className="p-2 border border-gray-300 text-xs bg-white outline-none focus:border-black w-full sm:w-72"
                            />
                        </div>

                        <div className="overflow-x-auto border border-gray-200">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                        <th className="py-2.5 px-3 text-center w-10">№</th>
                                        <th className="py-2.5 px-3">Xodim</th>
                                        <th className="py-2.5 px-3">Bo'lim & Lavozim</th>
                                        <th className="py-2.5 px-3 text-right">Asosiy oylik</th>
                                        <th className="py-2.5 px-3 text-right">Bonus</th>
                                        <th className="py-2.5 px-3 text-right">Ushlanma</th>
                                        <th className="py-2.5 px-3 text-right">Avans</th>
                                        <th className="py-2.5 px-3 text-right">Jami Xarajat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEmployeeList.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-gray-400 font-semibold">
                                                Xodimlar bo'yicha yozuvlar topilmadi.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployeeList.map((emp: any, eIdx: number) => (
                                            <tr key={emp.employeeId || eIdx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-2.5 px-3 text-center text-gray-400 font-medium">
                                                    {eIdx + 1}
                                                </td>
                                                <td className="py-2.5 px-3 font-bold text-black">
                                                    <div>{emp.name}</div>
                                                    {emp.email && (
                                                        <div className="text-[10px] text-gray-400 font-normal">{emp.email}</div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-gray-600">
                                                    <div>{emp.department}</div>
                                                    <div className="text-[10px] text-gray-400">{emp.position}</div>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-medium text-gray-800">
                                                    {Number(emp.baseSalary || 0).toLocaleString()} UZS
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                                                    {emp.bonus > 0 ? `+${Number(emp.bonus).toLocaleString()} UZS` : "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                                                    {emp.deductions > 0 ? `-${Number(emp.deductions).toLocaleString()} UZS` : "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold text-purple-600">
                                                    {emp.advances > 0 ? `${Number(emp.advances).toLocaleString()} UZS` : "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-black text-black">
                                                    {formatMoney(emp.totalExpense)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete 12-Month Comparison Table */}
            <div className="bg-white border border-gray-200 p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                            <span>📋</span> {selectedYear} Yil — 12 Oylik Xarajatlar Taqqoslama Jadvali
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Har bir oyning to'liq xarajatlari, bonuslari, avanslari va yillik ulushi
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                <th className="py-3 px-3 text-center w-12">№</th>
                                <th className="py-3 px-4">Oy nomi</th>
                                <th className="py-3 px-4 text-right">Asosiy ish haqi</th>
                                <th className="py-3 px-4 text-right">Bonuslar</th>
                                <th className="py-3 px-4 text-right">Avanslar</th>
                                <th className="py-3 px-4 text-right">Jarimalar</th>
                                <th className="py-3 px-4 text-right">Jami Xarajat</th>
                                <th className="py-3 px-4 text-center">Yillik ulush</th>
                                <th className="py-3 px-4 text-center">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthlyList.map((m: any) => {
                                const isMax = data?.maxExpenseMonth?.month === m.month;
                                const isMin = data?.minExpenseMonth?.month === m.month;
                                const pctOfYear = data?.yearlyTotalExpense > 0
                                    ? Math.round((m.totalExpense / data.yearlyTotalExpense) * 1000) / 10
                                    : 0;

                                return (
                                    <tr key={m.month} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-3 text-center text-gray-400 font-bold">
                                            {m.month}
                                        </td>
                                        <td className="py-3 px-4 font-black text-black">
                                            <div className="flex items-center gap-2">
                                                <span>{m.monthName}</span>
                                                {isMax && (
                                                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-rose-100 text-rose-800 rounded">
                                                        MAX
                                                    </span>
                                                )}
                                                {isMin && (
                                                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 rounded">
                                                        MIN
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-700">
                                            {Number(m.baseSalary || 0).toLocaleString()} UZS
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                            {m.bonuses > 0 ? `+${Number(m.bonuses).toLocaleString()} UZS` : "-"}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-purple-600">
                                            {m.advances > 0 ? `${Number(m.advances).toLocaleString()} UZS` : "-"}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                                            {m.penalties > 0 ? `-${Number(m.penalties).toLocaleString()} UZS` : "-"}
                                        </td>
                                        <td className="py-3 px-4 text-right font-black text-black">
                                            {formatMoney(m.totalExpense)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 font-bold rounded text-[11px]">
                                                {pctOfYear}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => handleSelectMonth(m)}
                                                className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                                            >
                                                Tafsilotlar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
