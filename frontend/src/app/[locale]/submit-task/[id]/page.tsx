"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicCandidateTask, submitCandidateTask } from "@/src/services/recruiting-service";

export default function CandidateTaskSubmitPage() {
    const params = useParams();
    const candidateId = params.id as string;

    const [candidateData, setCandidateData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [submissionUrl, setSubmissionUrl] = useState("");
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    const [submissionNote, setSubmissionNote] = useState("");

    useEffect(() => {
        const loadTask = async () => {
            try {
                if (candidateId) {
                    const data = await getPublicCandidateTask(candidateId);
                    setCandidateData(data);
                    if (data.testTaskSubmittedAt) {
                        setSuccess(true);
                        setSubmissionUrl(data.testTaskSubmissionUrl || "");
                        setSubmissionNote(data.testTaskSubmissionNote || "");
                    }
                }
            } catch (err: any) {
                setError(err.message || "Ma'lumotlarni yuklab bo'lmadi.");
            } finally {
                setLoading(false);
            }
        };

        loadTask();
    }, [candidateId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!submissionUrl.trim() && !submissionFile) {
            setError("Iltimos, topshiriq havolasini (link) kiriting yoki yechim faylini yuklang.");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            if (submissionUrl.trim()) formData.append("submissionUrl", submissionUrl.trim());
            if (submissionFile) formData.append("file", submissionFile);
            if (submissionNote.trim()) formData.append("submissionNote", submissionNote.trim());

            await submitCandidateTask(candidateId, formData);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Topshiriqni yuborishda xatolik yuz berdi.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 animate-pulse">
                    Yuklanmoqda...
                </div>
            </div>
        );
    }

    if (error && !candidateData) {
        return (
            <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
                <div className="bg-white border border-red-200 p-8 max-w-md w-full text-center">
                    <div className="text-red-500 text-3xl mb-3">⚠️</div>
                    <h2 className="text-lg font-bold uppercase text-black mb-2">Xatolik</h2>
                    <p className="text-xs text-gray-600 mb-6">{error}</p>
                </div>
            </div>
        );
    }

    const vacancyTitle = candidateData?.primaryVacancy?.title || "Vakansiya";
    const companyName = candidateData?.primaryVacancy?.companyName || "Kompaniya";

    return (
        <div className="min-h-screen bg-[#fbfbfb] text-black flex flex-col justify-between">
            <header className="border-b border-gray-200 bg-white py-6 px-8 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-black block"></span>
                    <span className="text-lg font-black uppercase tracking-tight">HR PLATFORM</span>
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Test topshirig'i portali
                </div>
            </header>

            <main className="max-w-2xl w-full mx-auto p-6 md:p-12 flex-1 flex flex-col justify-center">
                <div className="bg-white border border-gray-200 p-8 md:p-12 shadow-sm rounded-sm">
                    <div className="border-b border-gray-200 pb-6 mb-8">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">
                            {companyName} • {vacancyTitle}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black mb-2">
                            Test topshirig'ini yuborish
                        </h1>
                        <p className="text-xs text-gray-600 font-medium">
                            Hurmatli <span className="font-bold text-black">{candidateData?.fullName}</span>, ushbu sahifa orqali test topshirig'ingiz yechimini yuklashingiz yoki havolasini qoldirishingiz mumkin.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center py-10 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-2">
                                ✓
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                                Topshiriq muvaffaqiyatli qabul qilindi!
                            </h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest max-w-md">
                                Sizning javobingiz qabul qilindi va HR mutaxassislari tomonidan ko'rib chiqiladi. Natija bo'yicha elektron pochtangizga xabar yuboriladi.
                            </p>
                            {submissionUrl && (
                                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 text-xs text-left w-full rounded">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Yuborilgan havola:</div>
                                    <a href={submissionUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline break-all">
                                        {submissionUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-700 mb-2">
                                    Topshiriq havolasi (GitHub, Figma, Google Drive, Demo)
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://github.com/username/project"
                                    value={submissionUrl}
                                    onChange={(e) => setSubmissionUrl(e.target.value)}
                                    className="w-full p-3.5 border border-gray-200 text-sm focus:outline-none focus:border-black rounded-sm"
                                />
                            </div>

                            <div className="flex items-center gap-4 my-1">
                                <div className="flex-1 h-[1px] bg-gray-200"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Yoki / Va</span>
                                <div className="flex-1 h-[1px] bg-gray-200"></div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-700 mb-2">
                                    Topshiriq faylini yuklash (ZIP, RAR, PDF, DOCX)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                                    className="w-full p-3 border border-gray-200 text-xs focus:outline-none focus:border-black rounded-sm bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-bold file:uppercase file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
                                />
                                {submissionFile && (
                                    <div className="mt-2 text-xs font-bold text-green-700 flex items-center gap-1">
                                        <span>✓ Tanlangan fayl:</span>
                                        <span>{submissionFile.name} ({(submissionFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-700 mb-2">
                                    Izoh yoki ko'rsatmalar (ixtiyoriy)
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Loyiha bo'yicha qo'shimcha ma'lumotlar, ishga tushirish yo'riqnomasi yoki sharhlar..."
                                    value={submissionNote}
                                    onChange={(e) => setSubmissionNote(e.target.value)}
                                    className="w-full p-3.5 border border-gray-200 text-sm focus:outline-none focus:border-black rounded-sm resize-y"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2"
                            >
                                {submitting ? "Yuborilmoqda..." : "Topshiriqni Yuborish"}
                            </button>
                        </form>
                    )}
                </div>
            </main>

            <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                &copy; {new Date().getFullYear()} {companyName}. Barcha huquqlar himoyalangan.
            </footer>
        </div>
    );
}
