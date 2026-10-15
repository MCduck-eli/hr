"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { loginApi } from "@/src/services/auth";
import { Eye, EyeOff } from "lucide-react";

function getRoleDashboardPath(locale: string, role?: string) {
    if (role === "SUPER_ADMIN") {
        return `/${locale}/dashboard`;
    } else if (role === "DIRECTOR") {
        return `/${locale}/director/dashboard`;
    } else if (role === "HR_ADMIN") {
        return `/${locale}/hr/dashboard`;
    } else if (role === "ACCOUNTANT") {
        return `/${locale}/profile?tab=payroll`;
    } else if (role === "MANAGER" || role === "DEPARTMENT_HEAD") {
        return `/${locale}/manager/okr`;
    } else if (role === "RECRUITER") {
        return `/${locale}/recruiter/vacancies`;
    }
    return `/${locale}/profile`;
}

function isInvalidCredentials(msg: string): boolean {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
        lower.includes("noto'g'ri") ||
        lower.includes("неверн") ||
        lower.includes("invalid") ||
        lower.includes("failed") ||
        lower.includes("email yoki parol")
    );
}

const backgrounds = [
    "/images/O‘zbekona meros manzarasi.png",
    "/images/Sehrli Samarqand_ Oltin va Moviy Ohanglar.png",
    "/images/Temuriylar sohibqironi shahri uzra.png"
];

export default function LoginPage() {
    const t = useTranslations("Login");
    const tErr = useTranslations("errors");
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
    const [bannerImage, setBannerImage] = useState(backgrounds[0]);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * backgrounds.length);
        setBannerImage(backgrounds[randomIndex]);

        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                router.replace(getRoleDashboardPath(locale, user.role));
            } catch (e) {}
        }
    }, [locale, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const newErrors: { email?: string; password?: string } = {};
        if (!email.trim()) {
            newErrors.email = "requiredField";
        }
        if (!password.trim()) {
            newErrors.password = "requiredField";
        }

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const responseData = await loginApi({
                email: email.trim(),
                password: password.trim(),
            });

            const actualData = responseData.data
                ? responseData.data
                : responseData;

            if (!actualData.token || !actualData.user) {
                throw new Error("Token yoki foydalanuvchi ma'lumotlari kelmadi!");
            }

            const role = actualData.user?.role || "";

            localStorage.setItem("token", actualData.token);
            localStorage.setItem("user", JSON.stringify(actualData.user));
            document.cookie = `token=${actualData.token}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `user_role=${role}; path=/; max-age=86400; SameSite=Lax`;

            router.push(getRoleDashboardPath(locale, role));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen h-screen overflow-hidden flex flex-col lg:flex-row bg-[#E0E5EC]">
            <div className="hidden lg:block lg:w-1/2 h-full relative overflow-hidden bg-slate-950 shrink-0">
                <img
                    src={bannerImage}
                    alt="HR Platform"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto bg-[#E0E5EC] relative">
                <div
                    className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-20"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: "240px 240px",
                    }}
                />
                <div className="relative z-10 w-full max-w-md bg-[#E0E5EC] rounded-3xl p-8 sm:p-10 shadow-[10px_10px_20px_#a3b1c6,-10px_-10px_20px_#ffffff]">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white shadow-md mb-4 lg:hidden">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                            {t("title")}
                        </h1>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2.5">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                                {isInvalidCredentials(error)
                                    ? tErr("invalidCredentials")
                                    : error}
                            </span>
                        </div>
                    )}

                    <form noValidate onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                {t("email")}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (formErrors.email) {
                                        setFormErrors((prev) => ({ ...prev, email: undefined }));
                                    }
                                }}
                                className="w-full px-4 py-3.5 rounded-xl bg-[#E0E5EC] shadow-[inset_5px_5px_10px_#a3b1c6,inset_-5px_-5px_10px_#ffffff] text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all duration-200 font-medium"
                            />
                            {formErrors.email && (
                                <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                    {tErr(formErrors.email)}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                {t("password")}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (formErrors.password) {
                                            setFormErrors((prev) => ({ ...prev, password: undefined }));
                                        }
                                    }}
                                    className="w-full px-4 py-3.5 pr-11 rounded-xl bg-[#E0E5EC] shadow-[inset_5px_5px_10px_#a3b1c6,inset_-5px_-5px_10px_#ffffff] text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all duration-200 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {formErrors.password && (
                                <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                    {tErr(formErrors.password)}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-3 w-full bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-6 py-3.5 text-sm transition-all duration-200 shadow-[6px_6px_12px_#a3b1c6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.2)] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    <span>{t("loading")}</span>
                                </div>
                            ) : (
                                <span>{t("submit")}</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
