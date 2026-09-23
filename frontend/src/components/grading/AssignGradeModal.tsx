"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { JobGrade, EmployeeWithGrade } from "@/src/services/grading-service";

interface AssignGradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (employeeId: string, gradeId: string) => Promise<void>;
    employee: EmployeeWithGrade | null;
    grades: JobGrade[];
}

export default function AssignGradeModal({
    isOpen,
    onClose,
    onAssign,
    employee,
    grades,
}: AssignGradeModalProps) {
    const t = useTranslations("Grading");
    const [selectedGradeId, setSelectedGradeId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (employee) {
            setSelectedGradeId(employee.gradeId || (grades[0]?.id || ""));
        }
        setError(null);
    }, [employee, grades, isOpen]);

    if (!isOpen || !employee) return null;

    const selectedGrade = grades.find((g) => g.id === selectedGradeId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGradeId) {
            setError(t("selectGrade"));
            return;
        }

        try {
            setIsSubmitting(true);
            await onAssign(employee.id, selectedGradeId);
            onClose();
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full p-6 sm:p-8 shadow-xl relative font-sans">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            {t("assignModalTitle")}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {t("employee")}: <span className="font-bold text-gray-900">{employee.firstName} {employee.lastName}</span>
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

                {error && (
                    <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-semibold rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 text-xs space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-gray-500">{t("department")}:</span>
                            <span className="font-semibold text-gray-900">{employee.department?.name || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">{t("position")}:</span>
                            <span className="font-semibold text-gray-900">{employee.position || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">{t("currentGrade")}:</span>
                            <span className="font-semibold text-gray-900">
                                {employee.grade ? `${employee.grade.title} (${employee.grade.code})` : t("unassigned")}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                            {t("targetGrade")} *
                        </label>
                        <select
                            value={selectedGradeId}
                            onChange={(e) => setSelectedGradeId(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF] outline-none bg-white font-medium"
                            required
                        >
                            <option value="">{t("selectGrade")}</option>
                            {grades.map((g) => (
                                <option key={g.id} value={g.id}>
                                    Level {g.level} | {g.title} ({g.code}) — {g.minSalary.toLocaleString()} - {g.maxSalary.toLocaleString()} UZS
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedGrade && (
                        <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 text-xs space-y-2">
                            <div className="flex justify-between text-purple-900">
                                <span>{t("level")}:</span>
                                <span className="font-bold">Level {selectedGrade.level}</span>
                            </div>
                            <div className="flex justify-between text-purple-900">
                                <span>{t("salaryRange")}</span>
                                <span className="font-bold">{selectedGrade.minSalary.toLocaleString()} - {selectedGrade.maxSalary.toLocaleString()} UZS</span>
                            </div>
                            {selectedGrade.requirements && (
                                <div className="text-purple-900 pt-1.5 border-t border-purple-200/50">
                                    <span className="font-semibold">{t("requirements")}</span> {selectedGrade.requirements}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-[#9327FF] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? t("saving") : t("assign")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
