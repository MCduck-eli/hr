"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { createCycle, updateCycle } from "@/src/services/feedback360-service";

export default function CreateFeedbackCycleModal({
    onClose,
    onSuccess,
    initialData,
    showToast,
}: {
    onClose: () => void;
    onSuccess: (isEdit?: boolean) => void;
    initialData?: any;
    showToast?: (message: string, type?: "success" | "error") => void;
}) {
    const t = useTranslations("Feedback360");
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [startDate, setStartDate] = useState(
        initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : ""
    );
    const [endDate, setEndDate] = useState(
        initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : ""
    );
    const [loading, setLoading] = useState(false);

    const [questions, setQuestions] = useState<{ competency: string; text: string; order?: number }[]>(
        initialData?.questions && initialData.questions.length > 0 
            ? initialData.questions 
            : [{ competency: "", text: "" }]
    );

    const handleAddQuestion = () => {
        setQuestions([...questions, { competency: "", text: "" }]);
    };

    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const handleQuestionChange = (index: number, field: "competency" | "text", value: string) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validQuestions = questions.filter(q => q.competency.trim() && q.text.trim());
        
        if (validQuestions.length === 0) {
            if (showToast) {
                showToast(t("errorNoQuestions") || "Iltimos, kamida bitta savol qo'shing.", "error");
            }
            return;
        }
        
        setLoading(true);
        try {
            const payload = {
                title,
                description,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                questions: validQuestions.map((q, i) => ({
                    competency: q.competency,
                    text: q.text,
                    order: i + 1,
                })),
            };

            if (initialData?.id) {
                await updateCycle(initialData.id, payload);
                onSuccess(true);
            } else {
                await createCycle(payload);
                onSuccess(false);
            }
        } catch (error: any) {
            console.error(error);
            if (showToast) {
                showToast(error.message || t("errorDefault") || "Xatolik yuz berdi", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 pt-6 border-t border-gray-100"
        >
            <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 overflow-hidden">
                <svg
                    className="absolute inset-0 w-full h-full z-0 opacity-[0.10] pointer-events-none text-slate-300 stroke-current"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="girih-pattern-feedback-create-cycle" width="240" height="240" patternUnits="userSpaceOnUse">
                            <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z" />
                                <path d="M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z" />
                                <circle cx="120" cy="120" r="10" />
                                <path d="M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180" />
                                <path d="M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216" />
                                <path d="M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230" />
                                <path d="M120 0V60M120 180V240M0 120H60M180 120H240" />
                                <path d="M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240" />
                                <path d="M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198" />
                                <path d="M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60" />
                                <path d="M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90" />
                            </g>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#girih-pattern-feedback-create-cycle)" />
                </svg>

                <div className="relative z-10">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 mb-6">
                    {t("createNewCycle") || "Yangi sikl yaratish"}
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {t("cycleTitle") || "Sikl nomi"}
                            </label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="p-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm"
                                placeholder="Masalan: 2025 Yillik Baholash"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {t("cycleInstructions") || "Baholash yo'riqnomasi va qoidalari"}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="p-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm"
                                placeholder="Baholovchilar uchun batafsil yo'riqnoma va qoidalarni shu yerga yozing..."
                                rows={4}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {t("startDate") || "Boshlanish sanasi"}
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="p-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {t("endDate") || "Tugash sanasi"}
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="p-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                                {t("questionsList") || "Baholash Savollari"}
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddQuestion}
                                className="text-xs font-semibold uppercase tracking-wider bg-violet-50 text-violet-700 hover:bg-violet-100 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                                + {t("addQuestion") || "Savol Qo'shish"}
                            </button>
                        </div>
                        
                        {questions.map((q, idx) => (
                            <div key={idx} className="flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-xl relative group hover:border-violet-200 transition-all shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveQuestion(idx)}
                                    className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer shadow-xs"
                                    title="O'chirish"
                                >
                                    ✕
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1 md:col-span-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            {t("competencyName") || "Kompetensiya"}
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={q.competency}
                                            onChange={(e) => handleQuestionChange(idx, "competency", e.target.value)}
                                            className="p-2.5 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm"
                                            placeholder="Masalan: Teamwork"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 md:col-span-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            {t("questionText") || "Savol matni"}
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                                            className="p-2.5 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all text-sm"
                                            placeholder="Masalan: Xodim jamoada qanday ishlaydi?"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4 mt-2 border-t border-gray-100 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-xs font-semibold uppercase tracking-wider px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                        >
                            {t("cancel") || "Bekor qilish"}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="text-xs font-bold uppercase tracking-wider bg-[#9327FF] text-white px-8 py-2.5 hover:opacity-90 rounded-xl transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                        >
                            {loading ? "..." : (t("createBtn") || "Yaratish")}
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </motion.div>
    );
}
