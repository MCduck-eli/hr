"use client";

import React, { useState, useEffect } from "react";
import { assignEmployeeToDepartment } from "@/src/services/department-service";

interface AssignDepartmentEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    department: any | null;
    users: any[];
    onSuccess: (message?: string) => void;
}

export default function AssignDepartmentEmployeeModal({
    isOpen,
    onClose,
    department,
    users,
    onSuccess,
}: AssignDepartmentEmployeeModalProps) {
    const [selectedUserId, setSelectedUserId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedUserId("");
            setError(null);
        }
    }, [isOpen, department]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !department) return null;

    const availableUsers = users.filter((u) => u.employee?.departmentId !== department.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            setError("Iltimos, biriktirish uchun xodimni tanlang");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await assignEmployeeToDepartment(department.id, {
                userId: selectedUserId,
            });
            onSuccess("Xodim bo'limga muvaffaqiyatli biriktirildi");
            onClose();
        } catch (err: any) {
            setError(err.message || "Xodimni biriktirishda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#9327FF] flex items-center justify-center text-lg font-bold">
                            🏢
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Xodim biriktirish
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {department.name} bo'limiga
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">
                            Xodimni tanlang *
                        </label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => {
                                setSelectedUserId(e.target.value);
                                setError(null);
                            }}
                            className="p-3 border border-slate-200 text-xs sm:text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-[#9327FF] w-full font-medium"
                        >
                            <option value="">-- Xodimni tanlang --</option>
                            {availableUsers.map((u) => {
                                const name = `${u.employee?.firstName || ""} ${u.employee?.lastName || ""}`.trim() || u.email;
                                const currentDept = u.employee?.department?.name ? `(${u.employee.department.name})` : "(Bo'limsiz)";
                                return (
                                    <option key={u.id} value={u.id}>
                                        {name} {currentDept} - {u.role}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {availableUsers.length === 0 && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                            Kompaniyada ushbu bo'limga biriktirish mumkin bo'lgan boshqa xodimlar topilmadi.
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedUserId}
                            className="px-5 py-2.5 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? "Biriktirilmoqda..." : "Biriktirish"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
