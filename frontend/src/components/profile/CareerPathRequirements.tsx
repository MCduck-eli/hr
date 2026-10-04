"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import RequestPromotionModal from "../grading/RequestPromotionModal";
import { createPromotionRequest, fetchGrades, JobGrade } from "@/src/services/grading-service";

interface CareerPathProps {
    careerPath: {
        currentGrade?: any;
        nextGrade?: any;
        activePromotionRequest?: any;
        okrTarget: number;
        currentOkr: number;
        feedbackTarget: number;
        currentFeedback?: number | null;
        isOkrMet: boolean;
        isFeedbackMet: boolean;
        isReadyForPromotion: boolean;
    } | null;
    employeeId?: string;
    employeeName?: string;
    onRefresh?: () => void;
}

export default function CareerPathRequirements({
    careerPath,
    employeeId,
    employeeName,
    onRefresh,
}: CareerPathProps) {
    const t = useTranslations("DashboardProfile");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [allGrades, setAllGrades] = useState<JobGrade[]>([]);

    useEffect(() => {
        fetchGrades()
            .then((data) => {
                if (Array.isArray(data)) {
                    const sorted = [...data].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
                    setAllGrades(sorted);
                }
            })
            .catch(() => {});
    }, []);

    if (!careerPath) return null;

    const { currentGrade, nextGrade, activePromotionRequest, okrTarget, currentOkr, feedbackTarget, currentFeedback, isOkrMet, isFeedbackMet, isReadyForPromotion } = careerPath;

    const hasCurrentGrade = Boolean(currentGrade && (currentGrade.level !== undefined || currentGrade.title));

    const targetNextGrade = (() => {
        if (nextGrade) return nextGrade;
        if (allGrades.length === 0) return null;
        if (!hasCurrentGrade) {
            return allGrades[0] || null;
        }
        const currentLevel = currentGrade?.level ?? 0;
        return allGrades.find((g) => (g.level ?? 0) > currentLevel) || null;
    })();

    const isTopLevel = Boolean(hasCurrentGrade && !targetNextGrade && (allGrades.length > 0 || currentGrade?.level !== undefined));

    const handlePromotionSubmit = async (data: any) => {
        try {
            await createPromotionRequest(data);
            setActionMessage({ type: "success", text: t("promotionSuccess") });
            if (onRefresh) onRefresh();
            setTimeout(() => setActionMessage(null), 5000);
        } catch (err: any) {
            setActionMessage({ type: "error", text: err.message || "Error" });
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 flex flex-col gap-6 shadow-sm relative">
            {actionMessage && (
                <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                    actionMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
                }`}>
                    <span>{actionMessage.text}</span>
                    <button onClick={() => setActionMessage(null)} className="text-xs cursor-pointer">✕</button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        {t("careerPlanBadge")}
                    </div>
                    <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
                        {t("careerRequirementsTitle")}
                    </h2>
                </div>

                {activePromotionRequest ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        {t("requestInReview")}
                    </div>
                ) : isReadyForPromotion && targetNextGrade ? (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-[#9327FF] hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {t("requestPromotionBtn")}
                    </button>
                ) : null}
            </div>

            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-purple-50 text-[#9327FF] border border-purple-100 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0">
                        {hasCurrentGrade ? `L${currentGrade.level}` : "0"}
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                            {t("currentLevel")}
                        </span>
                        <span className="text-sm md:text-base font-bold text-slate-900">
                            {hasCurrentGrade ? currentGrade.title : t("unassigned")}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <svg className="w-5 h-5 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>

                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0">
                        {targetNextGrade ? `L${targetNextGrade.level}` : isTopLevel ? "TOP" : "—"}
                    </div>
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                            {t("targetNextGrade")}
                        </span>
                        <span className="text-sm md:text-base font-bold text-slate-900">
                            {targetNextGrade ? targetNextGrade.title : isTopLevel ? t("topLevelReached") : t("unassigned")}
                        </span>
                    </div>
                </div>
            </div>

            {targetNextGrade ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                {t("okrProgressTitle")}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase ${
                                isOkrMet ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}>
                                {isOkrMet ? t("okrMet") : t("okrRequired", { target: okrTarget })}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-500">{t("currentResult")}:</span>
                                <span className="text-slate-900 font-bold">{currentOkr}% / {okrTarget}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                                <div
                                    className={`h-full transition-all duration-500 rounded-full ${isOkrMet ? "bg-emerald-600" : "bg-[#9327FF]"}`}
                                    style={{ width: `${Math.min(100, currentOkr)}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-500 font-medium">
                            {t("okrHint", { target: okrTarget })}
                        </p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                {t("feedback360Title")}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase ${
                                isFeedbackMet ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                            }`}>
                                {currentFeedback !== null && currentFeedback !== undefined ? `${currentFeedback} / 5.0` : t("notSpecified")}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-500">{t("requiredScore")}:</span>
                                <span className="text-slate-900 font-bold">{feedbackTarget}.0+</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 rounded-full ${isFeedbackMet ? "bg-emerald-600" : "bg-[#9327FF]"}`}
                                    style={{ width: `${Math.min(100, ((currentFeedback || 0) / 5) * 100)}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-500 font-medium">
                            {t("feedbackHint", { target: feedbackTarget })}
                        </p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3.5 md:col-span-2 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                {t("qualificationsTitle", { title: targetNextGrade.title })}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                {t("newSalary")}: {Number(targetNextGrade.minSalary || 0).toLocaleString()} — {Number(targetNextGrade.maxSalary || 0).toLocaleString()} UZS
                            </span>
                        </div>

                        {targetNextGrade.requirements && (
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                                    {t("knowledgeExp")}:
                                </span>
                                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                                    {targetNextGrade.requirements}
                                </p>
                            </div>
                        )}

                        {targetNextGrade.responsibilities && (
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                                    {t("responsibilities")}:
                                </span>
                                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                                    {targetNextGrade.responsibilities}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-6 text-xs text-slate-500 font-medium">
                    {isTopLevel ? t("maxLevelMessage") : "Keyingi darajaga chiqish uchun talablarni bajaring"}
                </div>
            )}

            {activePromotionRequest && (
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs space-y-1.5">
                    <div className="font-bold text-blue-900 uppercase">
                        {t("submittedPromotionRequest")}:
                    </div>
                    <div className="text-blue-800">
                        <span className="font-semibold">{t("targetGrade")}:</span> {activePromotionRequest.targetGradeTitle}
                    </div>
                    <div className="text-blue-800">
                        <span className="font-semibold">{t("proposedSalary")}:</span> {activePromotionRequest.proposedSalary.toLocaleString()} UZS
                    </div>
                    <div className="text-blue-800">
                        <span className="font-semibold">{t("reason")}:</span> {activePromotionRequest.reason}
                    </div>
                </div>
            )}

            {targetNextGrade && employeeId && (
                <RequestPromotionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handlePromotionSubmit}
                    employees={[
                        {
                            id: employeeId,
                            firstName: employeeName?.split(" ")[0] || "Employee",
                            lastName: employeeName?.split(" ")[1] || "",
                            grade: currentGrade,
                        },
                    ]}
                    grades={[targetNextGrade]}
                    initialEmployeeId={employeeId}
                />
            )}
        </div>
    );
}
