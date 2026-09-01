"use client";

import { useState, useEffect } from "react";
import {
    JourneyEvent,
    EmployeeJourneyResponse,
    fetchEmployeeJourney,
} from "@/src/services/lifecycle-service";

interface EmployeeJourneyTimelineProps {
    employeeId: string;
    employeeName?: string;
    canManage?: boolean;
}

export default function EmployeeJourneyTimeline({
    employeeId,
    employeeName,
}: EmployeeJourneyTimelineProps) {
    const [journeyData, setJourneyData] = useState<EmployeeJourneyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const loadJourney = async () => {
        if (!employeeId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await fetchEmployeeJourney(employeeId);
            setJourneyData(data);
        } catch (err: any) {
            setError(err.message || "EJM ma'lumotlarini yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJourney();
    }, [employeeId]);

    const stageConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
        CANDIDATE_APPLIED: {
            label: "Nomzodlik Arizasi",
            bg: "bg-sky-50",
            text: "text-sky-800",
            border: "border-sky-500",
            icon: "📝",
        },
        OFFER_ACCEPTED: {
            label: "Offer Qabul Qilindi",
            bg: "bg-teal-50",
            text: "text-teal-800",
            border: "border-teal-500",
            icon: "🤝",
        },
        HIRED: {
            label: "Ishga Qabul",
            bg: "bg-emerald-50",
            text: "text-emerald-800",
            border: "border-emerald-500",
            icon: "🚀",
        },
        ONBOARDING_STARTED: {
            label: "Onboarding Boshlandi",
            bg: "bg-blue-50",
            text: "text-blue-800",
            border: "border-blue-500",
            icon: "📚",
        },
        ONBOARDING_COMPLETED: {
            label: "Onboarding / Nizom",
            bg: "bg-blue-50",
            text: "text-blue-800",
            border: "border-blue-500",
            icon: "✅",
        },
        PROBATION_PASSED: {
            label: "Sinov Muddati O'tdi",
            bg: "bg-teal-50",
            text: "text-teal-800",
            border: "border-teal-500",
            icon: "🛡️",
        },
        PROMOTED: {
            label: "Greyd / Karyera O'sishi",
            bg: "bg-purple-50",
            text: "text-purple-800",
            border: "border-purple-500",
            icon: "👑",
        },
        DEPARTMENT_CHANGED: {
            label: "Bo'lim / Lavozim O'zgardi",
            bg: "bg-amber-50",
            text: "text-amber-800",
            border: "border-amber-500",
            icon: "🔄",
        },
        COURSE_COMPLETED: {
            label: "Kurs Yakunlandi",
            bg: "bg-indigo-50",
            text: "text-indigo-800",
            border: "border-indigo-500",
            icon: "🎓",
        },
        CERTIFICATE_EARNED: {
            label: "Sertifikat Olindi",
            bg: "bg-cyan-50",
            text: "text-cyan-800",
            border: "border-cyan-500",
            icon: "📜",
        },
        PERFORMANCE_REVIEWED: {
            label: "Baholash / OKR / DISC / 360",
            bg: "bg-violet-50",
            text: "text-violet-800",
            border: "border-violet-500",
            icon: "⭐",
        },
        OFFBOARDING_STARTED: {
            label: "Offboarding Boshlandi",
            bg: "bg-red-50",
            text: "text-red-800",
            border: "border-red-500",
            icon: "🚪",
        },
        TERMINATED: {
            label: "Ish Faoliyati Yakunlandi",
            bg: "bg-gray-100",
            text: "text-gray-800",
            border: "border-gray-400",
            icon: "🏁",
        },
    };

    const getStageMeta = (stage: string) => {
        return stageConfig[stage] || {
            label: stage,
            bg: "bg-gray-50",
            text: "text-gray-800",
            border: "border-black",
            icon: "📌",
        };
    };

    const rawTimeline = journeyData?.timeline || [];
    const stages = journeyData?.stages || [];
    const currentStageName = journeyData?.currentStage || "Asosiy Faoliyat";

    const matchesCategoryFilter = (item: JourneyEvent, cat: string) => {
        if (cat === "ALL") return true;
        if (cat === "ONBOARDING") {
            return ["CANDIDATE_APPLIED", "OFFER_ACCEPTED", "HIRED", "ONBOARDING_STARTED", "ONBOARDING_COMPLETED", "PROBATION_PASSED"].includes(item.stage);
        }
        if (cat === "CAREER") {
            return ["PROMOTED", "DEPARTMENT_CHANGED"].includes(item.stage);
        }
        if (cat === "PERFORMANCE") {
            return ["PERFORMANCE_REVIEWED"].includes(item.stage);
        }
        if (cat === "ACADEMY") {
            return ["CERTIFICATE_EARNED", "COURSE_COMPLETED"].includes(item.stage);
        }
        if (cat === "OFFBOARDING") {
            return ["OFFBOARDING_STARTED", "TERMINATED", "EXIT_INTERVIEW_COMPLETED"].includes(item.stage);
        }
        return true;
    };

    const filteredTimeline = rawTimeline.filter((item) => {
        const matchesCat = matchesCategoryFilter(item, filterCategory);
        const matchesSearch =
            searchQuery.trim() === "" ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.details.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    if (loading) {
        return (
            <div className="border border-black bg-white p-6 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-widest text-black animate-pulse">
                    EJM (Xodimning Hayotiy Sikl Xaritasi) yuklanmoqda...
                </div>
            </div>
        );
    }

    return (
        <div className="border border-black bg-white p-6 md:p-8 flex flex-col gap-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black pb-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            Employee Journey Map (EJM)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-black text-white uppercase tracking-wider">
                            Dinamik Karyera Yo'li
                        </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                        Xodimning Hayotiy Sikl Xaritasi
                    </h2>
                </div>

                <div className="flex items-center gap-2 bg-neutral-900 text-white px-3.5 py-2 border border-black shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                            Hozirgi Bosqichda:
                        </span>
                        <span className="text-xs font-black uppercase text-emerald-400">
                            {currentStageName}
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 text-xs font-bold uppercase tracking-wider">
                    {error}
                </div>
            )}

            {stages.length > 0 && (
                <div className="flex flex-col gap-3 bg-gray-50 p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-black">
                            Bosqichlar Ketma-ketligi & Holati
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                            Avtomatik reja
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                        {stages.map((st) => {
                            const isCompleted = st.status === "COMPLETED";
                            const isCurrent = st.status === "CURRENT";

                            return (
                                <div
                                    key={st.code}
                                    className={`border p-2.5 flex flex-col justify-between gap-1.5 relative transition-all ${
                                        isCurrent
                                            ? "border-black bg-black text-white shadow-xs ring-2 ring-emerald-500"
                                            : isCompleted
                                            ? "border-emerald-300 bg-emerald-50/70 text-emerald-950"
                                            : "border-gray-200 bg-white text-gray-400 opacity-60"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">{st.icon}</span>
                                        <span
                                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs ${
                                                isCurrent
                                                    ? "bg-emerald-500 text-black"
                                                    : isCompleted
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            {isCurrent ? "Joriy" : isCompleted ? "✓ O'tgan" : "Reja"}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black uppercase leading-tight line-clamp-2">
                                            {st.title}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 border border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setFilterCategory("ALL")}
                        className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            filterCategory === "ALL" ? "bg-black text-white" : "bg-white text-black border border-gray-300 hover:border-black"
                        }`}
                    >
                        Barchasi ({rawTimeline.length})
                    </button>
                    <button
                        onClick={() => setFilterCategory("ONBOARDING")}
                        className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            filterCategory === "ONBOARDING" ? "bg-blue-700 text-white" : "bg-white text-blue-700 border border-blue-200 hover:border-blue-600"
                        }`}
                    >
                        Onboarding & Qabul
                    </button>
                    <button
                        onClick={() => setFilterCategory("CAREER")}
                        className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            filterCategory === "CAREER" ? "bg-purple-700 text-white" : "bg-white text-purple-700 border border-purple-200 hover:border-purple-600"
                        }`}
                    >
                        Greyd & Karyera
                    </button>
                    <button
                        onClick={() => setFilterCategory("PERFORMANCE")}
                        className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            filterCategory === "PERFORMANCE" ? "bg-violet-700 text-white" : "bg-white text-violet-700 border border-violet-200 hover:border-violet-600"
                        }`}
                    >
                        Baholash / OKR / DISC / 360
                    </button>
                    <button
                        onClick={() => setFilterCategory("ACADEMY")}
                        className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            filterCategory === "ACADEMY" ? "bg-cyan-700 text-white" : "bg-white text-cyan-700 border border-cyan-200 hover:border-cyan-600"
                        }`}
                    >
                        Sertifikatlar & Kurslar
                    </button>
                    <button
                        onClick={() => setFilterCategory("OFFBOARDING")}
                        className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            filterCategory === "OFFBOARDING" ? "bg-red-700 text-white" : "bg-white text-red-700 border border-red-200 hover:border-red-600"
                        }`}
                    >
                        Offboarding
                    </button>
                </div>

                <div className="w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Qidirish (masalan: greyd, OKR, sertifikat)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 text-xs text-black placeholder-gray-400 focus:outline-none focus:border-black"
                    />
                </div>
            </div>

            {filteredTimeline.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-300 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    Ushbu parametrlar bo'yicha hayotiy sikl hodisalari topilmadi.
                </div>
            ) : (
                <div className="relative pl-6 md:pl-8 border-l-2 border-black space-y-8 my-2">
                    {filteredTimeline.map((item, idx) => {
                        const meta = getStageMeta(item.stage);
                        const formattedDate = item.date
                            ? new Date(item.date).toLocaleDateString("uz-UZ", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                              })
                            : "-";

                        return (
                            <div key={item.id || idx} className="relative group">
                                <div
                                    className={`absolute -left-[31px] md:-left-[39px] top-1.5 w-6 h-6 rounded-full border-2 border-black bg-white flex items-center justify-center text-xs shadow-xs`}
                                >
                                    <span className="text-[11px] leading-none">{meta.icon}</span>
                                </div>

                                <div className="border border-black bg-white p-4 md:p-5 flex flex-col gap-2 transition-all hover:shadow-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${meta.bg} ${meta.text} ${meta.border}`}>
                                                {meta.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-bold text-gray-500 font-mono">
                                                📅 {formattedDate}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-sm md:text-base font-black text-black tracking-tight mt-1">
                                        {item.title}
                                    </h3>

                                    {item.details && (
                                        <p className="text-xs font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
                                            {item.details}
                                        </p>
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
