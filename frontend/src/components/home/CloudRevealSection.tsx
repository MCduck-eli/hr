"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function CloudRevealSection() {
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
    const invEp = 1 - ep;

    const leftCloudShift = -ep * 120;
    const rightCloudShift = ep * 120;
    const topCloudShift = -ep * 90;
    const bottomCloudShift = ep * 90;

    const textScale = 0.85 + ep * 0.25;
    const textOpacity = Math.min(1, Math.max(0, (ep - 0.08) / 0.55));

    return (
        <div ref={containerRef} className="relative h-[220vh] w-full bg-[#fff0f4]">
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
                    className="absolute w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none transition-all duration-700"
                    style={{
                        background: "radial-gradient(circle, rgba(254,205,211,0.7) 0%, rgba(255,228,230,0.4) 50%, transparent 75%)",
                        transform: `scale(${0.9 + ep * 0.4})`,
                    }}
                />

                <div
                    className="relative z-10 flex flex-col items-center justify-center text-center px-4 md:px-8 max-w-[1100px] mx-auto pointer-events-none transition-transform duration-100"
                    style={{
                        transform: `scale(${textScale})`,
                        opacity: textOpacity,
                    }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-rose-200/80 shadow-xs mb-6 backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs md:text-sm font-extrabold text-rose-600 tracking-wider uppercase">
                            {t("cloudRevealBadge")}
                        </span>
                    </div>

                    <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-[#f43f5e] leading-[1.08] mb-6 drop-shadow-xs">
                        {t("cloudRevealTitle")}
                    </h2>

                    <p className="text-base sm:text-lg md:text-xl text-rose-950/70 font-medium max-w-2xl mx-auto leading-relaxed">
                        {t("cloudRevealSubtitle")}
                    </p>
                </div>

                <div
                    className="absolute inset-y-0 -left-20 w-[65vw] max-w-[900px] z-20 pointer-events-none flex items-center transition-transform duration-75"
                    style={{
                        transform: `translate3d(${leftCloudShift}%, 0, 0)`,
                    }}
                >
                    <svg
                        viewBox="0 0 700 500"
                        className="w-full h-full scale-110 drop-shadow-[0_20px_35px_rgba(244,63,94,0.12)]"
                        fill="none"
                    >
                        <path
                            d="M100 380 C40 380 0 330 0 270 C0 210 45 165 105 165 C120 100 180 50 255 50 C335 50 400 105 415 175 C455 160 505 180 520 225 C565 235 600 275 600 325 C600 380 550 425 490 425 L100 425 Z"
                            fill="url(#cloud-grad-left)"
                        />
                        <defs>
                            <linearGradient id="cloud-grad-left" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                                <stop offset="70%" stopColor="#ffe4ea" stopOpacity="0.92" />
                                <stop offset="100%" stopColor="#fecdd3" stopOpacity="0.85" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div
                    className="absolute inset-y-0 -right-20 w-[65vw] max-w-[900px] z-20 pointer-events-none flex items-center transition-transform duration-75"
                    style={{
                        transform: `translate3d(${rightCloudShift}%, 0, 0)`,
                    }}
                >
                    <svg
                        viewBox="0 0 700 500"
                        className="w-full h-full scale-110 drop-shadow-[0_20px_35px_rgba(244,63,94,0.12)]"
                        fill="none"
                    >
                        <path
                            d="M600 380 C660 380 700 330 700 270 C700 210 655 165 595 165 C580 100 520 50 445 50 C365 50 300 105 285 175 C245 160 195 180 180 225 C135 235 100 275 100 325 C100 380 150 425 210 425 L600 425 Z"
                            fill="url(#cloud-grad-right)"
                        />
                        <defs>
                            <linearGradient id="cloud-grad-right" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                                <stop offset="70%" stopColor="#ffe4ea" stopOpacity="0.92" />
                                <stop offset="100%" stopColor="#fecdd3" stopOpacity="0.85" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div
                    className="absolute -top-16 inset-x-0 h-[45vh] z-30 pointer-events-none flex justify-center transition-transform duration-75"
                    style={{
                        transform: `translate3d(0, ${topCloudShift}%, 0)`,
                    }}
                >
                    <svg
                        viewBox="0 0 1000 350"
                        className="w-full h-full drop-shadow-[0_15px_30px_rgba(244,63,94,0.08)]"
                        fill="none"
                    >
                        <path
                            d="M0 0 L1000 0 L1000 180 C930 180 870 140 800 140 C720 140 660 210 560 210 C460 210 410 130 300 130 C200 130 140 190 0 190 Z"
                            fill="url(#cloud-grad-top)"
                        />
                        <defs>
                            <linearGradient id="cloud-grad-top" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                                <stop offset="100%" stopColor="#ffe4ea" stopOpacity="0.75" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div
                    className="absolute -bottom-16 inset-x-0 h-[45vh] z-30 pointer-events-none flex justify-center transition-transform duration-75"
                    style={{
                        transform: `translate3d(0, ${bottomCloudShift}%, 0)`,
                    }}
                >
                    <svg
                        viewBox="0 0 1000 350"
                        className="w-full h-full drop-shadow-[0_-15px_30px_rgba(244,63,94,0.08)]"
                        fill="none"
                    >
                        <path
                            d="M0 350 L1000 350 L1000 160 C920 160 860 210 770 210 C670 210 610 130 490 130 C380 130 320 220 200 220 C110 220 50 170 0 170 Z"
                            fill="url(#cloud-grad-bottom)"
                        />
                        <defs>
                            <linearGradient id="cloud-grad-bottom" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                                <stop offset="100%" stopColor="#ffe4ea" stopOpacity="0.8" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>
        </div>
    );
}
