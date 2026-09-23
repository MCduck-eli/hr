"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { loginApi } from "@/src/services/auth";

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

export default function LoginPage() {
    const t = useTranslations("Login");
    const tErr = useTranslations("errors");
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

    useEffect(() => {
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
        <div className="w-full h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden flex flex-col lg:flex-row bg-[#fafafc]">
            <div className="hidden lg:block lg:w-1/2 h-full relative overflow-hidden bg-slate-950 shrink-0">
                <img
                    src="/images/auth-banner.jpg"
                    alt="HR Platform"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
                <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
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
                                className={`w-full px-4 py-3.5 rounded-xl border ${
                                    formErrors.email
                                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                        : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-600"
                                } bg-slate-50/50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 font-medium`}
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
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (formErrors.password) {
                                        setFormErrors((prev) => ({ ...prev, password: undefined }));
                                    }
                                }}
                                className={`w-full px-4 py-3.5 rounded-xl border ${
                                    formErrors.password
                                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                        : "border-slate-200 focus:ring-purple-500/20 focus:border-purple-600"
                                } bg-slate-50/50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 font-medium`}
                            />
                            {formErrors.password && (
                                <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                    {tErr(formErrors.password)}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-3 w-full bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl px-6 py-3.5 text-sm transition-all duration-200 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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
