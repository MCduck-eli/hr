"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import GirihPattern from "@/src/components/ui/GirihPattern";

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
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-[10px_10px_30px_#cbd5e1,-10px_-10px_30px_#ffffff] relative overflow-hidden">
                <GirihPattern className="opacity-[0.11] rounded-3xl overflow-hidden" strokeColor="#9333ea" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                                Tashkiliy Bo'lim
                            </span>
                            <h2 className="text-base font-bold text-slate-900">
                                {t("newDepartment")}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white text-slate-500 hover:text-slate-900 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] active:shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] transition-all flex items-center justify-center font-bold text-sm cursor-pointer"
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
                                className={`p-3 text-sm bg-white rounded-2xl outline-none shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] transition-all ${
                                    nameError ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-purple-600/30"
                                }`}
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
                                className="flex-1 py-2.5 px-4 bg-white text-slate-700 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] font-semibold rounded-2xl text-xs transition-all cursor-pointer"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl text-xs transition-all duration-200 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? "..." : t("save")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
