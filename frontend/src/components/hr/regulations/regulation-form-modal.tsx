"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { PolicyItem } from "@/src/services/policy-service";

interface RegulationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData, editingId?: string) => Promise<void>;
    editingPolicy?: PolicyItem | null;
}

export default function RegulationFormModal({
    isOpen,
    onClose,
    onSubmit,
    editingPolicy,
}: RegulationFormModalProps) {
    const t = useTranslations("HRRegulations");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [isRequired, setIsRequired] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingPolicy) {
            setTitle(editingPolicy.title || "");
            setDescription(editingPolicy.description || "");
            setContent(editingPolicy.content || "");
            setIsRequired(editingPolicy.isRequired ?? true);
            setFile(null);
        } else {
            setTitle("");
            setDescription("");
            setContent("");
            setIsRequired(true);
            setFile(null);
        }
    }, [editingPolicy, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("content", content);
            formData.append("isRequired", String(isRequired));
            if (file) {
                formData.append("file", file);
            }

            await onSubmit(formData, editingPolicy?.id);
            onClose();
        } catch (err: any) {
            alert(err.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                        {editingPolicy ? t("editRegulation") : t("addRegulation")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1 leading-none rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("formTitle")} *
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t("formTitlePlaceholder")}
                            className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 text-sm font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("formDesc")}
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("formDescPlaceholder")}
                            className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 text-sm font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("formContent")}
                        </label>
                        <textarea
                            rows={5}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t("formContentPlaceholder")}
                            className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 text-sm font-medium resize-y"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("formFile")}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                            />
                            {file && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="text-xs font-bold text-red-600 hover:text-red-800"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                        {editingPolicy?.documentUrl && !file && (
                            <p className="text-[11px] text-gray-400 mt-1">
                                Joriy fayl: {editingPolicy.documentUrl.split("/").pop()}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="isRequiredInput"
                            checked={isRequired}
                            onChange={(e) => setIsRequired(e.target.checked)}
                            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-gray-300 cursor-pointer"
                        />
                        <label
                            htmlFor="isRequiredInput"
                            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                        >
                            {t("formRequired")}
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            className="px-6 py-2.5 bg-[#9327FF] text-white disabled:opacity-50 text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm"
                        >
                            {loading ? t("saving") : t("save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
