"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    LifecycleTemplate,
    fetchLifecycleTemplates,
    fetchStageStats,
    createLifecycleTemplate,
    updateLifecycleTemplate,
    deleteLifecycleTemplate,
} from "@/src/services/lifecycle-service";
import { fetchDepartments } from "@/src/services/department-service";

interface RoadmapStageItem {
    id: string;
    step: string;
    title: string;
    desc: string;
    stage: string;
    icon: string;
    departmentId?: string;
    color: string;
    transitionCondition?: string;
    transitionValue?: string;
}

interface TransitionConditionItem {
    id: string;
    code: string;
    label: string;
    defaultPlaceholder?: string;
}

function CircularProgress({
    value,
    size = 38,
    strokeWidth = 3.5,
    color = "#9327FF",
}: {
    value: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-100"
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                    fill="transparent"
                />
            </svg>
            <span className="absolute text-[10px] font-bold text-gray-800">{value}%</span>
        </div>
    );
}

export default function EjmTemplateManager() {
    const t = useTranslations("EjmManager");

    const defaultStages: RoadmapStageItem[] = [
        {
            id: "st_1",
            step: "01",
            title: t("defaultStages.st_1_title"),
            desc: t("defaultStages.st_1_desc"),
            stage: "PRE_HIRE",
            icon: "📝",
            departmentId: "ALL",
            color: "border-sky-500 bg-sky-50 text-sky-900",
            transitionCondition: "HIRED_OFFER",
            transitionValue: t("defaultStages.st_1_trans"),
        },
        {
            id: "st_2",
            step: "02",
            title: t("defaultStages.st_2_title"),
            desc: t("defaultStages.st_2_desc"),
            stage: "HIRED",
            icon: "🚀",
            departmentId: "ALL",
            color: "border-emerald-500 bg-emerald-50 text-emerald-900",
            transitionCondition: "DOCS_SIGNED",
            transitionValue: t("defaultStages.st_2_trans"),
        },
        {
            id: "st_3",
            step: "03",
            title: t("defaultStages.st_3_title"),
            desc: t("defaultStages.st_3_desc"),
            stage: "ONBOARDING",
            icon: "📚",
            departmentId: "ALL",
            color: "border-blue-500 bg-blue-50 text-blue-900",
            transitionCondition: "COURSES_100",
            transitionValue: t("defaultStages.st_3_trans"),
        },
        {
            id: "st_4",
            step: "04",
            title: t("defaultStages.st_4_title"),
            desc: t("defaultStages.st_4_desc"),
            stage: "PROBATION",
            icon: "🛡️",
            departmentId: "ALL",
            color: "border-teal-500 bg-teal-50 text-teal-900",
            transitionCondition: "DAYS_PASSED",
            transitionValue: t("defaultStages.st_4_trans"),
        },
        {
            id: "st_5",
            step: "05",
            title: t("defaultStages.st_5_title"),
            desc: t("defaultStages.st_5_desc"),
            stage: "REGULAR_WORK",
            icon: "⭐",
            departmentId: "ALL",
            color: "border-violet-500 bg-violet-50 text-violet-900",
            transitionCondition: "OKR_COMPLETED",
            transitionValue: t("defaultStages.st_5_trans"),
        },
        {
            id: "st_6",
            step: "06",
            title: t("defaultStages.st_6_title"),
            desc: t("defaultStages.st_6_desc"),
            stage: "PROMOTION",
            icon: "👑",
            departmentId: "ALL",
            color: "border-purple-500 bg-purple-50 text-purple-900",
            transitionCondition: "GRADE_PROMOTED",
            transitionValue: t("defaultStages.st_6_trans"),
        },
        {
            id: "st_7",
            step: "07",
            title: t("defaultStages.st_7_title"),
            desc: t("defaultStages.st_7_desc"),
            stage: "OFFBOARDING",
            icon: "🏁",
            departmentId: "ALL",
            color: "border-red-500 bg-red-50 text-red-900",
            transitionCondition: "OFFBOARDING_DONE",
            transitionValue: t("defaultStages.st_7_trans"),
        },
    ];

    const defaultConditions: TransitionConditionItem[] = [
        { id: "c_1", code: "COURSES_100", label: t("defaultConditions.c_1"), defaultPlaceholder: "100%" },
        { id: "c_2", code: "TASKS_100", label: t("defaultConditions.c_2"), defaultPlaceholder: "100%" },
        { id: "c_3", code: "DAYS_PASSED", label: t("defaultConditions.c_3"), defaultPlaceholder: "30 kun" },
        { id: "c_4", code: "OKR_COMPLETED", label: t("defaultConditions.c_4"), defaultPlaceholder: "70% KPI" },
        { id: "c_5", code: "DISC_COMPLETED", label: t("defaultConditions.c_5"), defaultPlaceholder: "DISC" },
        { id: "c_6", code: "FEEDBACK_360", label: t("defaultConditions.c_6"), defaultPlaceholder: "360" },
        { id: "c_7", code: "GRADE_PROMOTED", label: t("defaultConditions.c_7"), defaultPlaceholder: "L2" },
        { id: "c_8", code: "OFFBOARDING_DONE", label: t("defaultConditions.c_8"), defaultPlaceholder: "Exit interview" },
    ];

    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("ALL");
    const [roadmapStages, setRoadmapStages] = useState<RoadmapStageItem[]>([]);
    const [templates, setTemplates] = useState<LifecycleTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [transitionConditions, setTransitionConditions] = useState<TransitionConditionItem[]>([]);
    const [isManagingConditions, setIsManagingConditions] = useState(false);
    const [newConditionLabel, setNewConditionLabel] = useState("");
    const [editingConditionId, setEditingConditionId] = useState<string | null>(null);
    const [editingConditionLabel, setEditingConditionLabel] = useState("");
    const [stageStats, setStageStats] = useState<Record<string, { total: number; completed: number; percentage: number }>>({});

    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<RoadmapStageItem | null>(null);
    const [stageTitle, setStageTitle] = useState("");
    const [stageDesc, setStageDesc] = useState("");
    const [stageIcon, setStageIcon] = useState("📌");
    const [stageType, setStageType] = useState("REGULAR_WORK");
    const [stageDept, setStageDept] = useState("ALL");
    const [stageCondition, setStageCondition] = useState("COURSES_100");
    const [stageConditionValue, setStageConditionValue] = useState("100%");

    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<LifecycleTemplate | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formStage, setFormStage] = useState("ONBOARDING");
    const [tasks, setTasks] = useState<{ title: string; description: string; dueDays: number }[]>([
        { title: "", description: "", dueDays: 7 },
    ]);
    const [saving, setSaving] = useState(false);

    const getCompanyKey = () => {
        try {
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            if (u && u.companyName) {
                return u.companyName.trim().toLowerCase().replace(/\s+/g, "_");
            }
        } catch {}
        return "default";
    };

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [tplData, deptData, statsData] = await Promise.all([
                fetchLifecycleTemplates().catch(() => []),
                fetchDepartments().catch(() => []),
                fetchStageStats(selectedDepartmentId).catch(() => ({})),
            ]);

            setTemplates(tplData || []);
            setStageStats(statsData || {});

            if (Array.isArray(deptData)) {
                setDepartments(deptData);
            } else {
                setDepartments([]);
            }

            const storageKey = `ejm_roadmap_stages_${getCompanyKey()}`;
            let savedStages = null;
            try {
                const raw = localStorage.getItem(storageKey);
                if (raw) savedStages = JSON.parse(raw);
            } catch {}

            if (savedStages && Array.isArray(savedStages) && savedStages.length > 0) {
                setRoadmapStages(savedStages);
            } else {
                setRoadmapStages(defaultStages);
            }

            const condStorageKey = `ejm_transition_conditions_${getCompanyKey()}`;
            let savedConditions = null;
            try {
                const rawCond = localStorage.getItem(condStorageKey);
                if (rawCond) savedConditions = JSON.parse(rawCond);
            } catch {}

            if (savedConditions && Array.isArray(savedConditions) && savedConditions.length > 0) {
                setTransitionConditions(savedConditions);
            } else {
                setTransitionConditions(defaultConditions);
            }
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        fetchStageStats(selectedDepartmentId)
            .then((res) => setStageStats(res || {}))
            .catch(() => {});
    }, [selectedDepartmentId]);

    const saveStagesToStorage = (updated: RoadmapStageItem[]) => {
        setRoadmapStages(updated);
        try {
            const storageKey = `ejm_roadmap_stages_${getCompanyKey()}`;
            localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {}
    };

    const saveTransitionConditions = (updated: TransitionConditionItem[]) => {
        setTransitionConditions(updated);
        try {
            const condStorageKey = `ejm_transition_conditions_${getCompanyKey()}`;
            localStorage.setItem(condStorageKey, JSON.stringify(updated));
        } catch {}
    };

    const handleAddCondition = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConditionLabel.trim()) return;
        const newCond: TransitionConditionItem = {
            id: `cond_${Date.now()}`,
            code: `CUSTOM_${Date.now()}`,
            label: newConditionLabel.trim(),
            defaultPlaceholder: "100%",
        };
        const updated = [...transitionConditions, newCond];
        saveTransitionConditions(updated);
        setNewConditionLabel("");
        setStageCondition(newCond.code);
    };

    const handleSaveEditCondition = (id: string) => {
        if (!editingConditionLabel.trim()) return;
        const updated = transitionConditions.map((c) =>
            c.id === id ? { ...c, label: editingConditionLabel.trim() } : c
        );
        saveTransitionConditions(updated);
        setEditingConditionId(null);
        setEditingConditionLabel("");
    };

    const handleDeleteCondition = (id: string) => {
        if (transitionConditions.length <= 1) {
            alert("Min 1 required");
            return;
        }
        const updated = transitionConditions.filter((c) => c.id !== id);
        saveTransitionConditions(updated);
        if (stageCondition === id || !updated.some((c) => c.code === stageCondition)) {
            setStageCondition(updated[0]?.code || "COURSES_100");
        }
    };

    const handleOpenCreateStageModal = () => {
        setEditingStage(null);
        setStageTitle("");
        setStageDesc("");
        setStageIcon("📌");
        setStageType("REGULAR_WORK");
        setStageDept(selectedDepartmentId);
        setStageCondition(transitionConditions[0]?.code || "COURSES_100");
        setStageConditionValue("100%");
        setIsManagingConditions(false);
        setIsStageModalOpen(true);
    };

    const handleOpenEditStageModal = (st: RoadmapStageItem) => {
        setEditingStage(st);
        setStageTitle(st.title);
        setStageDesc(st.desc);
        setStageIcon(st.icon || "📌");
        setStageType(st.stage || "REGULAR_WORK");
        setStageDept(st.departmentId || "ALL");
        setStageCondition(st.transitionCondition || "COURSES_100");
        setStageConditionValue(st.transitionValue || "100%");
        setIsStageModalOpen(true);
    };

    const handleSaveStage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!stageTitle.trim()) {
            return;
        }

        const colorMap: Record<string, string> = {
            PRE_HIRE: "bg-white",
            HIRED: "bg-white",
            ONBOARDING: "bg-white",
            PROBATION: "bg-white",
            REGULAR_WORK: "bg-white",
            PROMOTION: "bg-white",
            OFFBOARDING: "bg-white",
        };

        if (editingStage) {
            const updated = roadmapStages.map((s) =>
                s.id === editingStage.id
                    ? {
                          ...s,
                          title: stageTitle.trim(),
                          desc: stageDesc.trim(),
                          icon: stageIcon,
                          stage: stageType,
                          departmentId: stageDept,
                          color: colorMap[stageType] || "bg-white",
                          transitionCondition: stageCondition,
                          transitionValue: stageConditionValue.trim(),
                      }
                    : s
            );
            saveStagesToStorage(updated);
        } else {
            const currentDeptStages = roadmapStages.filter((s) => s.departmentId === stageDept || (!s.departmentId && stageDept === "ALL"));
            const nextStepNum = String(currentDeptStages.length + 1).padStart(2, "0");

            const newStage: RoadmapStageItem = {
                id: `st_custom_${Date.now()}`,
                step: nextStepNum,
                title: stageTitle.trim(),
                desc: stageDesc.trim(),
                stage: stageType,
                icon: stageIcon,
                departmentId: stageDept,
                color: colorMap[stageType] || "bg-white",
                transitionCondition: stageCondition,
                transitionValue: stageConditionValue.trim(),
            };
            const updated = [...roadmapStages, newStage];
            saveStagesToStorage(updated);
        }

        setIsStageModalOpen(false);
    };

    const handleDeleteStage = (stageId: string) => {
        if (!window.confirm("Delete?")) return;
        const updated = roadmapStages.filter((s) => s.id !== stageId);
        saveStagesToStorage(updated);
    };

    const handleResetStagesToDefault = () => {
        if (!window.confirm("Reset?")) return;
        saveStagesToStorage(defaultStages);
    };

    const handleOpenCreateTemplateModal = () => {
        setEditingTemplate(null);
        setFormTitle("");
        setFormDescription("");
        setFormStage("ONBOARDING");
        setTasks([{ title: "", description: "", dueDays: 7 }]);
        setIsTemplateModalOpen(true);
    };

    const handleOpenEditTemplateModal = (tpl: LifecycleTemplate) => {
        setEditingTemplate(tpl);
        setFormTitle(tpl.title);
        setFormDescription(tpl.description || "");
        setFormStage(tpl.stage || "ONBOARDING");
        setTasks(
            tpl.tasks && tpl.tasks.length > 0
                ? tpl.tasks.map((t) => ({
                      title: t.title,
                      description: t.description || "",
                      dueDays: t.dueDays || 7,
                  }))
                : [{ title: "", description: "", dueDays: 7 }]
        );
        setIsTemplateModalOpen(true);
    };

    const handleAddTaskRow = () => {
        setTasks([...tasks, { title: "", description: "", dueDays: 7 }]);
    };

    const handleRemoveTaskRow = (idx: number) => {
        if (tasks.length === 1) return;
        setTasks(tasks.filter((_, i) => i !== idx));
    };

    const handleTaskChange = (idx: number, field: string, val: any) => {
        const updated = [...tasks];
        updated[idx] = { ...updated[idx], [field]: val };
        setTasks(updated);
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim()) {
            return;
        }

        const validTasks = tasks
            .filter((t) => t.title.trim().length > 0)
            .map((t) => ({
                title: t.title.trim(),
                description: t.description?.trim() || undefined,
                dueDays: Number(t.dueDays) || 1,
            }));

        try {
            setSaving(true);
            const payload = {
                title: formTitle.trim(),
                description: formDescription.trim() || undefined,
                stage: formStage,
                tasks: validTasks,
            };

            if (editingTemplate) {
                await updateLifecycleTemplate(editingTemplate.id, payload);
            } else {
                await createLifecycleTemplate(payload);
            }

            setIsTemplateModalOpen(false);
            const data = await fetchLifecycleTemplates();
            setTemplates(data || []);
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!window.confirm("Delete?")) return;
        try {
            await deleteLifecycleTemplate(templateId);
            const data = await fetchLifecycleTemplates();
            setTemplates(data || []);
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const visibleStages = roadmapStages.filter((s) => {
        if (selectedDepartmentId === "ALL") {
            return !s.departmentId || s.departmentId === "ALL";
        }
        return s.departmentId === selectedDepartmentId;
    });

    const selectedDeptObj = departments.find((d) => d.id === selectedDepartmentId);

    return (
        <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        {t("title")}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {t("badge")} &bull; Employee Journey Map
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleOpenCreateStageModal}
                        className="bg-[#9327FF] text-white rounded-xl shadow-sm hover:opacity-90 px-5 py-2.5 font-medium transition-all flex items-center gap-2 text-sm"
                    >
                        <span>+</span>
                        <span>{t("addStage")}</span>
                    </button>

                    <button
                        onClick={handleOpenCreateTemplateModal}
                        className="bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 px-5 py-2.5 shadow-sm font-medium transition-all flex items-center gap-2 text-sm"
                    >
                        <span>+</span>
                        <span>{t("newTemplate")}</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs font-semibold">
                    {successMessage}
                </div>
            )}

            <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            {t("plansByDept")}:
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 bg-violet-100 text-violet-700 rounded-lg">
                            {selectedDepartmentId === "ALL" ? t("allEmployees") : selectedDeptObj?.name || "Department"}
                        </span>
                    </div>

                    <button
                        onClick={handleResetStagesToDefault}
                        className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors underline"
                    >
                        {t("resetDefault")}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                        onClick={() => setSelectedDepartmentId("ALL")}
                        className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${
                            selectedDepartmentId === "ALL"
                                ? "bg-violet-100 text-violet-700 font-semibold"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        🏢 {t("allEmployees")}
                    </button>

                    {departments.map((dept) => (
                        <button
                            key={dept.id}
                            onClick={() => setSelectedDepartmentId(dept.id)}
                            className={`px-4 py-2 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 ${
                                selectedDepartmentId === dept.id
                                    ? "bg-violet-100 text-violet-700 font-semibold"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <span>📁</span>
                            <span>{dept.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">
                            {selectedDepartmentId === "ALL"
                                ? t("generalStagesSequence")
                                : t("deptStagesSequence", { dept: selectedDeptObj?.name || "Department" })}
                        </h3>
                        <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-lg border border-violet-100">
                            {t("stageCount", { count: visibleStages.length })}
                        </span>
                    </div>
                </div>

                {visibleStages.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3">
                        <span className="text-3xl">📁</span>
                        <p className="text-xs font-semibold text-gray-500">
                            {t("noStagesForDept", { dept: selectedDeptObj?.name || "Department" })}
                        </p>
                        <button
                            onClick={handleOpenCreateStageModal}
                            className="px-5 py-2 bg-[#9327FF] text-white text-xs font-semibold rounded-xl hover:opacity-90 shadow-sm transition-all"
                        >
                            {t("addStageForDept")}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {visibleStages.map((st, idx) => {
                            const progressVal = stageStats[st.stage]?.percentage ?? 0;
                            return (
                                <div
                                    key={st.id || idx}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between gap-4 relative transition-all hover:shadow-md"
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-50 text-gray-700 rounded-lg px-3 py-1.5 font-semibold text-xs border border-gray-100 flex items-center gap-1.5">
                                                    <span>{st.icon}</span>
                                                    <span>{t("stage")} {st.step || String(idx + 1).padStart(2, "0")}</span>
                                                </span>
                                            </div>

                                            <CircularProgress value={progressVal} size={38} strokeWidth={3.5} color="#9327FF" />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <h4 className="text-sm font-bold text-gray-900 leading-snug">
                                                {st.title}
                                            </h4>
                                            <p className="text-xs text-gray-500 font-normal leading-relaxed">
                                                {st.desc}
                                            </p>
                                        </div>

                                        {st.transitionValue && (
                                            <div className="text-[11px] font-medium text-violet-700 bg-violet-50/80 border border-violet-100 px-3 py-1.5 rounded-xl flex items-center justify-between">
                                                <span className="text-gray-500">{t("transitionCriterion")}:</span>
                                                <span className="font-bold text-violet-900">{st.transitionValue}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 pt-3 border-t border-gray-50">
                                        <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                                            <span>{t("systemPrefix")} {st.stage}</span>
                                            {st.departmentId && st.departmentId !== "ALL" && (
                                                <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md font-semibold truncate max-w-[110px]">
                                                    {departments.find((d) => d.id === st.departmentId)?.name || "Department"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            <button
                                                onClick={() => handleOpenEditStageModal(st)}
                                                className="px-3 py-1 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                                            >
                                                {t("edit")}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStage(st.id)}
                                                className="px-3 py-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                {t("delete")}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900">
                        {t("specialTemplatesTitle", { count: templates.length })}
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400 animate-pulse">
                        {t("loadingTemplates")}
                    </div>
                ) : templates.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-3xl border border-gray-100 text-xs font-medium text-gray-400 shadow-sm">
                        {t("noTemplates")}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((tpl) => (
                            <div
                                key={tpl.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between gap-4 hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
                                            {tpl.stage}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleOpenEditTemplateModal(tpl)}
                                                className="px-3 py-1 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                                            >
                                                {t("editTemplate")}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(tpl.id)}
                                                className="px-3 py-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                {t("deleteTemplate")}
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-base font-bold text-gray-900 mt-1">
                                        {tpl.title}
                                    </h4>

                                    {tpl.description && (
                                        <p className="text-xs font-normal text-gray-500 leading-relaxed">
                                            {tpl.description}
                                        </p>
                                    )}
                                </div>

                                {tpl.tasks && tpl.tasks.length > 0 && (
                                    <div className="border-t border-gray-50 pt-3 flex flex-col gap-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                            {t("plannedTasks", { count: tpl.tasks.length })}
                                        </span>
                                        <div className="flex flex-col gap-1.5">
                                            {tpl.tasks.map((tsk, tIdx) => (
                                                <div
                                                    key={tsk.id || tIdx}
                                                    className="flex items-center justify-between text-xs font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100"
                                                >
                                                    <span>• {tsk.title}</span>
                                                    <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                                                        {t("daysSuffix", { days: tsk.dueDays })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isStageModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-bold text-gray-900">
                                {editingStage ? t("stageModalEditTitle") : t("stageModalAddTitle")}
                            </h3>
                            <button
                                onClick={() => setIsStageModalOpen(false)}
                                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 rounded-lg hover:bg-gray-50"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveStage} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700">
                                    {t("relatedDept")}
                                </label>
                                <select
                                    value={stageDept}
                                    onChange={(e) => setStageDept(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                                >
                                    <option value="ALL">🏢 {t("allEmployees")}</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            📁 {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700">
                                    {t("stageName")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("stageNamePlaceholder")}
                                    value={stageTitle}
                                    onChange={(e) => setStageTitle(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-700">
                                        {t("systemStageType")}
                                    </label>
                                    <select
                                        value={stageType}
                                        onChange={(e) => setStageType(e.target.value)}
                                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                                    >
                                        <option value="PRE_HIRE">📝 PRE_HIRE</option>
                                        <option value="HIRED">🚀 HIRED</option>
                                        <option value="ONBOARDING">📚 ONBOARDING</option>
                                        <option value="PROBATION">🛡️ PROBATION</option>
                                        <option value="REGULAR_WORK">⭐ REGULAR_WORK</option>
                                        <option value="PROMOTION">👑 PROMOTION</option>
                                        <option value="OFFBOARDING">🏁 OFFBOARDING</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-700">
                                        {t("iconEmoji")}
                                    </label>
                                    <input
                                        type="text"
                                        value={stageIcon}
                                        onChange={(e) => setStageIcon(e.target.value)}
                                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2.5 p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-violet-950">
                                            {t("autoTransitionCriterion")}
                                        </label>
                                        <span className="text-[9px] font-semibold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">
                                            {t("automationBadge")}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsManagingConditions(!isManagingConditions)}
                                        className="text-[11px] font-semibold text-violet-700 hover:text-violet-900 underline cursor-pointer"
                                    >
                                        {isManagingConditions ? t("closeManaging") : t("manageCriteria")}
                                    </button>
                                </div>

                                {isManagingConditions ? (
                                    <div className="flex flex-col gap-2.5 bg-white p-3 border border-violet-100 rounded-xl shadow-xs">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                            <span className="text-xs font-bold text-gray-900">
                                                {t("criteriaCategoriesTitle")}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-500">
                                                {t("companyOnly")}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                                            {transitionConditions.map((cond) => (
                                                <div
                                                    key={cond.id}
                                                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs"
                                                >
                                                    {editingConditionId === cond.id ? (
                                                        <div className="flex items-center gap-1.5 flex-1">
                                                            <input
                                                                type="text"
                                                                value={editingConditionLabel}
                                                                onChange={(e) => setEditingConditionLabel(e.target.value)}
                                                                className="flex-1 p-1 bg-white border border-gray-200 rounded text-xs font-medium"
                                                                autoFocus
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveEditCondition(cond.id)}
                                                                className="px-2.5 py-1 bg-[#9327FF] text-white text-[10px] font-semibold rounded-lg"
                                                            >
                                                                {t("save")}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingConditionId(null);
                                                                    setEditingConditionLabel("");
                                                                }}
                                                                className="px-2 py-1 text-[10px] text-gray-600 hover:text-gray-900 font-medium"
                                                            >
                                                                {t("cancel")}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="font-semibold text-gray-800 truncate">
                                                                {cond.label}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingConditionId(cond.id);
                                                                        setEditingConditionLabel(cond.label);
                                                                    }}
                                                                    className="px-2 py-0.5 text-[10px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded"
                                                                >
                                                                    {t("edit")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteCondition(cond.id)}
                                                                    className="px-2 py-0.5 text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded"
                                                                >
                                                                    {t("delete")}
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                            <input
                                                type="text"
                                                placeholder={t("newCriterionPlaceholder")}
                                                value={newConditionLabel}
                                                onChange={(e) => setNewConditionLabel(e.target.value)}
                                                className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCondition}
                                                className="px-4 py-2 bg-[#9327FF] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all shrink-0"
                                            >
                                                {t("addBtn")}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-semibold text-gray-700">{t("transitionCondition")}</label>
                                            <select
                                                value={stageCondition}
                                                onChange={(e) => {
                                                    setStageCondition(e.target.value);
                                                    const matched = transitionConditions.find((c) => c.code === e.target.value);
                                                    if (matched?.defaultPlaceholder && !stageConditionValue) {
                                                        setStageConditionValue(matched.defaultPlaceholder);
                                                    }
                                                }}
                                                className="p-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 outline-none"
                                            >
                                                {transitionConditions.map((cond) => (
                                                    <option key={cond.id} value={cond.code}>
                                                        {cond.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-semibold text-gray-700">{t("criterionValue")}</label>
                                            <input
                                                type="text"
                                                placeholder={t("criterionValuePlaceholder")}
                                                value={stageConditionValue}
                                                onChange={(e) => setStageConditionValue(e.target.value)}
                                                className="p-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700">
                                    {t("descAndResults")}
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder={t("descPlaceholder")}
                                    value={stageDesc}
                                    onChange={(e) => setStageDesc(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 outline-none resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsStageModalOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-200 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-[#9327FF] text-white text-xs font-semibold rounded-xl hover:opacity-90 shadow-sm transition-all"
                                >
                                    {t("save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isTemplateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-bold text-gray-900">
                                {editingTemplate ? t("templateModalEditTitle") : t("templateModalAddTitle")}
                            </h3>
                            <button
                                onClick={() => setIsTemplateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 rounded-lg hover:bg-gray-50"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveTemplate} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700">
                                    {t("templateName")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("templateNamePlaceholder")}
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700">
                                    {t("lifecycleStage")}
                                </label>
                                <select
                                    value={formStage}
                                    onChange={(e) => setFormStage(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 outline-none"
                                >
                                    <option value="PRE_HIRE">📝 PRE_HIRE</option>
                                    <option value="ONBOARDING">📚 ONBOARDING</option>
                                    <option value="PROBATION">🛡️ PROBATION</option>
                                    <option value="REGULAR_WORK">⭐ REGULAR_WORK</option>
                                    <option value="PROMOTION">👑 PROMOTION</option>
                                    <option value="OFFBOARDING">🏁 OFFBOARDING</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-700">
                                    {t("desc")}
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder={t("templateDescPlaceholder")}
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-500/20 outline-none resize-none"
                                />
                            </div>

                            <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-gray-700">
                                        {t("stageTasksAndSteps")}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddTaskRow}
                                        className="text-xs font-semibold text-violet-600 hover:text-violet-800"
                                    >
                                        + {t("addStep")}
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {tasks.map((task, tIdx) => (
                                        <div
                                            key={tIdx}
                                            className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100"
                                        >
                                            <input
                                                type="text"
                                                required
                                                placeholder={t("taskNamePlaceholder")}
                                                value={task.title}
                                                onChange={(e) => handleTaskChange(tIdx, "title", e.target.value)}
                                                className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-violet-500/20 outline-none"
                                            />
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={task.dueDays}
                                                    onChange={(e) => handleTaskChange(tIdx, "dueDays", e.target.value === "" ? "" : (parseInt(e.target.value) || 1))}
                                                    className="w-16 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-violet-500/20 outline-none"
                                                />
                                                <span className="text-[11px] font-medium text-gray-500">{t("day")}</span>
                                            </div>
                                            {tasks.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTaskRow(tIdx)}
                                                    className="p-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-bold"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsTemplateModalOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-200 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-[#9327FF] text-white text-xs font-semibold rounded-xl hover:opacity-90 shadow-sm transition-all disabled:opacity-50"
                                >
                                    {saving ? t("saving") : t("save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
