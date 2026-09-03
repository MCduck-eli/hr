"use client";

import { useState } from "react";
import { parseResume } from "@/src/services/recruiting-service";

interface CvParserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCandidateExtracted?: (parsedData: any) => void;
}

export default function CvParserModal({
    isOpen,
    onClose,
    onCandidateExtracted,
}: CvParserModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [rawText, setRawText] = useState("");
    const [parsing, setParsing] = useState(false);
    const [parsedResult, setParsedResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleParse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file && !rawText.trim()) {
            setErrorMsg("Iltimos, rezyume faylini yuklang yoki matnini kiriting.");
            return;
        }

        setParsing(true);
        setErrorMsg(null);
        try {
            let res;
            if (file) {
                res = await parseResume(file);
            } else {
                res = await parseResume({ rawText });
            }
            setParsedResult(res);
        } catch (err: any) {
            setErrorMsg(err.message || "Rezyumeni o'qishda xatolik yuz berdi");
        } finally {
            setParsing(false);
        }
    };

    const handleApplyExtracted = () => {
        if (parsedResult && onCandidateExtracted) {
            onCandidateExtracted(parsedResult);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-black pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📄</span>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tight text-black">
                                Rezyumeni Avtomatik O'qish (CV Parser)
                            </h3>
                            <p className="text-[11px] font-medium text-gray-500">
                                Nomzod ma'lumotlari, ko'nikmalari va kontaktlarini sun'iy intellekt yordamida ajratib olish
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-sm font-bold text-gray-500 hover:text-black transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold">
                        {errorMsg}
                    </div>
                )}

                {!parsedResult ? (
                    <form onSubmit={handleParse} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-black">
                                Rezyume Faylini Yuklang (PDF, DOCX, TXT)
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-black file:text-white file:text-xs file:font-bold file:uppercase cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-[10px] font-bold uppercase text-gray-400">yoki matn ko'rinishida kiriting</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-black">
                                Rezyume Matni (Raw Text)
                            </label>
                            <textarea
                                rows={5}
                                placeholder="Rezyume matnini shu yerga nusxalab qo'ying..."
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100 transition-colors"
                            >
                                Bekor Qilish
                            </button>
                            <button
                                type="submit"
                                disabled={parsing}
                                className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
                            >
                                {parsing ? "O'qilmoqda..." : "Rezyumeni Tahlil Qilish →"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-gray-50 border border-gray-200 flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                <span className="text-xs font-black uppercase text-black">
                                    🔍 Aniqlangan Nomzod Profili
                                </span>
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                    Muvaffaqiyatli
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-gray-500 block">F.I.SH (Ism-Familiya)</span>
                                    <span className="font-bold text-black">{parsedResult.fullName || "Aniqlanmadi"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Email Manzili</span>
                                    <span className="font-bold text-black">{parsedResult.email || "Aniqlanmadi"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Telefon Raqami</span>
                                    <span className="font-bold text-black">{parsedResult.phone || "Aniqlanmadi"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Shahar / Manzil</span>
                                    <span className="font-bold text-black">{parsedResult.location || "Aniqlanmadi"}</span>
                                </div>
                                {parsedResult.experienceYears && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-gray-500 block">Ish Tajribasi</span>
                                        <span className="font-bold text-black">{parsedResult.experienceYears} yil</span>
                                    </div>
                                )}
                                {parsedResult.education && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-gray-500 block">Ta'lim</span>
                                        <span className="font-bold text-black">{parsedResult.education}</span>
                                    </div>
                                )}
                            </div>

                            {parsedResult.skills && parsedResult.skills.length > 0 && (
                                <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-200">
                                    <span className="text-[10px] font-bold uppercase text-gray-500">
                                        Aniqlangan Ko'nikmalar ({parsedResult.skills.length} ta)
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {parsedResult.skills.map((skill: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-xs"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {parsedResult.links && parsedResult.links.length > 0 && (
                                <div className="flex flex-col gap-1 pt-2 border-t border-gray-200">
                                    <span className="text-[10px] font-bold uppercase text-gray-500">Havolalar</span>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {parsedResult.links.map((link: string, idx: number) => (
                                            <a
                                                key={idx}
                                                href={link.startsWith("http") ? link : `https://${link}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 underline font-medium"
                                            >
                                                {link}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => setParsedResult(null)}
                                className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100"
                            >
                                ← Boshqa Rezyumeni O'qish
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-200 text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-300"
                                >
                                    Yopish
                                </button>
                                {onCandidateExtracted && (
                                    <button
                                        type="button"
                                        onClick={handleApplyExtracted}
                                        className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800"
                                    >
                                        Nomzod Qo'shishga O'tkazish ✓
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
