"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    OffboardingItem,
    fetchAllOffboardingRequests,
} from "@/src/services/offboarding-service";
import OffboardingManagerModal from "@/src/components/offboarding/OffboardingManagerModal";

export default function HROffboardingPage() {
    const t = useTranslations("HROffboarding");
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
            setError(err.message || "Error");
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${locale}/hr/dashboard`}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-900 uppercase tracking-wider transition-colors"
                        >
                            {t("dashboardLink")}
                        </Link>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
                        <span>🏁</span> {t("title")}
                    </h1>
                    <p className="text-xs font-medium text-slate-500">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenCreate}
                        className="px-5 py-2.5 bg-[#9327FF] text-white text-xs font-semibold uppercase tracking-wider hover:opacity-90 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <span>{t("startNewBtn")}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {t("totalProcesses")}
                    </span>
                    <span className="text-2xl md:text-3xl font-bold text-slate-900">{totalCount}</span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {t("inProgressActive")}
                    </span>
                    <span className="text-2xl md:text-3xl font-bold text-amber-600">{inProgressCount}</span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {t("completed")}
                    </span>
                    <span className="text-2xl md:text-3xl font-bold text-emerald-600">{completedCount}</span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {t("assetsPending")}
                    </span>
                    <span className="text-2xl md:text-3xl font-bold text-purple-600">{assetsPendingCount}</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                        { id: "ALL", label: t("tabs.all") },
                        { id: "IN_PROGRESS", label: t("tabs.inProgress") },
                        { id: "COMPLETED", label: t("tabs.completed") },
                        { id: "CANCELLED", label: t("tabs.cancelled") },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                                statusFilter === tab.id
                                    ? "bg-violet-100 text-violet-700 font-medium"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="w-full sm:w-72">
                    <input
                        type="text"
                        placeholder={t("searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 px-4 py-2.5 outline-none transition-all text-xs bg-slate-50/50"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm text-xs font-bold uppercase tracking-wider text-gray-400 animate-pulse">
                    {t("loading")}
                </div>
            ) : error ? (
                <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-xs font-bold text-center">
                    {error}
                </div>
            ) : filteredList.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center gap-4 text-center">
                    <span className="text-4xl">🏁</span>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {t("emptyState")}
                    </p>
                    <button
                        onClick={handleOpenCreate}
                        className="bg-[#9327FF] text-white rounded-xl shadow-sm hover:opacity-90 px-5 py-2.5 transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                        {t("startFirst")}
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
                                className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                                                item.status === "COMPLETED"
                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                    : item.status === "CANCELLED"
                                                    ? "bg-gray-100 text-gray-600 border-gray-200"
                                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                            }`}
                                        >
                                            {item.status === "COMPLETED"
                                                ? t("status.completed")
                                                : item.status === "CANCELLED"
                                                ? t("status.cancelled")
                                                : t("status.inProgress")}
                                        </span>

                                        <span className="text-[10px] font-mono font-bold text-gray-400">
                                            {item.lastWorkingDay
                                                ? new Date(item.lastWorkingDay).toISOString().split("T")[0]
                                                : ""}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">
                                            {item.employee?.firstName} {item.employee?.lastName}
                                        </h3>
                                        <p className="text-xs font-medium text-slate-500">
                                            {item.employee?.department?.name || t("unassignedDept")} • {item.employee?.position?.title || t("unassignedPos")}
                                        </p>
                                    </div>

                                    <div className="p-3 bg-slate-50/70 border border-gray-100 rounded-xl text-xs flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{t("reasonLabel")}</span>
                                            <span className="font-semibold text-slate-800">{item.reason}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{t("assetsLabel")}</span>
                                            <span className={`font-semibold ${item.status === "CANCELLED" ? "text-gray-500" : item.isAssetsReturned ? "text-emerald-700" : "text-amber-700"}`}>
                                                {item.status === "CANCELLED" ? (t("status.cancelled") || "Bekor qilingan") : item.isAssetsReturned ? t("assetsReturned") : t("assetsPendingLabel")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                                            <span>{t("checklistProgress", { completed: completedTasks, total: totalTasks })}</span>
                                            <span>{pct}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#9327FF] transition-all duration-300"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {item.exitInterviewNotes && (
                                        <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl text-[11px] font-medium text-purple-900 truncate">
                                            {t("exitInterviewFilled")}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => handleOpenEdit(item)}
                                        className="flex-1 py-2.5 bg-white border border-gray-200 text-slate-700 hover:bg-gray-50 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all text-center cursor-pointer"
                                    >
                                        {t("manageBtn")}
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
