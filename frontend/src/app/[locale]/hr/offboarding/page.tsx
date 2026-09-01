"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    OffboardingItem,
    fetchAllOffboardingRequests,
} from "@/src/services/offboarding-service";
import OffboardingManagerModal from "@/src/components/offboarding/OffboardingManagerModal";

export default function HROffboardingPage() {
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "uz";

    const [offboardings, setOffboardings] = useState<OffboardingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
    const [selectedOffboarding, setSelectedOffboarding] = useState<OffboardingItem | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllOffboardingRequests();
            setOffboardings(data || []);
        } catch (err: any) {
            setError(err.message || "Offboarding ma'lumotlarini yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!token || !userStr) {
            router.push(`/${locale}/login`);
            return;
        }
        loadData();
    }, [locale, router]);

    const handleOpenCreate = () => {
        setSelectedOffboarding(null);
        setIsManagerModalOpen(true);
    };

    const handleOpenEdit = (item: OffboardingItem) => {
        setSelectedOffboarding(item);
        setIsManagerModalOpen(true);
    };

    const filteredList = offboardings.filter((item) => {
        const fullName = `${item.employee?.firstName || ""} ${item.employee?.lastName || ""}`.toLowerCase();
        const dept = (item.employee?.department?.name || "").toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || dept.includes(searchQuery.toLowerCase());

        if (statusFilter === "ALL") return matchesSearch;
        return matchesSearch && item.status === statusFilter;
    });

    const totalCount = offboardings.length;
    const inProgressCount = offboardings.filter((o) => o.status === "IN_PROGRESS").length;
    const completedCount = offboardings.filter((o) => o.status === "COMPLETED").length;
    const assetsPendingCount = offboardings.filter((o) => o.status === "IN_PROGRESS" && !o.isAssetsReturned).length;

    return (
        <div className="max-w-[1400px] mx-auto p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${locale}/hr/dashboard`}
                            className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider"
                        >
                            &larr; Dashboard
                        </Link>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                        <span>🏁</span> Offboarding & Ishdan Bo'shatish
                    </h1>
                    <p className="text-xs font-medium text-gray-500">
                        Xodimlar ketishi, aylanma varaqasi (Checklist), aktivlar qaytarilishi va Exit Interview nazorati
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenCreate}
                        className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs"
                    >
                        <span>+</span>
                        <span>Yangi Offboarding Boshlash</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-gray-200 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Jami Jarayonlar
                    </span>
                    <span className="text-2xl font-black text-black">{totalCount}</span>
                </div>
                <div className="p-4 bg-amber-50/50 border border-amber-200 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                        Jarayonda (Faol)
                    </span>
                    <span className="text-2xl font-black text-amber-900">{inProgressCount}</span>
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        Yakunlangan
                    </span>
                    <span className="text-2xl font-black text-emerald-900">{completedCount}</span>
                </div>
                <div className="p-4 bg-purple-50/50 border border-purple-200 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-700">
                        Aktivlar Kutilmoqda
                    </span>
                    <span className="text-2xl font-black text-purple-900">{assetsPendingCount}</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-gray-200">
                <div className="flex items-center gap-1 overflow-x-auto">
                    {[
                        { id: "ALL", label: "Barchasi" },
                        { id: "IN_PROGRESS", label: "Jarayonda" },
                        { id: "COMPLETED", label: "Yakunlangan" },
                        { id: "CANCELLED", label: "Bekor qilingan" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                                statusFilter === tab.id
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="w-full sm:w-72">
                    <input
                        type="text"
                        placeholder="Xodim yoki bo'lim nomi bo'yicha qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400 animate-pulse">
                    Offboarding ma'lumotlari yuklanmoqda...
                </div>
            ) : error ? (
                <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">
                    {error}
                </div>
            ) : filteredList.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-gray-300 flex flex-col items-center justify-center gap-3">
                    <span className="text-3xl">🏁</span>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Hozircha offboarding arizalari mavjud emas.
                    </p>
                    <button
                        onClick={handleOpenCreate}
                        className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800"
                    >
                        + Birinchi Offboardingni Boshlash
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredList.map((item) => {
                        const completedTasks = item.tasks?.filter((t) => t.isCompleted).length || 0;
                        const totalTasks = item.tasks?.length || 0;
                        const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                        return (
                            <div
                                key={item.id}
                                className="bg-white border-2 border-black p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                                                item.status === "COMPLETED"
                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                    : item.status === "CANCELLED"
                                                    ? "bg-gray-100 text-gray-600 border-gray-300"
                                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                            }`}
                                        >
                                            {item.status === "COMPLETED"
                                                ? "✓ Yakunlangan"
                                                : item.status === "CANCELLED"
                                                ? "Bekor qilingan"
                                                : "⚡ Jarayonda"}
                                        </span>

                                        <span className="text-[10px] font-mono font-bold text-gray-500">
                                            {item.lastWorkingDay
                                                ? new Date(item.lastWorkingDay).toISOString().split("T")[0]
                                                : ""}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-black text-black">
                                            {item.employee?.firstName} {item.employee?.lastName}
                                        </h3>
                                        <p className="text-xs font-medium text-gray-600">
                                            {item.employee?.department?.name || "Bo'limsiz"} • {item.employee?.position?.title || "Lavozimsiz"}
                                        </p>
                                    </div>

                                    <div className="p-2.5 bg-gray-50 border border-gray-200 text-xs flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Sabab:</span>
                                            <span className="font-bold text-gray-800">{item.reason}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Aktivlar:</span>
                                            <span className={`font-bold ${item.isAssetsReturned ? "text-emerald-700" : "text-amber-700"}`}>
                                                {item.isAssetsReturned ? "✓ Topshirildi" : "Kutilmoqda"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-600">
                                            <span>Aylanma varaqasi ({completedTasks}/{totalTasks})</span>
                                            <span>{pct}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-black transition-all duration-300"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {item.exitInterviewNotes && (
                                        <div className="p-2 bg-purple-50 border border-purple-200 text-[11px] font-medium text-purple-900 truncate">
                                            📝 Exit Interview to'ldirilgan
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                                    <button
                                        onClick={() => handleOpenEdit(item)}
                                        className="flex-1 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors text-center"
                                    >
                                        Boshqarish 📋
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <OffboardingManagerModal
                isOpen={isManagerModalOpen}
                onClose={() => setIsManagerModalOpen(false)}
                onSuccess={loadData}
                initialOffboarding={selectedOffboarding}
            />
        </div>
    );
}
