import { useState } from "react";
import { useTranslations } from "next-intl";
import { createCycle, updateCycle } from "@/src/services/feedback360-service";

export default function CreateFeedbackCycleModal({
    onClose,
    onSuccess,
    initialData,
}: {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
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
        
        // Filter out empty questions
        const validQuestions = questions.filter(q => q.competency.trim() && q.text.trim());
        
        if (validQuestions.length === 0) {
            alert(t("errorNoQuestions") || "Iltimos, kamida bitta savol qo'shing.");
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
                alert("Sikl muvaffaqiyatli yangilandi!");
            } else {
                await createCycle(payload);
                alert(t("successCreateCycle") || "Cycle created successfully!");
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            alert(t("errorDefault") || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="bg-gray-50 p-8 border border-gray-200">
                <h2 className="text-lg font-bold uppercase tracking-widest text-black mb-6">
                    {t("createNewCycle") || "Yangi sikl yaratish"}
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 bg-white p-6 border border-gray-200">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                {t("cycleTitle") || "Sikl nomi"}
                            </label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="p-3 border border-gray-200 focus:border-black focus:outline-none transition-colors text-sm"
                                placeholder="Masalan: 2025 Yillik Baholash"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                {t("cycleInstructions") || "Baholash yo'riqnomasi va qoidalari"}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="p-3 border border-gray-200 focus:border-black focus:outline-none transition-colors text-sm"
                                placeholder="Baholovchilar uchun batafsil yo'riqnoma va qoidalarni shu yerga yozing..."
                                rows={4}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    {t("startDate") || "Boshlanish sanasi"}
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="p-3 border border-gray-200 focus:border-black focus:outline-none transition-colors text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    {t("endDate") || "Tugash sanasi"}
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="p-3 border border-gray-200 focus:border-black focus:outline-none transition-colors text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-black">
                                {t("questionsList") || "Baholash Savollari"}
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddQuestion}
                                className="text-xs font-bold uppercase tracking-widest bg-black text-white px-3 py-1.5 hover:bg-gray-800 transition-colors"
                            >
                                + {t("addQuestion") || "Savol Qo'shish"}
                            </button>
                        </div>
                        
                        {questions.map((q, idx) => (
                            <div key={idx} className="flex flex-col gap-3 p-4 bg-white border border-gray-200 relative group hover:border-black transition-colors">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveQuestion(idx)}
                                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="O'chirish"
                                >
                                    ✕
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1 md:col-span-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {t("competencyName") || "Kompetensiya"}
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={q.competency}
                                            onChange={(e) => handleQuestionChange(idx, "competency", e.target.value)}
                                            className="p-2 border border-gray-200 focus:border-black focus:outline-none transition-colors text-sm"
                                            placeholder="Masalan: Teamwork"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 md:col-span-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {t("questionText") || "Savol matni"}
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                                            className="p-2 border border-gray-200 focus:border-black focus:outline-none transition-colors text-sm"
                                            placeholder="Masalan: Xodim jamoada qanday ishlaydi?"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4 mt-2 border-t border-gray-200 gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-xs font-bold uppercase tracking-widest px-6 py-3 border border-black hover:bg-gray-100 transition-colors"
                        >
                            {t("cancel") || "Bekor qilish"}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="text-xs font-bold uppercase tracking-widest bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {loading ? "..." : (t("createBtn") || "Yaratish")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
