"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
}: EmployeeJourneyTimelineProps) {
    const t = useTranslations("EJM");
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
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJourney();
    }, [employeeId]);

    const stageConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
        CANDIDATE_APPLIED: {
            label: t("stages.CANDIDATE_APPLIED"),
            bg: "bg-sky-50",
            text: "text-sky-700",
            border: "border-sky-200",
            icon: "📝",
        },
        OFFER_ACCEPTED: {
            label: t("stages.OFFER_ACCEPTED"),
            bg: "bg-teal-50",
            text: "text-teal-700",
            border: "border-teal-200",
            icon: "🤝",
        },
        HIRED: {
            label: t("stages.HIRED"),
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            border: "border-emerald-200",
            icon: "🚀",
        },
        ONBOARDING_STARTED: {
            label: t("stages.ONBOARDING_STARTED"),
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-200",
            icon: "📚",
        },
        ONBOARDING_COMPLETED: {
            label: t("stages.ONBOARDING_COMPLETED"),
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-200",
            icon: "✅",
        },
        PROBATION_PASSED: {
            label: t("stages.PROBATION_PASSED"),
            bg: "bg-teal-50",
            text: "text-teal-700",
            border: "border-teal-200",
            icon: "🛡️",
        },
        PROMOTED: {
            label: t("stages.PROMOTED"),
            bg: "bg-purple-50",
            text: "text-purple-700",
            border: "border-purple-200",
            icon: "👑",
        },
        DEPARTMENT_CHANGED: {
            label: t("stages.DEPARTMENT_CHANGED"),
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-200",
            icon: "🔄",
        },
        COURSE_COMPLETED: {
            label: t("stages.COURSE_COMPLETED"),
            bg: "bg-indigo-50",
            text: "text-indigo-700",
            border: "border-indigo-200",
            icon: "🎓",
        },
        CERTIFICATE_EARNED: {
            label: t("stages.CERTIFICATE_EARNED"),
            bg: "bg-cyan-50",
            text: "text-cyan-700",
            border: "border-cyan-200",
            icon: "📜",
        },
        PERFORMANCE_REVIEWED: {
            label: t("stages.PERFORMANCE_REVIEWED"),
            bg: "bg-violet-50",
            text: "text-violet-700",
            border: "border-violet-200",
            icon: "⭐",
        },
        OFFBOARDING_STARTED: {
            label: t("stages.OFFBOARDING_STARTED"),
            bg: "bg-rose-50",
            text: "text-rose-700",
            border: "border-rose-200",
            icon: "🚪",
        },
        TERMINATED: {
            label: t("stages.TERMINATED"),
            bg: "bg-slate-100",
            text: "text-slate-700",
            border: "border-slate-200",
            icon: "🏁",
        },
    };

    const getStageMeta = (stage: string) => {
        return stageConfig[stage] || {
            label: stage,
            bg: "bg-slate-50",
            text: "text-slate-700",
            border: "border-slate-200",
            icon: "📌",
        };
    };

    const rawTimeline = journeyData?.timeline || [];
    const stages = journeyData?.stages || [];
    const currentStageName = journeyData?.currentStage || t("defaultCurrentStage");

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
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm flex items-center justify-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 animate-pulse">
                    {t("loading")}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {t("badge")}
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-purple-50 text-[#9327FF] rounded-full border border-purple-100">
                            {t("dynamicPath")}
                        </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                        {t("title")}
                    </h2>
                </div>

                <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-900 px-4 py-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/80">
                            {t("currentStage")}:
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                            {currentStageName}
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold">
                    {error}
                </div>
            )}

            {stages.length > 0 && (
                <div className="flex flex-col gap-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {t("stagesSequence")}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {t("autoPlan")}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                        {stages.map((st) => {
                            const isCompleted = st.status === "COMPLETED";
                            const isCurrent = st.status === "CURRENT";

                            return (
                                <div
                                    key={st.code}
                                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                                        isCurrent
                                            ? "border-purple-200 bg-purple-50/70 text-purple-900 shadow-xs ring-2 ring-purple-400/20"
                                            : isCompleted
                                            ? "border-emerald-100 bg-emerald-50/60 text-emerald-900"
                                            : "border-slate-100 bg-white text-slate-400 opacity-70"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">{st.icon}</span>
                                        <span
                                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                                                isCurrent
                                                    ? "bg-[#9327FF] text-white"
                                                    : isCompleted
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {isCurrent ? t("statusCurrent") : isCompleted ? t("statusCompleted") : t("statusPlanned")}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold leading-snug line-clamp-2">
                                            {st.title}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setFilterCategory("ALL")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            filterCategory === "ALL"
                                ? "bg-[#9327FF] text-white shadow-xs"
                                : "bg-white text-slate-600 border border-slate-200 hover:border-purple-200 hover:text-[#9327FF]"
                        }`}
                    >
                        {t("allFilter")} ({rawTimeline.length})
                    </button>
                    <button
                        onClick={() => setFilterCategory("ONBOARDING")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            filterCategory === "ONBOARDING"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-white text-blue-700 border border-blue-100 hover:bg-blue-50"
                        }`}
                    >
                        {t("onboardingFilter")}
                    </button>
                    <button
                        onClick={() => setFilterCategory("CAREER")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            filterCategory === "CAREER"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-white text-purple-700 border border-purple-100 hover:bg-purple-50"
                        }`}
                    >
                        {t("careerFilter")}
                    </button>
                    <button
                        onClick={() => setFilterCategory("PERFORMANCE")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            filterCategory === "PERFORMANCE"
                                ? "bg-violet-600 text-white shadow-xs"
                                : "bg-white text-violet-700 border border-violet-100 hover:bg-violet-50"
                        }`}
                    >
                        {t("performanceFilter")}
                    </button>
                    <button
                        onClick={() => setFilterCategory("ACADEMY")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            filterCategory === "ACADEMY"
                                ? "bg-cyan-600 text-white shadow-xs"
                                : "bg-white text-cyan-700 border border-cyan-100 hover:bg-cyan-50"
                        }`}
                    >
                        {t("academyFilter")}
                    </button>
                    <button
                        onClick={() => setFilterCategory("OFFBOARDING")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            filterCategory === "OFFBOARDING"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "bg-white text-rose-700 border border-rose-100 hover:bg-rose-50"
                        }`}
                    >
                        {t("offboardingFilter")}
                    </button>
                </div>

                <div className="w-full sm:w-64">
                    <input
                        type="text"
                        placeholder={t("searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                    />
                </div>
            </div>

            {filteredTimeline.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
                    {t("noEvents")}
                </div>
            ) : (
                <div className="relative pl-6 md:pl-8 border-l-2 border-slate-200 space-y-6 my-2">
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
                                    className="absolute -left-[31px] md:-left-[39px] top-2 w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-xs shadow-2xs"
                                >
                                    <span className="text-xs leading-none">{meta.icon}</span>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-2 shadow-2xs hover:shadow-sm transition-all">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg border ${meta.bg} ${meta.text} ${meta.border}`}>
                                                {meta.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-slate-500 font-mono">
                                                📅 {formattedDate}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight mt-1">
                                        {item.title}
                                    </h3>

                                    {item.details && (
                                        <p className="text-xs font-normal text-slate-600 leading-relaxed whitespace-pre-wrap">
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
