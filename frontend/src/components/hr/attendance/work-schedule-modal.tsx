"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import GirihPattern from "@/src/components/ui/GirihPattern";
import Skeleton from "@/src/components/ui/Skeleton";
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

const inputClass =
    "w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#9327FF] focus:ring-2 focus:ring-[#9327FF]/10 transition-all";

const labelClass =
    "text-[11px] font-black uppercase tracking-wider text-slate-500";

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
    const [listLoading, setListLoading] = useState(true);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const optionsLoadedRef = useRef(false);
    const [error, setError] = useState<string | null>(null);

    const loadSchedules = async () => {
        try {
            const scheds = await fetchAllWorkSchedules();
            setSchedules(scheds || []);
        } catch (e) {
        } finally {
            setListLoading(false);
        }
    };

    const loadOptions = async () => {
        if (optionsLoadedRef.current) return;
        setOptionsLoading(true);
        try {
            const [depts, users] = await Promise.all([
                fetchDepartments().catch(() => []),
                fetchAllUsers().catch(() => []),
            ]);
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
            optionsLoadedRef.current = true;
        } catch (e) {
        } finally {
            setOptionsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setListLoading(true);
            loadSchedules();
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
        loadOptions();
    };

    const handleStartEdit = (s: WorkScheduleInfo) => {
        setEditingScheduleId(s.id);
        setIsCreating(true);
        setName(s.name);
        setStartTime(s.startTime);
        setEndTime(s.endTime);
        setWorkingDays(s.workingDays || [1, 2, 3, 4, 5]);
        setGraceMinutes(s.gracePeriodMinutes ?? 15);
        loadOptions();

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
            await loadSchedules();
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

            await loadSchedules();
            resetForm();
            onSaved();
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const showListSkeleton = listLoading && schedules.length === 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <GirihPattern className="opacity-[0.10] rounded-3xl overflow-hidden" />

                <div className="relative z-10 flex flex-col flex-1 min-h-0">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#9327FF] flex items-center justify-center text-base shrink-0">
                                ⚙️
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-base font-bold text-slate-900">
                                    {t("scheduleModalTitle")}
                                </h2>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                            Yopish ✕
                        </button>
                    </div>

                    <div className="overflow-y-auto p-6 flex flex-col gap-6 flex-1 min-h-0">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                                {error}
                            </div>
                        )}

                        {!isCreating ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                        {t("existingSchedules")}{" "}
                                        {showListSkeleton ? (
                                            <Skeleton className="inline-block w-8 h-4 rounded-md align-middle" />
                                        ) : (
                                            <span className="text-[#9327FF]">({schedules.length})</span>
                                        )}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={handleStartCreate}
                                        className="px-4 py-2 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>+</span>
                                        <span>{t("addNewSchedule")}</span>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {showListSkeleton ? (
                                        Array.from({ length: 3 }).map((_, idx) => (
                                            <div
                                                key={`sched-skel-${idx}`}
                                                className="p-4 border border-slate-100 bg-white rounded-2xl flex items-center justify-between gap-3 animate-pulse"
                                            >
                                                <div className="flex flex-col gap-2">
                                                    <Skeleton className="w-40 h-4 rounded-md" />
                                                    <Skeleton className="w-64 h-3 rounded-md" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="w-20 h-8 rounded-xl" />
                                                    <Skeleton className="w-20 h-8 rounded-xl" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        schedules.map((s) => (
                                            <div
                                                key={s.id}
                                                className="p-4 border border-slate-100 bg-white hover:border-[#9327FF]/30 hover:bg-purple-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            {s.name}
                                                        </span>
                                                        {s.isDefault ? (
                                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                                                {t("globalDefault")}
                                                            </span>
                                                        ) : s.departmentName ? (
                                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                                                                {t("deptPrefix")}: {s.departmentName}
                                                            </span>
                                                        ) : s.employeeName ? (
                                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-purple-50 text-[#9327FF] border border-purple-200 rounded-full">
                                                                {t("empPrefix")}: {s.employeeName}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                                                        <span className="font-mono font-bold text-slate-900">
                                                            ⏰ {s.startTime} - {s.endTime}
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {t("gracePeriod")}: {s.gracePeriodMinutes} {t("minutes")}
                                                        </span>
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
                                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
                                                    >
                                                        {t("edit")}
                                                    </button>
                                                    {!s.isDefault && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(s.id)}
                                                            disabled={loading}
                                                            className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                                                        >
                                                            {t("delete")}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="flex flex-col gap-5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <h3 className="text-base font-bold text-slate-900">
                                        {editingScheduleId ? t("edit") : t("addNewSchedule")}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                                    >
                                        &larr; {t("backToList")}
                                    </button>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className={labelClass}>{t("scheduleName")}</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={t("scheduleNamePlaceholder")}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>{t("targetAudience")}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(
                                            [
                                                { key: "GLOBAL", icon: "🌐", label: t("targetGlobal") },
                                                { key: "DEPARTMENT", icon: "🏢", label: t("targetDept") },
                                                { key: "EMPLOYEE", icon: "👤", label: t("targetEmp") },
                                            ] as const
                                        ).map((opt) => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() =>
                                                    setTargetType(
                                                        opt.key as "GLOBAL" | "DEPARTMENT" | "EMPLOYEE",
                                                    )
                                                }
                                                className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                                                    targetType === opt.key
                                                        ? "bg-[#9327FF] border-[#9327FF] text-white shadow-xs"
                                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#9327FF]/40 hover:text-[#9327FF]"
                                                }`}
                                            >
                                                {opt.icon} {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {targetType === "DEPARTMENT" && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className={labelClass}>{t("selectDept")}</label>
                                        <select
                                            required
                                            disabled={optionsLoading}
                                            value={selectedDepartmentId}
                                            onChange={(e) => setSelectedDepartmentId(e.target.value)}
                                            className={`${inputClass} cursor-pointer ${
                                                optionsLoading ? "opacity-60" : ""
                                            }`}
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
                                    <div className="flex flex-col gap-1.5">
                                        <label className={labelClass}>{t("selectEmp")}</label>
                                        <select
                                            required
                                            disabled={optionsLoading}
                                            value={selectedEmployeeId}
                                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                            className={`${inputClass} cursor-pointer ${
                                                optionsLoading ? "opacity-60" : ""
                                            }`}
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
                                        <label className={labelClass}>
                                            {t("checkInTimeLabel")}
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className={`${inputClass} font-mono cursor-pointer`}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className={labelClass}>
                                            {t("checkOutTimeLabel")}
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className={`${inputClass} font-mono cursor-pointer`}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className={labelClass}>{t("graceMinutesLabel")}</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={120}
                                        required
                                        value={graceMinutes}
                                        onChange={(e) => setGraceMinutes(Number(e.target.value))}
                                        className={`${inputClass} font-mono`}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>{t("weeklyWorkDays")}</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {DAYS.map((day) => {
                                            const isSelected = workingDays.includes(day.id);
                                            return (
                                                <button
                                                    type="button"
                                                    key={day.id}
                                                    onClick={() => toggleDay(day.id)}
                                                    className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider border rounded-xl transition-all text-center cursor-pointer ${
                                                        isSelected
                                                            ? "bg-[#9327FF] border-[#9327FF] text-white shadow-xs"
                                                            : "bg-slate-50 border-slate-200 text-slate-400 hover:border-[#9327FF]/40 hover:text-[#9327FF]"
                                                    }`}
                                                >
                                                    {day.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                                    >
                                        {t("cancel")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? t("saving") : t("save")}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
