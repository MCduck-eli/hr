"use client";

import { useTranslations } from "next-intl";

export default function Home() {
    const t = useTranslations("Home");

    return (
        <div className="flex flex-col w-full bg-[#f8f8f8] text-black pt-20 pb-32">
            <div className="flex flex-col items-center justify-center text-center px-4 mb-32 relative z-10">
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-10"
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
                <h1 className="text-[64px] md:text-[96px] font-black uppercase tracking-tighter text-black mb-6 leading-none">
                    {t("title")}
                </h1>
                <p className="text-lg md:text-xl font-medium text-black max-w-2xl">
                    {t("subtitle")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 px-4 md:px-8 max-w-[1200px] mx-auto w-full relative z-10">
                <div className="flex justify-start md:justify-end pr-0 md:pr-12 pt-2">
                    <div className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-[#22c55e]"></div>
                        <span className="text-[13px] font-bold uppercase tracking-widest text-black">
                            {t("about")}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-8">
                    <h2 className="text-4xl md:text-[44px] font-bold leading-tight text-black tracking-tight">
                        {t("heading")}
                    </h2>
                    <div className="flex flex-col gap-6 text-[15px] font-medium text-gray-600 leading-relaxed max-w-[540px]">
                        <p>{t("p1")}</p>
                        <p>{t("p2")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
