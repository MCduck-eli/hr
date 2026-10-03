"use client";

import React, { useState, useEffect } from "react";

interface EmployeeProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any | null;
}

export default function EmployeeProfileModal({
    isOpen,
    onClose,
    user,
}: EmployeeProfileModalProps) {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [user]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !user) return null;

    const firstName = user.employee?.firstName || user.firstName || "";
    const lastName = user.employee?.lastName || user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || user.email?.split("@")[0] || "Xodim";
    const initials = (firstName && lastName)
        ? `${firstName[0]}${lastName[0]}`.toUpperCase()
        : (fullName[0] || "U").toUpperCase();

    const email = user.email || "Mavjud emas";
    const phone = user.phone || user.employee?.phone || "Mavjud emas";
    const role = user.customRole?.name || user.role || "Mavjud emas";
    const department = user.employee?.department?.name || user.department?.name || "Mavjud emas";
    const score = user.employee?.score ?? user.employee?.rating ?? (user.employee?.okrProgress !== undefined ? `${user.employee.okrProgress}%` : "0");
    const status = user.employee?.status || (user.isActive !== false ? "Faol" : "Nofaol");

    const rawAvatar = user.avatar || user.employee?.avatar || "";
    let formattedAvatarSrc: string | null = null;

    if (rawAvatar && !imageError) {
        if (rawAvatar.startsWith("http://") || rawAvatar.startsWith("https://") || rawAvatar.startsWith("data:")) {
            formattedAvatarSrc = rawAvatar;
        } else {
            const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
            const baseOrigin = rawApi.replace(/\/api(\/v\d+)?\/?$/, "").replace(/\/+$/, "");
            const cleanPath = rawAvatar.startsWith("/") ? rawAvatar : `/${rawAvatar}`;
            formattedAvatarSrc = `${baseOrigin}${cleanPath}`;
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-6 pt-7 pb-8 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        aria-label="Yopish"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl font-bold text-white shadow-inner overflow-hidden shrink-0">
                            {formattedAvatarSrc ? (
                                <img
                                    src={formattedAvatarSrc}
                                    alt={fullName}
                                    onError={() => setImageError(true)}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold text-white truncate">
                                    {fullName}
                                </h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${
                                    status === "ACTIVE" || status === "Faol"
                                        ? "bg-emerald-500/20 border-emerald-300/40 text-emerald-100"
                                        : "bg-amber-500/20 border-amber-300/40 text-amber-100"
                                }`}>
                                    {status}
                                </span>
                            </div>
                            <p className="text-sm text-purple-100 truncate mt-0.5">
                                {email}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Xodim ID
                            </span>
                            <span className="text-xs font-mono font-medium text-slate-800 break-all">
                                {user.id || "Mavjud emas"}
                            </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Roli
                            </span>
                            <span className="text-sm font-semibold text-slate-800">
                                {role}
                            </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Telefon raqami
                            </span>
                            <span className="text-sm font-medium text-slate-800">
                                {phone}
                            </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Bo'limi
                            </span>
                            <span className="text-sm font-semibold text-slate-800">
                                {department}
                            </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                To'plagan balli / Reyting
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-amber-500">⭐</span>
                                <span className="text-sm font-bold text-slate-800">
                                    {score}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Faollik holati
                            </span>
                            <span className="text-sm font-medium text-slate-800">
                                {status}
                            </span>
                        </div>
                    </div>

                    {user.createdAt && (
                        <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs text-slate-500">
                            <span>Qo'shilgan sana:</span>
                            <span className="font-medium text-slate-700">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                        Yopish
                    </button>
                </div>
            </div>
        </div>
    );
}
