"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const languages = [
        { code: "uz", label: "O'ZBEK" },
        { code: "ru", label: "РУССКИЙ" },
        { code: "en", label: "ENGLISH" },
    ];

    const currentLocale = pathname.split("/")[1];
    const activeLangCode = languages.some((l) => l.code === currentLocale)
        ? currentLocale
        : "en";
    const currentLangLabel =
        languages.find((l) => l.code === activeLangCode)?.code.toUpperCase() ||
        "EN";

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const selectLanguage = (code: string) => {
        setIsOpen(false);
        if (code === activeLangCode) return;

        const segments = pathname.split("/");
        const locales = ["uz", "ru", "en"];

        if (locales.includes(segments[1])) {
            segments[1] = code;
            window.location.href = segments.join("/");
        } else {
            window.location.href = `/${code}${pathname === "/" ? "" : pathname}`;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1"
            >
                {currentLangLabel}
                <svg
                    className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-4 w-28 bg-white border border-gray-200 flex flex-col z-50 shadow-sm">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => selectLanguage(lang.code)}
                            className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-left hover:bg-[#f8f8f8] transition-colors ${
                                activeLangCode === lang.code
                                    ? "text-black bg-[#f8f8f8]"
                                    : "text-gray-500"
                            }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
