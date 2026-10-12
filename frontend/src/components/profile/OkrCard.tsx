"use client";

import React from "react";

function CircularProgress({ value, size = 48, strokeWidth = 4, color = "#9327FF" }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-100"
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                    fill="transparent"
                />
            </svg>
            <span className="absolute text-[11px] font-bold text-slate-800">{Math.round(value)}%</span>
        </div>
    );
}

interface OkrCardProps {
    okr: any;
    onOpenCheckIn: (kr: any) => void;
}

export default function OkrCard({ okr, onOpenCheckIn }: OkrCardProps) {
    const rawKeyResults: any[] = okr.keyResults || [];
    const uniqueKeyResults = Array.from(new Map(rawKeyResults.map((kr: any) => [kr.id, kr])).values());

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-2xs flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                            okr.level === "INDIVIDUAL"
                                ? "bg-purple-100 text-purple-800"
                                : okr.level === "DEPARTMENT"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                        }`}>
                            {okr.level === "INDIVIDUAL" ? "👤 Shaxsiy OKR" : okr.level === "DEPARTMENT" ? `🏢 Bo'lim OKR${okr.department?.name ? ` (${okr.department.name})` : ""}` : "🌐 Kompaniya OKR"}
                        </span>
                        {okr.cycle?.title && (
                            <span className="text-[11px] font-bold text-slate-400">
                                • {okr.cycle.title}
                            </span>
                        )}
                    </div>
                    <h3 className="text-base font-black text-slate-900">{okr.title}</h3>
                    {okr.description && <p className="text-xs text-slate-500 font-medium leading-relaxed">{okr.description}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-slate-900">{Math.round(okr.progress)}%</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Umumiy ijro</span>
                    </div>
                    <CircularProgress value={okr.progress} size={48} strokeWidth={4.5} color="#9327FF" />
                </div>
            </div>

            {uniqueKeyResults.length > 0 && (
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Asosiy Natijalar (Key Results)
                    </span>
                    {uniqueKeyResults.map((kr: any) => {
                        const latestCheckIn = kr.checkIns?.[0];
                        const isPending = latestCheckIn?.status === "PENDING";
                        const isRejected = latestCheckIn?.status === "REJECTED";
                        const isCompleted = (kr.progress || 0) >= 100;

                        return (
                            <div key={kr.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <span className="text-xs font-bold text-slate-900">{kr.title}</span>
                                    <div className="flex items-center gap-3 w-full max-w-md">
                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-300 rounded-full ${isCompleted ? "bg-emerald-500" : isPending ? "bg-amber-500" : isRejected ? "bg-rose-500" : "bg-[#9327FF]"}`} 
                                                style={{ width: `${Math.min(100, Math.max(0, kr.progress))}%` }} 
                                            />
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
                                            {kr.currentValue} / {kr.targetValue} {kr.unit || ""} ({Math.round(kr.progress)}%)
                                        </span>
                                    </div>
                                    {latestCheckIn?.comment && (
                                        <div className="text-[11px] text-slate-500 italic mt-0.5">
                                            Topshirilgan hisobot: "{latestCheckIn.comment}"
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {isPending ? (
                                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                                            <span>⏳</span> Kutilmoqda
                                        </span>
                                    ) : isCompleted ? (
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                                            <span>✓</span> Tugallangan
                                        </span>
                                    ) : isRejected ? (
                                        <button
                                            onClick={() => onOpenCheckIn(kr)}
                                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                                        >
                                            🔄 Qayta topshirish
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onOpenCheckIn(kr)}
                                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs"
                                        >
                                            {kr.progress > 0 ? "⚡ Natijani yangilash" : "🚀 Topshirish"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
