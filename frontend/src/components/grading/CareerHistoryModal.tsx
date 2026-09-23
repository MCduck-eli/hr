"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchCareerHistory, CareerHistoryItem, EmployeeWithGrade } from "@/src/services/grading-service";

interface CareerHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: EmployeeWithGrade | null;
}

export default function CareerHistoryModal({
    isOpen,
    onClose,
    employee,
}: CareerHistoryModalProps) {
    const t = useTranslations("Grading");
    const [history, setHistory] = useState<CareerHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && employee?.id) {
            const loadHistory = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const data = await fetchCareerHistory(employee.id);
                    setHistory(data);
                } catch (err: any) {
                    setError(err.message || "Error");
                } finally {
                    setLoading(false);
                }
            };
            loadHistory();
        }
    }, [isOpen, employee]);

    if (!isOpen || !employee) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-gray-100 max-w-xl w-full p-6 sm:p-8 shadow-xl relative font-sans">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            {t("careerHistoryTitle")}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {employee.firstName} {employee.lastName} — {employee.department?.name || "-"} ({employee.position || "-"})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider flex flex-col items-center justify-center gap-3">
                        <div className="w-7 h-7 border-3 border-[#9327FF] border-t-transparent rounded-full animate-spin" />
                        <span>{t("loadingHistory")}</span>
                    </div>
                ) : error ? (
                    <div className="py-6 text-center text-xs text-red-700 font-semibold bg-red-50 p-4 border border-red-200 rounded-xl">
                        {error}
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center text-xl">
                            📂
                        </div>
                        <span className="font-medium">{t("noHistory")}</span>
                    </div>
                ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-100">
                        {history.map((item) => (
                            <div key={item.id} className="relative">
                                <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-[#9327FF] ring-4 ring-purple-100" />
                                <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-sm font-bold text-gray-900">
                                            {item.newGradeTitle}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            {new Date(item.changedAt).toLocaleDateString("uz-UZ")}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1.5 mt-2">
                                        {item.oldGradeTitle && (
                                            <div>
                                                <span className="text-gray-400">{t("currentGrade")}:</span> {item.oldGradeTitle}
                                            </div>
                                        )}
                                        <div className="font-semibold text-emerald-700">
                                            {t("proposedSalary")}: {item.newSalary.toLocaleString()} UZS
                                        </div>
                                        {item.reason && (
                                            <div className="text-gray-600 pt-1.5 border-t border-gray-200/60 mt-2 text-[11px]">
                                                <span className="font-bold text-gray-900">{t("reason")}:</span> {item.reason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                        {t("cancel")}
                    </button>
                </div>
            </div>
        </div>
    );
}
