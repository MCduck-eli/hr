"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    OffboardingItem,
    OffboardingTask,
    startOffboarding,
    toggleOffboardingTask,
    editOffboardingTask,
    addOffboardingTask,
    deleteOffboardingTask,
    updateOffboardingStatus,
} from "@/src/services/offboarding-service";
import { fetchAllUsers } from "@/src/services/user-service";

interface OffboardingManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialOffboarding?: OffboardingItem | null;
    initialEmployeeId?: string | null;
}

interface TemplateTaskItem {
    id: string;
    title: string;
    category: "IT_ACCESS" | "ASSET_RETURN" | "FINANCE" | "HR_DOCUMENTS";
}

export default function OffboardingManagerModal({
    isOpen,
    onClose,
    onSuccess,
    initialOffboarding,
    initialEmployeeId,
}: OffboardingManagerModalProps) {
    const t = useTranslations("HROffboarding.managerModal");

    const defaultCompanyTasks: TemplateTaskItem[] = [
        {
            id: "t_1",
            title: t("defaultTasks.t_1"),
            category: "IT_ACCESS",
        },
        {
            id: "t_2",
            title: t("defaultTasks.t_2"),
            category: "ASSET_RETURN",
        },
        {
            id: "t_3",
            title: t("defaultTasks.t_3"),
            category: "ASSET_RETURN",
        },
        {
            id: "t_4",
            title: t("defaultTasks.t_4"),
            category: "FINANCE",
        },
        {
            id: "t_5",
            title: t("defaultTasks.t_5"),
            category: "HR_DOCUMENTS",
        },
    ];

    const [companyKey, setCompanyKey] = useState<string>("default");
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
        initialEmployeeId || initialOffboarding?.employeeId || "",
    );
    const [reason, setReason] = useState<string>(
        initialOffboarding?.reason || t("reasons.ownWill"),
    );
    const [lastWorkingDay, setLastWorkingDay] = useState<string>(
        initialOffboarding?.lastWorkingDay
            ? new Date(initialOffboarding.lastWorkingDay).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
    );
    const [exitNotes, setExitNotes] = useState<string>(
        initialOffboarding?.exitInterviewNotes || "",
    );

    const [currentOffboarding, setCurrentOffboarding] = useState<OffboardingItem | null>(
        initialOffboarding || null,
    );

    const [initialTasks, setInitialTasks] = useState<TemplateTaskItem[]>(defaultCompanyTasks);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTaskTitle, setEditingTaskTitle] = useState("");
    const [editingTaskCategory, setEditingTaskCategory] = useState<string>("IT_ACCESS");

    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskCategory, setNewTaskCategory] = useState<string>("IT_ACCESS");

    const [loading, setLoading] = useState(false);
    const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    useEffect(() => {
        if (isOpen) {
            setErrorMsg(null);
            setEditingTaskId(null);

            let cKey = "default";
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    const u = JSON.parse(userStr);
                    if (u.companyName) cKey = u.companyName.trim();
                }
            } catch (e) {}
            setCompanyKey(cKey);

            const storageKey = `offboarding_template_${cKey}`;
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setInitialTasks(parsed);
                    } else {
                        setInitialTasks(defaultCompanyTasks);
                    }
                } else {
                    setInitialTasks(defaultCompanyTasks);
                }
            } catch (e) {
                setInitialTasks(defaultCompanyTasks);
            }

            if (!initialOffboarding) {
                setIsEmployeesLoading(true);
                fetchAllUsers()
                    .then((usersList: any[]) => {
                        const empList = (usersList || [])
                            .filter(
                                (u: any) =>
                                    u.role !== "DIRECTOR" &&
                                    u.role !== "SUPER_ADMIN" &&
                                    (u.employee || u.role === "EMPLOYEE")
                            )
                            .map((u: any) => ({
                                id: u.employee?.id || u.id,
                                firstName: u.firstName || u.employee?.firstName || "Employee",
                                lastName: u.lastName || u.employee?.lastName || "",
                                department: u.employee?.department || null,
                                position: u.employee?.position || null,
                            }));
                        setEmployees(empList);
                        if (!selectedEmployeeId && empList.length > 0) {
                            setSelectedEmployeeId(empList[0].id);
                        }
                    })
                    .catch(() => {})
                    .finally(() => {
                        setIsEmployeesLoading(false);
                    });
            } else {
                setCurrentOffboarding(initialOffboarding);
                setSelectedEmployeeId(initialOffboarding.employeeId);
                setReason(initialOffboarding.reason);
                setLastWorkingDay(
                    initialOffboarding.lastWorkingDay
                        ? new Date(initialOffboarding.lastWorkingDay)
                              .toISOString()
                              .split("T")[0]
                        : new Date().toISOString().split("T")[0],
                );
                setExitNotes(initialOffboarding.exitInterviewNotes || "");
            }
        }
    }, [isOpen, initialOffboarding]);

    if (!isOpen) return null;

    const handleSaveTemplateForCompany = () => {
        const storageKey = `offboarding_template_${companyKey}`;
        localStorage.setItem(storageKey, JSON.stringify(initialTasks));
        showToast(t("templateSavedAlert", { company: companyKey }), "success");
    };

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeId) {
            const err = "Iltimos, xodimni tanlang";
            setErrorMsg(err);
            showToast(err, "error");
            return;
        }

        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await startOffboarding(selectedEmployeeId, {
                reason,
                lastWorkingDay,
                exitInterviewNotes: exitNotes,
                customTasks: initialTasks.map((t) => ({
                    title: t.title,
                    category: t.category,
                })),
            });
            setCurrentOffboarding(res);
            showToast("Offboarding jarayoni muvaffaqiyatli boshlandi!", "success");
            if (onSuccess) onSuccess();
        } catch (err: any) {
            const msg = err.message || "Xatolik yuz berdi";
            setErrorMsg(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (taskId: string, currentVal: boolean) => {
        try {
            await toggleOffboardingTask(taskId, !currentVal);
            if (currentOffboarding) {
                const updatedTasks = currentOffboarding.tasks.map((t) =>
                    t.id === taskId
                        ? { ...t, isCompleted: !currentVal, completedAt: !currentVal ? new Date().toISOString() : null }
                        : t,
                );
                const allDone = updatedTasks.every((t) => t.isCompleted);
                setCurrentOffboarding({
                    ...currentOffboarding,
                    tasks: updatedTasks,
                    status: allDone ? "COMPLETED" : "IN_PROGRESS",
                    isAssetsReturned: allDone,
                });
            }
            showToast("Vazifa holati yangilandi", "success");
            if (onSuccess) onSuccess();
        } catch (err: any) {
            showToast(err.message || "Xatolik yuz berdi", "error");
        }
    };

    const handleStartEditTask = (task: OffboardingTask | TemplateTaskItem) => {
        setEditingTaskId(task.id);
        setEditingTaskTitle(task.title);
        setEditingTaskCategory(task.category);
    };

    const handleSaveEditedTask = async (taskId: string) => {
        if (!editingTaskTitle.trim()) return;

        if (currentOffboarding) {
            try {
                const updated = await editOffboardingTask(taskId, {
                    title: editingTaskTitle.trim(),
                    category: editingTaskCategory as any,
                });
                setCurrentOffboarding({
                    ...currentOffboarding,
                    tasks: currentOffboarding.tasks.map((t) => (t.id === taskId ? { ...t, ...updated } : t)),
                });
                setEditingTaskId(null);
                showToast("Vazifa muvaffaqiyatli yangilandi", "success");
                if (onSuccess) onSuccess();
            } catch (err: any) {
                showToast(err.message || "Xatolik yuz berdi", "error");
            }
        } else {
            setInitialTasks(
                initialTasks.map((t) =>
                    t.id === taskId
                        ? { ...t, title: editingTaskTitle.trim(), category: editingTaskCategory as any }
                        : t,
                ),
            );
            setEditingTaskId(null);
            showToast("Vazifa o'zgartirildi", "success");
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        if (currentOffboarding) {
            try {
                const newTask = await addOffboardingTask(currentOffboarding.id, {
                    title: newTaskTitle.trim(),
                    category: newTaskCategory,
                });
                setCurrentOffboarding({
                    ...currentOffboarding,
                    tasks: [...currentOffboarding.tasks, newTask],
                });
                setNewTaskTitle("");
                showToast("Yangi vazifa qo'shildi", "success");
                if (onSuccess) onSuccess();
            } catch (err: any) {
                showToast(err.message || "Xatolik yuz berdi", "error");
            }
        } else {
            const newItem: TemplateTaskItem = {
                id: `t_${Date.now()}`,
                title: newTaskTitle.trim(),
                category: newTaskCategory as any,
            };
            setInitialTasks([...initialTasks, newItem]);
            setNewTaskTitle("");
            showToast("Yangi vazifa qo'shildi", "success");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (currentOffboarding) {
            try {
                await deleteOffboardingTask(taskId);
                setCurrentOffboarding({
                    ...currentOffboarding,
                    tasks: currentOffboarding.tasks.filter((t) => t.id !== taskId),
                });
                showToast("Vazifa o'chirildi", "success");
                if (onSuccess) onSuccess();
            } catch (err: any) {
                showToast(err.message || "Xatolik yuz berdi", "error");
            }
        } else {
            setInitialTasks(initialTasks.filter((t) => t.id !== taskId));
            showToast("Vazifa o'chirildi", "success");
        }
    };

    const handleStatusChange = async (newStatus: "IN_PROGRESS" | "COMPLETED" | "CANCELLED") => {
        if (!currentOffboarding) return;
        try {
            const updated = await updateOffboardingStatus(currentOffboarding.id, newStatus);
            setCurrentOffboarding({
                ...currentOffboarding,
                status: updated.status,
                isAssetsReturned: updated.isAssetsReturned,
            });
            showToast("Status muvaffaqiyatli yangilandi", "success");
            if (onSuccess) onSuccess();
        } catch (err: any) {
            showToast(err.message || "Xatolik yuz berdi", "error");
        }
    };

    const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
        IT_ACCESS: { label: t("categories.IT_ACCESS"), icon: "🔒", color: "text-blue-700 bg-blue-50 border-blue-200/80" },
        ASSET_RETURN: { label: t("categories.ASSET_RETURN"), icon: "💻", color: "text-amber-700 bg-amber-50 border-amber-200/80" },
        FINANCE: { label: t("categories.FINANCE"), icon: "💰", color: "text-emerald-700 bg-emerald-50 border-emerald-200/80" },
        HR_DOCUMENTS: { label: t("categories.HR_DOCUMENTS"), icon: "📝", color: "text-purple-700 bg-purple-50 border-purple-200/80" },
    };

    const completedTasksCount = currentOffboarding?.tasks?.filter((t) => t.isCompleted).length || 0;
    const totalTasksCount = currentOffboarding?.tasks?.length || 0;
    const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    return (
        <>
            {toast && (
                <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        toast.type === "error" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                    }`}>
                        {toast.type === "error" ? "✕" : "✓"}
                    </div>
                    <span className="text-xs font-bold text-slate-900 pr-2">
                        {toast.message}
                    </span>
                    <button
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.12)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-[#9327FF] flex items-center justify-center text-lg font-bold shadow-2xs">
                                🏁
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <span>{currentOffboarding ? t("editTitle") : t("createTitle")}</span>
                                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-purple-50 text-[#9327FF] border border-purple-100">
                                        🏢 {companyKey}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    {t("subtitle")}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex flex-col gap-5">
                        {errorMsg && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-semibold flex items-center gap-2">
                                <span className="font-bold">✕</span>
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {!currentOffboarding ? (
                            <form onSubmit={handleStart} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        {t("selectEmployee")}
                                    </label>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        required
                                        disabled={isEmployeesLoading}
                                        className={`w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] focus:bg-white transition-all cursor-pointer ${
                                            isEmployeesLoading ? "opacity-60 cursor-not-allowed" : ""
                                        }`}
                                    >
                                        <option value="">
                                            {isEmployeesLoading ? "Yuklanmoqda..." : t("selectEmployeePlaceholder")}
                                        </option>
                                        {!isEmployeesLoading &&
                                            employees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.firstName} {emp.lastName} ({emp.department?.name || "-"} • {emp.position?.title || "-"})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                            {t("reason")}
                                        </label>
                                        <select
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] focus:bg-white transition-all cursor-pointer"
                                        >
                                            <option value="O'z xohishiga ko'ra">{t("reasons.ownWill")}</option>
                                            <option value="Boshqa kompaniyaga o'tish">{t("reasons.anotherCompany")}</option>
                                            <option value="Shartnoma muddati tugashi">{t("reasons.contractEnd")}</option>
                                            <option value="Karyera o'zgarishi / O'qish">{t("reasons.careerChange")}</option>
                                            <option value="Kompaniya tashabbusi bilan">{t("reasons.companyInitiative")}</option>
                                            <option value="Boshqa sabab">{t("reasons.other")}</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                            {t("lastWorkingDay")}
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={lastWorkingDay}
                                            onChange={(e) => setLastWorkingDay(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                            <span>📋</span> {t("companyChecklist", { count: initialTasks.length })}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleSaveTemplateForCompany}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 text-[#9327FF] border border-purple-200/80 hover:bg-purple-100 transition-all cursor-pointer flex items-center gap-1"
                                        >
                                            <span>💾</span> {t("saveAsTemplate", { company: companyKey })}
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                                        {initialTasks.map((task) => {
                                            const isEditing = editingTaskId === task.id;
                                            const catMeta = categoryLabels[task.category] || categoryLabels.HR_DOCUMENTS;

                                            return (
                                                <div
                                                    key={task.id}
                                                    className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between gap-3 transition-all"
                                                >
                                                    {isEditing ? (
                                                        <div className="flex flex-wrap items-center gap-2 flex-1">
                                                            <input
                                                                type="text"
                                                                value={editingTaskTitle}
                                                                onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                                className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                                                            />
                                                            <select
                                                                value={editingTaskCategory}
                                                                onChange={(e) => setEditingTaskCategory(e.target.value)}
                                                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                                                            >
                                                                <option value="IT_ACCESS">🔒 {t("categories.IT_ACCESS")}</option>
                                                                <option value="ASSET_RETURN">💻 {t("categories.ASSET_RETURN")}</option>
                                                                <option value="FINANCE">💰 {t("categories.FINANCE")}</option>
                                                                <option value="HR_DOCUMENTS">📝 {t("categories.HR_DOCUMENTS")}</option>
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveEditedTask(task.id)}
                                                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingTaskId(null)}
                                                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                                <span className="text-xs font-semibold text-slate-900 truncate">
                                                                    {task.title}
                                                                </span>
                                                                <span className={`text-[10px] font-bold rounded-lg px-2 py-0.5 shrink-0 border ${catMeta.color}`}>
                                                                    {catMeta.icon} {catMeta.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartEditTask(task)}
                                                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors cursor-pointer"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs transition-colors cursor-pointer"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                                        <input
                                            type="text"
                                            placeholder={t("newTaskPlaceholder")}
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            className="w-full flex-1 px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] focus:bg-white transition-all"
                                        />
                                        <select
                                            value={newTaskCategory}
                                            onChange={(e) => setNewTaskCategory(e.target.value)}
                                            className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] focus:bg-white transition-all cursor-pointer"
                                        >
                                            <option value="IT_ACCESS">🔒 {t("categories.IT_ACCESS")}</option>
                                            <option value="ASSET_RETURN">💻 {t("categories.ASSET_RETURN")}</option>
                                            <option value="FINANCE">💰 {t("categories.FINANCE")}</option>
                                            <option value="HR_DOCUMENTS">📝 {t("categories.HR_DOCUMENTS")}</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handleAddTask}
                                            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
                                        >
                                            {t("addBtn")}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        {t("hrNotes")}
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder={t("hrNotesPlaceholder")}
                                        value={exitNotes}
                                        onChange={(e) => setExitNotes(e.target.value)}
                                        className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] focus:bg-white transition-all resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-2xs"
                                    >
                                        {t("cancel")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? t("starting") : t("startBtn")}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex flex-col gap-5">
                                <div className="p-4 bg-gradient-to-br from-slate-50 to-purple-50/40 border border-slate-200/80 rounded-2xl flex flex-col gap-3.5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">
                                                {currentOffboarding.employee?.firstName} {currentOffboarding.employee?.lastName}
                                            </h4>
                                            <p className="text-xs font-medium text-slate-500">
                                                {currentOffboarding.employee?.department?.name || "-"} • {currentOffboarding.employee?.position?.title || "-"}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                                    currentOffboarding.status === "COMPLETED"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : currentOffboarding.status === "CANCELLED"
                                                        ? "bg-slate-100 text-slate-600 border-slate-200"
                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                }`}
                                            >
                                                {currentOffboarding.status === "COMPLETED"
                                                    ? "✓"
                                                    : currentOffboarding.status === "CANCELLED"
                                                    ? "✕"
                                                    : "⚡"} {currentOffboarding.status}
                                            </span>

                                            <select
                                                value={currentOffboarding.status}
                                                onChange={(e) => handleStatusChange(e.target.value as any)}
                                                className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold uppercase text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20"
                                            >
                                                <option value="IN_PROGRESS">{t("selectStatus.inProgress")}</option>
                                                <option value="COMPLETED">{t("selectStatus.completed")}</option>
                                                <option value="CANCELLED">{t("selectStatus.cancelled")}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t border-slate-200/60 pt-3">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("reasonHeader")}</span>
                                            <span className="font-semibold text-slate-800">{currentOffboarding.reason}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("lastWorkingDayHeader")}</span>
                                            <span className="font-semibold text-slate-800">
                                                {currentOffboarding.lastWorkingDay
                                                    ? new Date(currentOffboarding.lastWorkingDay).toISOString().split("T")[0]
                                                    : "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("assetsReturnedHeader")}</span>
                                            <span className={`font-semibold ${currentOffboarding.status === "CANCELLED" ? "text-slate-500" : currentOffboarding.isAssetsReturned ? "text-emerald-600" : "text-amber-600"}`}>
                                                {currentOffboarding.status === "CANCELLED" ? (t("selectStatus.cancelled") || "Bekor qilingan") : currentOffboarding.isAssetsReturned ? t("yes") : t("pending")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 pt-1">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                            <span>{t("checklistCompletion", { completed: completedTasksCount, total: totalTasksCount })}</span>
                                            <span className="font-mono text-[#9327FF]">{progressPercent}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#9327FF] transition-all duration-300 rounded-full"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                            {t("checklistTitle")}
                                        </h4>
                                        <span className="text-xs font-semibold text-slate-400">{t("tasksCount", { count: totalTasksCount })}</span>
                                    </div>

                                    <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                                        {currentOffboarding.tasks?.map((task) => {
                                            const isEditing = editingTaskId === task.id;
                                            const catMeta = categoryLabels[task.category] || categoryLabels.HR_DOCUMENTS;

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`p-3.5 border rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                                                        task.isCompleted ? "bg-emerald-50/30 border-emerald-200/80" : "bg-slate-50/60 border-slate-200/70"
                                                    }`}
                                                >
                                                    {isEditing ? (
                                                        <div className="flex flex-wrap items-center gap-2 flex-1">
                                                            <input
                                                                type="text"
                                                                value={editingTaskTitle}
                                                                onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                                className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                                                            />
                                                            <select
                                                                value={editingTaskCategory}
                                                                onChange={(e) => setEditingTaskCategory(e.target.value)}
                                                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF]"
                                                            >
                                                                <option value="IT_ACCESS">🔒 {t("categories.IT_ACCESS")}</option>
                                                                <option value="ASSET_RETURN">💻 {t("categories.ASSET_RETURN")}</option>
                                                                <option value="FINANCE">💰 {t("categories.FINANCE")}</option>
                                                                <option value="HR_DOCUMENTS">📝 {t("categories.HR_DOCUMENTS")}</option>
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveEditedTask(task.id)}
                                                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingTaskId(null)}
                                                                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={task.isCompleted}
                                                                    onChange={() => handleToggleTask(task.id, task.isCompleted)}
                                                                    className="w-4 h-4 accent-[#9327FF] rounded-md cursor-pointer shrink-0"
                                                                />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className={`text-xs font-semibold truncate ${task.isCompleted ? "line-through text-slate-400" : "text-slate-900"}`}>
                                                                        {task.title}
                                                                    </span>
                                                                    <span className={`text-[10px] font-bold rounded-lg px-2 py-0.5 border w-fit mt-0.5 ${catMeta.color}`}>
                                                                        {catMeta.icon} {catMeta.label}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartEditTask(task)}
                                                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors cursor-pointer"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs transition-colors cursor-pointer"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                                        <input
                                            type="text"
                                            required
                                            placeholder={t("newTaskPlaceholder")}
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            className="w-full flex-1 px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] focus:bg-white transition-all"
                                        />
                                        <select
                                            value={newTaskCategory}
                                            onChange={(e) => setNewTaskCategory(e.target.value)}
                                            className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9327FF]/20 focus:border-[#9327FF] focus:bg-white transition-all cursor-pointer"
                                        >
                                            <option value="IT_ACCESS">🔒 {t("categories.IT_ACCESS")}</option>
                                            <option value="ASSET_RETURN">💻 {t("categories.ASSET_RETURN")}</option>
                                            <option value="FINANCE">💰 {t("categories.FINANCE")}</option>
                                            <option value="HR_DOCUMENTS">📝 {t("categories.HR_DOCUMENTS")}</option>
                                        </select>
                                        <button
                                            type="submit"
                                            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
                                        >
                                            {t("addBtn")}
                                        </button>
                                    </form>
                                </div>

                                {currentOffboarding.exitInterviewNotes && (
                                    <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl flex flex-col gap-1.5">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                                            <span>📝</span> {t("exitInterviewResultTitle")}
                                        </span>
                                        <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap">
                                            {currentOffboarding.exitInterviewNotes}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
                                    >
                                        {t("close")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
