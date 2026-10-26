"use client";

import React, { useState, useEffect } from "react";
import { assignEmployeeToDepartment } from "@/src/services/department-service";
import GirihPattern from "@/src/components/ui/GirihPattern";
import { motion } from "framer-motion";

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-[10px_10px_30px_#cbd5e1,-10px_-10px_30px_#ffffff] overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-200"
            >
                <GirihPattern className="opacity-[0.10] rounded-3xl overflow-hidden" />

                <div className="relative z-10">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white text-purple-600 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center justify-center text-lg font-bold">
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
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white text-slate-500 hover:text-slate-900 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] flex items-center justify-center transition-all cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                        {error && (
                            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl shadow-[inset_1px_1px_3px_#fecdd3,inset_-1px_-1px_3px_#ffffff]">
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
                                className="p-3 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] text-xs sm:text-sm bg-white rounded-2xl outline-none w-full font-medium"
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
                            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-2xl shadow-[inset_1px_1px_3px_#fde68a,inset_-1px_-1px_3px_#ffffff]">
                                Kompaniyada ushbu bo'limga biriktirish mumkin bo'lgan boshqa xodimlar topilmadi.
                            </p>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 bg-white text-slate-700 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] text-xs font-semibold rounded-2xl transition-all cursor-pointer"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedUserId}
                                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-2xl transition-all duration-200 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? "Biriktirilmoqda..." : "Biriktirish"}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
}
