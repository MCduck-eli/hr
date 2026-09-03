"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicVacancies } from "@/src/services/recruiting-service";

export default function PublicCareersPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = (params?.locale as string) || "uz";
    const companyParam = searchParams.get("company") || "";

    const [vacancies, setVacancies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDept, setSelectedDept] = useState<string>("ALL");

    useEffect(() => {
        const loadVacancies = async () => {
            setLoading(true);
            try {
                const data = await getPublicVacancies({
                    company: companyParam || undefined,
                });
                setVacancies(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadVacancies();
    }, [companyParam]);

    const departments = Array.from(
        new Set(vacancies.map((v) => v.department?.name).filter(Boolean)),
    );

    const filteredVacancies = vacancies.filter((v) => {
        const matchesSearch =
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.requirements.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDept =
            selectedDept === "ALL" || v.department?.name === selectedDept;

        return matchesSearch && matchesDept;
    });

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col">
            <header className="bg-black text-white py-16 px-6 border-b border-gray-800">
                <div className="max-w-5xl mx-auto flex flex-col gap-4 text-center items-center">
                    <span className="px-3 py-1 bg-white/10 text-white text-[11px] font-mono font-bold uppercase tracking-widest rounded-full">
                        {companyParam ? `${companyParam} Karyera Markazi` : "Ochiq Vakansiyalar Markazi"}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                        Bizning jamoamizga qo'shiling
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base max-w-2xl">
                        O'z sohangizning eng ilg'or mutaxassislari bilan birgalikda yirik loyihalarda ishlash va karyerangizni rivojlantirish imkoniyati.
                    </p>

                    <div className="w-full max-w-xl mt-4">
                        <input
                            type="text"
                            placeholder="Vakansiya nomi yoki ko'nikmalar bo'yicha qidiring..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-5 py-3.5 bg-white text-black text-sm font-medium focus:outline-none shadow-lg"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto w-full p-6 md:p-8 flex-1 flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <button
                            onClick={() => setSelectedDept("ALL")}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                                selectedDept === "ALL"
                                    ? "bg-black text-white"
                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                            Barchasi ({vacancies.length})
                        </button>
                        {departments.map((dept: any) => (
                            <button
                                key={dept}
                                onClick={() => setSelectedDept(dept)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                                    selectedDept === dept
                                        ? "bg-black text-white"
                                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                }`}
                            >
                                {dept}
                            </button>
                        ))}
                    </div>

                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Topilgan vakansiyalar: {filteredVacancies.length}
                    </span>
                </div>

                {loading ? (
                    <div className="p-16 text-center text-xs font-bold uppercase tracking-wider text-gray-400 animate-pulse">
                        Vakansiyalar yuklanmoqda...
                    </div>
                ) : filteredVacancies.length === 0 ? (
                    <div className="p-16 text-center border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3">
                        <span className="text-3xl">🎯</span>
                        <p className="text-sm font-bold uppercase tracking-wider text-gray-600">
                            Mos keluvchi ochiq vakansiyalar topilmadi.
                        </p>
                        <p className="text-xs text-gray-400">
                            Qidiruv so'zini o'zgartirib ko'ring yoki keyinroq qayta tekshiring.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredVacancies.map((vacancy) => {
                            let parsedReqs: string[] = [];
                            try {
                                const r = JSON.parse(vacancy.requirements);
                                parsedReqs = Array.isArray(r) ? r : [vacancy.requirements];
                            } catch {
                                parsedReqs = [vacancy.requirements];
                            }

                            return (
                                <div
                                    key={vacancy.id}
                                    className="bg-white border-2 border-black p-6 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                ● Ochiq Vakansiya
                                            </span>
                                            {vacancy.companyName && (
                                                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">
                                                    🏢 {vacancy.companyName}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-black text-black group-hover:text-neutral-800">
                                                {vacancy.title}
                                            </h2>
                                            {vacancy.department?.name && (
                                                <p className="text-xs font-medium text-gray-500">
                                                    {vacancy.department.name} bo'limi
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
                                            {vacancy.description}
                                        </p>

                                        {parsedReqs.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-2">
                                                {parsedReqs.slice(0, 3).map((req, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-xs truncate max-w-[200px]"
                                                    >
                                                        ✓ {req}
                                                    </span>
                                                ))}
                                                {parsedReqs.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold">
                                                        +{parsedReqs.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                                        <span className="text-[11px] font-mono text-gray-400">
                                            {new Date(vacancy.createdAt).toISOString().split("T")[0]}
                                        </span>

                                        <Link
                                            href={`/${locale}/jobs/${vacancy.id}`}
                                            className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                                        >
                                            Ariza Topshirish →
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
