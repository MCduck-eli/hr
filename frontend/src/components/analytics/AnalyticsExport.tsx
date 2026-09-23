"use client";

import { useState } from "react";
import { ExecutiveSummaryResponse } from "@/src/services/analytics-service";

interface AnalyticsExportProps {
    data: ExecutiveSummaryResponse;
}

export default function AnalyticsExport({ data }: AnalyticsExportProps) {
    const [exporting, setExporting] = useState(false);

    const exportToExcel = () => {
        setExporting(true);
        try {
            const rows: string[][] = [];

            rows.push(["KOMPANIYA HR ANALITIKASI HISOBOTI"]);
            rows.push(["Kompaniya:", data.companyName]);
            rows.push(["Sana:", new Date().toLocaleDateString("uz-UZ")]);
            rows.push([]);

            rows.push(["ASOSIY KO'RSATKICHLAR (EXECUTIVE KPIS)"]);
            rows.push(["Ko'rsatkich", "Qiymat"]);
            rows.push(["Jami faol xodimlar soni", String(data.headcount.totalActive)]);
            rows.push(["Yil boshidan yangi olinganlar", String(data.headcount.newHiresYear)]);
            rows.push(["Yil boshidan bo'shatilganlar", String(data.headcount.terminationsYear)]);
            rows.push(["O'rtacha ish staji (oy)", String(data.headcount.avgTenureMonths)]);
            rows.push(["Turnover Rate (Qo'nimsizlik)", `${data.turnover.turnoverRate}%`]);
            rows.push(["Retention Rate (Saqlab qolish)", `${data.turnover.retentionRate}%`]);
            rows.push(["eNPS Bali", String(data.enps.score)]);
            rows.push(["eNPS Promoters (%)", `${data.enps.promotersPct}%`]);
            rows.push(["eNPS Detractors (%)", `${data.enps.detractorsPct}%`]);
            rows.push([]);

            rows.push(["OYLIK TURNOVER VA BANDLIK TRENDI"]);
            rows.push(["Oy", "Yangi Qabul", "Bo'shatilgan", "Turnover Rate (%)", "Retention Rate (%)"]);
            for (const t of data.turnover.trend) {
                rows.push([t.month, String(t.hires), String(t.exits), `${t.turnoverRate}%`, `${t.retentionRate}%`]);
            }
            rows.push([]);

            rows.push(["BO'LIMLAR KESIMIDAGI TAHLIL"]);
            rows.push(["Bo'lim Nomi", "Xodimlar Soni", "Ulashuv (%)", "O'rtacha OKR (%)", "Turnover Rate (%)"]);
            for (const d of data.departmentAnalytics) {
                rows.push([d.name, String(d.headcount), `${d.headcountPercentage}%`, `${d.avgOkr}%`, `${d.turnoverRate}%`]);
            }
            rows.push([]);

            rows.push(["9-BOX GRID (NATIJA VA SALOHIYAT TAHLILI)"]);
            rows.push(["Toifa", "Xodimlar Soni", "Ulashuv (%)", "Tavsif"]);
            for (const b of data.nineBoxMatrix) {
                rows.push([b.title, String(b.count), `${b.percentage}%`, b.description]);
            }
            rows.push([]);

            rows.push(["9-BOX XODIMLAR RO'YXATI"]);
            rows.push(["Xodim", "Bo'lim", "Lavozim", "Grade", "OKR Ball (%)", "Salohiyat Bali", "9-Box Toifasi"]);
            for (const b of data.nineBoxMatrix) {
                for (const emp of b.employees) {
                    rows.push([
                        `${emp.firstName} ${emp.lastName}`,
                        emp.department,
                        emp.position,
                        emp.grade,
                        `${emp.okrScore}%`,
                        String(emp.potentialScore),
                        b.title,
                    ]);
                }
            }

            const csvContent =
                "\uFEFF" +
                rows
                    .map((e) =>
                        e
                            .map((field) => `"${String(field || "").replace(/"/g, '""')}"`)
                            .join(","),
                    )
                    .join("\r\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute(
                "download",
                `Executive_HR_Analytics_${data.companyName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error(err);
        } finally {
            setExporting(false);
        }
    };

    const handlePrintPdf = () => {
        window.print();
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={exportToExcel}
                disabled={exporting}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{exporting ? "Eksport..." : "Excel (CSV)"}</span>
            </button>

            <button
                type="button"
                onClick={handlePrintPdf}
                className="px-3.5 py-2.5 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>PDF Chop Etish</span>
            </button>
        </div>
    );
}
