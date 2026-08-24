"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { sendCandidateEmail, uploadTaskFile } from "../../../services/recruiting-service";

interface EmailActionModalProps {
    candidate: any;
    vacancyTitle?: string;
    type: string;
    onClose: () => void;
    onSuccess: (meta?: { testTaskDeadline?: string }) => void;
}

export default function EmailActionModal({ candidate, vacancyTitle, type, onClose, onSuccess }: EmailActionModalProps) {
    const t = useTranslations("Recruiting");
    const [subject, setSubject] = useState("");
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Test task specific state
    const [taskLink, setTaskLink] = useState("");
    const [taskDeadline, setTaskDeadline] = useState("3 kun ichida");
    const [taskNote, setTaskNote] = useState("");
    const [uploadedFile, setUploadedFile] = useState<{ fileUrl: string; fileName: string } | null>(null);
    const [uploading, setUploading] = useState(false);

    const getSubmissionUrl = () => {
        if (typeof window === "undefined") return "";
        const locale = window.location.pathname.split("/")[1] || "uz";
        return `${window.location.origin}/${locale}/submit-task/${candidate.id}`;
    };

    const buildTaskText = (link: string, file: { fileUrl: string; fileName: string } | null, dl: string, note: string) => {
        const vacName = vacancyTitle ? `"${vacancyTitle}"` : "ochiq";
        let apiOrigin = "http://localhost:5001";
        if (typeof window !== "undefined") {
            try {
                const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
                const parsed = new URL(rawApi, window.location.origin);
                apiOrigin = parsed.origin;
            } catch {
                apiOrigin = window.location.protocol + "//" + window.location.hostname + ":5001";
            }
        }

        const submissionUrl = getSubmissionUrl();

        let body = `Hurmatli ${candidate.fullName},\n\nSizni ${vacName} vakansiyasi bo'yicha keyingi — amaliy test topshirig'i bosqichiga o'tganingiz bilan tabriklaymiz!\n\n`;

        body += `📌 TEST TOPSHIRIG'I MA'LUMOTLARI:\n`;

        if (link.trim()) {
            body += `🔗 Havola: ${link.trim()}\n`;
        }

        if (file) {
            const fullUrl = file.fileUrl.startsWith("http") ? file.fileUrl : `${apiOrigin}${file.fileUrl}`;
            body += `📁 Biriktirilgan fayl: ${file.fileName}\n⬇️ Yuklab olish: ${fullUrl}\n`;
        }

        if (!link.trim() && !file) {
            body += `Topshiriq materiallari bilan yuqoridagi havola orqali tanishishingiz mumkin.\n`;
        }

        if (dl.trim()) {
            body += `\n⏰ Topshirish muddati: ${dl.trim()}\n`;
        }

        if (note.trim()) {
            body += `\n📝 Qo'shimcha ko'rsatma:\n${note.trim()}\n`;
        }

        body += `\n🚀 VAZIFANI TOPSHIRISH UCHUN HAVOLA:\nTopshiriqni bajarib bo'lgach, quyidagi maxsus havola orqali yechim havolasini yoki faylini yuklab topshiring:\n${submissionUrl}\n\nSizga omad tilaymiz!\n\nHurmat bilan,\nHR Bo'limi`;

        return body;
    };

    const calculateDeadlineDate = (dlText: string) => {
        const daysMatch = dlText.match(/(\d+)\s*kun/i);
        if (daysMatch && daysMatch[1]) {
            const days = parseInt(daysMatch[1], 10);
            const d = new Date();
            d.setDate(d.getDate() + days);
            return d.toISOString();
        }
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString();
    };

    useEffect(() => {
        const vacName = vacancyTitle ? `"${vacancyTitle}"` : "ochiq";

        switch (type) {
            case "HIRE":
            case "HIRED":
                setSubject(`Tabriklaymiz! Siz ishga qabul qilindingiz ${vacancyTitle ? `— ${vacancyTitle}` : ""}`);
                setText(`Hurmatli ${candidate.fullName},\n\nSizni ${vacName} vakansiyasi bo'yicha jamoamizga qabul qilinganingiz bilan tabriklaymiz!\n\nBizning HR mutaxassisimiz keyingi qadamlar va rasmiylashtirish bo'yicha siz bilan tez orada bog'lanadi.\n\nHurmat bilan,\nHR Bo'limi`);
                break;

            case "REJECT":
            case "REJECTED":
                setSubject(`Vakansiya bo'yicha javob ${vacancyTitle ? `— ${vacancyTitle}` : ""}`);
                setText(`Hurmatli ${candidate.fullName},\n\n${vacName} vakansiyasiga qiziqish bildirganingiz uchun minnatdorchilik bildiramiz.\n\nAfsuski, ushbu bosqichda sizning nomzodingizni keyingi bosqichlarga o'tkaza olmaymiz. Biz sizning ma'lumotlaringizni bazamizda saqlab qolamiz va kelgusidagi mos loyihalarda siz bilan yana bog'lanishimiz mumkin.\n\nKelgusi ishlaringizda muvaffaqiyatlar tilaymiz!\n\nHurmat bilan,\nHR Bo'limi`);
                break;

            case "INTERVIEW":
                setSubject(`Suhbatga taklifnoma ${vacancyTitle ? `— ${vacancyTitle}` : ""}`);
                setText(`Hurmatli ${candidate.fullName},\n\nSizning rezyumeingiz va nomzodlik arizangizni ko'rib chiqdik hamda ${vacName} vakansiyasi bo'yicha sizni suhbat (intervyu) bosqichiga taklif qilishdan mamnunmiz!\n\nSuhbat sanasi, aniq vaqti va formati (onlayn/oflayn) bo'yicha HR mutaxassisimiz tez orada siz bilan bog'lanadi.\n\nKelgusi suhbatda siz bilan tanishishdan mamnun bo'lamiz!\n\nHurmat bilan,\nHR Bo'limi`);
                break;

            case "TEST_TASK":
                setSubject(`Test topshirig'i ${vacancyTitle ? `— ${vacancyTitle}` : ""}`);
                setText(buildTaskText(taskLink, uploadedFile, taskDeadline, taskNote));
                break;

            case "TASK_REMINDER":
                const submitUrl = getSubmissionUrl();
                setSubject(`Eslatma: Test topshirig'ini topshirish muddati — ${vacancyTitle || "Vakansiya"}`);
                setText(`Hurmatli ${candidate.fullName},\n\nSizga ${vacName} vakansiyasi bo'yicha yuborilgan test topshirig'ini topshirish muddati bo'yicha eslatib o'tmoqchimiz.\n\nTopshiriqni bajarib bo'lgach, uni quyidagi havola orqali yuklab topshirishingizni so'raymiz:\n\n🚀 Topshirish havolasi:\n${submitUrl}\n\nTopshiriq natijangizni kutib qolamiz!\n\nHurmat bilan,\nHR Bo'limi`);
                break;

            case "OFFER":
                setSubject(`Ish taklifi (Job Offer) ${vacancyTitle ? `— ${vacancyTitle}` : ""}`);
                setText(`Hurmatli ${candidate.fullName},\n\nSiz ${vacName} vakansiyasi bo'yicha barcha saralash bosqichlaridan muvaffaqiyatli o'tdingiz!\n\nSizga rasmiy ish taklifini (Job Offer) taqdim etishdan mamnunmiz. Tafsilotlar bo'yicha HR mutaxassisimiz siz bilan bog'lanadi.\n\nHurmat bilan,\nHR Bo'limi`);
                break;

            default:
                setSubject(`Xabarnoma ${vacancyTitle ? `— ${vacancyTitle}` : ""}`);
                setText(`Hurmatli ${candidate.fullName},\n\n${vacName} vakansiyasi bo'yicha sizning arizangiz holati yangilandi.\n\nHurmat bilan,\nHR Bo'limi`);
                break;
        }
    }, [candidate, type, vacancyTitle]);

    const handleTaskParamChange = (newLink: string, newFile: any, newDl: string, newNote: string) => {
        setText(buildTaskText(newLink, newFile, newDl, newNote));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const res = await uploadTaskFile(file);
            setUploadedFile(res);
            handleTaskParamChange(taskLink, res, taskDeadline, taskNote);
        } catch (err: any) {
            alert(err.message || "Faylni yuklashda xatolik yuz berdi");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        handleTaskParamChange(taskLink, null, taskDeadline, taskNote);
    };

    const getModalTitle = (stageType: string) => {
        switch (stageType) {
            case "HIRE":
            case "HIRED":
                return t("emailModal.titleHire");
            case "REJECT":
            case "REJECTED":
                return t("emailModal.titleReject");
            case "INTERVIEW":
                return t("emailModal.titleInterview");
            case "TEST_TASK":
                return t("emailModal.titleTestTask");
            case "TASK_REMINDER":
                return t("emailModal.titleTaskReminder");
            case "OFFER":
                return t("emailModal.titleOffer");
            default:
                return t("emailModal.titleDefault");
        }
    };

    const handleSend = async () => {
        setLoading(true);
        try {
            const res = await sendCandidateEmail(candidate.id, {
                subject,
                text,
                type
            });
            const meta = type === "TEST_TASK" ? { testTaskDeadline: calculateDeadlineDate(taskDeadline) } : undefined;
            if (res.previewUrl) {
                setPreviewUrl(res.previewUrl);
            } else {
                onSuccess(meta);
            }
        } catch (error: any) {
            alert(error.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-black mb-1">
                            {getModalTitle(type)}
                        </h2>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {t("emailModal.recipient")}: {candidate.fullName} ({candidate.email})
                        </div>
                    </div>
                    {!previewUrl && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-black transition-colors text-lg"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {previewUrl ? (
                        <div className="text-center py-8 flex flex-col items-center justify-center gap-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-2">
                                ✓
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-black uppercase">
                                {t("emailModal.sentSuccess")}
                            </h3>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest max-w-md">
                                {t("emailModal.sentSuccessNotice")}
                            </p>
                            <a 
                                href={previewUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-block px-8 py-4 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors"
                            >
                                {t("emailModal.previewEmail")}
                            </a>
                            <button
                                onClick={() => onSuccess(type === "TEST_TASK" ? { testTaskDeadline: calculateDeadlineDate(taskDeadline) } : undefined)}
                                className="mt-4 px-8 py-4 bg-black text-white font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors"
                            >
                                {t("emailModal.close")}
                            </button>
                        </div>
                    ) : (
                        <>
                            {type === "TEST_TASK" && (
                                <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-sm flex flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">📌</span>
                                        <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                                            {t("emailModal.testTaskSetup")}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                                                {t("emailModal.taskLink")}
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://github.com/... yoki Docs / Figma"
                                                value={taskLink}
                                                onChange={(e) => {
                                                    setTaskLink(e.target.value);
                                                    handleTaskParamChange(e.target.value, uploadedFile, taskDeadline, taskNote);
                                                }}
                                                className="w-full p-2.5 bg-white border border-gray-300 text-xs focus:outline-none focus:border-black rounded-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                                                {t("emailModal.taskDeadline")}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={t("emailModal.defaultDeadline")}
                                                value={taskDeadline}
                                                onChange={(e) => {
                                                    setTaskDeadline(e.target.value);
                                                    handleTaskParamChange(taskLink, uploadedFile, e.target.value, taskNote);
                                                }}
                                                className="w-full p-2.5 bg-white border border-gray-300 text-xs focus:outline-none focus:border-black rounded-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                                            {t("emailModal.taskFile")}
                                        </label>
                                        {uploadedFile ? (
                                            <div className="flex items-center justify-between bg-white p-3 border border-green-300 rounded-sm">
                                                <div className="flex items-center gap-2 text-xs font-bold text-green-800">
                                                    <span>📎</span>
                                                    <span className="truncate max-w-[300px]">{uploadedFile.fileName}</span>
                                                    <span className="text-[10px] font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded">{t("emailModal.uploaded")}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider"
                                                >
                                                    {t("emailModal.removeFile")}
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-gray-300 hover:border-black cursor-pointer rounded-sm transition-colors text-xs font-bold text-gray-600">
                                                <span>📂</span>
                                                <span>{uploading ? t("emailModal.uploading") : t("emailModal.chooseFile")}</span>
                                                <input
                                                    type="file"
                                                    disabled={uploading}
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                                            {t("emailModal.customNote")}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Masalan: Natijani GitHub repository va demo video bilan yuboring."
                                            value={taskNote}
                                            onChange={(e) => {
                                                setTaskNote(e.target.value);
                                                handleTaskParamChange(taskLink, uploadedFile, taskDeadline, e.target.value);
                                            }}
                                            className="w-full p-2.5 bg-white border border-gray-300 text-xs focus:outline-none focus:border-black rounded-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    {t("emailModal.subject")}
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full p-4 border border-gray-200 text-sm focus:outline-none focus:border-black font-bold"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    {t("emailModal.messageText")}
                                </label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full p-4 border border-gray-200 text-sm focus:outline-none focus:border-black min-h-[220px] resize-y leading-relaxed font-mono text-xs"
                                />
                            </div>

                            <div className="bg-gray-50 p-4 border border-gray-200 text-xs text-gray-500 font-bold uppercase tracking-widest flex gap-2">
                                <span className="text-blue-500">ℹ</span> {t("emailModal.htmlNotice")}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                <button
                                    onClick={handleSend}
                                    disabled={loading || uploading}
                                    className="flex-1 px-6 py-3.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {loading ? t("emailModal.sending") : t("emailModal.sendEmail")}
                                </button>
                                <button
                                    onClick={() => onSuccess(type === "TEST_TASK" ? { testTaskDeadline: calculateDeadlineDate(taskDeadline) } : undefined)}
                                    disabled={loading || uploading}
                                    className="px-6 py-3.5 bg-gray-200 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors disabled:opacity-50"
                                    title="Email yubormasdan faqat statusni o'zgartirish"
                                >
                                    {t("emailModal.skipEmail")}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={loading || uploading}
                                    className="px-6 py-3.5 bg-gray-100 text-gray-700 text-[11px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {t("emailModal.cancel")}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}


