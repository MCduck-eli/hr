"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export interface FloatingCardItem {
    id: string;
    title: string;
    badge: string;
    stats?: string;
    tagColor: string;
    glowColor: string;
    bgColor: string;
    initialX: number;
    initialY: number;
    targetX: number;
    targetY: number;
    rotate: number;
    imageSrc?: string;
    icon?: ReactNode;
    customSlot?: ReactNode;
}

interface StickyHeroScrollProps {
    customCards?: FloatingCardItem[];
}

export default function StickyHeroScroll({ customCards }: StickyHeroScrollProps) {
    const t = useTranslations("Home");
    const params = useParams();
    const locale = (params?.locale as string) || "uz";
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

    const ep = Math.min(1, progress / 0.7);
    const invEp = 1 - ep;

    const defaultCards: FloatingCardItem[] = [
        {
            id: "org-chart",
            title: "Matritsali Org Chart",
            badge: "Ierarxiya",
            stats: "Ko'p darajali & Matritsa",
            tagColor: "bg-purple-100 text-purple-700 border-purple-200",
            glowColor: "rgba(168, 85, 247, 0.25)",
            bgColor: "#002BFF",
            initialX: -460,
            initialY: -150,
            targetX: -140,
            targetY: -70,
            rotate: -12,
            icon: (
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            customSlot: (
                <svg viewBox="0 0 200 200" className="w-full h-full scale-75">
                    <circle cx="100" cy="100" r="88" fill="#FF6B35" stroke="#111111" strokeWidth="6" />
                    <circle cx="100" cy="100" r="62" fill="#00CFFF" stroke="#111111" strokeWidth="5" />
                    <circle cx="100" cy="100" r="36" fill="#FFE033" stroke="#111111" strokeWidth="4" />
                    <circle cx="100" cy="100" r="14" fill="#FF1F7A" stroke="#111111" strokeWidth="3" />
                </svg>
            ),
        },
        {
            id: "9-box",
            title: "9-Box Grid & Salohiyat",
            badge: "Iste'dodlar",
            stats: "Star & Core Players",
            tagColor: "bg-amber-100 text-amber-700 border-amber-200",
            glowColor: "rgba(245, 158, 11, 0.25)",
            bgColor: "#FFE033",
            initialX: 460,
            initialY: -150,
            targetX: 0,
            targetY: -70,
            rotate: 12,
            icon: (
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
            customSlot: (
                <svg viewBox="0 0 200 200" className="w-full h-full scale-75">
                    <polygon points="100,18 182,172 18,172" fill="#FF1F7A" stroke="#111111" strokeWidth="6" strokeLinejoin="round" />
                    <polygon points="100,52 158,158 42,158" fill="#002BFF" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
                    <polygon points="100,84 132,142 68,142" fill="#FFE033" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            id: "okr",
            title: "Haqiqiy Vaqtdagi OKR",
            badge: "Maqsadlar",
            stats: "89% Bajarilish Ulushi",
            tagColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
            glowColor: "rgba(168, 85, 247, 0.25)",
            bgColor: "#00CFFF",
            initialX: -510,
            initialY: 0,
            targetX: 140,
            targetY: -70,
            rotate: -6,
            icon: (
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            customSlot: (
                <svg viewBox="0 0 200 200" className="w-full h-full scale-75">
                    <path d="M30,170 L30,100 A70,70 0 0,1 170,100 L170,170 Z" fill="#FFE033" stroke="#111111" strokeWidth="6" />
                    <path d="M55,170 L55,112 A45,45 0 0,1 145,112 L145,170 Z" fill="#FF1F7A" stroke="#111111" strokeWidth="5" />
                    <path d="M80,170 L80,124 A20,20 0 0,1 120,124 L120,170 Z" fill="#00E5A0" stroke="#111111" strokeWidth="4" />
                    <rect x={25} y={163} width={150} height={12} fill="#111111" />
                </svg>
            ),
        },
        {
            id: "analytics",
            title: "Executive BI Tahlil",
            badge: "Metrikalar",
            stats: "Turnover & eNPS",
            tagColor: "bg-blue-100 text-blue-700 border-blue-200",
            glowColor: "rgba(59, 130, 246, 0.25)",
            bgColor: "#FF1F7A",
            initialX: 510,
            initialY: 0,
            targetX: -140,
            targetY: 70,
            rotate: 6,
            icon: (
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            customSlot: (
                <svg viewBox="0 0 200 200" className="w-full h-full scale-75">
                    <rect x={18} y={142} width={130} height={42} fill="#FF6B35" stroke="#111111" strokeWidth="5" />
                    <rect x={30} y={100} width={108} height={46} fill="#00CFFF" stroke="#111111" strokeWidth="5" />
                    <rect x={44} y={63} width={84} height={42} fill="#FF1F7A" stroke="#111111" strokeWidth="5" />
                    <rect x={60} y={30} width={60} height={38} fill="#FFE033" stroke="#111111" strokeWidth="5" />
                </svg>
            ),
        },
        {
            id: "360-eval",
            title: "360° Baholash",
            badge: "Feedback",
            stats: "Anonim & Obyektiv",
            tagColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
            glowColor: "rgba(99, 102, 241, 0.25)",
            bgColor: "#FF6B35",
            initialX: -450,
            initialY: 150,
            targetX: 0,
            targetY: 70,
            rotate: -10,
            icon: (
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            ),
            customSlot: (
                <svg viewBox="0 0 200 200" className="w-full h-full scale-75">
                    <circle cx="100" cy="100" r="80" fill="#FFE033" stroke="#111111" strokeWidth="6" />
                    <circle cx="100" cy="100" r="50" fill="#FF1F7A" stroke="#111111" strokeWidth="5" />
                    <circle cx="100" cy="100" r="22" fill="#00CFFF" stroke="#111111" strokeWidth="4" />
                    <circle cx="100" cy="100" r="8" fill="#111111" />
                </svg>
            ),
        },
        {
            id: "disc",
            title: "DISC Xulq-atvor Modeli",
            badge: "Psixologiya",
            stats: "Dominance & Influence",
            tagColor: "bg-rose-100 text-rose-700 border-rose-200",
            glowColor: "rgba(244, 63, 94, 0.25)",
            bgColor: "#00E5A0",
            initialX: 450,
            initialY: 150,
            targetX: 140,
            targetY: 70,
            rotate: 10,
            icon: (
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            customSlot: (
                <svg viewBox="0 0 200 200" className="w-full h-full scale-75">
                    <path d="M10,35 c8,-18 22,-18 30,0 c8,18 22,18 30,0 c8,-18 22,-18 30,0" fill="none" stroke="#FFE033" strokeWidth="5" strokeLinecap="round" />
                    <path d="M10,68 c8,-18 22,-18 30,0 c8,18 22,18 30,0 c8,-18 22,-18 30,0" fill="none" stroke="#FF1F7A" strokeWidth="5" strokeLinecap="round" />
                    <path d="M10,101 c8,-18 22,-18 30,0 c8,18 22,18 30,0 c8,-18 22,-18 30,0" fill="none" stroke="#00E5A0" strokeWidth="5" strokeLinecap="round" />
                    <path d="M10,134 c8,-18 22,-18 30,0 c8,18 22,18 30,0 c8,-18 22,-18 30,0" fill="none" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round" />
                    <path d="M10,167 c8,-18 22,-18 30,0 c8,18 22,18 30,0 c8,-18 22,-18 30,0" fill="none" stroke="#00CFFF" strokeWidth="5" strokeLinecap="round" />
                </svg>
            ),
        },
    ];

    const cardList = customCards && customCards.length > 0 ? customCards : defaultCards;

    return (
        <div ref={containerRef} className="relative h-[480vh] w-full bg-[#f8f8f8]">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#f8f8f8] via-slate-50/50 to-[#f8f8f8]">
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        opacity: 0.15 + ep * 0.2,
                        backgroundImage: "radial-gradient(#9333ea 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />

                <div
                    className="absolute w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transition-all duration-700"
                    style={{
                        background: `radial-gradient(circle, rgba(147,51,234,${0.15 + ep * 0.35}) 0%, rgba(59,130,246,${0.1 + ep * 0.25}) 50%, transparent 70%)`,
                        transform: `scale(${0.7 + ep * 0.6})`,
                    }}
                />

                <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 md:px-8 max-w-[1300px] mx-auto z-10 pointer-events-none"
                    style={{
                        opacity: Math.max(0, 1 - ep / 0.35),
                        transform: `translate3d(0, ${-ep * 340}px, 0)`,
                        visibility: ep > 0.38 ? "hidden" : "visible",
                    }}
                >
                    <div className="mb-6 flex items-center justify-center">
                        <svg
                            width="52"
                            height="52"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="black" />
                            <path
                                d="M2 17L12 22L22 17"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M2 12L12 17L22 12"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 tracking-tight leading-[1.08] max-w-4xl mx-auto mb-6">
                        {t("heroTitle1")}{" "}
                        <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                            {t("heroTitle2")}
                        </span>
                    </h1>

                    <p className="text-base md:text-lg text-slate-600 font-normal max-w-2xl mx-auto mb-8 leading-relaxed">
                        {t("heroSubtitle")}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
                        <Link
                            href={`/${locale}/login`}
                            className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-6 py-3 text-sm md:text-base transition-all duration-200 shadow-sm flex items-center gap-2.5"
                        >
                            <span>{t("loginBtn")}</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>

                        <button
                            type="button"
                            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium rounded-xl px-6 py-3 text-sm md:text-base transition-all duration-200 shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                            <svg className="w-5 h-5 text-[#9327FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>{t("tryFreeBtn")}</span>
                        </button>
                    </div>
                </div>

                <div
                    className="relative z-10 flex flex-col items-center justify-center text-center transition-all duration-300 pointer-events-none px-4"
                    style={{
                        transform: `translate3d(0, ${135 + (ep < 0.65 ? 0 : Math.min(1, (ep - 0.65) / 0.35)) * 80}px, 0)`,
                        opacity: ep < 0.65 ? 0 : Math.min(1, (ep - 0.65) / 0.35),
                        visibility: ep < 0.65 ? "hidden" : "visible",
                    }}
                >
                    <div className="flex flex-col items-center pointer-events-auto">
                        <span
                            className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-[#9327FF] mb-1.5 transition-all duration-300"
                            style={{ letterSpacing: `${2 + (ep < 0.68 ? 0 : Math.min(1, (ep - 0.68) / 0.32)) * 4}px` }}
                        >
                            {t("coreBadge")}
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight mb-2">
                            {t("unifiedTitle")}
                        </h2>
                        <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-lg mx-auto font-medium mb-1">
                            {t("unifiedSubtitle")}
                        </p>

                        <div
                            className="mt-3.5 flex items-center gap-3 transition-all duration-500"
                            style={{
                                opacity: ep > 0.82 ? 1 : 0,
                                transform: `translateY(${ep > 0.82 ? 0 : 15}px)`,
                                pointerEvents: ep > 0.82 ? "auto" : "none",
                            }}
                        >
                            <Link
                                href={`/${locale}/login`}
                                className="bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-6 py-3 text-sm transition-all duration-200 shadow-sm flex items-center gap-1.5"
                            >
                                {t("goToPlatform")}
                            </Link>
                            <Link
                                href={`/${locale}/hr/org-chart`}
                                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium rounded-xl px-6 py-3 text-sm transition-all duration-200 shadow-sm flex items-center gap-1.5"
                            >
                                {t("viewHierarchy")}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                    {cardList.map((card) => {
                        const curX = card.initialX * invEp + card.targetX * ep;
                        const curY = card.initialY * invEp + card.targetY * ep;
                        const curRotate = card.rotate * invEp;
                        const curScale = 0.82 + (1 - invEp) * 0.18;
                        const curRadius = Math.max(0, invEp * 20);
                        const bgOpacity = ep < 0.65 ? 0 : Math.min(1, (ep - 0.65) / 0.35);

                        return (
                            <div
                                key={card.id}
                                className="absolute w-28 h-28 sm:w-32 sm:h-32 md:w-[140px] md:h-[140px] flex items-center justify-center pointer-events-auto select-none overflow-hidden"
                                style={{
                                    transform: `translate3d(${curX}px, ${curY}px, 0) rotate(${curRotate}deg) scale(${curScale})`,
                                }}
                            >
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        backgroundColor: card.bgColor,
                                        borderRadius: `${curRadius}px`,
                                        opacity: bgOpacity,
                                    }}
                                />
                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                    {card.customSlot}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
