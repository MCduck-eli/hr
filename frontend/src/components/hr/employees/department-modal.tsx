"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface DepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, parentId?: string) => Promise<void>;
    departments: any[];
}

export default function DepartmentModal({
    isOpen,
    onClose,
    onSave,
}: DepartmentModalProps) {
    const t = useTranslations("HREmployees");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        try {
            await onSave(name, undefined);
            setName("");
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md flex flex-col shadow-2xl relative">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-lg font-black uppercase tracking-wider text-black">
                        {t("newDepartment")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            {t("departmentName")}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("departmentName")}
                            required
                            className="p-3 border border-gray-200 text-sm bg-[#f8f8f8] outline-none focus:border-black"
                        />
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-gray-100 text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex-1 py-3 px-4 bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? "..." : t("save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
