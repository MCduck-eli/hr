"use client";

import { useState, useEffect } from "react";
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

const DEFAULT_COMPANY_TASKS: TemplateTaskItem[] = [
    {
        id: "t_1",
        title: "IT tizimlaridan va korporativ pochtadan ruxsatni bekor qilish",
        category: "IT_ACCESS",
    },
    {
        id: "t_2",
        title: "Korporativ noutbuk, telefon va aksessuarlarni qaytarib olish",
        category: "ASSET_RETURN",
    },
    {
        id: "t_3",
        title: "ID karta, kalit va bino ruxsatnomalarini topshirish",
        category: "ASSET_RETURN",
    },
    {
        id: "t_4",
        title: "Yakuniy moliyaviy hisob-kitob va oylik maoshni to'lash",
        category: "FINANCE",
    },
    {
        id: "t_5",
        title: "Exit interview so'rovnomasini to'ldirish va hujjatlarni imzolash",
        category: "HR_DOCUMENTS",
    },
];

export default function OffboardingManagerModal({
    isOpen,
    onClose,
    onSuccess,
    initialOffboarding,
    initialEmployeeId,
}: OffboardingManagerModalProps) {
    const [companyKey, setCompanyKey] = useState<string>("default");
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
        initialEmployeeId || initialOffboarding?.employeeId || "",
    );
    const [reason, setReason] = useState<string>(
        initialOffboarding?.reason || "O'z xohishiga ko'ra",
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

    const [initialTasks, setInitialTasks] = useState<TemplateTaskItem[]>(DEFAULT_COMPANY_TASKS);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTaskTitle, setEditingTaskTitle] = useState("");
    const [editingTaskCategory, setEditingTaskCategory] = useState<string>("IT_ACCESS");

    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskCategory, setNewTaskCategory] = useState<string>("IT_ACCESS");

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
                        setInitialTasks(DEFAULT_COMPANY_TASKS);
                    }
                } else {
                    setInitialTasks(DEFAULT_COMPANY_TASKS);
                }
            } catch (e) {
                setInitialTasks(DEFAULT_COMPANY_TASKS);
            }

            if (!initialOffboarding) {
                fetchAllUsers()
                    .then((usersList: any[]) => {
                        const empList = (usersList || [])
                            .filter((u: any) => u.employee || u.role !== "SUPER_ADMIN")
                            .map((u: any) => ({
                                id: u.employee?.id || u.id,
                                firstName: u.firstName || u.employee?.firstName || "Xodim",
                                lastName: u.lastName || u.employee?.lastName || "",
                                department: u.employee?.department || null,
                                position: u.employee?.position || null,
                            }));
                        setEmployees(empList);
                        if (!selectedEmployeeId && empList.length > 0) {
                            setSelectedEmployeeId(empList[0].id);
                        }
                    })
                    .catch(() => {});
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
        alert(`Kompaniya (${companyKey}) uchun aylanma varaqasi shabloni muvaffaqiyatli saqlandi!`);
    };

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeId) {
            setErrorMsg("Iltimos, xodimni tanlang.");
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
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setErrorMsg(err.message || "Offboarding jarayonini boshlashda xatolik");
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
            if (onSuccess) onSuccess();
        } catch (err: any) {
            alert(err.message || "Topshiriq holatini o'zgartirishda xatolik");
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
                if (onSuccess) onSuccess();
            } catch (err: any) {
                alert(err.message || "Topshiriqni tahrirlashda xatolik");
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
                if (onSuccess) onSuccess();
            } catch (err: any) {
                alert(err.message || "Topshiriq qo'shishda xatolik");
            }
        } else {
            const newItem: TemplateTaskItem = {
                id: `t_${Date.now()}`,
                title: newTaskTitle.trim(),
                category: newTaskCategory as any,
            };
            setInitialTasks([...initialTasks, newItem]);
            setNewTaskTitle("");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Ushbu topshiriqni aylanma varaqasidan o'chirmoqchimisiz?")) return;

        if (currentOffboarding) {
            try {
                await deleteOffboardingTask(taskId);
                setCurrentOffboarding({
                    ...currentOffboarding,
                    tasks: currentOffboarding.tasks.filter((t) => t.id !== taskId),
                });
                if (onSuccess) onSuccess();
            } catch (err: any) {
                alert(err.message || "Topshiriqni o'chirishda xatolik");
            }
        } else {
            setInitialTasks(initialTasks.filter((t) => t.id !== taskId));
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
            if (onSuccess) onSuccess();
        } catch (err: any) {
            alert(err.message || "Statusni o'zgartirishda xatolik");
        }
    };

    const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
        IT_ACCESS: { label: "IT Ruxsatnomalar & Hisoblar", icon: "🔒", color: "text-blue-700 bg-blue-50 border-blue-200" },
        ASSET_RETURN: { label: "Uskunalar & Moddiy Aktivlar", icon: "💻", color: "text-amber-700 bg-amber-50 border-amber-200" },
        FINANCE: { label: "Buxgalteriya & Hisob-kitob", icon: "💰", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
        HR_DOCUMENTS: { label: "HR Hujjatlar & Exit Interview", icon: "📝", color: "text-purple-700 bg-purple-50 border-purple-200" },
    };

    const completedTasksCount = currentOffboarding?.tasks?.filter((t) => t.isCompleted).length || 0;
    const totalTasksCount = currentOffboarding?.tasks?.length || 0;
    const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-black pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🏁</span>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
                                <span>{currentOffboarding ? "Offboarding & Aylanma Varaqasi" : "Yangi Offboarding Boshlash"}</span>
                                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-gray-100 border border-gray-300 text-gray-700">
                                    🏢 {companyKey}
                                </span>
                            </h3>
                            <p className="text-[11px] font-medium text-gray-500">
                                Ishdan bo'shatish aylanma varaqasi, topshiriqlar qo'shish/tahrirlash va izolyatsiya
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-sm font-bold text-gray-500 hover:text-black transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold">
                        {errorMsg}
                    </div>
                )}

                {!currentOffboarding ? (
                    <form onSubmit={handleStart} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-black">
                                Xodimni Tanlang *
                            </label>
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                required
                                className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                            >
                                <option value="">Xodimni tanlang...</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName} ({emp.department?.name || "Bo'limsiz"} - {emp.position?.title || "Lavozimsiz"})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black">
                                    Ishdan Ketish Sababi *
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="p-2.5 bg-gray-50 border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                                >
                                    <option value="O'z xohishiga ko'ra">O'z xohishiga ko'ra</option>
                                    <option value="Boshqa kompaniyaga o'tish">Boshqa kompaniyaga o'tish</option>
                                    <option value="Shartnoma muddati tugashi">Shartnoma muddati tugashi</option>
                                    <option value="Karyera o'zgarishi / O'qish">Karyera o'zgarishi / O'qish</option>
                                    <option value="Kompaniya tashabbusi bilan">Kompaniya tashabbusi bilan</option>
                                    <option value="Boshqa sabab">Boshqa sabab</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-black">
                                    Oxirgi Ish Kuni *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={lastWorkingDay}
                                    onChange={(e) => setLastWorkingDay(e.target.value)}
                                    className="p-2 bg-white border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                                    <span>📋</span> Kompaniya Aylanma Varaqasi ({initialTasks.length} ta topshiriq)
                                </label>
                                <button
                                    type="button"
                                    onClick={handleSaveTemplateForCompany}
                                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                                >
                                    💾 Shablon sifatida saqlash ({companyKey})
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                                {initialTasks.map((task) => {
                                    const isEditing = editingTaskId === task.id;
                                    const catMeta = categoryLabels[task.category] || categoryLabels.HR_DOCUMENTS;

                                    return (
                                        <div
                                            key={task.id}
                                            className="p-2.5 bg-gray-50 border border-gray-200 flex items-center justify-between gap-2"
                                        >
                                            {isEditing ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="text"
                                                        value={editingTaskTitle}
                                                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                        className="flex-1 p-1 bg-white border border-black text-xs font-bold"
                                                    />
                                                    <select
                                                        value={editingTaskCategory}
                                                        onChange={(e) => setEditingTaskCategory(e.target.value)}
                                                        className="p-1 bg-white border border-gray-300 text-xs font-bold"
                                                    >
                                                        <option value="IT_ACCESS">🔒 IT Ruxsatlar</option>
                                                        <option value="ASSET_RETURN">💻 Aktivlar</option>
                                                        <option value="FINANCE">💰 Buxgalteriya</option>
                                                        <option value="HR_DOCUMENTS">📝 HR Hujjatlar</option>
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEditedTask(task.id)}
                                                        className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingTaskId(null)}
                                                        className="px-2 py-1 bg-gray-300 text-black text-xs font-bold"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className="text-xs font-bold text-black">{task.title}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-xs ${catMeta.color}`}>
                                                            {catMeta.icon} {catMeta.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartEditTask(task)}
                                                            className="p-1 text-gray-500 hover:text-black text-xs font-bold"
                                                            title="Tahrirlash"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 text-xs font-bold"
                                                            title="O'chirish"
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

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                <input
                                    type="text"
                                    placeholder="+ Yangi topshiriq kiritish..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="flex-1 p-2 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black"
                                />
                                <select
                                    value={newTaskCategory}
                                    onChange={(e) => setNewTaskCategory(e.target.value)}
                                    className="p-2 bg-white border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                                >
                                    <option value="IT_ACCESS">🔒 IT Ruxsatlar</option>
                                    <option value="ASSET_RETURN">💻 Aktivlar</option>
                                    <option value="FINANCE">💰 Buxgalteriya</option>
                                    <option value="HR_DOCUMENTS">📝 HR Hujjatlar</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAddTask}
                                    className="px-3 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shrink-0"
                                >
                                    + Qo'shish
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-black">
                                Dastlabki Izohlar / HR Eslatmasi
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Ishdan bo'shatish jarayoni bo'yicha maxsus eslatmalar..."
                                value={exitNotes}
                                onChange={(e) => setExitNotes(e.target.value)}
                                className="p-2.5 bg-white border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100 transition-colors"
                            >
                                Bekor Qilish
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Boshlanmoqda..." : "Offboardingni Boshlash"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-5">
                        <div className="p-4 bg-gray-50 border border-gray-200 flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h4 className="text-sm font-black text-black">
                                        {currentOffboarding.employee?.firstName} {currentOffboarding.employee?.lastName}
                                    </h4>
                                    <p className="text-[11px] font-medium text-gray-600">
                                        {currentOffboarding.employee?.department?.name || "Bo'lim"} • {currentOffboarding.employee?.position?.title || "Lavozim"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-xs border ${
                                            currentOffboarding.status === "COMPLETED"
                                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                : currentOffboarding.status === "CANCELLED"
                                                ? "bg-gray-100 text-gray-600 border-gray-300"
                                                : "bg-amber-50 text-amber-800 border-amber-200"
                                        }`}
                                    >
                                        {currentOffboarding.status === "COMPLETED"
                                            ? "✓ Yakunlangan"
                                            : currentOffboarding.status === "CANCELLED"
                                            ? "Bekor qilingan"
                                            : "⚡ Jarayonda"}
                                    </span>

                                    <select
                                        value={currentOffboarding.status}
                                        onChange={(e) => handleStatusChange(e.target.value as any)}
                                        className="p-1 bg-white border border-gray-300 text-[10px] font-bold uppercase"
                                    >
                                        <option value="IN_PROGRESS">Jarayonda</option>
                                        <option value="COMPLETED">Yakunlash</option>
                                        <option value="CANCELLED">Bekor qilish</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border-t border-gray-200 pt-2">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Sabab</span>
                                    <span className="font-bold text-gray-800">{currentOffboarding.reason}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Oxirgi Ish Kuni</span>
                                    <span className="font-bold text-gray-800">
                                        {currentOffboarding.lastWorkingDay
                                            ? new Date(currentOffboarding.lastWorkingDay).toISOString().split("T")[0]
                                            : "-"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Aktivlar Topshirildi</span>
                                    <span className={`font-bold ${currentOffboarding.isAssetsReturned ? "text-emerald-700" : "text-amber-700"}`}>
                                        {currentOffboarding.isAssetsReturned ? "✓ Ha" : "Kutilmoqda"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 pt-1">
                                <div className="flex items-center justify-between text-[10px] font-bold text-gray-600">
                                    <span>Aylanma Varaqasi Bajarilishi ({completedTasksCount}/{totalTasksCount})</span>
                                    <span>{progressPercent}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-black transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center justify-between">
                                <span>📋 Aylanma Varaqasi (Checklist)</span>
                                <span className="text-[10px] font-bold text-gray-500">{totalTasksCount} ta topshiriq</span>
                            </h4>

                            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                                {currentOffboarding.tasks?.map((task) => {
                                    const isEditing = editingTaskId === task.id;
                                    const catMeta = categoryLabels[task.category] || categoryLabels.HR_DOCUMENTS;

                                    return (
                                        <div
                                            key={task.id}
                                            className={`p-2.5 border flex items-center justify-between gap-2 transition-colors ${
                                                task.isCompleted ? "bg-emerald-50/40 border-emerald-200" : "bg-white border-gray-200"
                                            }`}
                                        >
                                            {isEditing ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="text"
                                                        value={editingTaskTitle}
                                                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                        className="flex-1 p-1 bg-white border border-black text-xs font-bold"
                                                    />
                                                    <select
                                                        value={editingTaskCategory}
                                                        onChange={(e) => setEditingTaskCategory(e.target.value)}
                                                        className="p-1 bg-white border border-gray-300 text-xs font-bold"
                                                    >
                                                        <option value="IT_ACCESS">🔒 IT Ruxsatlar</option>
                                                        <option value="ASSET_RETURN">💻 Aktivlar</option>
                                                        <option value="FINANCE">💰 Buxgalteriya</option>
                                                        <option value="HR_DOCUMENTS">📝 HR Hujjatlar</option>
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEditedTask(task.id)}
                                                        className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingTaskId(null)}
                                                        className="px-2 py-1 bg-gray-300 text-black text-xs font-bold"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2.5 flex-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={task.isCompleted}
                                                            onChange={() => handleToggleTask(task.id, task.isCompleted)}
                                                            className="w-4 h-4 accent-black cursor-pointer"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className={`text-xs font-bold ${task.isCompleted ? "line-through text-gray-500" : "text-black"}`}>
                                                                {task.title}
                                                            </span>
                                                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-xs w-fit ${catMeta.color}`}>
                                                                {catMeta.icon} {catMeta.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartEditTask(task)}
                                                            className="p-1 text-gray-500 hover:text-black transition-colors font-bold text-xs"
                                                            title="Tahrirlash"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors font-bold text-xs"
                                                            title="O'chirish"
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

                            <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                <input
                                    type="text"
                                    required
                                    placeholder="+ Yangi topshiriq qo'shish..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="flex-1 p-2 bg-gray-50 border border-gray-300 text-xs font-medium text-black focus:outline-none focus:border-black"
                                />
                                <select
                                    value={newTaskCategory}
                                    onChange={(e) => setNewTaskCategory(e.target.value)}
                                    className="p-2 bg-gray-50 border border-gray-300 text-xs font-bold text-black focus:outline-none focus:border-black"
                                >
                                    <option value="IT_ACCESS">🔒 IT Ruxsatlar</option>
                                    <option value="ASSET_RETURN">💻 Aktivlar</option>
                                    <option value="FINANCE">💰 Buxgalteriya</option>
                                    <option value="HR_DOCUMENTS">📝 HR Hujjatlar</option>
                                </select>
                                <button
                                    type="submit"
                                    className="px-3 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shrink-0"
                                >
                                    + Qo'shish
                                </button>
                            </form>
                        </div>

                        {currentOffboarding.exitInterviewNotes && (
                            <div className="p-3.5 bg-purple-50/70 border border-purple-200 flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                                    <span>📝</span> Exit Interview So'rovnomasi Natijasi
                                </span>
                                <p className="text-xs font-medium text-gray-800 whitespace-pre-wrap">
                                    {currentOffboarding.exitInterviewNotes}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
