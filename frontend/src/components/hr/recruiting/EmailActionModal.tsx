"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { sendCandidateEmail, uploadTaskFile } from "../../../services/recruiting-service";

interface EmailActionModalProps {
    candidate: any;
    vacancyTitle?: string;
    companyName?: string;
    type: string;
    onClose: () => void;
    onSuccess: (meta?: { testTaskDeadline?: string }) => void;
}

type EmailLang = "uz" | "ru" | "en";

export default function EmailActionModal({
    candidate,
    vacancyTitle,
    companyName = "",
    type,
    onClose,
    onSuccess,
}: EmailActionModalProps) {
    const t = useTranslations("Recruiting");

    // Detect initial language from URL or fallback to "uz"
    const [emailLang, setEmailLang] = useState<EmailLang>(() => {
        if (typeof window !== "undefined") {
            const loc = window.location.pathname.split("/")[1];
            if (loc === "ru" || loc === "en" || loc === "uz") return loc as EmailLang;
        }
        return "uz";
    });

    const [company, setCompany] = useState(companyName || "");
    const [sender, setSender] = useState(() => {
        if (emailLang === "ru") return "HR Отдел";
        if (emailLang === "en") return "HR Department";
        return "HR Bo'limi";
    });

    const [subject, setSubject] = useState("");
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Test task specific state
    const [taskLink, setTaskLink] = useState("");
    const [taskDeadline, setTaskDeadline] = useState(() => {
        if (emailLang === "ru") return "в течение 3 дней";
        if (emailLang === "en") return "within 3 days";
        return "3 kun ichida";
    });
    const [taskNote, setTaskNote] = useState("");
    const [uploadedFile, setUploadedFile] = useState<{ fileUrl: string; fileName: string } | null>(null);
    const [uploading, setUploading] = useState(false);

    const getSubmissionUrl = () => {
        if (typeof window === "undefined") return "";
        const locale = window.location.pathname.split("/")[1] || emailLang || "uz";
        return `${window.location.origin}/${locale}/submit-task/${candidate.id}`;
    };

    const generateEmailContent = useCallback((
        lang: EmailLang,
        currentCompany: string,
        currentSender: string,
        currentLink: string,
        currentFile: { fileUrl: string; fileName: string } | null,
        currentDeadline: string,
        currentNote: string
    ) => {
        const comp = currentCompany.trim() ? `"${currentCompany.trim()}"` : (lang === "ru" ? "нашей компании" : lang === "en" ? "our company" : "kompaniyamiz");
        const compSubject = currentCompany.trim() ? ` (${currentCompany.trim()})` : "";
        const vac = vacancyTitle ? `"${vacancyTitle}"` : (lang === "ru" ? "открытой" : lang === "en" ? "the position" : "ochiq");
        const sendBy = currentSender.trim() || (lang === "ru" ? "HR Отдел" : lang === "en" ? "HR Department" : "HR Bo'limi");
        const candName = candidate?.fullName || (lang === "ru" ? "Кандидат" : lang === "en" ? "Candidate" : "Nomzod");

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

        // 1. O'ZBEKCHA TEMPLATES
        if (lang === "uz") {
            switch (type) {
                case "HIRE":
                case "HIRED":
                    return {
                        subj: `Tabriklaymiz! Siz ishga qabul qilindingiz — ${vacancyTitle || "Vakansiya"}${compSubject}`,
                        body: `Hurmatli ${candName},\n\nSizni ${comp} kompaniyasining ${vac} vakansiyasi bo'yicha jamoamiz safiga qabul qilinganingiz bilan chin dildan tabriklaymiz!\n\nBizning HR mutaxassisimiz keyingi qadamlar, hujjatlar va rasmiylashtirish bo'yicha siz bilan tez orada bog'lanadi.\n\nHurmat bilan,\n${sendBy}`
                    };

                case "REJECT":
                case "REJECTED":
                    return {
                        subj: `Nomzodlik arizasi bo'yicha javob — ${vacancyTitle || "Vakansiya"}${compSubject}`,
                        body: `Hurmatli ${candName},\n\n${comp} kompaniyasidagi ${vac} vakansiyasiga qiziqish bildirganingiz uchun minnatdorchilik bildiramiz.\n\nAfsuski, ushbu bosqichda sizning nomzodingizni keyingi bosqichlarga o'tkaza olmaymiz. Biz sizning ma'lumotlaringizni bazamizda saqlab qolamiz va kelgusidagi mos loyihalarda siz bilan yana bog'lanishimiz mumkin.\n\nKelgusi faoliyatingizda ulkan muvaffaqiyatlar tilaymiz!\n\nHurmat bilan,\n${sendBy}`
                    };

                case "INTERVIEW":
                    return {
                        subj: `Suhbatga taklifnoma — ${vacancyTitle || "Vakansiya"}${compSubject}`,
                        body: `Hurmatli ${candName},\n\nSizning rezyumeingiz va nomzodlik arizangizni ko'rib chiqdik hamda ${comp} kompaniyasidagi ${vac} vakansiyasi bo'yicha sizni suhbat (intervyu) bosqichiga taklif qilishdan mamnunmiz!\n\nSuhbat sanasi, aniq vaqti va formati (onlayn/oflayn) bo'yicha HR mutaxassisimiz tez orada siz bilan bog'lanadi.\n\nKelgusi suhbatda siz bilan tanishishdan mamnun bo'lamiz!\n\nHurmat bilan,\n${sendBy}`
                    };

                case "TEST_TASK": {
                    let taskBody = `Hurmatli ${candName},\n\nSizni ${comp} kompaniyasining ${vac} vakansiyasi bo'yicha amaliy test topshirig'i bosqichiga o'tganingiz bilan tabriklaymiz!\n\n`;
                    taskBody += `📌 TEST TOPSHIRIG'I MA'LUMOTLARI:\n`;
                    if (currentLink.trim()) taskBody += `🔗 Havola: ${currentLink.trim()}\n`;
                    if (currentFile) {
                        const fullUrl = currentFile.fileUrl.startsWith("http") ? currentFile.fileUrl : `${apiOrigin}${currentFile.fileUrl}`;
                        taskBody += `📁 Biriktirilgan fayl: ${currentFile.fileName}\n⬇️ Yuklab olish: ${fullUrl}\n`;
                    }
                    if (!currentLink.trim() && !currentFile) {
                        taskBody += `Topshiriq materiallari bilan yuqoridagi havola orqali tanishishingiz mumkin.\n`;
                    }
                    if (currentDeadline.trim()) taskBody += `\n⏰ Topshirish muddati: ${currentDeadline.trim()}\n`;
                    if (currentNote.trim()) taskBody += `\n📝 Qo'shimcha ko'rsatma:\n${currentNote.trim()}\n`;
                    taskBody += `\n🚀 VAZIFANI TOPSHIRISH UCHUN HAVOLA:\nTopshiriqni bajarib bo'lgach, quyidagi havola orqali yechim havolasini yoki faylini topshiring:\n${submissionUrl}\n\nSizga omad tilaymiz!\n\nHurmat bilan,\n${sendBy}`;
                    return {
                        subj: `Test topshirig'i — ${vacancyTitle || "Vakansiya"}${compSubject}`,
                        body: taskBody
                    };
                }

                case "TASK_REMINDER":
                    return {
                        subj: `Eslatma: Test topshirig'ini topshirish muddati — ${vacancyTitle || "Vakansiya"}${compSubject}`,
                        body: `Hurmatli ${candName},\n\nSizga ${comp} kompaniyasining ${vac} vakansiyasi bo'yicha yuborilgan test topshirig'ini topshirish muddati bo'yicha eslatib o'tmoqchimiz.\n\nTopshiriqni bajarib bo'lgach, uni quyidagi havola orqali topshirishingizni so'raymiz:\n\n🚀 Topshirish havolasi:\n${submissionUrl}\n\nTopshiriq natijangizni kutib qolamiz!\n\nHurmat bilan,\n${sendBy}`
                    };

                case "OFFER":
                    return {
                        subj: `Ish taklifi (Job Offer) — ${vacancyTitle || "Vakansiya"}${compSubject}`,
                        body: `Hurmatli ${candName},\n\nSiz ${comp} kompaniyasidagi ${vac} vakansiyasi bo'yicha barcha saralash bosqichlaridan muvaffaqiyatli o'tdingiz!\n\nSizga rasmiy ish taklifini (Job Offer) taqdim etishdan mamnunmiz. Tafsilotlar va shartlar bo'yicha HR mutaxassisimiz siz bilan bog'lanadi.\n\nHurmat bilan,\n${sendBy}`
                    };

                default:
                    return {
                        subj: `Xabarnoma — ${vacancyTitle || "Vakansiya"}${compSubject}`,
                        body: `Hurmatli ${candName},\n\n${comp} kompaniyasidagi ${vac} vakansiyasi bo'yicha sizning arizangiz holati yangilandi.\n\nHurmat bilan,\n${sendBy}`
                    };
            }
        }

        // 2. RUSSIAN TEMPLATES
        if (lang === "ru") {
            switch (type) {
                case "HIRE":
                case "HIRED":
                    return {
                        subj: `Поздравляем с приемом на работу! — ${vacancyTitle || "Вакансия"}${compSubject}`,
                        body: `Уважаемый(ая) ${candName},\n\nПоздравляем вас с успешным трудоустройством на позицию ${vac} в ${comp}!\n\nНаш HR-специалист свяжется с вами в ближайшее время для оформления документов и предоставления информации о первых рабочих днях.\n\nС уважением,\n${sendBy}`
                    };

                case "REJECT":
                case "REJECTED":
                    return {
                        subj: `Ответ по вашей кандидатуре — ${vacancyTitle || "Вакансия"}${compSubject}`,
                        body: `Уважаемый(ая) ${candName},\n\nБлагодарим вас за интерес, проявленный к вакансии ${vac} в ${comp}.\n\nК сожалению, в настоящий момент мы не готовы сделать вам предложение о работе. Мы сохранили ваше резюме в нашей базе кандидатов и обязательно свяжемся с вами, если у нас появится подходящая позиция.\n\nЖелаем вам профессиональных успехов!\n\nС уважением,\n${sendBy}`
                    };

                case "INTERVIEW":
                    return {
                        subj: `Приглашение на собеседование — ${vacancyTitle || "Вакансия"}${compSubject}`,
                        body: `Уважаемый(ая) ${candName},\n\nМы рассмотрели вашу анкету и с удовольствием приглашаем вас на этап собеседования на позицию ${vac} в ${comp}!\n\nНаш HR-специалист свяжется с вами в ближайшее время для согласования даты, времени и формата встречи.\n\nБудем рады знакомству!\n\nС уважением,\n${sendBy}`
                    };

                case "TEST_TASK": {
                    let taskBody = `Уважаемый(ая) ${candName},\n\nПоздравляем с успешным переходом на этап практического тестового задания по вакансии ${vac} в ${comp}!\n\n`;
                    taskBody += `📌 ДЕТАЛИ ТЕСТОВОГО ЗАДАНИЯ:\n`;
                    if (currentLink.trim()) taskBody += `🔗 Ссылка: ${currentLink.trim()}\n`;
                    if (currentFile) {
                        const fullUrl = currentFile.fileUrl.startsWith("http") ? currentFile.fileUrl : `${apiOrigin}${currentFile.fileUrl}`;
                        taskBody += `📁 Прикрепленный файл: ${currentFile.fileName}\n⬇️ Скачать: ${fullUrl}\n`;
                    }
                    if (!currentLink.trim() && !currentFile) {
                        taskBody += `Материалы тестового задания доступны по указанной ссылке.\n`;
                    }
                    if (currentDeadline.trim()) taskBody += `\n⏰ Срок сдачи: ${currentDeadline.trim()}\n`;
                    if (currentNote.trim()) taskBody += `\n📝 Дополнительные инструкции:\n${currentNote.trim()}\n`;
                    taskBody += `\n🚀 ССЫЛКА ДЛЯ СДАЧИ ЗАДАНИЯ:\nПосле выполнения задания отправьте ваше решение по следующей ссылке:\n${submissionUrl}\n\nЖелаем успехов!\n\nС уважением,\n${sendBy}`;
                    return {
                        subj: `Тестовое задание — ${vacancyTitle || "Вакансия"}${compSubject}`,
                        body: taskBody
                    };
                }

                case "TASK_REMINDER":
                    return {
                        subj: `Напоминание: Срок сдачи тестового задания — ${vacancyTitle || "Вакансия"}${compSubject}`,
                        body: `Уважаемый(ая) ${candName},\n\nНапоминаем вам о сроке сдачи тестового задания по вакансии ${vac} в ${comp}.\n\nПожалуйста, отправьте ваше готовое решение по следующей ссылке:\n\n🚀 Ссылка для сдачи:\n${submissionUrl}\n\nБудем ждать вашего ответа!\n\nС уважением,\n${sendBy}`
                    };

                case "OFFER":
                    return {
                        subj: `Предложение о работе (Job Offer) — ${vacancyTitle || "Вакансия"}${compSubject}`,
                        body: `Уважаемый(ая) ${candName},\n\nВы успешно прошли все этапы отбора на позицию ${vac} в ${comp}!\n\nМы рады сделать вам официальное предложение о работе (Job Offer). Наш HR-специалист свяжется с вами для обсуждения деталей и условий.\n\nС уважением,\n${sendBy}`
                    };

                default:
                    return {
                        subj: `Уведомление — ${vacancyTitle || "Вакансия"}${compSubject}`,
                        body: `Уважаемый(ая) ${candName},\n\nСтатус вашей заявки по вакансии ${vac} в ${comp} был обновлен.\n\nС уважением,\n${sendBy}`
                    };
            }
        }

        // 3. ENGLISH TEMPLATES
        switch (type) {
            case "HIRE":
            case "HIRED":
                return {
                    subj: `Congratulations! Welcome to the team — ${vacancyTitle || "Position"}${compSubject}`,
                    body: `Dear ${candName},\n\nWelcome to ${comp}! We are thrilled to confirm your offer and hire for the ${vac} position.\n\nOur HR team will contact you shortly regarding documentation and onboarding procedures.\n\nBest regards,\n${sendBy}`
                };

            case "REJECT":
            case "REJECTED":
                return {
                    subj: `Update regarding your application — ${vacancyTitle || "Position"}${compSubject}`,
                    body: `Dear ${candName},\n\nThank you for your interest in the ${vac} role at ${comp}.\n\nAfter careful consideration, we have decided to proceed with other candidates at this time. We will keep your resume on file for future opportunities that match your experience.\n\nWe wish you the very best in your career pursuits!\n\nBest regards,\n${sendBy}`
                };

            case "INTERVIEW":
                return {
                    subj: `Interview Invitation — ${vacancyTitle || "Position"}${compSubject}`,
                    body: `Dear ${candName},\n\nWe have reviewed your application and are pleased to invite you to an interview for the ${vac} position at ${comp}!\n\nOur HR team will be in touch shortly to coordinate the date, time, and format of the meeting.\n\nWe look forward to speaking with you!\n\nBest regards,\n${sendBy}`
                };

            case "TEST_TASK": {
                let taskBody = `Dear ${candName},\n\nCongratulations on advancing to the practical test assignment stage for the ${vac} position at ${comp}!\n\n`;
                taskBody += `📌 TEST ASSIGNMENT DETAILS:\n`;
                if (currentLink.trim()) taskBody += `🔗 Link: ${currentLink.trim()}\n`;
                if (currentFile) {
                    const fullUrl = currentFile.fileUrl.startsWith("http") ? currentFile.fileUrl : `${apiOrigin}${currentFile.fileUrl}`;
                    taskBody += `📁 Attached File: ${currentFile.fileName}\n⬇️ Download: ${fullUrl}\n`;
                }
                if (!currentLink.trim() && !currentFile) {
                    taskBody += `Assignment materials are accessible via the provided link.\n`;
                }
                if (currentDeadline.trim()) taskBody += `\n⏰ Submission Deadline: ${currentDeadline.trim()}\n`;
                if (currentNote.trim()) taskBody += `\n📝 Additional Instructions:\n${currentNote.trim()}\n`;
                taskBody += `\n🚀 SUBMISSION LINK:\nOnce completed, please submit your solution via the following link:\n${submissionUrl}\n\nGood luck!\n\nBest regards,\n${sendBy}`;
                return {
                    subj: `Test Assignment — ${vacancyTitle || "Position"}${compSubject}`,
                    body: taskBody
                };
            }

            case "TASK_REMINDER":
                return {
                    subj: `Reminder: Test Assignment Deadline — ${vacancyTitle || "Position"}${compSubject}`,
                    body: `Dear ${candName},\n\nThis is a friendly reminder regarding the submission deadline for your test assignment for the ${vac} role at ${comp}.\n\nPlease submit your solution using the link below:\n\n🚀 Submission Link:\n${submissionUrl}\n\nWe look forward to reviewing your work!\n\nBest regards,\n${sendBy}`
                };

            case "OFFER":
                return {
                    subj: `Job Offer — ${vacancyTitle || "Position"}${compSubject}`,
                    body: `Dear ${candName},\n\nCongratulations! You have successfully passed all selection stages for the ${vac} role at ${comp}.\n\nWe are delighted to extend a formal Job Offer to you. Our HR representative will be in touch with the details shortly.\n\nBest regards,\n${sendBy}`
                };

            default:
                return {
                    subj: `Notification — ${vacancyTitle || "Position"}${compSubject}`,
                    body: `Dear ${candName},\n\nThe status of your application for ${vac} at ${comp} has been updated.\n\nBest regards,\n${sendBy}`
                };
        }
    }, [candidate, type, vacancyTitle]);

    const applyTemplate = useCallback((
        lang: EmailLang,
        cComp: string,
        cSender: string,
        cLink: string,
        cFile: any,
        cDl: string,
        cNote: string
    ) => {
        const { subj, body } = generateEmailContent(lang, cComp, cSender, cLink, cFile, cDl, cNote);
        setSubject(subj);
        setText(body);
    }, [generateEmailContent]);

    // Initialize/sync on open or parameter changes
    useEffect(() => {
        applyTemplate(emailLang, company, sender, taskLink, uploadedFile, taskDeadline, taskNote);
    }, [emailLang, company, sender, applyTemplate]);

    const handleLanguageChange = (newLang: EmailLang) => {
        setEmailLang(newLang);
        let newSender = sender;
        if (newLang === "ru" && (sender === "HR Bo'limi" || sender === "HR Department")) {
            newSender = "HR Отдел";
            setSender(newSender);
        } else if (newLang === "en" && (sender === "HR Bo'limi" || sender === "HR Отдел")) {
            newSender = "HR Department";
            setSender(newSender);
        } else if (newLang === "uz" && (sender === "HR Отдел" || sender === "HR Department")) {
            newSender = "HR Bo'limi";
            setSender(newSender);
        }

        let newDl = taskDeadline;
        if (taskDeadline === "3 kun ichida" || taskDeadline === "в течение 3 дней" || taskDeadline === "within 3 days") {
            newDl = newLang === "ru" ? "в течение 3 дней" : newLang === "en" ? "within 3 days" : "3 kun ichida";
            setTaskDeadline(newDl);
        }

        applyTemplate(newLang, company, newSender, taskLink, uploadedFile, newDl, taskNote);
    };

    const handleTaskParamChange = (newLink: string, newFile: any, newDl: string, newNote: string) => {
        applyTemplate(emailLang, company, sender, newLink, newFile, newDl, newNote);
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

    const calculateDeadlineDate = (dlText: string) => {
        const daysMatch = dlText.match(/(\d+)/);
        if (daysMatch && daysMatch[1]) {
            const days = parseInt(daysMatch[1], 10);
            const d = new Date();
            d.setDate(d.getDate() + (days > 0 ? days : 3));
            return d.toISOString();
        }
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString();
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
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-black mb-1">
                            {getModalTitle(type)}
                        </h2>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {t("emailModal.recipient")}: <span className="text-black font-extrabold">{candidate.fullName}</span> ({candidate.email})
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

                <div className="p-6 flex flex-col gap-5">
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
                            {/* Language and Company Customization Section */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded flex flex-col gap-4">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                                        {t("emailModal.emailLanguage")}:
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleLanguageChange("uz")}
                                            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded border transition-all ${
                                                emailLang === "uz"
                                                    ? "bg-black text-white border-black shadow-sm"
                                                    : "bg-white text-gray-700 border-gray-300 hover:border-black"
                                            }`}
                                        >
                                            🇺🇿 O'zbekcha
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleLanguageChange("ru")}
                                            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded border transition-all ${
                                                emailLang === "ru"
                                                    ? "bg-black text-white border-black shadow-sm"
                                                    : "bg-white text-gray-700 border-gray-300 hover:border-black"
                                            }`}
                                        >
                                            🇷🇺 Русский
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleLanguageChange("en")}
                                            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded border transition-all ${
                                                emailLang === "en"
                                                    ? "bg-black text-white border-black shadow-sm"
                                                    : "bg-white text-gray-700 border-gray-300 hover:border-black"
                                            }`}
                                        >
                                            🇬🇧 English
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                            {t("emailModal.companyLabel")}
                                        </label>
                                        <input
                                            type="text"
                                            value={company}
                                            onChange={(e) => {
                                                setCompany(e.target.value);
                                                applyTemplate(emailLang, e.target.value, sender, taskLink, uploadedFile, taskDeadline, taskNote);
                                            }}
                                            placeholder="Masalan: MCHJ Google"
                                            className="w-full p-2.5 bg-white border border-gray-300 text-xs focus:outline-none focus:border-black rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                            {t("emailModal.senderLabel")}
                                        </label>
                                        <input
                                            type="text"
                                            value={sender}
                                            onChange={(e) => {
                                                setSender(e.target.value);
                                                applyTemplate(emailLang, company, e.target.value, taskLink, uploadedFile, taskDeadline, taskNote);
                                            }}
                                            placeholder="HR Bo'limi"
                                            className="w-full p-2.5 bg-white border border-gray-300 text-xs focus:outline-none focus:border-black rounded"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Test Task specific options */}
                            {type === "TEST_TASK" && (
                                <div className="p-5 bg-amber-50/70 border border-amber-200 rounded flex flex-col gap-4">
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
                                                className="w-full p-2.5 bg-white border border-gray-300 text-xs focus:outline-none focus:border-black rounded"
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
                                                className="w-full p-2.5 bg-white border border-gray-300 text-xs focus:outline-none focus:border-black rounded"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                                            {t("emailModal.taskFile")}
                                        </label>
                                        {uploadedFile ? (
                                            <div className="flex items-center justify-between bg-white p-3 border border-green-300 rounded">
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
                                            <label className="flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-gray-300 hover:border-black cursor-pointer rounded transition-colors text-xs font-bold text-gray-600">
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
                                            className="w-full p-2.5 bg-white border border-gray-300 text-xs focus:outline-none focus:border-black rounded"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Subject and Message Editor */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                        {t("emailModal.subject")}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => applyTemplate(emailLang, company, sender, taskLink, uploadedFile, taskDeadline, taskNote)}
                                        className="text-[10px] text-blue-600 hover:underline font-bold uppercase tracking-wider"
                                        title="Shablonni qayta tiklash"
                                    >
                                        🔄 {t("emailModal.resetTemplate")}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full p-3.5 border border-gray-300 text-sm focus:outline-none focus:border-black font-bold rounded"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    {t("emailModal.messageText")}
                                </label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full p-4 border border-gray-300 text-xs focus:outline-none focus:border-black min-h-[200px] resize-y leading-relaxed font-mono rounded"
                                />
                            </div>

                            <div className="bg-gray-50 p-3.5 border border-gray-200 text-xs text-gray-500 font-bold uppercase tracking-widest flex gap-2 rounded">
                                <span className="text-blue-500">ℹ</span> {t("emailModal.htmlNotice")}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-1">
                                <button
                                    onClick={handleSend}
                                    disabled={loading || uploading}
                                    className="flex-1 px-6 py-3.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50 rounded"
                                >
                                    {loading ? t("emailModal.sending") : t("emailModal.sendEmail")}
                                </button>
                                <button
                                    onClick={() => onSuccess(type === "TEST_TASK" ? { testTaskDeadline: calculateDeadlineDate(taskDeadline) } : undefined)}
                                    disabled={loading || uploading}
                                    className="px-6 py-3.5 bg-gray-200 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors disabled:opacity-50 rounded"
                                    title="Email yubormasdan faqat statusni o'zgartirish"
                                >
                                    {t("emailModal.skipEmail")}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={loading || uploading}
                                    className="px-6 py-3.5 bg-gray-100 text-gray-700 text-[11px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50 rounded"
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
