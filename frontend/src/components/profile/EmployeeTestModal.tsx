"use client";

import { useState, useEffect } from "react";
import {
    DiscQuestion,
    DiscProfileResponse,
    fetchDiscQuestions,
    submitDiscAssessment,
    fetchMyDiscProfile,
} from "@/src/services/disc-service";

interface EmployeeTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (profile: DiscProfileResponse) => void;
    locale?: string;
}

export default function EmployeeTestModal({
    isOpen,
    onClose,
    onSuccess,
}: EmployeeTestModalProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [questions, setQuestions] = useState<DiscQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [completedProfile, setCompletedProfile] = useState<DiscProfileResponse | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadQuestions();
        }
    }, [isOpen]);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError(null);
            setAnswers({});
            setCurrentIdx(0);
            setCompletedProfile(null);
            const data = await fetchDiscQuestions();
            setQuestions(data);
        } catch (err: any) {
            setError(err.message || "Savollarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleSelectOption = (questionId: string, optionId: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        const unanswered = questions.filter((q) => !answers[q.id]);
        if (unanswered.length > 0) {
            const firstUnansweredIdx = questions.findIndex((q) => !answers[q.id]);
            if (firstUnansweredIdx !== -1) {
                setCurrentIdx(firstUnansweredIdx);
            }
            setError("Iltimos, barcha savollarga javob bering!");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            const formatted = Object.entries(answers).map(([questionId, optionId]) => ({
                questionId,
                optionId,
            }));

            await submitDiscAssessment(formatted);
            const profile = await fetchMyDiscProfile();
            setCompletedProfile(profile);
            onSuccess(profile);
        } catch (err: any) {
            setError(err.message || "Natijalarni saqlashda xatolik");
        } finally {
            setSubmitting(false);
        }
    };

    const answeredCount = Object.keys(answers).length;
    const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
    const currentQ = questions[currentIdx];

    const discColorConfig: Record<string, { bg: string; text: string; bar: string; name: string }> = {
        D: { bg: "bg-red-50", text: "text-red-700", bar: "bg-red-600", name: "Dominance (Yetakchilik & Qat'iyat)" },
        I: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500", name: "Influence (Muloqot & Ilhomlantirish)" },
        S: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-600", name: "Steadiness (Barqarorlik & Hamkorlik)" },
        C: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-600", name: "Conscientiousness (Aniqlik & Tahlil)" },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border-2 border-black max-w-3xl w-full p-6 md:p-8 flex flex-col gap-6 shadow-2xl my-8">
                <div className="flex items-center justify-between border-b-2 border-black pb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Psixometrik Baholash
                        </span>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                            🧠 DISC Shaxsiyat & Xulq-atvor Testi
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

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin rounded-full" />
                        <span className="text-xs font-bold uppercase tracking-widest text-black">
                            Savollar yuklanmoqda...
                        </span>
                    </div>
                ) : completedProfile?.assessment ? (
                    <div className="flex flex-col gap-6 py-2">
                        <div className="bg-emerald-50 border-2 border-emerald-500 p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-800">
                                    🎉 Test Muvaffaqiyatli Yakunlandi!
                                </span>
                                <span className="px-3 py-1 bg-black text-white text-xs font-black uppercase tracking-widest">
                                    Asosiy Tip: {completedProfile.assessment.primaryType}
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-black">
                                {completedProfile.description?.primary?.title || `Tip ${completedProfile.assessment.primaryType}`}
                            </h3>
                            <p className="text-sm font-medium text-gray-700 leading-relaxed">
                                {completedProfile.description?.primary?.traits}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="border border-red-200 bg-red-50/50 p-4 flex flex-col gap-1.5">
                                <span className="text-xs font-black text-red-700">D (Dominance)</span>
                                <span className="text-2xl font-black font-mono text-black">{completedProfile.assessment.dScore}%</span>
                                <div className="w-full bg-gray-200 h-2">
                                    <div className="bg-red-600 h-full" style={{ width: `${completedProfile.assessment.dScore}%` }} />
                                </div>
                            </div>
                            <div className="border border-amber-200 bg-amber-50/50 p-4 flex flex-col gap-1.5">
                                <span className="text-xs font-black text-amber-700">I (Influence)</span>
                                <span className="text-2xl font-black font-mono text-black">{completedProfile.assessment.iScore}%</span>
                                <div className="w-full bg-gray-200 h-2">
                                    <div className="bg-amber-500 h-full" style={{ width: `${completedProfile.assessment.iScore}%` }} />
                                </div>
                            </div>
                            <div className="border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col gap-1.5">
                                <span className="text-xs font-black text-emerald-700">S (Steadiness)</span>
                                <span className="text-2xl font-black font-mono text-black">{completedProfile.assessment.sScore}%</span>
                                <div className="w-full bg-gray-200 h-2">
                                    <div className="bg-emerald-600 h-full" style={{ width: `${completedProfile.assessment.sScore}%` }} />
                                </div>
                            </div>
                            <div className="border border-blue-200 bg-blue-50/50 p-4 flex flex-col gap-1.5">
                                <span className="text-xs font-black text-blue-700">C (Compliance)</span>
                                <span className="text-2xl font-black font-mono text-black">{completedProfile.assessment.cScore}%</span>
                                <div className="w-full bg-gray-200 h-2">
                                    <div className="bg-blue-600 h-full" style={{ width: `${completedProfile.assessment.cScore}%` }} />
                                </div>
                            </div>
                        </div>

                        {completedProfile.description?.primary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="border border-gray-200 p-4 bg-gray-50 flex flex-col gap-1.5">
                                    <span className="font-bold text-gray-500 uppercase tracking-wider">Kuchli jihatlar:</span>
                                    <span className="font-bold text-black">{completedProfile.description.primary.strengths}</span>
                                </div>
                                <div className="border border-gray-200 p-4 bg-gray-50 flex flex-col gap-1.5">
                                    <span className="font-bold text-gray-500 uppercase tracking-wider">Muloqot uslubi:</span>
                                    <span className="font-bold text-black">{completedProfile.description.primary.communication}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                            >
                                Yopish va Profilga qaytish
                            </button>
                        </div>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center gap-2 text-gray-500">
                        <span className="text-3xl">📭</span>
                        <p className="text-sm font-bold">Hozircha test savollari mavjud emas</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-gray-600 uppercase tracking-wider">
                                    Savol {currentIdx + 1} / {questions.length}
                                </span>
                                <span className="font-mono text-black">
                                    {answeredCount} / {questions.length} belgilandi ({progressPercent}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 overflow-hidden">
                                <div
                                    className="bg-black h-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {currentQ && (
                            <div className="flex flex-col gap-4 border-2 border-black p-5 md:p-6 bg-white shadow-xs">
                                <h3 className="text-base md:text-lg font-bold text-black leading-snug">
                                    {currentQ.text}
                                </h3>

                                <div className="flex flex-col gap-2.5 pt-2">
                                    {currentQ.options.map((opt) => {
                                        const isSelected = answers[currentQ.id] === opt.id;
                                        const color = discColorConfig[opt.discType] || discColorConfig.D;

                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => handleSelectOption(currentQ.id, opt.id)}
                                                className={`text-left p-4 border-2 transition-all flex items-start gap-3.5 ${
                                                    isSelected
                                                        ? "border-black bg-neutral-900 text-white shadow-sm"
                                                        : "border-gray-200 bg-white hover:border-gray-400 text-black"
                                                }`}
                                            >
                                                <div
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 border ${
                                                        isSelected
                                                            ? "bg-white text-black border-white"
                                                            : "bg-gray-100 text-gray-700 border-gray-300"
                                                    }`}
                                                >
                                                    {opt.discType}
                                                </div>
                                                <span className="text-xs md:text-sm font-medium leading-relaxed flex-1">
                                                    {opt.text}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <button
                                type="button"
                                disabled={currentIdx === 0}
                                onClick={handlePrev}
                                className="px-4 py-2 border border-black bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                ← Oldingi
                            </button>

                            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                                {questions.map((q, qIndex) => {
                                    const isAnswered = !!answers[q.id];
                                    const isCurrent = currentIdx === qIndex;

                                    return (
                                        <button
                                            key={q.id}
                                            type="button"
                                            onClick={() => setCurrentIdx(qIndex)}
                                            className={`w-7 h-7 text-xs font-bold border transition-colors flex items-center justify-center ${
                                                isCurrent
                                                    ? "border-black bg-black text-white"
                                                    : isAnswered
                                                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                                    : "border-gray-300 bg-white text-gray-500 hover:border-black"
                                            }`}
                                        >
                                            {qIndex + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {currentIdx < questions.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                                >
                                    Keyingi →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handleSubmit}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? "Saqlanmoqda..." : "✓ Testni Yakunlash"}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
