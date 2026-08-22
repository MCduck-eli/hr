"use client";

import React, { useState, useEffect } from "react";
import { sendCandidateEmail } from "../../../services/recruiting-service";

interface EmailActionModalProps {
    candidate: any;
    type: "HIRE" | "REJECT";
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmailActionModal({ candidate, type, onClose, onSuccess }: EmailActionModalProps) {
    const [subject, setSubject] = useState("");
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (type === "HIRE") {
            setSubject("Tabriklaymiz! Siz ishga qabul qilindingiz");
            setText(`Hurmatli ${candidate.fullName},\n\nSizni jamoamizga qabul qilinganingiz bilan tabriklaymiz! Bizning HR mutaxassisimiz keyingi qadamlar va hujjatlarni rasmiylashtirish bo'yicha siz bilan tez orada bog'lanadi.\n\nHurmat bilan,\nHR Bo'limi`);
        } else if (type === "REJECT") {
            setSubject("Vakansiya bo'yicha javob");
            setText(`Hurmatli ${candidate.fullName},\n\nKompaniyamizdagi vakansiyaga qiziqish bildirganingiz uchun tashakkur.\n\nAfsuski, joriy bosqichda sizning nomzodingizni keyingi bosqichlarga o'tkaza olmaymiz. Biz sizning rezyumeingizni bazamizda saqlab qolamiz va kelajakda mos vakansiyalar paydo bo'lsa siz bilan bog'lanamiz.\n\nKelgusi ishlaringizda muvaffaqiyatlar tilaymiz!\n\nHurmat bilan,\nHR Bo'limi`);
        }
    }, [candidate, type]);

    const handleSend = async () => {
        setLoading(true);
        try {
            const res = await sendCandidateEmail(candidate.id, {
                subject,
                text,
                type
            });
            if (res.previewUrl) {
                setPreviewUrl(res.previewUrl);
            } else {
                onSuccess();
            }
        } catch (error: any) {
            alert(error.message || "Xatni yuborishda xatolik yuz berdi.");
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
                            {type === "HIRE" ? "Tabriknoma yuborish" : "Rad etish xatini yuborish"}
                        </h2>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Qabul qiluvchi: {candidate.fullName} ({candidate.email})
                        </div>
                    </div>
                    {!previewUrl && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-black transition-colors"
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
                                Xat muvaffaqiyatli yuborildi!
                            </h3>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest max-w-md">
                                Nomzodga xabar yuborildi. Ishlab chiqish (test) muhitida bo'lganingiz uchun haqiqiy xatni Ethereal pochtada ko'rishingiz mumkin:
                            </p>
                            <a 
                                href={previewUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-block px-8 py-4 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors"
                            >
                                Xatni (Preview) ko'rish
                            </a>
                            <button
                                onClick={onSuccess}
                                className="mt-4 px-8 py-4 bg-black text-white font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors"
                            >
                                Yopish
                            </button>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    Mavzu (Subject)
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
                                    Matn (Xabar mazmuni)
                                </label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full p-4 border border-gray-200 text-sm focus:outline-none focus:border-black min-h-[250px] resize-y leading-relaxed"
                                />
                            </div>

                            <div className="bg-gray-50 p-4 border border-gray-200 text-xs text-gray-500 font-bold uppercase tracking-widest flex gap-2">
                                <span className="text-blue-500">ℹ</span> Xat dizayni avtomatik ravishda korporativ html shablon ichiga joylanadi.
                            </div>

                            <div className="flex gap-4 mt-2">
                                <button
                                    onClick={handleSend}
                                    disabled={loading}
                                    className="flex-1 px-8 py-4 bg-black text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {loading ? "Yuborilmoqda..." : "Yuborish"}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 px-8 py-4 bg-gray-100 text-black text-[12px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Bekor qilish
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
