"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function FeatureDashboardScroll() {
    const t = useTranslations("Home");
    const containerRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const totalScroll = containerRef.current.offsetHeight - window.innerHeight;
            if (totalScroll <= 0) return;
            const currentScroll = -rect.top;
            const rawProgress = currentScroll / totalScroll;
            const clamped = Math.min(Math.max(rawProgress, 0), 1);
            setProgress(clamped);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const ep = Math.min(1, progress / 0.75);
    const inv = 1 - ep;

    const leftX = -220 * inv;
    const leftY = -60 * inv;
    const leftRotate = -5 * inv;
    const leftOpacity = 0.3 + ep * 0.7;

    const midX = 0;
    const midY = 180 * inv;
    const midRotate = 4 * inv;
    const midOpacity = 0.3 + ep * 0.7;

    const rightX = 220 * inv;
    const rightY = -50 * inv;
    const rightRotate = 5 * inv;
    const rightOpacity = 0.3 + ep * 0.7;

    return (
        <div ref={containerRef} className="relative z-30 h-[280vh] w-full bg-[#f8f8f8]">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-[#f8f8f8] via-slate-50 to-[#f1f5f9] px-4 md:px-8">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        opacity: 0.12,
                        backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />

                <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mb-6 pointer-events-none">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 shadow-xs mb-2.5">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-700">
                            {t("featureDashboardBadge")}
                        </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight mb-1.5">
                        {t("featureDashboardTitle")}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
                        {t("featureDashboardSubtitle")}
                    </p>
                </div>

                <div className="relative z-20 w-full max-w-[1220px] h-[540px] sm:h-[580px] md:h-[600px] flex rounded-2xl border border-slate-300/80 shadow-[0_25px_70px_rgba(15,23,42,0.14)] overflow-hidden bg-white select-none">
                    <div
                        className="w-[220px] sm:w-[240px] h-full bg-slate-950 text-white flex flex-col justify-between p-4 border-r border-slate-800 shrink-0 transition-transform duration-75"
                        style={{
                            transform: `translate3d(${leftX}px, ${leftY}px, 0) rotate(${leftRotate}deg)`,
                            opacity: leftOpacity,
                        }}
                    >
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-2.5 px-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-md">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                        <polyline points="2 17 12 22 22 17" />
                                        <polyline points="2 12 12 17 22 12" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold tracking-tight text-white">HR Platform</span>
                            </div>

                            <nav className="flex flex-col gap-1 text-xs font-semibold">
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                                    <div className="flex items-center gap-2.5">
                                        <span>📊</span>
                                        <span>Dashboard</span>
                                    </div>
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <span>👥</span>
                                        <span>Xodimlar</span>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">128</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <span>🎯</span>
                                        <span>OKR Maqsadlar</span>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400">92%</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <span>🧭</span>
                                        <span>9-Box Matritsa</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <span>💰</span>
                                        <span>Payroll & Oylik</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <span>⏱️</span>
                                        <span>Davomat & Face ID</span>
                                    </div>
                                </div>
                            </nav>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                                HR
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white truncate">Direktor Paneli</span>
                                <span className="text-[10px] text-emerald-400 font-medium">● Faol sessiya</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className="w-[290px] sm:w-[330px] h-full bg-slate-50/90 border-r border-slate-200/80 flex flex-col p-4 shrink-0 transition-transform duration-75"
                        style={{
                            transform: `translate3d(${midX}px, ${midY}px, 0) rotate(${midRotate}deg)`,
                            opacity: midOpacity,
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">XODIMLAR RO'YXATI</span>
                            <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                                128 ta
                            </span>
                        </div>

                        <div className="flex flex-col gap-2.5 overflow-hidden">
                            <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                            AS
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900">Anvar Salimov</span>
                                            <span className="text-[10px] text-slate-500 font-medium">Lead Architect</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Grade 5
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[10px] font-medium text-slate-600">
                                        <span>OKR Bajarilishi</span>
                                        <span className="font-bold text-slate-900">94%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                                            MK
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900">Malika Karimova</span>
                                            <span className="text-[10px] text-slate-500 font-medium">Senior Product HR</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                        Grade 4
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[10px] font-medium text-slate-600">
                                        <span>OKR Bajarilishi</span>
                                        <span className="font-bold text-slate-900">88%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-600 rounded-full w-[88%]" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                                            JU
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900">Jasur Umarov</span>
                                            <span className="text-[10px] text-slate-500 font-medium">Backend Team Lead</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                        Grade 4
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[10px] font-medium text-slate-600">
                                        <span>OKR Bajarilishi</span>
                                        <span className="font-bold text-slate-900">82%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full w-[82%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="flex-1 h-full bg-white flex flex-col p-4 sm:p-5 gap-3.5 overflow-hidden transition-transform duration-75"
                        style={{
                            transform: `translate3d(${rightX}px, ${rightY}px, 0) rotate(${rightRotate}deg)`,
                            opacity: rightOpacity,
                        }}
                    >
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SAMARADORLIK</span>
                                <span className="text-lg sm:text-xl font-black text-slate-950">96.4%</span>
                                <span className="text-[10px] font-semibold text-emerald-600">↑ +4.2% o'sish</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">360 BAHOLASH</span>
                                <span className="text-lg sm:text-xl font-black text-slate-950">4.85 / 5</span>
                                <span className="text-[10px] font-semibold text-indigo-600">● 142 ta baho</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">DAVOMAT ANIQLIGI</span>
                                <span className="text-lg sm:text-xl font-black text-slate-950">99.1%</span>
                                <span className="text-[10px] font-semibold text-emerald-600">✓ Face ID jonli</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-2 flex-1 min-h-0 justify-between">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">9-BOX SALOHIYAT & MAHSULDORLIK MATRITSASI</span>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Real-time Q3 2026</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 h-[175px] w-full">
                                <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-emerald-800">STAR PERFORMER</span>
                                    <span className="text-xs font-bold text-emerald-900">18 xodim</span>
                                </div>
                                <div className="rounded-lg bg-indigo-500/15 border border-indigo-500/30 p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-indigo-800">HIGH POTENTIAL</span>
                                    <span className="text-xs font-bold text-indigo-900">34 xodim</span>
                                </div>
                                <div className="rounded-lg bg-purple-500/15 border border-purple-500/30 p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-purple-800">FUTURE LEADER</span>
                                    <span className="text-xs font-bold text-purple-900">12 xodim</span>
                                </div>

                                <div className="rounded-lg bg-sky-500/15 border border-sky-500/30 p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-sky-800">HIGH PROFESSIONAL</span>
                                    <span className="text-xs font-bold text-sky-900">26 xodim</span>
                                </div>
                                <div className="rounded-lg bg-slate-200/70 border border-slate-300 p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-slate-800">CORE TALENT</span>
                                    <span className="text-xs font-bold text-slate-900">22 xodim</span>
                                </div>
                                <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-amber-800">GROWTH NEEDED</span>
                                    <span className="text-xs font-bold text-amber-900">9 xodim</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                <span className="text-[11px] font-medium text-slate-600">Matritsali Rahbarlik & Karyera Xaritasi integratsiyasi faol</span>
                                <span className="text-[11px] font-bold text-indigo-600">Batafsil Hisobot →</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
