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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border border-black max-w-xl w-full p-6 sm:p-8 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                            {t("careerHistoryTitle")}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {employee.firstName} {employee.lastName} — {employee.department?.name || "-"} ({employee.position || "-"})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t("loadingHistory")}
                    </div>
                ) : error ? (
                    <div className="py-6 text-center text-xs text-red-600 font-semibold bg-red-50 p-4 border border-red-200">
                        {error}
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-xs">
                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t("noHistory")}
                    </div>
                ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                        {history.map((item) => (
                            <div key={item.id} className="relative">
                                <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-black ring-4 ring-white" />
                                <div className="bg-gray-50 border border-gray-200 p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-sm font-bold text-black">
                                            {item.newGradeTitle}
                                        </h4>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {new Date(item.changedAt).toLocaleDateString("uz-UZ")}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1 mt-2">
                                        {item.oldGradeTitle && (
                                            <div>
                                                <span className="text-gray-400">{t("currentGrade")}:</span> {item.oldGradeTitle}
                                            </div>
                                        )}
                                        <div className="font-semibold text-emerald-700">
                                            {t("proposedSalary")}: {item.newSalary.toLocaleString()} UZS
                                        </div>
                                        {item.reason && (
                                            <div className="text-gray-700 pt-1.5 border-t border-gray-200 mt-2 text-[11px]">
                                                <span className="font-bold">{t("reason")}:</span> {item.reason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                    >
                        {t("cancel")}
                    </button>
                </div>
            </div>
        </div>
    );
}
