"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { JobGrade, EmployeeWithGrade } from "@/src/services/grading-service";

interface RequestPromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        employeeId: string;
        targetGradeId: string;
        proposedSalary: number;
        reason: string;
    }) => Promise<void>;
    employees: EmployeeWithGrade[];
    grades: JobGrade[];
    initialEmployeeId?: string;
}

export default function RequestPromotionModal({
    isOpen,
    onClose,
    onSubmit,
    employees,
    grades,
    initialEmployeeId,
}: RequestPromotionModalProps) {
    const t = useTranslations("Grading");
    const [employeeId, setEmployeeId] = useState("");
    const [targetGradeId, setTargetGradeId] = useState("");
    const [proposedSalary, setProposedSalary] = useState<number>(0);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialId = initialEmployeeId || (employees[0]?.id || "");
            setEmployeeId(initialId);
            const emp = employees.find((e) => e.id === initialId);
            
            const nextGrades = grades.filter((g) => {
                if (!emp?.grade) return true;
                return g.level > emp.grade.level;
            });
            const defaultTarget = nextGrades[0] || grades[0];
            setTargetGradeId(defaultTarget?.id || "");
            setProposedSalary(defaultTarget?.minSalary || 0);
            setReason("");
            setError(null);
        }
    }, [isOpen, initialEmployeeId, employees, grades]);

    const selectedEmployee = employees.find((e) => e.id === employeeId);
    const selectedTargetGrade = grades.find((g) => g.id === targetGradeId);

    const handleGradeChange = (gradeId: string) => {
        setTargetGradeId(gradeId);
        const grade = grades.find((g) => g.id === gradeId);
        if (grade) {
            setProposedSalary(grade.minSalary);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!employeeId || !targetGradeId) {
            return;
        }

        if (!selectedTargetGrade) {
            return;
        }

        if (
            proposedSalary < selectedTargetGrade.minSalary ||
            proposedSalary > selectedTargetGrade.maxSalary
        ) {
            setError(
                `${t("salaryRange")} ${selectedTargetGrade.minSalary.toLocaleString()} - ${selectedTargetGrade.maxSalary.toLocaleString()} UZS`,
            );
            return;
        }

        if (reason.trim().length < 3) {
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                employeeId,
                targetGradeId,
                proposedSalary: Number(proposedSalary),
                reason: reason.trim(),
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-gray-100 max-w-xl w-full p-6 sm:p-8 shadow-xl relative font-sans">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            {t("promotionModalTitle")}
                        </h2>
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
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                            {t("employee")} *
                        </label>
                        <select
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF] outline-none bg-white font-medium"
                            required
                        >
                            <option value="">{t("selectEmployee")}</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} — {emp.position || "-"} ({emp.grade ? emp.grade.title : t("unassigned")})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedEmployee && (
                        <div className="bg-gray-50/80 rounded-xl border border-gray-100 p-3.5 text-xs flex justify-between items-center">
                            <div>
                                <span className="text-gray-500 block">{t("currentGrade")}:</span>
                                <span className="font-bold text-gray-900">
                                    {selectedEmployee.grade ? `${selectedEmployee.grade.title} (L${selectedEmployee.grade.level})` : t("unassigned")}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-500 block">{t("currentSalary")}:</span>
                                <span className="font-bold text-gray-900">
                                    {selectedEmployee.salary ? `${selectedEmployee.salary.toLocaleString()} UZS` : "-"}
                                </span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                            {t("targetGrade")} *
                        </label>
                        <select
                            value={targetGradeId}
                            onChange={(e) => handleGradeChange(e.target.value)}
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

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                            {t("proposedSalary")} (UZS) *
                        </label>
                        <input
                            type="number"
                            value={proposedSalary}
                            onChange={(e) => setProposedSalary(Number(e.target.value))}
                            step={100000}
                            min={0}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF] outline-none bg-white font-medium"
                            required
                        />
                        {selectedTargetGrade && (
                            <span className="text-[11px] text-gray-500 mt-1 block">
                                {t("salaryRange")} {selectedTargetGrade.minSalary.toLocaleString()} - {selectedTargetGrade.maxSalary.toLocaleString()} UZS
                            </span>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                            {t("justification")} *
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder={t("justificationPlaceholder")}
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF] outline-none bg-white font-medium"
                            required
                        />
                    </div>

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
                            {isSubmitting ? t("saving") : t("submitRequest")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
