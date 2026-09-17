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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border-2 border-black max-w-4xl w-full p-6 md:p-8 flex flex-col gap-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b-2 border-black pb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            HR Boshqaruv Paneli
                        </span>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                            <span>⚙️ eNPS So'rovnoma Savollarini Boshqarish</span>
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

                {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>✓ {successMessage}</span>
                        <button onClick={() => setSuccessMessage(null)} className="text-xs font-bold">✕</button>
                    </div>
                )}

                {!isCreating && !editingQuestion ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Mavjud So'rovnomalar ({questions.length})
                            </span>
                            <button
                                onClick={handleOpenCreate}
                                className="px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                                <span>➕</span>
                                <span>Yangi Savol Qo'shish</span>
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold uppercase text-gray-500">Yuklanmoqda...</span>
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="py-8 text-center bg-gray-50 border border-gray-200 p-6 text-xs text-gray-500 font-bold uppercase">
                                Hozircha savollar yo'q. Yuqoridagi tugma orqali yangi savol qo'shing.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {questions.map((q, idx) => (
                                    <div
                                        key={q.id}
                                        className={`p-4 border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                            q.isActive ? "border-black bg-white" : "border-gray-200 bg-gray-50 opacity-75"
                                        }`}
                                    >
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-black text-white">
                                                    #{idx + 1}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                                                        q.isActive
                                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                                            : "bg-gray-200 text-gray-700 border-gray-300"
                                                    }`}
                                                >
                                                    {q.isActive ? "Faol (Active)" : "Nofaol (Inactive)"}
                                                </span>
                                                <span className="text-[10px] font-mono font-bold text-gray-500">
                                                    Shkala: {q.minScale} dan {q.maxScale} gacha
                                                </span>
                                            </div>
                                            <span className="text-sm font-black text-black leading-snug">
                                                {q.question}
                                            </span>
                                            {q.description && (
                                                <span className="text-xs text-gray-600">
                                                    {q.description}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                                                <span>Min: {q.minScale} ({q.minLabel})</span>
                                                <span>&bull;</span>
                                                <span>Max: {q.maxScale} ({q.maxLabel})</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(q)}
                                                className={`px-3 py-1.5 text-xs font-bold uppercase border transition-colors ${
                                                    q.isActive
                                                        ? "border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                                        : "border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                                                }`}
                                            >
                                                {q.isActive ? "O'chirish (Deactivate)" : "Yoqish (Activate)"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(q)}
                                                className="px-3 py-1.5 bg-white border border-black text-black text-xs font-bold uppercase hover:bg-gray-100 transition-colors"
                                            >
                                                ✏️ Tahrirlash
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(q.id, q.question)}
                                                className="px-3 py-1.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold uppercase hover:bg-rose-100 transition-colors"
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
                    <form onSubmit={handleSaveForm} className="flex flex-col gap-5 bg-gray-50 p-6 border-2 border-black">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                            <h3 className="text-base font-black uppercase text-black">
                                {editingQuestion ? "✏️ Savolni Tahrirlash" : "➕ Yangi eNPS Savoli Qo'shish"}
                            </h3>
                            <button
                                type="button"
                                onClick={handleCancelForm}
                                className="text-xs font-bold text-gray-500 hover:text-black uppercase"
                            >
                                Orqaga
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-black">
                                Savol matni *
                            </label>
                            <textarea
                                value={formQuestion}
                                onChange={(e) => setFormQuestion(e.target.value)}
                                placeholder="Masalan: Kompaniyamizda ishlash tajribangizni do'stlaringizga tavsiya qilasizmi?"
                                rows={3}
                                required
                                className="w-full border-2 border-gray-300 p-3 text-xs bg-white focus:border-black focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Qo'shimcha tavsif yoki yo'riqnoma (Ixtiyoriy)
                            </label>
                            <input
                                type="text"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Masalan: 0 — Umuman tavsiya qilmayman, 10 — Albatta tavsiya qilaman"
                                className="w-full border-2 border-gray-300 p-2.5 text-xs bg-white focus:border-black focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Minimal Shkala Qiymati (Min Score)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={formMaxScale - 1}
                                    value={formMinScale}
                                    onChange={(e) => setFormMinScale(Number(e.target.value))}
                                    className="w-full border-2 border-gray-300 p-2.5 text-xs bg-white focus:border-black focus:outline-none font-mono font-bold"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Maksimal Shkala Qiymati (Max Score)
                                </label>
                                <input
                                    type="number"
                                    min={formMinScale + 1}
                                    max={100}
                                    value={formMaxScale}
                                    onChange={(e) => setFormMaxScale(Number(e.target.value))}
                                    className="w-full border-2 border-gray-300 p-2.5 text-xs bg-white focus:border-black focus:outline-none font-mono font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Min qiymat yozuvi (Label)
                                </label>
                                <input
                                    type="text"
                                    value={formMinLabel}
                                    onChange={(e) => setFormMinLabel(e.target.value)}
                                    placeholder="Tavsiya qilmayman"
                                    className="w-full border-2 border-gray-300 p-2.5 text-xs bg-white focus:border-black focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Max qiymat yozuvi (Label)
                                </label>
                                <input
                                    type="text"
                                    value={formMaxLabel}
                                    onChange={(e) => setFormMaxLabel(e.target.value)}
                                    placeholder="Albatta tavsiya qilaman"
                                    className="w-full border-2 border-gray-300 p-2.5 text-xs bg-white focus:border-black focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formIsActive}
                                onChange={(e) => setFormIsActive(e.target.checked)}
                                className="w-4 h-4 accent-black"
                            />
                            <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-wider text-black cursor-pointer">
                                Ushbu so'rovnoma faol (xodimlarga ko'rinadi)
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleCancelForm}
                                className="px-5 py-2.5 border border-black bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
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
