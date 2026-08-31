"use client";

import { useState, useEffect } from "react";
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
            setError("Iltimos, greydni tanlang.");
            return;
        }

        try {
            setIsSubmitting(true);
            await onAssign(employee.id, selectedGradeId);
            onClose();
        } catch (err: any) {
            setError(err.message || "Greyd biriktirishda xatolik yuz berdi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border border-black max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                            Greyd Biriktirish
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Xodim: <span className="font-bold text-black">{employee.firstName} {employee.lastName}</span>
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

                {error && (
                    <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-semibold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-gray-50 p-4 border border-gray-200 text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Bo'lim:</span>
                            <span className="font-semibold text-black">{employee.department?.name || "Biriktirilmagan"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Lavozim:</span>
                            <span className="font-semibold text-black">{employee.position || "Ko'rsatilmagan"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Hozirgi Greyd:</span>
                            <span className="font-semibold text-black">
                                {employee.grade ? `${employee.grade.title} (${employee.grade.code})` : "Mavjud emas"}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                            Yangi Greydni Tanlang *
                        </label>
                        <select
                            value={selectedGradeId}
                            onChange={(e) => setSelectedGradeId(e.target.value)}
                            className="w-full border border-gray-300 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none bg-[#fcfcfc]"
                            required
                        >
                            <option value="">Greydni tanlang...</option>
                            {grades.map((g) => (
                                <option key={g.id} value={g.id}>
                                    Level {g.level} | {g.title} ({g.code}) — {g.minSalary.toLocaleString()} - {g.maxSalary.toLocaleString()} UZS
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedGrade && (
                        <div className="bg-blue-50 border border-blue-200 p-4 text-xs space-y-2">
                            <div className="font-bold text-blue-900 uppercase">
                                Tanlangan Greyd Ma'lumotlari:
                            </div>
                            <div className="flex justify-between text-blue-800">
                                <span>Daraja:</span>
                                <span className="font-bold">Level {selectedGrade.level}</span>
                            </div>
                            <div className="flex justify-between text-blue-800">
                                <span>Maosh diapazoni:</span>
                                <span className="font-bold">{selectedGrade.minSalary.toLocaleString()} - {selectedGrade.maxSalary.toLocaleString()} UZS</span>
                            </div>
                            {selectedGrade.requirements && (
                                <div className="text-blue-900 pt-1 border-t border-blue-200/60">
                                    <span className="font-semibold">Talablar:</span> {selectedGrade.requirements}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100 transition-colors"
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? "Biriktirilmoqda..." : "Tasdiqlash"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
