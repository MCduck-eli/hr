"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    LifecycleTemplate,
    fetchLifecycleTemplates,
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

            const [tplData, deptData] = await Promise.all([
                fetchLifecycleTemplates().catch(() => []),
                fetchDepartments().catch(() => []),
            ]);

            setTemplates(tplData || []);

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
            PRE_HIRE: "border-sky-500 bg-sky-50 text-sky-900",
            HIRED: "border-emerald-500 bg-emerald-50 text-emerald-900",
            ONBOARDING: "border-blue-500 bg-blue-50 text-blue-900",
            PROBATION: "border-teal-500 bg-teal-50 text-teal-900",
            REGULAR_WORK: "border-violet-500 bg-violet-50 text-violet-900",
            PROMOTION: "border-purple-500 bg-purple-50 text-purple-900",
            OFFBOARDING: "border-red-500 bg-red-50 text-red-900",
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
                          color: colorMap[stageType] || "border-black bg-gray-50 text-black",
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
                color: colorMap[stageType] || "border-black bg-gray-50 text-black",
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
        <div className="flex flex-col gap-8 bg-white p-6 md:p-8 border border-black shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black pb-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                        {t("badge")}
                    </span>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                        {t("title")}
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleOpenCreateStageModal}
                        className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-xs"
                    >
                        <span>+</span>
                        <span>{t("addStage")}</span>
                    </button>

                    <button
                        onClick={handleOpenCreateTemplateModal}
                        className="px-4 py-2 bg-purple-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-purple-800 transition-colors flex items-center gap-2 shadow-xs"
                    >
                        <span>+</span>
                        <span>{t("newTemplate")}</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 text-xs font-bold uppercase tracking-wider">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 text-xs font-bold uppercase tracking-wider">
                    {successMessage}
                </div>
            )}

            <div className="flex flex-col gap-3 bg-gray-50 p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-black">
                            {t("plansByDept")}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-black text-white uppercase rounded-xs">
                            {selectedDepartmentId === "ALL" ? t("allEmployees") : selectedDeptObj?.name || "Department"}
                        </span>
                    </div>

                    <button
                        onClick={handleResetStagesToDefault}
                        className="text-[10px] font-bold text-gray-500 hover:text-black uppercase tracking-wider underline"
                    >
                        {t("resetDefault")}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                        onClick={() => setSelectedDepartmentId("ALL")}
                        className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                            selectedDepartmentId === "ALL"
                                ? "bg-black text-white shadow-xs"
                                : "bg-white text-black border border-gray-300 hover:border-black"
                        }`}
                    >
                        🏢 {t("allEmployees")}
                    </button>

                    {departments.map((dept) => (
                        <button
                            key={dept.id}
                            onClick={() => setSelectedDepartmentId(dept.id)}
                            className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                                selectedDepartmentId === dept.id
                                    ? "bg-purple-700 text-white shadow-xs"
                                    : "bg-white text-gray-800 border border-gray-300 hover:border-purple-600"
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
                        <h3 className="text-sm font-black uppercase tracking-wider text-black">
                            {selectedDepartmentId === "ALL"
                                ? t("generalStagesSequence")
                                : t("deptStagesSequence", { dept: selectedDeptObj?.name || "Department" })}
                        </h3>
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-200">
                            {t("stageCount", { count: visibleStages.length })}
                        </span>
                    </div>
                </div>

                {visibleStages.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-gray-300 flex flex-col items-center justify-center gap-3">
                        <span className="text-2xl">📁</span>
                        <p className="text-xs font-bold uppercase text-gray-500">
                            {t("noStagesForDept", { dept: selectedDeptObj?.name || "Department" })}
                        </p>
                        <button
                            onClick={handleOpenCreateStageModal}
                            className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800"
                        >
                            {t("addStageForDept")}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {visibleStages.map((st, idx) => (
                            <div
                                key={st.id || idx}
                                className={`border p-4 flex flex-col justify-between gap-3 relative transition-all hover:shadow-xs ${st.color}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black px-2 py-0.5 bg-black text-white rounded-xs">
                                            {t("stage")} {st.step || String(idx + 1).padStart(2, "0")}
                                        </span>
                                        <span className="text-base">{st.icon}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEditStageModal(st)}
                                            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white text-black border border-gray-300 hover:bg-black hover:text-white transition-colors"
                                        >
                                            {t("edit")}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStage(st.id)}
                                            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors"
                                        >
                                            {t("delete")}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <h4 className="text-xs font-black uppercase tracking-tight">
                                        {st.title}
                                    </h4>
                                    <p className="text-[11px] font-medium leading-relaxed opacity-90">
                                        {st.desc}
                                    </p>
                                </div>

                                {st.transitionValue && (
                                    <div className="text-[9px] font-bold text-purple-800 bg-purple-100/80 border border-purple-200 px-2 py-1 rounded-xs flex items-center justify-between">
                                        <span>{t("transitionCriterion")}</span>
                                        <span className="font-extrabold">{st.transitionValue}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-gray-600 border-t border-gray-300/40 pt-2">
                                    <span>{t("systemPrefix")} {st.stage}</span>
                                    {st.departmentId && st.departmentId !== "ALL" && (
                                        <span className="px-1.5 py-0.5 bg-purple-200 text-purple-900 rounded-xs font-bold truncate max-w-[120px]">
                                            {departments.find((d) => d.id === st.departmentId)?.name || "Department"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-black">
                        {t("specialTemplatesTitle", { count: templates.length })}
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400 animate-pulse">
                        {t("loadingTemplates")}
                    </div>
                ) : templates.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-gray-300 text-xs font-bold uppercase tracking-wider text-gray-400">
                        {t("noTemplates")}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((tpl) => (
                            <div
                                key={tpl.id}
                                className="border border-black bg-white p-5 flex flex-col justify-between gap-4 shadow-xs"
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                                            {tpl.stage}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleOpenEditTemplateModal(tpl)}
                                                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 hover:bg-black hover:text-white border border-gray-300 transition-colors"
                                            >
                                                {t("editTemplate")}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(tpl.id)}
                                                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 transition-colors"
                                            >
                                                {t("deleteTemplate")}
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-base font-black text-black">
                                        {tpl.title}
                                    </h4>

                                    {tpl.description && (
                                        <p className="text-xs font-medium text-gray-600">
                                            {tpl.description}
                                        </p>
                                    )}
                                </div>

                                {tpl.tasks && tpl.tasks.length > 0 && (
                                    <div className="border-t border-gray-100 pt-3 flex flex-col gap-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            {t("plannedTasks", { count: tpl.tasks.length })}
                                        </span>
                                        <div className="flex flex-col gap-1">
                                            {tpl.tasks.map((tsk, tIdx) => (
                                                <div
                                                    key={tsk.id || tIdx}
                                                    className="flex items-center justify-between text-xs font-medium text-gray-700 bg-gray-50 p-1.5 border border-gray-200"
                                                >
                                                    <span>• {tsk.title}</span>
                                                    <span className="text-[10px] font-bold font-mono text-gray-500">
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
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                            <h3 className="text-base font-black uppercase tracking-tight text-black">
                                {editingStage ? t("stageModalEditTitle") : t("stageModalAddTitle")}
                            </h3>
                            <button
                                onClick={() => setIsStageModalOpen(false)}
                                className="text-sm font-bold text-gray-500 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveStage} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black">
                                    {t("relatedDept")}
                                </label>
                                <select
                                    value={stageDept}
                                    onChange={(e) => setStageDept(e.target.value)}
                                    className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-black"
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
                                <label className="text-xs font-bold uppercase tracking-wider text-black">
                                    {t("stageName")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("stageNamePlaceholder")}
                                    value={stageTitle}
                                    onChange={(e) => setStageTitle(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                                        {t("systemStageType")}
                                    </label>
                                    <select
                                        value={stageType}
                                        onChange={(e) => setStageType(e.target.value)}
                                        className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-black"
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
                                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                                        {t("iconEmoji")}
                                    </label>
                                    <input
                                        type="text"
                                        value={stageIcon}
                                        onChange={(e) => setStageIcon(e.target.value)}
                                        className="p-2.5 bg-white border border-gray-300 text-xs font-bold text-center text-black focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2.5 p-3.5 bg-purple-50/70 border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-purple-950">
                                            {t("autoTransitionCriterion")}
                                        </label>
                                        <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                                            {t("automationBadge")}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsManagingConditions(!isManagingConditions)}
                                        className="text-[10px] font-black uppercase tracking-wider text-purple-700 hover:text-black underline cursor-pointer"
                                    >
                                        {isManagingConditions ? t("closeManaging") : t("manageCriteria")}
                                    </button>
                                </div>

                                {isManagingConditions ? (
                                    <div className="flex flex-col gap-2.5 bg-white p-3 border border-purple-200 shadow-xs">
                                        <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-black">
                                                {t("criteriaCategoriesTitle")}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-500">
                                                {t("companyOnly")}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                                            {transitionConditions.map((cond) => (
                                                <div
                                                    key={cond.id}
                                                    className="flex items-center justify-between gap-2 p-1.5 bg-gray-50 border border-gray-200 text-xs"
                                                >
                                                    {editingConditionId === cond.id ? (
                                                        <div className="flex items-center gap-1.5 flex-1">
                                                            <input
                                                                type="text"
                                                                value={editingConditionLabel}
                                                                onChange={(e) => setEditingConditionLabel(e.target.value)}
                                                                className="flex-1 p-1 bg-white border border-gray-300 text-xs font-bold"
                                                                autoFocus
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveEditCondition(cond.id)}
                                                                className="px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase"
                                                            >
                                                                {t("save")}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingConditionId(null);
                                                                    setEditingConditionLabel("");
                                                                }}
                                                                className="px-1.5 py-0.5 text-[10px] text-gray-600 hover:text-black font-bold"
                                                            >
                                                                {t("cancel")}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="font-bold text-gray-800 truncate">
                                                                {cond.label}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingConditionId(cond.id);
                                                                        setEditingConditionLabel(cond.label);
                                                                    }}
                                                                    className="px-1.5 py-0.5 text-[9px] font-bold bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white"
                                                                >
                                                                    {t("edit")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteCondition(cond.id)}
                                                                    className="px-1.5 py-0.5 text-[9px] font-bold bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white"
                                                                >
                                                                    {t("delete")}
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                            <input
                                                type="text"
                                                placeholder={t("newCriterionPlaceholder")}
                                                value={newConditionLabel}
                                                onChange={(e) => setNewConditionLabel(e.target.value)}
                                                className="flex-1 p-1.5 bg-gray-50 border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCondition}
                                                className="px-3 py-1.5 bg-purple-700 text-white text-xs font-black uppercase tracking-wider hover:bg-purple-800 shrink-0"
                                            >
                                                {t("addBtn")}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] font-bold uppercase text-gray-700">{t("transitionCondition")}</label>
                                            <select
                                                value={stageCondition}
                                                onChange={(e) => {
                                                    setStageCondition(e.target.value);
                                                    const matched = transitionConditions.find((c) => c.code === e.target.value);
                                                    if (matched?.defaultPlaceholder && !stageConditionValue) {
                                                        setStageConditionValue(matched.defaultPlaceholder);
                                                    }
                                                }}
                                                className="p-2 bg-white border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                                            >
                                                {transitionConditions.map((cond) => (
                                                    <option key={cond.id} value={cond.code}>
                                                        {cond.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] font-bold uppercase text-gray-700">{t("criterionValue")}</label>
                                            <input
                                                type="text"
                                                placeholder={t("criterionValuePlaceholder")}
                                                value={stageConditionValue}
                                                onChange={(e) => setStageConditionValue(e.target.value)}
                                                className="p-2 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black">
                                    {t("descAndResults")}
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder={t("descPlaceholder")}
                                    value={stageDesc}
                                    onChange={(e) => setStageDesc(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsStageModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100 transition-colors"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                                >
                                    {t("save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isTemplateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                            <h3 className="text-base font-black uppercase tracking-tight text-black">
                                {editingTemplate ? t("templateModalEditTitle") : t("templateModalAddTitle")}
                            </h3>
                            <button
                                onClick={() => setIsTemplateModalOpen(false)}
                                className="text-sm font-bold text-gray-500 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveTemplate} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black">
                                    {t("templateName")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("templateNamePlaceholder")}
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black">
                                    {t("lifecycleStage")}
                                </label>
                                <select
                                    value={formStage}
                                    onChange={(e) => setFormStage(e.target.value)}
                                    className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-black"
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
                                <label className="text-xs font-bold uppercase tracking-wider text-black">
                                    {t("desc")}
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder={t("templateDescPlaceholder")}
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                                />
                            </div>

                            <div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-black">
                                        {t("stageTasksAndSteps")}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddTaskRow}
                                        className="text-[11px] font-bold text-blue-600 hover:text-black uppercase tracking-wider"
                                    >
                                        {t("addStep")}
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {tasks.map((task, tIdx) => (
                                        <div
                                            key={tIdx}
                                            className="flex items-center gap-2 bg-gray-50 p-2 border border-gray-200"
                                        >
                                            <input
                                                type="text"
                                                required
                                                placeholder={t("taskNamePlaceholder")}
                                                value={task.title}
                                                onChange={(e) => handleTaskChange(tIdx, "title", e.target.value)}
                                                className="flex-1 p-1.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black"
                                            />
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={task.dueDays}
                                                    onChange={(e) => handleTaskChange(tIdx, "dueDays", parseInt(e.target.value) || 1)}
                                                    className="w-16 p-1.5 bg-white border border-gray-300 text-xs font-bold text-center text-black focus:outline-none focus:border-black"
                                                />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{t("day")}</span>
                                            </div>
                                            {tasks.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTaskRow(tIdx)}
                                                    className="p-1.5 text-xs text-red-600 hover:bg-red-50 font-bold"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsTemplateModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100 transition-colors"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
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
