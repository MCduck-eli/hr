"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { JobGrade } from "@/src/services/grading-service";

interface LevelItem {
    value: number;
    label: string;
    isCustom?: boolean;
}

interface CreateGradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    editingGrade?: JobGrade | null;
    existingGrades?: JobGrade[];
    companyName?: string | null;
}

export default function CreateGradeModal({
    isOpen,
    onClose,
    onSave,
    editingGrade,
    existingGrades = [],
    companyName,
}: CreateGradeModalProps) {
    const t = useTranslations("Grading");

    const defaultLevelsList: LevelItem[] = [
        { value: 1, label: t("defaultLevels.1") },
        { value: 2, label: t("defaultLevels.2") },
        { value: 3, label: t("defaultLevels.3") },
        { value: 4, label: t("defaultLevels.4") },
        { value: 5, label: t("defaultLevels.5") },
        { value: 6, label: t("defaultLevels.6") },
    ];

    const [code, setCode] = useState("");
    const [title, setTitle] = useState("");
    const [level, setLevel] = useState<number>(1);
    const [minSalary, setMinSalary] = useState<number>(5000000);
    const [maxSalary, setMaxSalary] = useState<number>(10000000);
    const [requirements, setRequirements] = useState("");
    const [responsibilities, setResponsibilities] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [levelsList, setLevelsList] = useState<LevelItem[]>(defaultLevelsList);
    const [isManagingLevels, setIsManagingLevels] = useState(false);
    const [editingLevelValue, setEditingLevelValue] = useState<number | null>(null);
    const [newLevelNum, setNewLevelNum] = useState<number>(7);
    const [newLevelName, setNewLevelName] = useState<string>("");
    const [levelManagerError, setLevelManagerError] = useState<string | null>(null);

    const resolvedCompany = companyName || (existingGrades.length > 0 && existingGrades[0].companyName) || "default";
    const companyStorageKey = `hr_company_grading_levels_${resolvedCompany}`;

    useEffect(() => {
        if (!isOpen) return;

        let loadedLevels: LevelItem[] = [...defaultLevelsList];
        try {
            const saved = localStorage.getItem(companyStorageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    loadedLevels = parsed;
                }
            }
        } catch {
        }

        existingGrades.forEach((g) => {
            if (!loadedLevels.some((l) => l.value === g.level)) {
                loadedLevels.push({
                    value: g.level,
                    label: `Level ${g.level}`,
                    isCustom: true,
                });
            }
        });

        loadedLevels.sort((a, b) => a.value - b.value);
        setLevelsList(loadedLevels);

        const maxLvl = loadedLevels.reduce((max, cur) => Math.max(max, cur.value), 0);
        setNewLevelNum(maxLvl + 1);
    }, [isOpen, existingGrades, companyStorageKey]);

    const saveLevelsToStorage = (updated: LevelItem[]) => {
        const sorted = [...updated].sort((a, b) => a.value - b.value);
        setLevelsList(sorted);
        try {
            localStorage.setItem(companyStorageKey, JSON.stringify(sorted));
        } catch {
        }
    };

    useEffect(() => {
        if (editingGrade) {
            setCode(editingGrade.code || "");
            setTitle(editingGrade.title || "");
            setLevel(editingGrade.level || 1);
            setMinSalary(editingGrade.minSalary || 0);
            setMaxSalary(editingGrade.maxSalary || 0);
            setRequirements(editingGrade.requirements || "");
            setResponsibilities(editingGrade.responsibilities || "");
        } else {
            setCode("");
            setTitle("");
            setLevel(1);
            setMinSalary(5000000);
            setMaxSalary(10000000);
            setRequirements("");
            setResponsibilities("");
        }
        setError(null);
        setIsManagingLevels(false);
        setEditingLevelValue(null);
        setLevelManagerError(null);
    }, [editingGrade, isOpen]);

    if (!isOpen) return null;

    const handleAddOrUpdateLevel = (e: React.FormEvent) => {
        e.preventDefault();
        setLevelManagerError(null);

        if (!newLevelNum || newLevelNum < 1) {
            return;
        }

        if (!newLevelName.trim()) {
            return;
        }

        if (editingLevelValue !== null) {
            const updated = levelsList.map((lvl) => {
                if (lvl.value === editingLevelValue) {
                    return {
                        value: Number(newLevelNum),
                        label: newLevelName.trim(),
                        isCustom: true,
                    };
                }
                return lvl;
            });
            saveLevelsToStorage(updated);
            setLevel(Number(newLevelNum));
            setEditingLevelValue(null);
            setNewLevelName("");
            const maxLvl = updated.reduce((max, cur) => Math.max(max, cur.value), 0);
            setNewLevelNum(maxLvl + 1);
        } else {
            if (levelsList.some((l) => l.value === Number(newLevelNum))) {
                return;
            }

            const updated: LevelItem[] = [
                ...levelsList,
                {
                    value: Number(newLevelNum),
                    label: newLevelName.trim(),
                    isCustom: true,
                },
            ];
            saveLevelsToStorage(updated);
            setLevel(Number(newLevelNum));
            setNewLevelName("");
            setNewLevelNum(Number(newLevelNum) + 1);
        }
    };

    const handleStartEditLevel = (item: LevelItem) => {
        setEditingLevelValue(item.value);
        setNewLevelNum(item.value);
        setNewLevelName(item.label);
        setLevelManagerError(null);
    };

    const handleDeleteLevel = (levelVal: number) => {
        const hasGrades = existingGrades.some((g) => g.level === levelVal);
        if (hasGrades) {
            if (!confirm(`Level ${levelVal}`)) {
                return;
            }
        }

        const updated = levelsList.filter((l) => l.value !== levelVal);
        saveLevelsToStorage(updated);
        if (level === levelVal) {
            setLevel(updated.length > 0 ? updated[0].value : 1);
        }
        if (editingLevelValue === levelVal) {
            setEditingLevelValue(null);
            setNewLevelName("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!code.trim() || !title.trim()) {
            return;
        }

        if (level < 1) {
            return;
        }

        if (minSalary > maxSalary) {
            return;
        }

        try {
            setIsSubmitting(true);
            await onSave({
                code: code.trim().toUpperCase(),
                title: title.trim(),
                level: Number(level),
                minSalary: Number(minSalary),
                maxSalary: Number(maxSalary),
                requirements: requirements.trim() || null,
                responsibilities: responsibilities.trim() || null,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border border-black max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
                <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                            {editingGrade ? t("editGradeTitle") : t("createGradeTitle")}
                        </h2>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                                {t("gradeCode")} *
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder={t("gradeCodePlaceholder")}
                                className="w-full border border-gray-300 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none bg-[#fcfcfc]"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                                    {t("gradeLevel")} *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsManagingLevels(!isManagingLevels);
                                        setLevelManagerError(null);
                                    }}
                                    className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    <span>⚙️</span>
                                    {isManagingLevels ? t("cancel") : t("manageLevels")}
                                </button>
                            </div>

                            <select
                                value={level}
                                onChange={(e) => setLevel(Number(e.target.value))}
                                className="w-full border border-gray-300 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none bg-[#fcfcfc] font-medium"
                            >
                                {levelsList.map((lvl) => (
                                    <option key={lvl.value} value={lvl.value}>
                                        Level {lvl.value} — {lvl.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {isManagingLevels && (
                        <div className="border border-blue-300 bg-blue-50/50 p-4 space-y-4">
                            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                    {t("manageLevels")}
                                </span>
                            </div>

                            {levelManagerError && (
                                <div className="p-2 bg-red-100 border border-red-200 text-red-800 text-xs font-semibold">
                                    {levelManagerError}
                                </div>
                            )}

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {levelsList.map((lvl) => (
                                    <div
                                        key={lvl.value}
                                        className={`flex items-center justify-between p-2 text-xs border bg-white ${
                                            level === lvl.value ? "border-black font-bold" : "border-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-[10px]">
                                                {lvl.value}
                                            </span>
                                            <span className="text-black">
                                                Level {lvl.value}: {lvl.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEditLevel(lvl)}
                                                className="text-blue-600 hover:text-blue-800 font-bold px-2 py-0.5 text-[11px] border border-blue-200 hover:bg-blue-50"
                                            >
                                                {t("edit")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteLevel(lvl.value)}
                                                className="text-red-600 hover:text-red-800 font-bold px-2 py-0.5 text-[11px] border border-red-200 hover:bg-red-50"
                                            >
                                                {t("delete")}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white border border-blue-200 p-3 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                                            Level *
                                        </label>
                                        <input
                                            type="number"
                                            value={newLevelNum}
                                            onChange={(e) => setNewLevelNum(Math.max(1, Number(e.target.value)))}
                                            min={1}
                                            max={100}
                                            className="w-full border border-gray-300 p-2 text-xs font-bold focus:border-black focus:outline-none"
                                            placeholder="7"
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={newLevelName}
                                            onChange={(e) => setNewLevelName(e.target.value)}
                                            className="w-full border border-gray-300 p-2 text-xs focus:border-black focus:outline-none"
                                            placeholder="Level name"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-1">
                                    {editingLevelValue !== null && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingLevelValue(null);
                                                setNewLevelName("");
                                                const maxLvl = levelsList.reduce((max, cur) => Math.max(max, cur.value), 0);
                                                setNewLevelNum(maxLvl + 1);
                                            }}
                                            className="px-3 py-1.5 border border-gray-300 text-xs font-bold uppercase"
                                        >
                                            {t("cancel")}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleAddOrUpdateLevel}
                                        className="px-4 py-1.5 bg-blue-700 text-white text-xs font-bold uppercase hover:bg-blue-800"
                                    >
                                        {t("save")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                            {t("gradeTitle")} *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t("gradeTitlePlaceholder")}
                            className="w-full border border-gray-300 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none bg-[#fcfcfc]"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                                {t("minSalary")} *
                            </label>
                            <input
                                type="number"
                                value={minSalary}
                                onChange={(e) => setMinSalary(Number(e.target.value))}
                                step={100000}
                                min={0}
                                className="w-full border border-gray-300 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none bg-[#fcfcfc]"
                                required
                            />
                            <span className="text-[10px] text-gray-500 mt-1 block">
                                {Number(minSalary).toLocaleString()} UZS
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                                {t("maxSalary")} *
                            </label>
                            <input
                                type="number"
                                value={maxSalary}
                                onChange={(e) => setMaxSalary(Number(e.target.value))}
                                step={100000}
                                min={0}
                                className="w-full border border-gray-300 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none bg-[#fcfcfc]"
                                required
                            />
                            <span className="text-[10px] text-gray-500 mt-1 block">
                                {Number(maxSalary).toLocaleString()} UZS
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                            {t("requirements")}
                        </label>
                        <textarea
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            rows={3}
                            placeholder={t("requirementsPlaceholder")}
                            className="w-full border border-gray-300 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none bg-[#fcfcfc]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                            {t("responsibilities")}
                        </label>
                        <textarea
                            value={responsibilities}
                            onChange={(e) => setResponsibilities(e.target.value)}
                            rows={3}
                            placeholder={t("responsibilitiesPlaceholder")}
                            className="w-full border border-gray-300 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none bg-[#fcfcfc]"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100 transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? t("saving") : t("save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
