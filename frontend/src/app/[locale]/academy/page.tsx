"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function EmployeeAcademyPage() {
    const t = useTranslations("AcademyPage");
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAcademyData = async () => {
            try {
                const token = localStorage.getItem("token");
                const API_URL = process.env.NEXT_PUBLIC_API_URL;

                const res = await fetch(`${API_URL}/academy/courses`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (res.ok) {
                    const courseList = Array.isArray(data)
                        ? data
                        : data.data || data.courses || [];
                    setCourses(courseList);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAcademyData();
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black uppercase tracking-tight text-black">
                    {t("title")}
                </h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    {t("subtitle")}
                </p>
            </div>

            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                    {t("mandatoryBlock")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-gray-200 bg-white p-6 flex flex-col gap-4 hover:border-black transition-colors">
                        <span className="text-xs font-black uppercase text-gray-400">
                            Modul 1
                        </span>
                        <h3 className="text-lg font-bold">
                            Kompaniya Oliy Maqsadi va Qadriyatlari
                        </h3>
                        <p className="text-xs text-gray-500">
                            Kompaniyaning asosiy missiyasi va ichki madaniyati
                            bilan tanishish.
                        </p>
                        <button className="mt-auto py-2 bg-black text-white text-xs font-bold uppercase tracking-wider">
                            Boshlash
                        </button>
                    </div>

                    <div className="border border-gray-200 bg-white p-6 flex flex-col gap-4 hover:border-black transition-colors">
                        <span className="text-xs font-black uppercase text-gray-400">
                            Modul 2
                        </span>
                        <h3 className="text-lg font-bold">
                            Ichki Qonun-Qoidalar va An'analar
                        </h3>
                        <p className="text-xs text-gray-500">
                            Ish tartibi, odob-axloq va jamoaviy an'analar
                            to'plami.
                        </p>
                        <button className="mt-auto py-2 bg-black text-white text-xs font-bold uppercase tracking-wider">
                            Boshlash
                        </button>
                    </div>

                    <div className="border border-gray-200 bg-white p-6 flex flex-col gap-4 hover:border-black transition-colors">
                        <span className="text-xs font-black uppercase text-gray-400">
                            Modul 3
                        </span>
                        <h3 className="text-lg font-bold">
                            Motivatsiya va Karyera Tizimi
                        </h3>
                        <p className="text-xs text-gray-500">
                            Xodimlarni rag'batlantirish va o'sish imkoniyatlari.
                        </p>
                        <button className="mt-auto py-2 bg-black text-white text-xs font-bold uppercase tracking-wider">
                            Boshlash
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                    {t("coursesList")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Hozircha kurslar mavjud emas
                        </p>
                    ) : (
                        courses.map((course: any) => (
                            <div
                                key={course.id}
                                className="border border-gray-200 bg-white p-6 flex flex-col gap-4"
                            >
                                <h3 className="text-base font-bold text-black">
                                    {course.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {course.description}
                                </p>
                                <button className="mt-auto py-2 border border-black text-black text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors">
                                    Davom etish
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
