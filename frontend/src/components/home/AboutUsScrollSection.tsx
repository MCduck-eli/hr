"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function AboutUsScrollSection() {
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

    const ep = progress;

    const cardsOpacity = ep < 0.05 ? 0 : ep < 0.25 ? (ep - 0.05) / 0.2 : ep < 0.6 ? 1 : Math.max(0, 1 - (ep - 0.6) / 0.12);
    const cardsScale = ep < 0.6 ? 0.85 + ep * 0.25 : Math.max(0.7, 1 - (ep - 0.6) * 1.2);

    const orbitAngle = ep * 1.8;

    const p2 = Math.min(1, Math.max(0, (ep - 0.62) / 0.38));

    const logoScale = 1.2 - p2 * 0.72;
    const logoY = -p2 * 230;

    const textOpacity = Math.min(1, Math.max(0, (p2 - 0.15) / 0.75));
    const textScale = 0.86 + p2 * 0.14;
    const textY = (1 - p2) * 50;

    const orbitRadiusX = 280;
    const orbitRadiusY = 170;

    const cardsData = [
        {
            baseAngle: -0.75 * Math.PI,
            val: t("aboutCard1Val"),
            title: t("aboutCard1Title"),
            desc: t("aboutCard1Desc"),
            icon: "🏢",
            badgeColor: "bg-rose-50 text-rose-600 border-rose-200",
        },
        {
            baseAngle: -0.25 * Math.PI,
            val: t("aboutCard2Val"),
            title: t("aboutCard2Title"),
            desc: t("aboutCard2Desc"),
            icon: "⚡",
            badgeColor: "bg-pink-50 text-pink-600 border-pink-200",
        },
        {
            baseAngle: 0.25 * Math.PI,
            val: t("aboutCard3Val"),
            title: t("aboutCard3Title"),
            desc: t("aboutCard3Desc"),
            icon: "👥",
            badgeColor: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
        },
        {
            baseAngle: 0.75 * Math.PI,
            val: t("aboutCard4Val"),
            title: t("aboutCard4Title"),
            desc: t("aboutCard4Desc"),
            icon: "🛡️",
            badgeColor: "bg-purple-50 text-purple-600 border-purple-200",
        },
    ];

    return (
        <div ref={containerRef} className="relative h-[260vh] w-full bg-[#fff0f4]">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#fff0f4] via-[#ffe4ea] to-[#fff0f4]">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        opacity: 0.28,
                        backgroundImage: "radial-gradient(#f43f5e 1px, transparent 1px)",
                        backgroundSize: "36px 36px",
                    }}
                />

                <div
                    className="absolute w-[650px] h-[650px] rounded-full blur-3xl pointer-events-none transition-transform duration-700"
                    style={{
                        background: "radial-gradient(circle, rgba(254,205,211,0.7) 0%, rgba(255,228,230,0.4) 50%, transparent 75%)",
                        transform: `scale(${1 + ep * 0.3})`,
                    }}
                />

                <div
                    className="absolute z-20 flex flex-col items-center justify-center transition-all duration-75 pointer-events-none select-none"
                    style={{
                        transform: `translate3d(0, ${logoY}px, 0) scale(${logoScale})`,
                    }}
                >
                    <div className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-3xl bg-white/90 shadow-[0_20px_60px_rgba(244,63,94,0.22)] border border-white backdrop-blur-xl">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-rose-500/10 via-transparent to-pink-500/20 pointer-events-none" />
                        <svg
                            viewBox="0 0 24 24"
                            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 drop-shadow-md text-black"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                            <path
                                d="M2 17L12 22L22 17"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M2 12L12 17L22 12"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>

                <div
                    className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                    style={{
                        opacity: cardsOpacity,
                        transform: `scale(${cardsScale})`,
                    }}
                >
                    {cardsData.map((card, i) => {
                        const currentAngle = card.baseAngle + orbitAngle;
                        const x = Math.cos(currentAngle) * orbitRadiusX;
                        const y = Math.sin(currentAngle) * orbitRadiusY;

                        return (
                            <div
                                key={i}
                                className="absolute flex flex-col gap-1 p-4 sm:p-5 rounded-2xl bg-white/80 border border-white/90 shadow-[0_15px_35px_rgba(244,63,94,0.12)] backdrop-blur-lg w-52 sm:w-60 pointer-events-auto transition-transform duration-75"
                                style={{
                                    transform: `translate3d(${x}px, ${y}px, 0)`,
                                }}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xl sm:text-2xl">{card.icon}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                                        {card.val}
                                    </span>
                                </div>
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                                    {card.title}
                                </h4>
                                <p className="text-xs text-slate-600 font-medium leading-snug">
                                    {card.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div
                    className="relative z-30 flex flex-col items-center justify-center text-center px-4 md:px-8 max-w-[1000px] mx-auto mt-28 pointer-events-none transition-all duration-100"
                    style={{
                        opacity: textOpacity,
                        transform: `translate3d(0, ${textY}px, 0) scale(${textScale})`,
                        pointerEvents: p2 > 0.8 ? "auto" : "none",
                    }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-rose-200/80 shadow-xs mb-5 backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                        <span className="text-xs md:text-sm font-extrabold text-rose-600 tracking-wider uppercase">
                            {t("about")}
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 leading-[1.12] mb-6 drop-shadow-xs max-w-4xl">
                        {t("heading")}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-left max-w-3xl mx-auto w-full">
                        <div className="p-5 sm:p-6 rounded-2xl bg-white/85 border border-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur-md">
                            <p className="text-sm sm:text-base font-normal text-slate-700 leading-relaxed">
                                {t("p1")}
                            </p>
                        </div>
                        <div className="p-5 sm:p-6 rounded-2xl bg-white/85 border border-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur-md">
                            <p className="text-sm sm:text-base font-normal text-slate-700 leading-relaxed">
                                {t("p2")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
