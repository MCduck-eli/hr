"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    getAllLeaveRequests,
    updateLeaveStatus,
    LeaveRequestWithEmployee,
} from "@/src/services/leave-service";
import Skeleton from "@/src/components/ui/Skeleton";
import Sidebar from "@/src/components/Sidebar";

const LEAVE_TYPE_LABELS: Record<string, string> = {
    ANNUAL: "Yillik mehnat ta'tili",
    SICK: "Kasallik ta'tili",
    UNPAID: "O'z hisobidan ta'til",
    MATERNITY: "Homiladorlik ta'tili",
    OTHER: "Boshqa ta'til",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Kutilmoqda", className: "bg-amber-50 text-amber-700 border border-amber-100" },
    APPROVED: { label: "Tasdiqlangan", className: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
    REJECTED: { label: "Rad etilgan", className: "bg-red-50 text-red-600 border border-red-100" },
    CANCELLED: { label: "Bekor qilingan", className: "bg-slate-100 text-slate-500 border border-slate-200" },
};

export default function HRLeavesPage() {
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "uz";

    const [leaves, setLeaves] = useState<LeaveRequestWithEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [companyName, setCompanyName] = useState("");

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast((current) => (current?.message === message ? null : current));
        }, 4000);
    };

    const loadLeaves = async () => {
        try {
            const status = filterStatus === "ALL" ? undefined : filterStatus;
            const data = await getAllLeaveRequests(status as any);
            setLeaves(data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!userStr || !token) {
            router.push(`/${locale}/login`);
            return;
        }
        try {
            const user = JSON.parse(userStr);
            setCompanyName(user.companyName || user.employee?.companyName || "");
            if (
                user.role !== "HR_ADMIN" &&
                user.role !== "SUPER_ADMIN" &&
                user.role !== "DIRECTOR" &&
                user.role !== "DEPARTMENT_HEAD"
            ) {
                router.push(`/${locale}/profile`);
            }
        } catch {
            router.push(`/${locale}/login`);
        }
    }, [locale, router]);

    useEffect(() => {
        setLoading(true);
        loadLeaves();
    }, [filterStatus]);

    const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
        setProcessingId(id);
        try {
            await updateLeaveStatus(id, status);
            showToast(
                status === "APPROVED" ? "So'rov muvaffaqiyatli tasdiqlandi" : "So'rov rad etildi",
                "success",
            );
            await loadLeaves();
        } catch (err: any) {
            showToast(err.message || "Xatolik yuz berdi", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const tabs = [
        { id: "ALL", label: "Barchasi" },
        { id: "PENDING", label: "Kutilmoqda" },
        { id: "APPROVED", label: "Tasdiqlangan" },
        { id: "REJECTED", label: "Rad etilgan" },
    ];

    const pendingCount = leaves.filter((l) => l.status === "PENDING").length;

    return (
        <div className="min-h-screen bg-slate-50/60 flex flex-col md:flex-row font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 p-6 lg:p-8 gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900">Ta&apos;til So&apos;rovlari</h1>
                    <p className="text-sm text-slate-500 font-normal">
                        Xodimlarning ta&apos;til so&apos;rovlarini ko&apos;rib chiqing va tasdiqlang
                    </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id as any)}
                            className={`px-4 py-2 text-xs font-medium rounded-full transition-all ${
                                filterStatus === tab.id
                                    ? "bg-purple-600 text-white shadow-sm"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {tab.label}
                            {tab.id === "PENDING" && pendingCount > 0 && (
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === "PENDING" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="flex-1 flex flex-col gap-2">
                                    <Skeleton className="w-40 h-4 rounded-lg" />
                                    <Skeleton className="w-64 h-3 rounded-lg" />
                                </div>
                                <Skeleton className="w-24 h-7 rounded-full" />
                                <Skeleton className="w-28 h-8 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : leaves.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
                        <div className="text-4xl mb-3">🏖️</div>
                        <p className="text-sm font-semibold text-slate-700">So&apos;rovlar mavjud emas</p>
                        <p className="text-xs text-slate-400 mt-1">Hozircha bu bo&apos;limda ta&apos;til so&apos;rovlari yo&apos;q</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {leaves.map((leave) => {
                            const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.PENDING;
                            const isProcessing = processingId === leave.id;

                            return (
                                <div
                                    key={leave.id}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">
                                        🏖️
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {leave.employee
                                                    ? `${leave.employee.firstName} ${leave.employee.lastName}`
                                                    : "Xodim"}
                                            </span>
                                            {leave.employee?.department?.name && (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                                                    {leave.employee.department.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-xs font-medium text-purple-600">
                                                {LEAVE_TYPE_LABELS[leave.type] || leave.type}
                                            </span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(leave.startDate).toLocaleDateString("uz-UZ")}
                                                {" — "}
                                                {new Date(leave.endDate).toLocaleDateString("uz-UZ")}
                                            </span>
                                        </div>
                                        {leave.reason && (
                                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                                {leave.reason}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap shrink-0">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${statusConfig.className}`}>
                                            {statusConfig.label}
                                        </span>

                                        {leave.status === "PENDING" && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(leave.id, "APPROVED")}
                                                    disabled={isProcessing}
                                                    className="px-3.5 py-1.5 rounded-xl text-[11px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
                                                >
                                                    {isProcessing ? "..." : "Tasdiqlash"}
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(leave.id, "REJECTED")}
                                                    disabled={isProcessing}
                                                    className="px-3.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                                                >
                                                    {isProcessing ? "..." : "Rad etish"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-white rounded-xl shadow-lg border border-slate-100 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    {toast.type === "error" ? (
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900">{toast.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs ml-2 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
