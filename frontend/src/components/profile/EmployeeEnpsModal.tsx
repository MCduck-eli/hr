"use client";

import { useState, useEffect } from "react";
import { submitEnps, fetchEnpsQuestions, EnpsQuestion } from "@/src/services/enps-service";

interface EmployeeEnpsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => void;
}

export default function EmployeeEnpsModal({
    isOpen,
    onClose,
    onSuccess,
}: EmployeeEnpsModalProps) {
    const [questions, setQuestions] = useState<EnpsQuestion[]>([]);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoadingQuestions(true);
            fetchEnpsQuestions(true)
                .then((qs) => {
                    setQuestions(qs);
                    setActiveQuestionIndex(0);
                    setScore(null);
                    setComment("");
                    setSubmitted(false);
                    setError(null);
                })
                .catch(() => {
                    setQuestions([]);
                })
                .finally(() => {
                    setLoadingQuestions(false);
                });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentQuestion = questions[activeQuestionIndex] || {
        id: undefined,
        question: "Kompaniyamizda ishlash tajribangizni do'stlaringiz yoki tanishlaringizga ish joyi sifatida tavsiya qilasizmi?",
        description: "0 — Umuman tavsiya qilmayman, 10 — Albatta tavsiya qilaman",
        minScale: 0,
        maxScale: 10,
        minLabel: "Tavsiya qilmayman",
        maxLabel: "Albatta tavsiya qilaman",
    };

    const minScale = currentQuestion.minScale ?? 0;
    const maxScale = currentQuestion.maxScale ?? 10;
    const scaleButtons = Array.from({ length: maxScale - minScale + 1 }, (_, i) => minScale + i);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (score === null) {
            setError(`Iltimos, ${minScale} dan ${maxScale} gacha bo'lgan bahoni tanlang`);
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            const result = await submitEnps({
                score,
                comment: comment.trim() || undefined,
                questionId: currentQuestion.id,
            });
            setSubmitted(true);
            onSuccess(result);
        } catch (err: any) {
            setError(err.message || "Bahoni saqlashda xatolik yuz berdi");
        } finally {
            setSubmitting(false);
        }
    };

    const getScoreCategory = (val: number) => {
        if (val >= 9) return { label: "Targ'ibotchi (Promoter)", color: "text-emerald-700 bg-emerald-50 border-emerald-500" };
        if (val >= 7) return { label: "Neytral (Passive)", color: "text-amber-700 bg-amber-50 border-amber-500" };
        return { label: "Tanqidchi (Detractor)", color: "text-rose-700 bg-rose-50 border-rose-500" };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border-2 border-black max-w-xl w-full p-6 md:p-8 flex flex-col gap-6 shadow-2xl my-8">
                <div className="flex items-center justify-between border-b-2 border-black pb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Xodimlar Qoniqishi & Sadoqati
                        </span>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                            💬 eNPS So'rovnomasi
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 border border-black bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center font-bold text-sm"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-xs font-bold">✕</button>
                    </div>
                )}

                {loadingQuestions ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold uppercase text-gray-500">So'rovnoma yuklanmoqda...</span>
                    </div>
                ) : submitted ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-2xl font-black border-2 border-emerald-500">
                            ✓
                        </div>
                        <h3 className="text-xl font-black text-black">
                            Rahmat! Sizning bahoyingiz muvaffaqiyatli qabul qilindi.
                        </h3>
                        <p className="text-xs font-medium text-gray-600 max-w-md">
                            Sizning fikringiz kompaniyamizdagi ish muhitini yanada yaxshilash va rivojlantirish uchun juda muhim.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-2 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                        >
                            Yopish
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {questions.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gray-100">
                                {questions.map((q, idx) => (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveQuestionIndex(idx);
                                            setScore(null);
                                        }}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase border transition-colors ${
                                            activeQuestionIndex === idx
                                                ? "border-black bg-black text-white"
                                                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
                                        }`}
                                    >
                                        Savol #{idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 bg-gray-50 p-4 border border-gray-200">
                            <span className="text-sm font-bold text-black leading-snug">
                                {currentQuestion.question}
                            </span>
                            {currentQuestion.description && (
                                <span className="text-xs text-gray-500">
                                    {currentQuestion.description}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className={`grid gap-1 sm:gap-1.5 ${scaleButtons.length > 10 ? "grid-cols-11" : "grid-cols-5 sm:grid-cols-10"}`}>
                                {scaleButtons.map((num) => {
                                    const isSelected = score === num;
                                    let btnColor = "border-gray-300 bg-white text-black hover:border-black";
                                    if (isSelected) {
                                        if (num >= 9) btnColor = "border-emerald-600 bg-emerald-600 text-white font-black shadow-md";
                                        else if (num >= 7) btnColor = "border-amber-500 bg-amber-500 text-white font-black shadow-md";
                                        else btnColor = "border-rose-600 bg-rose-600 text-white font-black shadow-md";
                                    }

                                    return (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setScore(num)}
                                            className={`h-11 border-2 text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${btnColor}`}
                                        >
                                            {num}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                <span>{minScale} — {currentQuestion.minLabel || "Tavsiya qilmayman"}</span>
                                <span>{maxScale} — {currentQuestion.maxLabel || "Albatta tavsiya qilaman"}</span>
                            </div>

                            {score !== null && (
                                <div className={`p-3 border text-xs font-bold flex items-center justify-between ${getScoreCategory(score).color}`}>
                                    <span>Tanlangan baho: {score} ball</span>
                                    <span>{getScoreCategory(score).label}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Izoh yoki taklifingiz (Ixtiyoriy):
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Ish muhitini qanday yaxshilashimiz mumkin? Fikringizni yozib qoldiring..."
                                rows={3}
                                className="w-full border-2 border-gray-300 p-3 text-xs focus:border-black focus:outline-none resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 border border-black bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || score === null}
                                className="px-6 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
                            >
                                {submitting ? "Yuborilmoqda..." : "✓ Bahoni Yuborish"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
