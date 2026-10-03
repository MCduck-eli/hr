"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { fetchAssignmentById, submitFeedback } from "@/src/services/feedback360-service";
import Skeleton from "@/src/components/ui/Skeleton";

export default function EvaluateEmployeePage() {
    const t = useTranslations("Feedback360");
    const router = useRouter();
    const params = useParams();
    const assignmentId = params.id as string;
    const locale = (params.locale as string) || "uz";

    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [answers, setAnswers] = useState<Record<string, { score: number; comment: string }>>({});
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    useEffect(() => {
        const loadAssignment = async () => {
            try {
                const found = await fetchAssignmentById(assignmentId);
                if (found) {
                    setAssignment(found);
                    const initialAnswers: Record<string, { score: number; comment: string }> = {};
                    found.cycle.questions.forEach((q: any) => {
                        initialAnswers[q.id] = { score: 0, comment: "" };
                    });
                    setAnswers(initialAnswers);
                } else {
                    setError("Not found in DB! ID: " + assignmentId);
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || String(err));
            } finally {
                setLoading(false);
            }
        };
        
        loadAssignment();
    }, [assignmentId, t]);

    const handleScoreChange = (questionId: string, score: number) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: { ...prev[questionId], score }
        }));
    };

    const handleCommentChange = (questionId: string, comment: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: { ...prev[questionId], comment }
        }));
    };

    const handleSubmit = async () => {
        const missingScores = Object.values(answers).some((a) => a.score === 0);
        if (missingScores) {
            setError(t("selectScore"));
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            
            const payload = Object.keys(answers).map((qId) => ({
                questionId: qId,
                score: answers[qId].score,
                comment: answers[qId].comment || undefined
            }));

            await submitFeedback(assignmentId, payload);
            setSuccess(true);
            
        } catch (err) {
            console.error(err);
            setError(t("errorMsg"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-[1000px] mx-auto p-8 space-y-6 font-sans">
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
                    <Skeleton className="w-48 h-6 rounded-lg" />
                    <Skeleton className="w-96 h-4 rounded" />
                    <div className="flex gap-4 pt-2">
                        <Skeleton className="w-32 h-8 rounded-xl" />
                        <Skeleton className="w-32 h-8 rounded-xl" />
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                            <Skeleton className="w-3/4 h-5 rounded" />
                            <div className="flex gap-3">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Skeleton key={s} className="w-12 h-10 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!assignment && !loading) {
        return (
            <div className="max-w-[1000px] mx-auto p-8 flex flex-col gap-4 font-sans">
                <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-violet-600 transition-colors w-fit mb-2 cursor-pointer">
                    &larr; {t("goBack")}
                </button>
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl">
                    {error}
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-[1000px] mx-auto p-8 flex flex-col gap-4 items-center justify-center min-h-[50vh] font-sans">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl mb-4 shadow-sm">✓</div>
                <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900">{t("successMsg")}</h1>
                <button 
                    onClick={() => router.push(`/${locale}/profile`)}
                    className="mt-6 px-6 py-2.5 bg-[#9327FF] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer"
                >
                    {t("goBack")}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] mx-auto p-4 md:p-8 flex flex-col gap-6 pb-20 font-sans">
            <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-6">
                <button 
                    onClick={() => router.back()} 
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-violet-600 transition-colors w-fit mb-2 cursor-pointer"
                >
                    &larr; {t("goBack")}
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 uppercase">
                    {t("evalTitle")}
                </h1>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 mt-1">
                    {t("evaluatingTarget")} <span className="text-gray-900">{assignment.target?.firstName} {assignment.target?.lastName}</span>
                </p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {assignment.target?.department?.name} • {assignment.target?.position?.title}
                </p>
            </div>

            <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-6 flex flex-col gap-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-violet-900">
                    {t("evalRulesTitle") || "Baholash Tartibi va Qoidalari"}
                </h2>
                {assignment.cycle?.description ? (
                    <div className="text-sm text-violet-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {assignment.cycle.description}
                    </div>
                ) : (
                    <p className="text-sm text-violet-600 font-medium italic">
                        {t("noInstructions") || "Ushbu baholash uchun maxsus yo'riqnoma kiritilmagan."}
                    </p>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-6">
                {assignment.cycle.questions.map((q: any, idx: number) => (
                    <div key={q.id} className="flex flex-col gap-4 p-6 border border-gray-100 bg-white rounded-2xl shadow-sm hover:border-violet-200 transition-all">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {t("competencyName")}: {q.competency}
                            </span>
                            <h3 className="text-base font-bold text-gray-900 mt-0.5">
                                {idx + 1}. {q.text}
                            </h3>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {t("scoreLabel")}
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                        key={score}
                                        type="button"
                                        onClick={() => handleScoreChange(q.id, score)}
                                        className={"w-11 h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer " + (answers[q.id]?.score === score ? "border-violet-600 bg-[#9327FF] text-white font-bold shadow-sm" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-violet-300 font-medium")}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {t("commentLabel")}
                            </label>
                            <textarea
                                value={answers[q.id]?.comment || ""}
                                onChange={(e) => handleCommentChange(q.id, e.target.value)}
                                rows={2}
                                className="w-full p-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm"
                                placeholder={t("commentLabel")}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end mt-2">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-[#9327FF] text-white px-8 py-3 font-bold uppercase tracking-wider text-xs rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                >
                    {submitting ? "..." : t("submitEval")}
                </button>
            </div>
        </div>
    );
}
