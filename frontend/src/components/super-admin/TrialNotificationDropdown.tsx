"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getTrialRequests, TrialRequest } from "@/src/services/trial-service";
import { formatRelativeTime, getTrialRemainingDays } from "@/src/utils/trial-utils";

interface TrialNotificationDropdownProps {
    locale: string;
}

export default function TrialNotificationDropdown({ locale }: TrialNotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [trials, setTrials] = useState<TrialRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [readIds, setReadIds] = useState<string[]>([]);
    const [selectedTrial, setSelectedTrial] = useState<TrialRequest | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadReadIds = () => {
        try {
            const stored = localStorage.getItem("read_trial_ids");
            if (stored) {
                setReadIds(JSON.parse(stored));
            }
        } catch {
            setReadIds([]);
        }
    };

    const markAsRead = (id: string) => {
        setReadIds((prev) => {
            if (prev.includes(id)) return prev;
            const updated = [...prev, id];
            try {
                localStorage.setItem("read_trial_ids", JSON.stringify(updated));
            } catch {}
            return updated;
        });
    };

    const markAllAsRead = () => {
        const allIds = trials.map((t) => t.id);
        setReadIds(allIds);
        try {
            localStorage.setItem("read_trial_ids", JSON.stringify(allIds));
        } catch {}
    };

    const fetchTrials = async () => {
        try {
            setIsLoading(true);
            const data = await getTrialRequests();
            setTrials(data);
        } catch {
            setTrials([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReadIds();
        fetchTrials();
        const interval = setInterval(fetchTrials, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const unreadCount = trials.filter((t) => !readIds.includes(t.id)).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-2xl bg-[#E0E5EC] shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] text-slate-700 hover:text-purple-600 transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-none"
                aria-label="Sinov so'rovlari"
            >
                <svg className="w-5 h-5 text-slate-700 hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-2">
                            <span className="text-base">💬</span>
                            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                Sinov So'rovlari
                            </span>
                            {unreadCount > 0 && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {unreadCount} ta yangi
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="text-[11px] text-purple-600 hover:text-purple-800 font-bold cursor-pointer transition-colors"
                            >
                                O'qilgan qilish
                            </button>
                        )}
                    </div>

                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                        {isLoading && trials.length === 0 ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                                        <div className="flex-1 space-y-1.5 py-1">
                                            <div className="h-3 bg-slate-100 rounded-md w-3/4" />
                                            <div className="h-2.5 bg-slate-100 rounded-md w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : trials.length === 0 ? (
                            <div className="py-10 px-4 text-center">
                                <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center mb-2">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-xs font-bold text-slate-700">Hozircha so'rovlar yo'q</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Yangi sinov so'rovlari shu yerda ko'rinadi</p>
                            </div>
                        ) : (
                            trials.slice(0, 10).map((trial) => {
                                const isUnread = !readIds.includes(trial.id);

                                return (
                                    <button
                                        key={trial.id}
                                        type="button"
                                        onClick={() => {
                                            markAsRead(trial.id);
                                            setSelectedTrial(trial);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left relative ${
                                            isUnread ? "bg-purple-50/70" : "bg-white"
                                        }`}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                                isUnread
                                                    ? "bg-purple-600 text-white shadow-xs"
                                                    : "bg-slate-100 text-slate-700"
                                            }`}
                                        >
                                            {trial.firstName?.[0]?.toUpperCase() || "U"}
                                            {trial.lastName?.[0]?.toUpperCase() || ""}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className={`text-xs truncate ${isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                                                    {trial.firstName} {trial.lastName}
                                                </span>
                                                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                                    {formatRelativeTime(trial.createdAt)}
                                                </span>
                                            </div>

                                            <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                                                📞 {trial.phone}
                                            </div>

                                            <div className="text-[11px] text-slate-400 font-mono truncate">
                                                ✉️ {trial.email}
                                            </div>
                                        </div>

                                        {isUnread && (
                                            <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 self-center" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-center">
                        <Link
                            href={`/${locale}/super-admin/trials`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
                        >
                            <span>Barchasini ko'rish</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            )}

            {selectedTrial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md relative border border-slate-100 animate-in zoom-in-95 duration-150">
                        <button
                            type="button"
                            onClick={() => setSelectedTrial(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-3.5 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                                {selectedTrial.firstName?.[0]?.toUpperCase() || "U"}
                                {selectedTrial.lastName?.[0]?.toUpperCase() || ""}
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    {selectedTrial.firstName} {selectedTrial.lastName}
                                </h3>
                                <div className="text-xs text-slate-400 font-medium">
                                    {formatRelativeTime(selectedTrial.createdAt)} yuborilgan
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 bg-slate-50/80 rounded-2xl p-4 border border-slate-100 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Telefon:</span>
                                <a
                                    href={`tel:${selectedTrial.phone}`}
                                    className="font-mono font-bold text-purple-600 hover:underline"
                                >
                                    {selectedTrial.phone}
                                </a>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Email:</span>
                                <a
                                    href={`mailto:${selectedTrial.email}`}
                                    className="font-mono font-bold text-purple-600 hover:underline truncate max-w-[220px]"
                                >
                                    {selectedTrial.email}
                                </a>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Holat:</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {selectedTrial.status}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Qolgan muddat:</span>
                                <span className="font-bold text-slate-800">
                                    {getTrialRemainingDays(selectedTrial.trialEndDate).text}
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center gap-2">
                            <a
                                href={`tel:${selectedTrial.phone}`}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs text-center transition-colors shadow-xs flex items-center justify-center gap-1.5"
                            >
                                <span>📞</span>
                                <span>Qo'ng'iroq</span>
                            </a>
                            <a
                                href={`mailto:${selectedTrial.email}`}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs text-center transition-colors shadow-xs flex items-center justify-center gap-1.5"
                            >
                                <span>✉️</span>
                                <span>Email</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => setSelectedTrial(null)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
