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

    if (loading) return <div className="p-8 text-center font-bold text-gray-500">YUKLANMOQDA...</div>;
    if (!vacancy) return <div className="p-8 text-center font-bold text-red-500">VAKANSIYA TOPILMADI</div>;

    if (success) {
        return (
            <div className="max-w-3xl mx-auto p-8 text-center mt-20">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                    ✓
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-black mb-4">
                    ARIZANGIZ QABUL QILINDI
                </h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    Biz sizning arizangizni ko'rib chiqib, tez orada aloqaga chiqamiz.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 mt-10 flex flex-col gap-12">
            <div className="border-b border-gray-200 pb-8">
                <h1 className="text-4xl font-black tracking-tight text-black uppercase mb-4">
                    {vacancy.title}
                </h1>
                {vacancy.companyName && (
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        🏢 {vacancy.companyName}
                    </div>
                )}
                <div className="flex flex-col gap-6 mt-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tavsif</h3>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{vacancy.description}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Talablar</h3>
                        <ul className="list-disc list-inside text-sm text-gray-800 space-y-2">
                            {reqsList.map((req, i) => (
                                <li key={i}>{req}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 p-8">
                <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-6">
                    Ariza topshirish
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Ism *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                className="w-full p-4 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
                                placeholder="Ismingiz"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Familiya *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                className="w-full p-4 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
                                placeholder="Familiyangiz"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full p-4 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
                                placeholder="Email manzilingiz"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Telefon raqam *
                            </label>
                            <input
                                type="tel"
                                required
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full p-4 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
                                placeholder="+998 90 123 45 67"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Yashash joyi (Lokatsiya) *
                        </label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                required
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                className="w-full p-4 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
                                placeholder="Shahar, Tuman yoki Manzil"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition(
                                            async (position) => {
                                                try {
                                                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                                                    const data = await res.json();
                                                    setForm({ ...form, location: data.display_name || "Joylashuv aniqlandi" });
                                                } catch (e) {
                                                    setForm({ ...form, location: `${position.coords.latitude}, ${position.coords.longitude}` });
                                                }
                                            },
                                            (error) => alert("Joylashuvni aniqlashda xatolik!")
                                        );
                                    } else {
                                        alert("Brauzeringiz joylashuvni qollab quvvatlamaydi!");
                                    }
                                }}
                                className="whitespace-nowrap px-6 border border-gray-200 text-[11px] font-bold text-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
                            >
                                Avtomatik joylashuv
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Qo'shimcha ma'lumot (Cover Letter)
                        </label>
                        <textarea
                            value={form.coverLetter}
                            onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                            className="w-full p-4 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors h-24 resize-none"
                            placeholder="O'zingiz haqingizda qisqacha ma'lumot qoldiring..."
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Rezyume (Fayl) *
                        </label>
                        <input
                            type="file"
                            required
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full p-3 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors"
                        />
                        <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            PDF, DOC yoki DOCX formatidagi faylni yuklang
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        {reqsList.map((req, i) => (
                            <label key={i} className="flex items-start gap-4 p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={answers[i]}
                                    onChange={(e) => {
                                        const newAnswers = [...answers];
                                        newAnswers[i] = e.target.checked;
                                        setAnswers(newAnswers);
                                    }}
                                    className="mt-1 w-5 h-5 accent-black cursor-pointer"
                                />
                                <div>
                                    <div className="text-sm font-bold text-black leading-snug">
                                        {req}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                        Talab qilinadi
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={applying}
                        className="mt-4 bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {applying ? "YUBORILMOQDA..." : "ARIZANI YUBORISH"}
                    </button>
                </form>
            </div>
        </div>
    );
}
