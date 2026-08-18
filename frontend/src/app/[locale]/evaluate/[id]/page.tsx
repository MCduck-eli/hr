"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { fetchAssignmentById, submitFeedback } from "@/src/services/feedback360-service";

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
            <div className="max-w-[1000px] mx-auto p-8 flex justify-center items-center h-64">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Yuklanmoqda...</p>
            </div>
        );
    }

    if (!assignment && !loading) {
        return (
            <div className="max-w-[1000px] mx-auto p-8 flex flex-col gap-4">
                <button onClick={() => router.back()} className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-4">
                    &larr; {t("goBack")}
                </button>
                <div className="p-4 bg-red-50 text-red-700 border border-red-200">
                    {error}
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-[1000px] mx-auto p-8 flex flex-col gap-4 items-center justify-center min-h-[50vh]">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl mb-4">✓</div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-black">{t("successMsg")}</h1>
                <button 
                    onClick={() => router.push(`/${locale}/profile`)}
                    className="mt-6 px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                    {t("goBack")}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] mx-auto p-4 md:p-8 flex flex-col gap-8 pb-20">
            <div className="flex flex-col gap-2 border-b border-gray-200 pb-6">
                <button 
                    onClick={() => router.back()} 
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-4"
                >
                    &larr; {t("goBack")}
                </button>
                <h1 className="text-3xl font-black uppercase tracking-tight text-black">
                    {t("evalTitle")}
                </h1>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mt-2">
                    {t("evaluatingTarget")} <span className="text-black">{assignment.target?.firstName} {assignment.target?.lastName}</span>
                </p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                    {assignment.target?.department?.name} • {assignment.target?.position?.title}
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-6 flex flex-col gap-3">
                <h2 className="text-sm font-black uppercase tracking-widest text-blue-900">
                    {t("evalRulesTitle") || "Baholash Tartibi va Qoidalari"}
                </h2>
                {assignment.cycle?.description ? (
                    <div className="text-sm text-blue-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {assignment.cycle.description}
                    </div>
                ) : (
                    <p className="text-sm text-blue-600 font-medium italic">
                        {t("noInstructions") || "Ushbu baholash uchun maxsus yo'riqnoma kiritilmagan."}
                    </p>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-sm font-bold">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-8">
                {assignment.cycle.questions.map((q: any, idx: number) => (
                    <div key={q.id} className="flex flex-col gap-4 p-6 border border-gray-200 bg-white hover:border-black transition-colors">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                {t("competencyName")}: {q.competency}
                            </span>
                            <h3 className="text-lg font-bold text-black mt-1">
                                {idx + 1}. {q.text}
                            </h3>
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                {t("scoreLabel")}
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                        key={score}
                                        type="button"
                                        onClick={() => handleScoreChange(q.id, score)}
                                        className={"w-12 h-12 flex items-center justify-center border transition-all " + (answers[q.id]?.score === score ? "border-black bg-black text-white font-black" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400 font-medium")}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                {t("commentLabel")}
                            </label>
                            <textarea
                                value={answers[q.id]?.comment || ""}
                                onChange={(e) => handleCommentChange(q.id, e.target.value)}
                                rows={2}
                                className="w-full p-3 border border-gray-200 focus:border-black focus:outline-none transition-colors text-sm"
                                placeholder={t("commentLabel")}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end mt-4">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                    {submitting ? "..." : t("submitEval")}
                </button>
            </div>
        </div>
    );
}
