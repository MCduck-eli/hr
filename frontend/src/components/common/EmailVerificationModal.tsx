"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { sendOtpApi, verifyOtpApi } from "@/src/services/auth";

interface EmailVerificationModalProps {
    isOpen: boolean;
    email: string;
    onClose: () => void;
    onVerified: () => void;
    checkExisting?: boolean;
}

export default function EmailVerificationModal({
    isOpen,
    email,
    onClose,
    onVerified,
    checkExisting = false,
}: EmailVerificationModalProps) {
    const t = useTranslations();
    const getTxt = (key: string, fallback: string) => {
        try {
            if (t.has(`EmailVerification.${key}` as any)) {
                return t(`EmailVerification.${key}` as any);
            }
        } catch {}
        return fallback;
    };

    const title = getTxt("title", "Tasdiqlash kodi yuborildi");
    const subtitle = getTxt("subtitle", "Quyidagi email manziliga 6 xonali tasdiqlash kodi yuborildi:");
    const confirmBtn = getTxt("confirmBtn", "Tasdiqlash");
    const confirming = getTxt("confirming", "Tasdiqlanmoqda...");
    const resendCode = getTxt("resendCode", "Kodni qayta yuborish");
    const resendIn = getTxt("resendIn", "Qayta yuborish:");
    const codeSent = getTxt("codeSent", "Kodi qayta yuborildi");
    const invalidCode = getTxt("invalidCode", "Tasdiqlash kodi noto'g'ri yoki eskirgan");
    const cancel = getTxt("cancel", "Bekor qilish");

    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [resendTimer, setResendTimer] = useState(60);
    const [resendSuccess, setResendSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setOtp(["", "", "", "", "", ""]);
            setError("");
            setResendTimer(60);
            setResendSuccess(false);
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen, email]);

    useEffect(() => {
        if (!isOpen || resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isOpen, resendTimer]);

    if (!isOpen) return null;

    const handleChange = (index: number, value: string) => {
        const cleanValue = value.replace(/\D/g, "");
        if (!cleanValue) {
            const newOtp = [...otp];
            newOtp[index] = "";
            setOtp(newOtp);
            return;
        }

        const digit = cleanValue.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        setError("");

        if (index < 5 && digit) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasteData) return;

        const newOtp = [...otp];
        for (let i = 0; i < pasteData.length; i++) {
            newOtp[i] = pasteData[i];
        }
        setOtp(newOtp);
        setError("");

        const focusIndex = Math.min(pasteData.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const isExpired = resendTimer <= 0;

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;
        if (isExpired || resendTimer <= 0) {
            setError(invalidCode);
            return;
        }
        const fullCode = otp.join("");
        if (fullCode.length !== 6) {
            setError(invalidCode);
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await verifyOtpApi({ email, code: fullCode });
            onVerified();
        } catch (err: any) {
            setError(err.message || invalidCode);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0 || resending) return;
        setResending(true);
        setError("");
        setResendSuccess(false);

        try {
            await sendOtpApi({ email, checkExisting });
            setResendSuccess(true);
            setResendTimer(60);
            setTimeout(() => setResendSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to resend code");
        } finally {
            setResending(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-6 relative"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                        ✕
                    </button>

                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 text-[#9327FF] flex items-center justify-center text-2xl mb-1 shadow-sm">
                            ✉️
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            {title}
                        </h2>
                        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                            {subtitle}{" "}
                            <span className="font-bold text-slate-800 font-mono block mt-0.5">
                                {email}
                            </span>
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="flex flex-col gap-6">
                        <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border ${
                                        error
                                            ? "border-red-500 bg-red-50/40 text-red-700 focus:ring-red-500/20 focus:border-red-500"
                                            : digit
                                              ? "border-[#9327FF] bg-purple-50/30 text-[#9327FF] focus:ring-[#9327FF]/20"
                                              : "border-slate-200 bg-slate-50/70 text-slate-900 focus:border-[#9327FF] focus:ring-[#9327FF]/20"
                                    } outline-none focus:bg-white focus:ring-2 transition-all`}
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5"
                            >
                                <span>⚠️</span>
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {resendSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5"
                            >
                                <span>✓</span>
                                <span>{codeSent}</span>
                            </motion.div>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || otp.join("").length !== 6}
                                className="w-full py-3.5 bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl text-sm transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>{confirming}</span>
                                    </>
                                ) : (
                                    confirmBtn
                                )}
                            </button>

                            <div className="flex items-center justify-between text-xs pt-1 px-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer"
                                >
                                    {cancel}
                                </button>

                                {resendTimer > 0 ? (
                                    <span className="text-slate-400 font-medium font-mono text-[11px]">
                                        {resendIn} {resendTimer}s
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resending}
                                        className="text-[#9327FF] hover:underline font-bold transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {resending ? "..." : resendCode}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
