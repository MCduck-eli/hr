"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    WorkScheduleInfo,
    fetchAllWorkSchedules,
    createWorkSchedule,
    updateWorkSchedule,
    deleteWorkSchedule,
} from "@/src/services/attendance-service";
import { fetchDepartments } from "@/src/services/department-service";
import { fetchAllUsers } from "@/src/services/user-service";

interface WorkScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

export default function WorkScheduleModal({
    isOpen,
    onClose,
    onSaved,
}: WorkScheduleModalProps) {
    const t = useTranslations("HRAttendance");

    const DAYS = [
        { id: 1, name: t("monday"), short: t("monShort") },
        { id: 2, name: t("tuesday"), short: t("tueShort") },
        { id: 3, name: t("wednesday"), short: t("wedShort") },
        { id: 4, name: t("thursday"), short: t("thuShort") },
        { id: 5, name: t("friday"), short: t("friShort") },
        { id: 6, name: t("saturday"), short: t("satShort") },
        { id: 7, name: t("sunday"), short: t("sunShort") },
    ];

    const [schedules, setSchedules] = useState<WorkScheduleInfo[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [name, setName] = useState("");
    const [targetType, setTargetType] = useState<"GLOBAL" | "DEPARTMENT" | "EMPLOYEE">("GLOBAL");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("18:00");
    const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [graceMinutes, setGraceMinutes] = useState(15);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSchedulesAndOptions = async () => {
        try {
            const [scheds, depts, users] = await Promise.all([
                fetchAllWorkSchedules(),
                fetchDepartments().catch(() => []),
                fetchAllUsers().catch(() => []),
            ]);
            setSchedules(scheds || []);
            setDepartments(depts || []);
            const storedUser = localStorage.getItem("user");
            let currentUserId = "";
            let currentUserEmpId = "";
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    currentUserId = parsed.id;
                    currentUserEmpId = parsed.employee?.id;
                } catch (err) {}
            }

            const emps = (users || [])
                .filter(
                    (u: any) =>
                        u.employee?.id &&
                        u.role !== "SUPER_ADMIN" &&
                        u.role !== "DIRECTOR" &&
                        u.role !== "HR_ADMIN" &&
                        u.id !== currentUserId &&
                        u.employee?.id !== currentUserEmpId &&
                        u.email !== "admin@hrplatform.com",
                )
                .map((u: any) => {
                    const firstName = u.employee?.firstName || u.firstName || "";
                    const lastName = u.employee?.lastName || u.lastName || "";
                    const fullName = `${firstName} ${lastName}`.trim();
                    return {
                        id: u.employee?.id || u.id,
                        name: fullName || u.email,
                    };
                })
                .filter((e: any) => e.name.toLowerCase() !== "super admin");
            setEmployees(emps);
        } catch (e) {}
    };

    useEffect(() => {
        if (isOpen) {
            loadSchedulesAndOptions();
            setIsCreating(false);
            setEditingScheduleId(null);
            setError(null);
        }
    }, [isOpen]);

    const resetForm = () => {
        setName("");
        setTargetType("GLOBAL");
        setSelectedDepartmentId("");
        setSelectedEmployeeId("");
        setStartTime("09:00");
        setEndTime("18:00");
        setWorkingDays([1, 2, 3, 4, 5]);
        setGraceMinutes(15);
        setEditingScheduleId(null);
        setIsCreating(false);
        setError(null);
    };

    const handleStartCreate = () => {
        resetForm();
        setName(t("addNewSchedule"));
        setIsCreating(true);
    };

    const handleStartEdit = (s: WorkScheduleInfo) => {
        setEditingScheduleId(s.id);
        setIsCreating(true);
        setName(s.name);
        setStartTime(s.startTime);
        setEndTime(s.endTime);
        setWorkingDays(s.workingDays || [1, 2, 3, 4, 5]);
        setGraceMinutes(s.gracePeriodMinutes ?? 15);

        if (s.employeeId) {
            setTargetType("EMPLOYEE");
            setSelectedEmployeeId(s.employeeId);
            setSelectedDepartmentId("");
        } else if (s.departmentId) {
            setTargetType("DEPARTMENT");
            setSelectedDepartmentId(s.departmentId);
            setSelectedEmployeeId("");
        } else {
            setTargetType("GLOBAL");
            setSelectedDepartmentId("");
            setSelectedEmployeeId("");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        setLoading(true);
        try {
            await deleteWorkSchedule(id);
            await loadSchedulesAndOptions();
            onSaved();
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dayId: number) => {
        if (workingDays.includes(dayId)) {
            setWorkingDays(workingDays.filter((d) => d !== dayId));
        } else {
            setWorkingDays([...workingDays, dayId].sort());
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const departmentId = targetType === "DEPARTMENT" ? selectedDepartmentId : null;
            const employeeId = targetType === "EMPLOYEE" ? selectedEmployeeId : null;
            const isDefault = targetType === "GLOBAL";

            if (targetType === "DEPARTMENT" && !departmentId) {
                throw new Error(t("selectDeptPlaceholder"));
            }
            if (targetType === "EMPLOYEE" && !employeeId) {
                throw new Error(t("selectEmpPlaceholder"));
            }

            if (editingScheduleId) {
                await updateWorkSchedule(editingScheduleId, {
                    name,
                    startTime,
                    endTime,
                    workingDays,
                    gracePeriodMinutes: graceMinutes,
                    departmentId,
                    employeeId,
                    isDefault,
                });
            } else {
                await createWorkSchedule({
                    name,
                    startTime,
                    endTime,
                    workingDays,
                    gracePeriodMinutes: graceMinutes,
                    departmentId,
                    employeeId,
                    isDefault,
                });
            }

            await loadSchedulesAndOptions();
            resetForm();
            onSaved();
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl bg-white border border-gray-200 shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-base">⚙️</span>
                        <h2 className="text-sm font-black uppercase tracking-wider text-black">
                            {t("scheduleModalTitle")}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black p-1 text-sm font-bold"
                    >
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex flex-col gap-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-sm">
                            {error}
                        </div>
                    )}

                    {!isCreating ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                                    {t("existingSchedules")} ({schedules.length})
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleStartCreate}
                                    className="px-3.5 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                                >
                                    <span>+</span>
                                    <span>{t("addNewSchedule")}</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {schedules.map((s) => (
                                    <div
                                        key={s.id}
                                        className="p-4 border border-gray-200 bg-gray-50/50 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-sm transition-colors"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-black text-sm">
                                                    {s.name}
                                                </span>
                                                {s.isDefault ? (
                                                    <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 rounded-full">
                                                        {t("globalDefault")}
                                                    </span>
                                                ) : s.departmentName ? (
                                                    <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-blue-100 text-blue-800 rounded-full">
                                                        {t("deptPrefix")}: {s.departmentName}
                                                    </span>
                                                ) : s.employeeName ? (
                                                    <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-purple-100 text-purple-800 rounded-full">
                                                        {t("empPrefix")}: {s.employeeName}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 font-medium">
                                                <span className="font-mono font-bold text-black">
                                                    ⏰ {s.startTime} - {s.endTime}
                                                </span>
                                                <span>•</span>
                                                <span>{t("gracePeriod")}: {s.gracePeriodMinutes} {t("minutes")}</span>
                                                <span>•</span>
                                                <span>
                                                    {t("workingDaysLabel")}:{" "}
                                                    {s.workingDays
                                                        ?.map((d) => DAYS.find((day) => day.id === d)?.short)
                                                        .join(", ")}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(s)}
                                                className="px-3 py-1.5 bg-white border border-gray-300 hover:border-black text-black text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                                            >
                                                {t("edit")}
                                            </button>
                                            {!s.isDefault && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(s.id)}
                                                    className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                                                >
                                                    {t("delete")}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="flex flex-col gap-5">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                                    {editingScheduleId ? t("edit") : t("addNewSchedule")}
                                </h3>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-xs text-gray-500 hover:text-black font-bold uppercase tracking-wider"
                                >
                                    &larr; {t("backToList")}
                                </button>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                    {t("scheduleName")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("scheduleNamePlaceholder")}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="p-3 border border-gray-300 bg-white font-bold text-sm text-black rounded-sm focus:border-black outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                    {t("targetAudience")}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTargetType("GLOBAL")}
                                        className={`py-2.5 px-3 text-xs font-bold uppercase tracking-wider border rounded-sm transition-colors text-center ${
                                            targetType === "GLOBAL"
                                                ? "bg-black border-black text-white"
                                                : "bg-gray-50 border-gray-200 text-gray-600 hover:text-black"
                                        }`}
                                    >
                                        🌐 {t("targetGlobal")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTargetType("DEPARTMENT")}
                                        className={`py-2.5 px-3 text-xs font-bold uppercase tracking-wider border rounded-sm transition-colors text-center ${
                                            targetType === "DEPARTMENT"
                                                ? "bg-black border-black text-white"
                                                : "bg-gray-50 border-gray-200 text-gray-600 hover:text-black"
                                        }`}
                                    >
                                        🏢 {t("targetDept")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTargetType("EMPLOYEE")}
                                        className={`py-2.5 px-3 text-xs font-bold uppercase tracking-wider border rounded-sm transition-colors text-center ${
                                            targetType === "EMPLOYEE"
                                                ? "bg-black border-black text-white"
                                                : "bg-gray-50 border-gray-200 text-gray-600 hover:text-black"
                                        }`}
                                    >
                                        👤 {t("targetEmp")}
                                    </button>
                                </div>
                            </div>

                            {targetType === "DEPARTMENT" && (
                                <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                        {t("selectDept")}
                                    </label>
                                    <select
                                        required
                                        value={selectedDepartmentId}
                                        onChange={(e) => setSelectedDepartmentId(e.target.value)}
                                        className="p-3 border border-gray-300 bg-white font-bold text-sm text-black rounded-sm focus:border-black outline-none"
                                    >
                                        <option value="">{t("selectDeptPlaceholder")}</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {targetType === "EMPLOYEE" && (
                                <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                        {t("selectEmp")}
                                    </label>
                                    <select
                                        required
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        className="p-3 border border-gray-300 bg-white font-bold text-sm text-black rounded-sm focus:border-black outline-none"
                                    >
                                        <option value="">{t("selectEmpPlaceholder")}</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                        {t("checkInTimeLabel")}
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="p-3 border border-gray-300 bg-white font-mono font-bold text-sm text-black rounded-sm focus:border-black outline-none"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                        {t("checkOutTimeLabel")}
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="p-3 border border-gray-300 bg-white font-mono font-bold text-sm text-black rounded-sm focus:border-black outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                    {t("graceMinutesLabel")}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={120}
                                    required
                                    value={graceMinutes}
                                    onChange={(e) => setGraceMinutes(Number(e.target.value))}
                                    className="p-3 border border-gray-300 bg-white font-mono font-bold text-sm text-black rounded-sm focus:border-black outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                                    {t("weeklyWorkDays")}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {DAYS.map((day) => {
                                        const isSelected = workingDays.includes(day.id);
                                        return (
                                            <button
                                                type="button"
                                                key={day.id}
                                                onClick={() => toggleDay(day.id)}
                                                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border rounded-sm transition-colors text-center ${
                                                    isSelected
                                                        ? "bg-black border-black text-white"
                                                        : "bg-gray-50 border-gray-200 text-gray-400 hover:text-black hover:border-gray-300"
                                                }`}
                                            >
                                                {day.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 hover:text-black text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-[#1a1a1a] text-white hover:bg-black text-xs font-black uppercase tracking-wider rounded-sm transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {loading ? t("saving") : t("save")}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
