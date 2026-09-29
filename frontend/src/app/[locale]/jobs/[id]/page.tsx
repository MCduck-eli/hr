"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicVacancy, applyForJob } from "@/src/services/recruiting-service";

export default function JobApplyPage() {
    const params = useParams();
    const [vacancy, setVacancy] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        location: "",
        coverLetter: "",
    });
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [reqsList, setReqsList] = useState<string[]>([]);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [suggestions, setSuggestions] = useState<Array<{ displayName: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchingLocation, setSearchingLocation] = useState(false);

    const handleLocationInputChange = async (value: string) => {
        setForm((prev) => ({ ...prev, location: value }));
        if (value.trim().length >= 2) {
            setSearchingLocation(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
                const res = await fetch(`${API_URL}/recruitment/search-location?q=${encodeURIComponent(value.trim())}`);
                const data = await res.json();
                if (data?.data && Array.isArray(data.data)) {
                    setSuggestions(data.data);
                    setShowSuggestions(data.data.length > 0);
                }
            } catch (_) {}
            setSearchingLocation(false);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        const loadVacancy = async () => {
            try {
                if (params.id) {
                    const data = await getPublicVacancy(params.id as string);
                    setVacancy(data);
                    
                    let parsedReqs = [];
                    try {
                        parsedReqs = JSON.parse(data.requirements);
                        if (!Array.isArray(parsedReqs)) throw new Error();
                    } catch {
                        parsedReqs = [data.requirements];
                    }
                    setReqsList(parsedReqs);
                    setAnswers(new Array(parsedReqs.length).fill(false));
                }
            } catch (error) {
                console.error("Failed to load vacancy", error);
            } finally {
                setLoading(false);
            }
        };
        loadVacancy();
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resumeFile) {
            alert("Iltimos, rezyumeni yuklang.");
            return;
        }
        setApplying(true);
        try {
            const formData = new FormData();
            formData.append("fullName", `${form.firstName} ${form.lastName}`.trim());
            formData.append("email", form.email);
            formData.append("phone", form.phone);
            formData.append("location", form.location);
            formData.append("coverLetter", form.coverLetter);
            const combinedText = reqsList.map((req, i) => {
                const isChecked = answers[i];
                if (!isChecked) return `Javob ${i+1}:\nYo'q`;
                return `Talab (Match): ${req}\nJavob ${i+1}:\nHa, bilaman`;
            }).join("\n\n");
            formData.append("resumeText", combinedText);
            formData.append("resume", resumeFile);
            formData.append("vacancyId", params.id as string);

            await applyForJob(formData);
            setSuccess(true);
        } catch (error: any) {
            console.error("Failed to apply", error);
            alert(error.message || "Arizani yuborishda xatolik yuz berdi.");
        } finally {
            setApplying(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest animate-pulse">Yuklanmoqda...</div>
        </div>
    );

    if (!vacancy) return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
                <div className="text-4xl mb-3">🔍</div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Vakansiya topilmadi</h2>
                <p className="text-xs text-gray-500">Ushbu vakansiya mavjud emas yoki muddati tugagan.</p>
            </div>
        </div>
    );

    if (success) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center max-w-xl w-full">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                        ✓
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">
                        Arizangiz qabul qilindi
                    </h1>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Biz sizning arizangizni ko'rib chiqib, tez orada ko'rsatilgan kontaktlar orqali siz bilan aloqaga chiqamiz.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="flex flex-col gap-3 pb-6 border-b border-gray-100">
                        {vacancy.companyName && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 px-3 py-1 rounded-lg w-fit">
                                🏢 {vacancy.companyName}
                            </span>
                        )}
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                            {vacancy.title}
                        </h1>
                    </div>

                    <div className="flex flex-col gap-6 mt-6">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tavsif</h3>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{vacancy.description}</p>
                        </div>
                        {reqsList.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Talablar</h3>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                                    {reqsList.map((req, i) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                        Ariza topshirish
                    </h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Ism *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.firstName}
                                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                    className="rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 px-4 py-3 outline-none transition-all w-full bg-gray-50/50 focus:bg-white text-sm text-gray-900"
                                    placeholder="Ismingiz"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Familiya *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.lastName}
                                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                    className="rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 px-4 py-3 outline-none transition-all w-full bg-gray-50/50 focus:bg-white text-sm text-gray-900"
                                    placeholder="Familiyangiz"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 px-4 py-3 outline-none transition-all w-full bg-gray-50/50 focus:bg-white text-sm text-gray-900"
                                    placeholder="Email manzilingiz"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Telefon raqam *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 px-4 py-3 outline-none transition-all w-full bg-gray-50/50 focus:bg-white text-sm text-gray-900"
                                    placeholder="+998 90 123 45 67"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Yashash joyi (Lokatsiya) *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={form.location}
                                    onChange={(e) => handleLocationInputChange(e.target.value)}
                                    onFocus={() => {
                                        if (suggestions.length > 0) setShowSuggestions(true);
                                    }}
                                    className="rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 px-4 py-3 outline-none transition-all w-full bg-gray-50/50 focus:bg-white text-sm text-gray-900"
                                    placeholder="Shahar, tuman, ko'cha nomi yoki bino..."
                                />
                                {searchingLocation && (
                                    <div className="absolute right-4 top-3.5 text-xs text-violet-600 font-semibold animate-pulse">
                                        Qidirilmoqda...
                                    </div>
                                )}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                        {suggestions.map((s, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setForm((prev) => ({ ...prev, location: s.displayName }));
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full text-left p-3.5 text-xs font-medium text-gray-800 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-start gap-2 transition-colors cursor-pointer"
                                            >
                                                <span className="text-gray-400">📍</span>
                                                <span className="line-clamp-2">{s.displayName}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Qo'shimcha ma'lumot (Cover Letter)
                            </label>
                            <textarea
                                value={form.coverLetter}
                                onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                                className="rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 px-4 py-3 outline-none transition-all w-full bg-gray-50/50 focus:bg-white text-sm text-gray-900 h-28 resize-none"
                                placeholder="O'zingiz haqingizda qisqacha ma'lumot qoldiring..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Rezyume (Fayl) *
                            </label>
                            <input
                                type="file"
                                required
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                                className="rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 px-4 py-3 outline-none transition-all w-full bg-gray-50/50 focus:bg-white text-sm text-gray-900 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                            />
                            <p className="mt-2 text-xs text-gray-400">
                                PDF, DOC yoki DOCX formatidagi faylni yuklang
                            </p>
                        </div>

                        {reqsList.length > 0 && (
                            <div className="flex flex-col gap-3 pt-2">
                                <span className="block text-sm font-medium text-gray-700 mb-1">
                                    Talablarga muvofiqligingizni tasdiqlang:
                                </span>
                                {reqsList.map((req, i) => (
                                    <label key={i} className="flex items-start gap-3.5 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/60 transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={answers[i]}
                                            onChange={(e) => {
                                                const newAnswers = [...answers];
                                                newAnswers[i] = e.target.checked;
                                                setAnswers(newAnswers);
                                            }}
                                            className="mt-0.5 w-4 h-4 accent-[#9327FF] rounded cursor-pointer shrink-0"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 leading-snug">
                                                {req}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                                                Talab qilinadi
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={applying}
                                className="bg-[#9327FF] text-white rounded-xl px-8 py-3.5 font-medium hover:opacity-90 transition-all shadow-sm w-full md:w-auto mt-4 cursor-pointer disabled:opacity-50 text-sm"
                            >
                                {applying ? "Yuborilmoqda..." : "Arizani yuborish"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
