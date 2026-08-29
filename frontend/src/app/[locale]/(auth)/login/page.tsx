"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { loginApi } from "@/src/services/auth";

export default function LoginPage() {
    const t = useTranslations("Login");
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);

    const processLoginSuccess = (actualData: any) => {
        if (!actualData.token || !actualData.user) {
            throw new Error("Token yoki foydalanuvchi ma'lumotlari kelmadi!");
        }

        localStorage.setItem("token", actualData.token);
        localStorage.setItem("user", JSON.stringify(actualData.user));
        document.cookie = `token=${actualData.token}; path=/; max-age=86400`;

        const role = actualData.user?.role;

        if (role === "SUPER_ADMIN") {
            router.push(`/${locale}/dashboard`);
        } else if (role === "DIRECTOR") {
            router.push(`/${locale}/director/dashboard`);
        } else if (role === "HR_ADMIN") {
            router.push(`/${locale}/hr/dashboard`);
        } else if (role === "MANAGER") {
            router.push(`/${locale}/manager/okr`);
        } else if (role === "RECRUITER") {
            router.push(`/${locale}/recruiter/vacancies`);
        } else {
            router.push(`/${locale}/profile`);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const responseData = await loginApi({
                email: email.trim(),
                password: password.trim(),
            });

            const actualData = responseData.data
                ? responseData.data
                : responseData;

            if (actualData.requiresCompanySelection) {
                setAvailableCompanies(actualData.companies || []);
                return;
            }

            processLoginSuccess(actualData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCompany = async (company: any) => {
        setError("");
        setLoading(true);
        try {
            const responseData = await loginApi({
                email: email.trim(),
                password: password.trim(),
                userId: company.id,
            });

            const actualData = responseData.data
                ? responseData.data
                : responseData;

            processLoginSuccess(actualData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <div className="w-full max-w-md p-8 bg-white border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold uppercase tracking-tight text-black mb-6 text-center">
                    {availableCompanies.length > 0 ? "Kompaniyani tanlang" : t("title")}
                </h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase">
                        {error}
                    </div>
                )}

                {availableCompanies.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        <p className="text-xs text-gray-500 font-medium text-center mb-2">
                            Ushbu email bir nechta kompaniyada ro'yxatdan o'tgan. Kirmoqchi bo'lgan kompaniyangizni tanlang:
                        </p>
                        {availableCompanies.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                disabled={loading}
                                onClick={() => handleSelectCompany(c)}
                                className="flex flex-col items-start p-3 border border-gray-200 hover:border-black hover:bg-gray-50 transition-all text-left"
                            >
                                <span className="text-sm font-bold text-black uppercase">
                                    {c.companyName}
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                    {c.name} ({c.role})
                                </span>
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setAvailableCompanies([])}
                            className="mt-2 text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider text-center"
                        >
                            Orqaga qaytish
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                {t("email")}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                {t("password")}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 py-3 bg-[#1a1a1a] text-white text-[12px] font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors disabled:opacity-50"
                        >
                            {loading ? t("loading") : t("submit")}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
