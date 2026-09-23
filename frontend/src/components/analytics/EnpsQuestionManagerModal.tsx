"use client";

import { useState, useEffect } from "react";
import {
    fetchEnpsQuestions,
    createEnpsQuestion,
    updateEnpsQuestion,
    deleteEnpsQuestion,
    EnpsQuestion,
} from "@/src/services/enps-service";

interface EnpsQuestionManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuestionsUpdated?: () => void;
}

export default function EnpsQuestionManagerModal({
    isOpen,
    onClose,
    onQuestionsUpdated,
}: EnpsQuestionManagerModalProps) {
    const [questions, setQuestions] = useState<EnpsQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [editingQuestion, setEditingQuestion] = useState<EnpsQuestion | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [formQuestion, setFormQuestion] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formMinScale, setFormMinScale] = useState(0);
    const [formMaxScale, setFormMaxScale] = useState(10);
    const [formMinLabel, setFormMinLabel] = useState("Tavsiya qilmayman");
    const [formMaxLabel, setFormMaxLabel] = useState("Albatta tavsiya qilaman");
    const [formIsActive, setFormIsActive] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchEnpsQuestions(false);
            setQuestions(data);
        } catch (err: any) {
            setError(err.message || "Savollarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadQuestions();
            setIsCreating(false);
            setEditingQuestion(null);
            setSuccessMessage(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOpenCreate = () => {
        setEditingQuestion(null);
        setFormQuestion("");
        setFormDescription("");
        setFormMinScale(0);
        setFormMaxScale(10);
        setFormMinLabel("Tavsiya qilmayman");
        setFormMaxLabel("Albatta tavsiya qilaman");
        setFormIsActive(true);
        setIsCreating(true);
        setError(null);
    };

    const handleOpenEdit = (q: EnpsQuestion) => {
        setIsCreating(false);
        setEditingQuestion(q);
        setFormQuestion(q.question);
        setFormDescription(q.description || "");
        setFormMinScale(q.minScale);
        setFormMaxScale(q.maxScale);
        setFormMinLabel(q.minLabel);
        setFormMaxLabel(q.maxLabel);
        setFormIsActive(q.isActive);
        setError(null);
    };

    const handleCancelForm = () => {
        setIsCreating(false);
        setEditingQuestion(null);
        setError(null);
    };

    const handleSaveForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formQuestion.trim()) {
            setError("Savol matnini kiritish shart");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const payload = {
                question: formQuestion.trim(),
                description: formDescription.trim() || undefined,
                minScale: Number(formMinScale),
                maxScale: Number(formMaxScale),
                minLabel: formMinLabel.trim() || "Tavsiya qilmayman",
                maxLabel: formMaxLabel.trim() || "Albatta tavsiya qilaman",
                isActive: formIsActive,
            };

            if (editingQuestion) {
                await updateEnpsQuestion(editingQuestion.id, payload);
                setSuccessMessage("Savol muvaffaqiyatli yangilandi");
            } else {
                await createEnpsQuestion(payload);
                setSuccessMessage("Yangi savol muvaffaqiyatli qo'shildi");
            }

            setIsCreating(false);
            setEditingQuestion(null);
            await loadQuestions();
            if (onQuestionsUpdated) onQuestionsUpdated();
        } catch (err: any) {
            setError(err.message || "Saqlashda xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, qText: string) => {
        if (!window.confirm(`Haqiqatan ham "${qText}" savolini o'chirmoqchimisiz?`)) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await deleteEnpsQuestion(id);
            setSuccessMessage("Savol o'chirildi");
            await loadQuestions();
            if (onQuestionsUpdated) onQuestionsUpdated();
        } catch (err: any) {
            setError(err.message || "O'chirishda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (q: EnpsQuestion) => {
        try {
            await updateEnpsQuestion(q.id, { isActive: !q.isActive });
            await loadQuestions();
            if (onQuestionsUpdated) onQuestionsUpdated();
        } catch (err: any) {
            setError(err.message || "Holatni o'zgartirishda xatolik");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-100 max-w-4xl w-full p-6 md:p-8 flex flex-col gap-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex flex-col gap-1">
                        <span className="px-2.5 py-0.5 bg-purple-50 text-[#9327FF] text-xs font-bold rounded-lg w-fit">
                            HR So'rovnomalar
                        </span>
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span>⚙️ eNPS So'rovnoma Savollarini Boshqarish</span>
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center justify-center font-bold text-sm"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-xs font-bold">✕</button>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between">
                        <span>✓ {successMessage}</span>
                        <button onClick={() => setSuccessMessage(null)} className="text-xs font-bold">✕</button>
                    </div>
                )}

                {!isCreating && !editingQuestion ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Mavjud So'rovnomalar ({questions.length})
                            </span>
                            <button
                                onClick={handleOpenCreate}
                                className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-4 py-2 transition-all duration-200 shadow-sm flex items-center gap-1.5 text-xs"
                            >
                                <span>➕</span>
                                <span>Yangi Savol Qo'shish</span>
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <div className="w-8 h-8 border-3 border-[#9327FF] border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold uppercase text-slate-400">Yuklanmoqda...</span>
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="py-8 text-center bg-slate-50 border border-slate-100 rounded-2xl p-6 text-xs text-slate-500 font-bold uppercase">
                                Hozircha savollar yo'q. Yuqoridagi tugma orqali yangi savol qo'shing.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {questions.map((q, idx) => (
                                    <div
                                        key={q.id}
                                        className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                            q.isActive ? "border-slate-100 bg-white shadow-sm" : "border-slate-100 bg-slate-50/60 opacity-75"
                                        }`}
                                    >
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded-md">
                                                    #{idx + 1}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                                        q.isActive
                                                            ? "bg-emerald-50 text-emerald-800"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    {q.isActive ? "Faol (Active)" : "Nofaol (Inactive)"}
                                                </span>
                                                <span className="text-[10px] font-mono font-medium text-slate-400">
                                                    Shkala: {q.minScale} dan {q.maxScale} gacha
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 leading-snug">
                                                {q.question}
                                            </span>
                                            {q.description && (
                                                <span className="text-xs text-slate-500">
                                                    {q.description}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400 mt-1">
                                                <span>Min: {q.minScale} ({q.minLabel})</span>
                                                <span>&bull;</span>
                                                <span>Max: {q.maxScale} ({q.maxLabel})</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(q)}
                                                className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                                                    q.isActive
                                                        ? "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
                                                        : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200"
                                                }`}
                                            >
                                                {q.isActive ? "O'chirish" : "Yoqish"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(q)}
                                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs"
                                            >
                                                ✏️ Tahrirlash
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(q.id, q.question)}
                                                className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs"
                                            >
                                                🗑️ O'chirish
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSaveForm} className="flex flex-col gap-5 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">
                                {editingQuestion ? "✏️ Savolni Tahrirlash" : "➕ Yangi eNPS Savoli Qo'shish"}
                            </h3>
                            <button
                                type="button"
                                onClick={handleCancelForm}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                            >
                                Orqaga
                            </button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">
                                Savol matni *
                            </label>
                            <textarea
                                value={formQuestion}
                                onChange={(e) => setFormQuestion(e.target.value)}
                                placeholder="Masalan: Kompaniyamizda ishlash tajribangizni do'stlaringizga tavsiya qilasizmi?"
                                rows={3}
                                required
                                className="w-full border border-slate-200 p-3 text-xs bg-white rounded-xl focus:border-[#9327FF] focus:ring-2 focus:ring-[#9327FF]/10 focus:outline-none transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">
                                Qo'shimcha tavsif yoki yo'riqnoma (Ixtiyoriy)
                            </label>
                            <input
                                type="text"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Masalan: 0 — Umuman tavsiya qilmayman, 10 — Albatta tavsiya qilaman"
                                className="w-full border border-slate-200 p-2.5 text-xs bg-white rounded-xl focus:border-[#9327FF] focus:ring-2 focus:ring-[#9327FF]/10 focus:outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Minimal Shkala Qiymati (Min Score)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={formMaxScale - 1}
                                    value={formMinScale}
                                    onChange={(e) => setFormMinScale(Number(e.target.value))}
                                    className="w-full border border-slate-200 p-2.5 text-xs bg-white rounded-xl focus:border-[#9327FF] focus:outline-none font-mono font-bold"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Maksimal Shkala Qiymati (Max Score)
                                </label>
                                <input
                                    type="number"
                                    min={formMinScale + 1}
                                    max={100}
                                    value={formMaxScale}
                                    onChange={(e) => setFormMaxScale(Number(e.target.value))}
                                    className="w-full border border-slate-200 p-2.5 text-xs bg-white rounded-xl focus:border-[#9327FF] focus:outline-none font-mono font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Min qiymat yozuvi (Label)
                                </label>
                                <input
                                    type="text"
                                    value={formMinLabel}
                                    onChange={(e) => setFormMinLabel(e.target.value)}
                                    placeholder="Tavsiya qilmayman"
                                    className="w-full border border-slate-200 p-2.5 text-xs bg-white rounded-xl focus:border-[#9327FF] focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Max qiymat yozuvi (Label)
                                </label>
                                <input
                                    type="text"
                                    value={formMaxLabel}
                                    onChange={(e) => setFormMaxLabel(e.target.value)}
                                    placeholder="Albatta tavsiya qilaman"
                                    className="w-full border border-slate-200 p-2.5 text-xs bg-white rounded-xl focus:border-[#9327FF] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formIsActive}
                                onChange={(e) => setFormIsActive(e.target.checked)}
                                className="w-4 h-4 accent-[#9327FF] rounded-sm"
                            />
                            <label htmlFor="isActive" className="text-xs font-semibold text-slate-800 cursor-pointer">
                                Ushbu so'rovnoma faol (xodimlarga ko'rinadi)
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80">
                            <button
                                type="button"
                                onClick={handleCancelForm}
                                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium rounded-xl text-xs transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-5 py-2 transition-all duration-200 shadow-sm text-xs disabled:opacity-50"
                            >
                                {saving ? "Saqlanmoqda..." : "✓ Saqlash"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
