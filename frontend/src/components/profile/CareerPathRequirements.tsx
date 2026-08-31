"use client";

import { useState } from "react";
import RequestPromotionModal from "../grading/RequestPromotionModal";
import { createPromotionRequest } from "@/src/services/grading-service";

interface CareerPathProps {
    careerPath: {
        currentGrade?: any;
        nextGrade?: any;
        activePromotionRequest?: any;
        okrTarget: number;
        currentOkr: number;
        feedbackTarget: number;
        currentFeedback?: number | null;
        isOkrMet: boolean;
        isFeedbackMet: boolean;
        isReadyForPromotion: boolean;
    } | null;
    employeeId?: string;
    employeeName?: string;
    onRefresh?: () => void;
}

export default function CareerPathRequirements({
    careerPath,
    employeeId,
    employeeName,
    onRefresh,
}: CareerPathProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    if (!careerPath) return null;

    const { currentGrade, nextGrade, activePromotionRequest, okrTarget, currentOkr, feedbackTarget, currentFeedback, isOkrMet, isFeedbackMet, isReadyForPromotion } = careerPath;

    const handlePromotionSubmit = async (data: any) => {
        try {
            await createPromotionRequest(data);
            setActionMessage({ type: "success", text: "Ko'tarilish so'rovi muvaffaqiyatli yuborildi!" });
            if (onRefresh) onRefresh();
            setTimeout(() => setActionMessage(null), 5000);
        } catch (err: any) {
            setActionMessage({ type: "error", text: err.message || "So'rov yuborishda xatolik yuz berdi" });
        }
    };

    return (
        <div className="border border-black bg-white p-6 md:p-8 flex flex-col gap-6 shadow-xs relative">
            {actionMessage && (
                <div className={`p-4 border text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
                    actionMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
                }`}>
                    <span>{actionMessage.text}</span>
                    <button onClick={() => setActionMessage(null)} className="text-xs">✕</button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black pb-4">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                        Karyera O'sishi va Rejasi
                    </div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                        Keyingi Greydga Ko'tarilish Talablari
                    </h2>
                </div>

                {activePromotionRequest ? (
                    <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        So'rov ko'rib chiqilmoqda
                    </div>
                ) : isReadyForPromotion && nextGrade ? (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shrink-0 flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Ko'tarish So'rovi Berish
                    </button>
                ) : null}
            </div>

            <div className="bg-gray-50 border border-gray-200 p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-sm shrink-0">
                        {currentGrade ? `L${currentGrade.level}` : "0"}
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">
                            Hozirgi Daraja
                        </span>
                        <span className="text-base font-bold text-black">
                            {currentGrade ? currentGrade.title : "Greyd biriktirilmagan"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-center text-gray-400">
                    <svg className="w-6 h-6 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <svg className="w-6 h-6 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                        {nextGrade ? `L${nextGrade.level}` : "TOP"}
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">
                            Maqsadli Keyingi Greyd
                        </span>
                        <span className="text-base font-bold text-black">
                            {nextGrade ? nextGrade.title : "Eng yuqori darajadasiz"}
                        </span>
                    </div>
                </div>
            </div>

            {nextGrade ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="border border-gray-200 p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                                1. OKR Bajarilish Ko'rsatkichi
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                isOkrMet ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}>
                                {isOkrMet ? "Bajarildi ✓" : `Kamida ${okrTarget}% kerak`}
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-gray-500">Joriy Natija:</span>
                                <span className="text-black">{currentOkr}% / {okrTarget}%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden relative">
                                <div
                                    className={`h-full transition-all duration-500 ${isOkrMet ? "bg-emerald-600" : "bg-black"}`}
                                    style={{ width: `${Math.min(100, currentOkr)}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-[11px] text-gray-500">
                            Keyingi darajaga o'tish uchun joriy siklda belgilangan OKR maqsadlarining kamida {okrTarget}% qismi muvaffaqiyatli bajarilishi shart.
                        </p>
                    </div>

                    <div className="border border-gray-200 p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                                2. 360 Baholash Natijasi
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                isFeedbackMet ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                            }`}>
                                {currentFeedback !== null ? `${currentFeedback} / 5.0` : "Hali baholanmagan"}
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-gray-500">Talab etilgan ball:</span>
                                <span className="text-black">{feedbackTarget}.0+ ball</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${isFeedbackMet ? "bg-emerald-600" : "bg-purple-600"}`}
                                    style={{ width: `${Math.min(100, ((currentFeedback || 0) / 5) * 100)}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-[11px] text-gray-500">
                            Hamkasblar va rahbarlar tomonidan o'tkaziladigan 360 baholashda xodimning o'rtacha ko'rsatkichi kamida {feedbackTarget}.0 ball bo'lishi tavsiya etiladi.
                        </p>
                    </div>

                    <div className="border border-gray-200 p-5 space-y-3 md:col-span-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                                3. {nextGrade.title} uchun Malakaviy Talablar va Mas'uliyatlar
                            </span>
                            <span className="text-xs font-black text-emerald-700">
                                Yangi Maosh: {nextGrade.minSalary.toLocaleString()} — {nextGrade.maxSalary.toLocaleString()} UZS
                            </span>
                        </div>

                        {nextGrade.requirements && (
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                                    Bilim va Tajriba Talabi:
                                </span>
                                <p className="text-xs text-gray-700 bg-gray-50 p-3 border border-gray-200">
                                    {nextGrade.requirements}
                                </p>
                            </div>
                        )}

                        {nextGrade.responsibilities && (
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                                    Kutiladigan Asosiy Mas'uliyatlar:
                                </span>
                                <p className="text-xs text-gray-700 bg-gray-50 p-3 border border-gray-200">
                                    {nextGrade.responsibilities}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-6 text-xs text-gray-500">
                    Siz kompaniyadagi eng yuqori lavozim darajasiga yetgansiz.
                </div>
            )}

            {activePromotionRequest && (
                <div className="bg-blue-50 border border-blue-200 p-4 text-xs space-y-1.5">
                    <div className="font-bold text-blue-900 uppercase">
                        Yuborilgan Ko'tarilish So'rovi:
                    </div>
                    <div className="text-blue-800">
                        <span className="font-semibold">Maqsadli Greyd:</span> {activePromotionRequest.targetGradeTitle}
                    </div>
                    <div className="text-blue-800">
                        <span className="font-semibold">Taklif etilgan maosh:</span> {activePromotionRequest.proposedSalary.toLocaleString()} UZS
                    </div>
                    <div className="text-blue-800">
                        <span className="font-semibold">Asos:</span> {activePromotionRequest.reason}
                    </div>
                </div>
            )}

            {nextGrade && employeeId && (
                <RequestPromotionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handlePromotionSubmit}
                    employees={[
                        {
                            id: employeeId,
                            firstName: employeeName?.split(" ")[0] || "Xodim",
                            lastName: employeeName?.split(" ")[1] || "",
                            grade: currentGrade,
                        },
                    ]}
                    grades={[nextGrade]}
                    initialEmployeeId={employeeId}
                />
            )}
        </div>
    );
}
