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
    const tErr = useTranslations("errors");
    const [name, setName] = useState("");
    const [nameError, setNameError] = useState<"requiredField" | "">("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setNameError("requiredField");
            return;
        }
        setNameError("");
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-md flex flex-col shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#9327FF] uppercase tracking-wider">
                            Tashkiliy Bo'lim
                        </span>
                        <h2 className="text-base font-bold text-slate-900">
                            {t("newDepartment")}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center justify-center font-bold text-sm"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="p-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700">
                            {t("departmentName")} *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (nameError) {
                                    if (e.target.value.trim()) {
                                        setNameError("");
                                    } else {
                                        setNameError("requiredField");
                                    }
                                }
                            }}
                            placeholder={t("departmentName")}
                            className={`p-3 border ${
                                nameError
                                    ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-slate-200 focus:ring-[#9327FF]/10 focus:border-[#9327FF]"
                            } text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 transition-all`}
                        />
                        {nameError && (
                            <span className="text-[11px] font-semibold text-red-500 mt-0.5">
                                {tErr(nameError)}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3 mt-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium rounded-xl text-xs transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex-1 py-2.5 px-4 bg-[#9327FF] hover:bg-[#7e22ce] text-white font-medium rounded-xl text-xs transition-all duration-200 shadow-sm disabled:opacity-50"
                        >
                            {loading ? "..." : t("save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
