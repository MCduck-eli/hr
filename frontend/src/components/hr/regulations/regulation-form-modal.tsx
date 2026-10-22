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
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                <svg
                    className="absolute inset-0 w-full h-full z-0 opacity-[0.10] pointer-events-none text-slate-300 stroke-current"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="girih-pattern-regulation-form" width="240" height="240" patternUnits="userSpaceOnUse">
                            <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z" />
                                <path d="M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z" />
                                <circle cx="120" cy="120" r="10" />
                                <path d="M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180" />
                                <path d="M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216" />
                                <path d="M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230" />
                                <path d="M120 0V60M120 180V240M0 120H60M180 120H240" />
                                <path d="M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240" />
                                <path d="M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198" />
                                <path d="M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60" />
                                <path d="M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90" />
                            </g>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#girih-pattern-regulation-form)" />
                </svg>

                <div className="relative z-10 flex flex-col flex-1 min-h-0">
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

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 min-h-0">
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
        </div>
    );
}
