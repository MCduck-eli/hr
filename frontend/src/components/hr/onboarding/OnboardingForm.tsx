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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold uppercase tracking-wider mb-6 text-slate-900">
                {editingId ? t("editTemplate") : t("addTemplate")}
            </h2>
            <div className="flex flex-col gap-5 max-w-xl">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                        {t("titlePlaceholder")}
                    </label>
                    <input
                        placeholder={t("titlePlaceholder")}
                        value={title}
                        className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all px-4 py-2.5 text-sm"
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                        {t("descPlaceholder")}
                    </label>
                    <textarea
                        placeholder={t("descPlaceholder")}
                        value={description}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all px-4 py-2.5 text-sm resize-y"
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                        {t("targetCategoryLabel")}
                    </label>
                    <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all px-4 py-2.5 text-sm bg-white font-medium"
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
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            {t("coverLabel")}
                        </label>
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="p-2 border border-gray-200 text-xs rounded-xl file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:rounded-lg hover:file:bg-gray-200 cursor-pointer"
                            onChange={(e) =>
                                setCoverFile(e.target.files?.[0] || null)
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            {t("videoLabel")}
                        </label>
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            className="p-2 border border-gray-200 text-xs rounded-xl file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:rounded-lg hover:file:bg-gray-200 cursor-pointer"
                            onChange={(e) =>
                                setVideoFile(e.target.files?.[0] || null)
                            }
                        />
                    </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer select-none text-slate-700 py-1">
                    <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(e) => setIsRequired(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    {t("isRequiredLabel")}
                </label>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onSubmit}
                        disabled={loading || !title.trim()}
                        className="bg-[#9327FF] text-white rounded-xl shadow-sm hover:opacity-90 px-6 py-2.5 font-medium text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
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
                            className="rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-2.5 font-medium text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                            {t("cancelBtn")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
