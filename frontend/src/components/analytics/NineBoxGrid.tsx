"use client";

import { useState } from "react";
import { NineBoxMatrixCell, NineBoxEmployee } from "@/src/services/analytics-service";

interface NineBoxGridProps {
    matrix: NineBoxMatrixCell[];
    selectedDepartment?: string;
}

export default function NineBoxGrid({ matrix }: NineBoxGridProps) {
    const [selectedCell, setSelectedCell] = useState<NineBoxMatrixCell | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const gridRows = [3, 2, 1];
    const gridCols = [1, 2, 3];

    const getCell = (row: number, col: number) => {
        return matrix.find((c) => c.row === row && c.col === col) || {
            key: `${row}_${col}`,
            row,
            col,
            title: "Cell",
            category: "",
            color: "gray",
            description: "",
            count: 0,
            percentage: 0,
            employees: [],
        };
    };

    const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string; hover: string }> = {
        emerald: {
            bg: "bg-emerald-50/80",
            border: "border-emerald-500",
            text: "text-emerald-900",
            badge: "bg-emerald-600 text-white",
            hover: "hover:bg-emerald-100/90",
        },
        blue: {
            bg: "bg-blue-50/80",
            border: "border-blue-500",
            text: "text-blue-900",
            badge: "bg-blue-600 text-white",
            hover: "hover:bg-blue-100/90",
        },
        sky: {
            bg: "bg-sky-50/80",
            border: "border-sky-400",
            text: "text-sky-900",
            badge: "bg-sky-600 text-white",
            hover: "hover:bg-sky-100/90",
        },
        teal: {
            bg: "bg-teal-50/80",
            border: "border-teal-500",
            text: "text-teal-900",
            badge: "bg-teal-600 text-white",
            hover: "hover:bg-teal-100/90",
        },
        indigo: {
            bg: "bg-indigo-50/80",
            border: "border-indigo-400",
            text: "text-indigo-900",
            badge: "bg-indigo-600 text-white",
            hover: "hover:bg-indigo-100/90",
        },
        slate: {
            bg: "bg-slate-50/80",
            border: "border-slate-400",
            text: "text-slate-900",
            badge: "bg-slate-600 text-white",
            hover: "hover:bg-slate-100/90",
        },
        purple: {
            bg: "bg-purple-50/80",
            border: "border-purple-400",
            text: "text-purple-900",
            badge: "bg-purple-600 text-white",
            hover: "hover:bg-purple-100/90",
        },
        amber: {
            bg: "bg-amber-50/80",
            border: "border-amber-400",
            text: "text-amber-900",
            badge: "bg-amber-600 text-white",
            hover: "hover:bg-amber-100/90",
        },
        rose: {
            bg: "bg-rose-50/80",
            border: "border-rose-400",
            text: "text-rose-900",
            badge: "bg-rose-600 text-white",
            hover: "hover:bg-rose-100/90",
        },
        gray: {
            bg: "bg-gray-50",
            border: "border-gray-300",
            text: "text-gray-900",
            badge: "bg-gray-600 text-white",
            hover: "hover:bg-gray-100",
        },
    };

    const rowLabels: Record<number, { title: string; subtitle: string }> = {
        3: { title: "YUQORI SALOHIYAT", subtitle: "High Potential" },
        2: { title: "O'RTACHA SALOHIYAT", subtitle: "Medium Potential" },
        1: { title: "PAST SALOHIYAT", subtitle: "Low Potential" },
    };

    const colLabels: Record<number, { title: string; subtitle: string }> = {
        1: { title: "PAST NATIJA", subtitle: "Low Performance" },
        2: { title: "O'RTACHA NATIJA", subtitle: "Medium Performance" },
        3: { title: "YUQORI NATIJA", subtitle: "High Performance" },
    };

    const filteredEmployees = selectedCell?.employees.filter((emp) => {
        const full = `${emp.firstName} ${emp.lastName} ${emp.department} ${emp.position}`.toLowerCase();
        return full.includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
                        <span>🎯</span> 9-Box Grid (Natija vs Salohiyat Matritsasi)
                    </h3>
                    <p className="text-xs font-medium text-gray-500">
                        Xodimlarning joriy OKR ko'rsatkichlari (Performance) va rivojlanish salohiyati (Potential) tahlili
                    </p>
                </div>
            </div>

            <div className="relative border-2 border-black bg-white p-4 md:p-6 shadow-xs overflow-x-auto">
                <div className="min-w-[700px] flex flex-col gap-3">
                    <div className="grid grid-cols-[140px_1fr_1fr_1fr] gap-3">
                        <div className="flex items-end justify-center pb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Salohiyat \ Natija
                            </span>
                        </div>
                        {gridCols.map((col) => (
                            <div
                                key={`col-header-${col}`}
                                className="bg-gray-100 border border-gray-300 p-2 text-center flex flex-col"
                            >
                                <span className="text-[11px] font-black uppercase tracking-wider text-black">
                                    {colLabels[col].title}
                                </span>
                                <span className="text-[9px] font-medium text-gray-500">
                                    {colLabels[col].subtitle}
                                </span>
                            </div>
                        ))}
                    </div>

                    {gridRows.map((row) => (
                        <div
                            key={`row-${row}`}
                            className="grid grid-cols-[140px_1fr_1fr_1fr] gap-3 items-stretch"
                        >
                            <div className="bg-gray-100 border border-gray-300 p-3 flex flex-col justify-center text-right pr-3">
                                <span className="text-[11px] font-black uppercase tracking-wider text-black">
                                    {rowLabels[row].title}
                                </span>
                                <span className="text-[9px] font-medium text-gray-500">
                                    {rowLabels[row].subtitle}
                                </span>
                            </div>

                            {gridCols.map((col) => {
                                const cell = getCell(row, col);
                                const theme = colorClasses[cell.color] || colorClasses.gray;
                                const isSelected = selectedCell?.key === cell.key;

                                return (
                                    <div
                                        key={`cell-${row}-${col}`}
                                        onClick={() => setSelectedCell(cell)}
                                        className={`p-3.5 border-2 ${theme.border} ${theme.bg} ${theme.hover} transition-all cursor-pointer flex flex-col justify-between gap-3 min-h-[125px] shadow-xs relative ${
                                            isSelected ? "ring-2 ring-black ring-offset-1" : ""
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-1">
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-black uppercase tracking-tight ${theme.text}`}>
                                                    {cell.title}
                                                </span>
                                                <span className="text-[10px] font-medium text-gray-600 line-clamp-1">
                                                    {cell.description}
                                                </span>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 text-[10px] font-black rounded-full ${theme.badge}`}
                                            >
                                                {cell.count}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-black/10">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                                                Ulashuv
                                            </span>
                                            <span className="text-xs font-mono font-black text-black">
                                                {cell.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {selectedCell && (
                <div className="border-2 border-black bg-white p-5 flex flex-col gap-4 shadow-sm animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📋</span>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight text-black flex items-center gap-2">
                                    <span>{selectedCell.title}</span>
                                    <span className="px-2 py-0.5 text-[10px] font-black bg-black text-white rounded-xs">
                                        {selectedCell.count} ta xodim ({selectedCell.percentage}%)
                                    </span>
                                </h4>
                                <p className="text-xs font-medium text-gray-500">
                                    {selectedCell.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Xodim ismi yoki bo'lim..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black w-48 sm:w-64"
                            />
                            <button
                                onClick={() => setSelectedCell(null)}
                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-xs font-bold uppercase tracking-wider text-black transition-colors"
                            >
                                Yopish ✕
                            </button>
                        </div>
                    </div>

                    {filteredEmployees && filteredEmployees.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Bu toifada xodimlar topilmadi
                            </span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredEmployees?.map((emp: NineBoxEmployee) => (
                                <div
                                    key={emp.id}
                                    className="p-3 bg-gray-50 border border-gray-200 flex flex-col justify-between gap-2 hover:border-black transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-xs font-black text-black block">
                                                {emp.firstName} {emp.lastName}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-600 block">
                                                {emp.department} • {emp.position}
                                            </span>
                                        </div>
                                        <span className="px-1.5 py-0.5 bg-gray-200 border border-gray-300 text-[9px] font-mono font-bold text-gray-800">
                                            {emp.grade}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-1 pt-2 border-t border-gray-200 text-center">
                                        <div className="bg-white p-1 border border-gray-200">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase block">OKR</span>
                                            <span className="text-[11px] font-black text-black">{emp.okrScore}%</span>
                                        </div>
                                        <div className="bg-white p-1 border border-gray-200">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase block">Kurslar</span>
                                            <span className="text-[11px] font-black text-blue-700">{emp.completedCourses || 0}</span>
                                        </div>
                                        <div className="bg-white p-1 border border-gray-200">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase block">Salohiyat</span>
                                            <span className="text-[11px] font-black text-emerald-700">{emp.potentialScore}</span>
                                        </div>
                                        <div className="bg-white p-1 border border-gray-200">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase block">DISC</span>
                                            <span className="text-[11px] font-black text-purple-700">{emp.discType}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
