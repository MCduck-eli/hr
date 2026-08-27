"use client";

import React, { useRef } from "react";
import { useTranslations } from "next-intl";

interface OnboardingFormProps {
    editingId: string | null;
    title: string;
    setTitle: (val: string) => void;
    description: string;
    setDescription: (val: string) => void;
    targetStatus: string;
    setTargetStatus: (val: string) => void;
    isRequired: boolean;
    setIsRequired: (val: boolean) => void;
    setCoverFile: (file: File | null) => void;
    setVideoFile: (file: File | null) => void;
    statuses?: any[];
    loading: boolean;
    onSubmit: () => void;
    onCancel: () => void;
}

export default function OnboardingForm({
    editingId,
    title,
    setTitle,
    description,
    setDescription,
    targetStatus,
    setTargetStatus,
    isRequired,
    setIsRequired,
    setCoverFile,
    setVideoFile,
    statuses = [],
    loading,
    onSubmit,
    onCancel,
}: OnboardingFormProps) {
    const t = useTranslations("HROnboardingPage");
    const coverInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleCancel = () => {
        if (coverInputRef.current) coverInputRef.current.value = "";
        if (videoInputRef.current) videoInputRef.current.value = "";
        onCancel();
    };

    return (
        <div className="p-8 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-wider mb-6 text-black">
                {editingId ? t("editTemplate") : t("addTemplate")}
            </h2>
            <div className="flex flex-col gap-5 max-w-xl">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                        {t("titlePlaceholder")}
                    </label>
                    <input
                        placeholder={t("titlePlaceholder")}
                        value={title}
                        className="w-full p-3 border border-gray-300 text-sm focus:outline-none focus:border-black rounded-sm"
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                        {t("descPlaceholder")}
                    </label>
                    <textarea
                        placeholder={t("descPlaceholder")}
                        value={description}
                        rows={3}
                        className="w-full p-3 border border-gray-300 text-sm focus:outline-none focus:border-black rounded-sm resize-y"
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                        {t("targetCategoryLabel")}
                    </label>
                    <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value)}
                        className="w-full p-3 border border-gray-300 text-sm focus:outline-none focus:border-black rounded-sm bg-white font-bold"
                    >
                        <option value="ALL">{t("targetCategoryAll")}</option>
                        {statuses.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} {s.durationDays ? `(${s.durationDays} kun)` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            {t("coverLabel")}
                        </label>
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="p-2 border border-gray-300 text-xs rounded-sm file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-gray-100 hover:file:bg-gray-200 cursor-pointer"
                            onChange={(e) =>
                                setCoverFile(e.target.files?.[0] || null)
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            {t("videoLabel")}
                        </label>
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            className="p-2 border border-gray-300 text-xs rounded-sm file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-gray-100 hover:file:bg-gray-200 cursor-pointer"
                            onChange={(e) =>
                                setVideoFile(e.target.files?.[0] || null)
                            }
                        />
                    </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer select-none text-gray-700 py-1">
                    <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(e) => setIsRequired(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    {t("isRequiredLabel")}
                </label>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onSubmit}
                        disabled={loading || !title.trim()}
                        className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50 rounded-sm"
                    >
                        {loading
                            ? t("loading")
                            : editingId
                              ? t("updateBtn")
                              : t("saveBtn")}
                    </button>
                    {editingId && (
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-6 py-3 border border-gray-300 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors rounded-sm"
                        >
                            {t("cancelBtn")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
