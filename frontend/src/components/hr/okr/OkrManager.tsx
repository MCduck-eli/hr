"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { 
    fetchOkrDashboard, 
    fetchOkrCycles, 
    createObjective, 
    updateObjective, 
    deleteObjective,
    createOkrCycle,
    fetchPendingCheckIns,
    reviewCheckIn
} from "@/src/services/okr-service";
import { fetchDepartments } from "@/src/services/department-service";

export default function OkrManager() {
    const t = useTranslations("HROkr");
    const [loading, setLoading] = useState(true);
    const [cycles, setCycles] = useState<any[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState<string>("");
    const [dashboard, setDashboard] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [pendingCheckIns, setPendingCheckIns] = useState<any[]>([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
    const [editingObjective, setEditingObjective] = useState<any>(null);
    
    const [form, setForm] = useState({
        level: "INDIVIDUAL",
        title: "",
        description: "",
        employeeId: "",
        departmentId: "",
        minExpectedProgress: "" as number | string,
        isIndividualForEach: true,
        keyResults: [{ id: "", title: "", targetValue: 1, unit: "" }]
    });

    const [cycleForm, setCycleForm] = useState({
        title: "",
        startDate: "",
        endDate: "",
        isCurrent: true,
        minExpectedProgress: 0 as number | string
    });

    useEffect(() => {
        loadInitialData();
        loadEmployees();
        loadDepartments();
    }, []);

    useEffect(() => {
        if (selectedCycleId) {
            loadDashboard(selectedCycleId);
        }
    }, [selectedCycleId]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const cyclesData = await fetchOkrCycles();
            setCycles(cyclesData || []);
            if (cyclesData?.length > 0) {
                const current = cyclesData.find((c: any) => c.isCurrent) || cyclesData[0];
                setSelectedCycleId(current.id);
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const loadDashboard = async (cycleId: string) => {
        try {
            setLoading(true);
            const [data, checkInsData] = await Promise.all([
                fetchOkrDashboard(cycleId),
                fetchPendingCheckIns()
            ]);
            setDashboard(data);
            setPendingCheckIns(checkInsData || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");
            let currentUserId = "";
            let currentUserEmpId = "";
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    currentUserId = parsed.id;
                    currentUserEmpId = parsed.employee?.id;
                } catch (e) {}
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1"}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployees(
                    data.data?.filter(
                        (u: any) => u.employee && u.role !== "SUPER_ADMIN"
                    ) || []
                );
            }
        } catch (e) {
            console.error("Failed to load employees");
        }
    };

    const loadDepartments = async () => {
        try {
            const data = await fetchDepartments();
            setDepartments(data || []);
        } catch (e) {
            console.error("Failed to load departments");
        }
    };

    const handleOpenModal = (objective: any = null) => {
        if (objective) {
            setEditingObjective(objective);
            setForm({
                level: objective.level,
                title: objective.title,
                description: objective.description || "",
                employeeId: objective.employee?.id || objective.employeeId || "",
                departmentId: objective.department?.id || objective.departmentId || "",
                minExpectedProgress: objective.minExpectedProgress || 0,
                isIndividualForEach: false,
                keyResults: objective.keyResults?.map((kr: any) => ({
                    id: kr.id,
                    title: kr.title,
                    targetValue: kr.targetValue,
                    unit: kr.unit
                })) || []
            });
        } else {
            setEditingObjective(null);
            setForm({
                level: "INDIVIDUAL",
                title: "",
                description: "",
                employeeId: "",
                departmentId: "",
                minExpectedProgress: "",
                isIndividualForEach: true,
                keyResults: [{ id: "", title: "", targetValue: 1, unit: "" }]
            });
        }
        setIsModalOpen(true);
        setIsCycleModalOpen(false);
        setTimeout(() => {
            document.getElementById('okr-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleAddKr = () => {
        setForm({
            ...form,
            keyResults: [...form.keyResults, { id: "", title: "", targetValue: 1, unit: "" }]
        });
    };

    const handleRemoveKr = (index: number) => {
        const newKrs = [...form.keyResults];
        newKrs.splice(index, 1);
        setForm({ ...form, keyResults: newKrs });
    };

    const handleKrChange = (index: number, field: string, value: any) => {
        const newKrs = [...form.keyResults];
        (newKrs[index] as any)[field] = value;
        setForm({ ...form, keyResults: newKrs });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                cycleId: selectedCycleId,
                ...form,
                minExpectedProgress: form.minExpectedProgress === "" ? undefined : Number(form.minExpectedProgress),
                employeeId: form.level === "INDIVIDUAL" ? (form.employeeId || undefined) : undefined,
                departmentId: form.level === "DEPARTMENT" ? (form.departmentId || undefined) : undefined,
            };

            if (editingObjective) {
                await updateObjective(editingObjective.id, payload);
            } else {
                await createObjective(payload);
            }
            setIsModalOpen(false);
            loadDashboard(selectedCycleId);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("confirmDeleteOkr"))) return;
        try {
            await deleteObjective(id);
            loadDashboard(selectedCycleId);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleReviewCheckIn = async (checkInId: string, status: "APPROVED" | "REJECTED") => {
        try {
            await reviewCheckIn(checkInId, status);
            loadDashboard(selectedCycleId);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleCreateCycle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...cycleForm,
                minExpectedProgress: Number(cycleForm.minExpectedProgress) || 0,
                startDate: new Date(cycleForm.startDate).toISOString(),
                endDate: new Date(cycleForm.endDate).toISOString(),
            };
            await createOkrCycle(payload);
            setIsCycleModalOpen(false);
            loadInitialData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">{t("title")}</h1>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t("subtitle")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-purple-500/20 text-xs font-bold uppercase tracking-wider px-4 py-2.5 min-w-[200px] outline-none text-gray-700"
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                    >
                        {cycles.map(c => (
                            <option key={c.id} value={c.id}>{c.title} {c.isCurrent ? "(Joriy)" : ""}</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => {
                            setIsCycleModalOpen(true);
                            setIsModalOpen(false);
                            setTimeout(() => {
                                document.getElementById('cycle-form')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }}
                        className="bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 shadow-sm px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                        {t("newCycle")}
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-[#9327FF] hover:opacity-90 text-white rounded-xl shadow-sm px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                        {t("newOkr")}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-3 border-[#9327FF] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("loading")}</span>
                </div>
            ) : !dashboard ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center text-2xl">
                        📂
                    </div>
                    <span className="text-gray-400 font-medium text-sm">
                        {t("noData")}
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-10">
                    {pendingCheckIns.length > 0 && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xs font-bold uppercase tracking-widest pb-2 text-orange-600 flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{t("pendingTasks")} ({pendingCheckIns.length})</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingCheckIns.map((ci: any) => (
                                    <div key={ci.id} className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5 flex flex-col gap-4 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                    {ci.keyResult?.objective?.employee?.firstName} {ci.keyResult?.objective?.employee?.lastName}
                                                </span>
                                                <h3 className="text-sm font-bold text-gray-900">{ci.keyResult?.title}</h3>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-2.5 py-1 rounded-lg">
                                                {t("pending")}
                                            </span>
                                        </div>
                                        {ci.comment && (
                                            <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-orange-100 italic">"{ci.comment}"</p>
                                        )}
                                        {ci.imageUrl && (
                                            <div className="relative h-48 w-full bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                                                <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:5001"}${ci.imageUrl}`} alt="Proof" className="object-contain w-full h-full" />
                                            </div>
                                        )}
                                        <div className="flex gap-3 mt-1">
                                            <button 
                                                onClick={() => handleReviewCheckIn(ci.id, "APPROVED")}
                                                className="flex-1 bg-[#9327FF] hover:bg-[#7e22ce] text-white py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                                            >
                                                {t("approve")}
                                            </button>
                                            <button 
                                                onClick={() => handleReviewCheckIn(ci.id, "REJECTED")}
                                                className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                                            >
                                                {t("reject")}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{t("companyProgress")}</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black font-mono tracking-tight text-gray-900">{Math.round(dashboard.summary?.overallCompanyProgress || 0)}</span>
                                <span className="text-gray-400 font-bold mb-1">%</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1.5 bg-[#9327FF] transition-all rounded-full" style={{ width: `${dashboard.summary?.overallCompanyProgress || 0}%` }} />
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{t("departmentProgress")}</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black font-mono tracking-tight text-blue-600">{Math.round(dashboard.summary?.overallDepartmentProgress || 0)}</span>
                                <span className="text-gray-400 font-bold mb-1">%</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1.5 bg-blue-600 transition-all rounded-full" style={{ width: `${dashboard.summary?.overallDepartmentProgress || 0}%` }} />
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{t("employeeProgress")}</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black font-mono tracking-tight text-emerald-600">{Math.round(dashboard.summary?.overallIndividualProgress || 0)}</span>
                                <span className="text-gray-400 font-bold mb-1">%</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1.5 bg-emerald-600 transition-all rounded-full" style={{ width: `${dashboard.summary?.overallIndividualProgress || 0}%` }} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">{t("allOkrs")}</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {[...(dashboard.tree?.company || []), ...(dashboard.tree?.department || []), ...(dashboard.tree?.individual || [])].map((okr: any) => (
                                <div key={okr.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-all relative group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${okr.level === 'COMPANY' ? 'bg-purple-50 text-purple-700 border border-purple-100' : okr.level === 'DEPARTMENT' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-700'}`}>
                                                    {okr.level}
                                                </span>
                                                {okr.employee && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                                                        {okr.employee.firstName} {okr.employee.lastName}
                                                    </span>
                                                )}
                                                {okr.department && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                                                        {t("departmentLabel")}: {okr.department.name}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-medium text-gray-400">
                                                    {t("statusLabel")}: {okr.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">{okr.title}</h3>
                                            {okr.description && <p className="text-xs text-gray-500 font-medium">{okr.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-2xl font-black font-mono tracking-tight text-gray-900">{Math.round(okr.progress)}%</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("total")}</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(okr)} className="text-[10px] font-bold uppercase tracking-wider text-[#9327FF] hover:underline cursor-pointer">{t("edit")}</button>
                                                <button onClick={() => handleDelete(okr.id)} className="text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:underline cursor-pointer">{t("delete")}</button>
                                            </div>
                                        </div>
                                    </div>

                                    {okr.keyResults?.length > 0 && (
                                        <div className="bg-gray-50/70 rounded-xl p-4 flex flex-col gap-3 border border-gray-100">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("keyResults")}</h4>
                                            <div className="flex flex-col gap-2.5">
                                                {okr.keyResults.map((kr: any) => (
                                                    <div key={kr.id} className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-gray-800">{kr.title}</span>
                                                        <div className="flex items-center gap-3 w-1/3">
                                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#9327FF] rounded-full" style={{ width: `${kr.progress}%` }} />
                                                            </div>
                                                            <span className="text-xs font-mono font-bold w-20 text-right text-gray-700">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {[...(dashboard.tree?.company || []), ...(dashboard.tree?.department || []), ...(dashboard.tree?.individual || [])].length === 0 && (
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center gap-2 text-center">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center text-xl">
                                        🎯
                                    </div>
                                    <span className="text-sm text-gray-400 font-medium">{t("noOkrsInCycle")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div id="okr-form" className="mt-12 flex justify-center">
                    <div className="bg-white max-w-3xl w-full rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">{editingObjective ? t("editOkrTitle") : t("newOkrTitle")}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 transition-colors cursor-pointer">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                        {t("targetScope") || t("level")}
                                    </label>
                                    <select 
                                        className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors bg-white font-medium text-gray-800"
                                        value={form.level}
                                        onChange={(e) => {
                                            const newLevel = e.target.value;
                                            setForm({
                                                ...form,
                                                level: newLevel,
                                                employeeId: newLevel === "INDIVIDUAL" ? form.employeeId : "",
                                                departmentId: newLevel === "DEPARTMENT" ? form.departmentId : "",
                                            });
                                        }}
                                    >
                                        <option value="COMPANY">{t("levelCompany")}</option>
                                        <option value="DEPARTMENT">{t("levelDepartment")}</option>
                                        <option value="INDIVIDUAL">{t("levelIndividual")}</option>
                                    </select>
                                </div>

                                {form.level === "COMPANY" && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                            {t("employee")}
                                        </label>
                                        <input
                                            type="text"
                                            disabled
                                            value={t("appliesToAllEmployees") || "Barcha xodimlarga avtomatik tegishli"}
                                            className="rounded-xl border border-gray-200 p-3 text-xs bg-gray-50 text-gray-500 font-bold uppercase tracking-wider cursor-not-allowed outline-none"
                                        />
                                    </div>
                                )}

                                {form.level === "DEPARTMENT" && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                            {t("departmentLabel")}
                                        </label>
                                        {departments.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-400 font-bold uppercase tracking-wider bg-gray-50">
                                                {t("noDepartmentsFound") || "Bo'limlar mavjud emas"}
                                            </div>
                                        ) : (
                                            <select 
                                                className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors bg-white font-medium text-gray-800"
                                                value={form.departmentId}
                                                onChange={(e) => setForm({...form, departmentId: e.target.value})}
                                                required
                                            >
                                                <option value="">{t("selectDepartment")}</option>
                                                {departments.map((d: any) => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {form.level === "INDIVIDUAL" && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                            {t("employee")}
                                        </label>
                                        <select 
                                            className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors bg-white font-medium text-gray-800"
                                            value={form.employeeId}
                                            onChange={(e) => setForm({...form, employeeId: e.target.value})}
                                            required
                                        >
                                            <option value="">{t("selectEmployee")}</option>
                                            {employees.map(u => (
                                                <option key={u.id} value={u.employee?.id || u.id}>
                                                    {u.employee?.firstName} {u.employee?.lastName} ({u.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {(form.level === "COMPANY" || form.level === "DEPARTMENT") && !editingObjective && (
                                    <div className="col-span-1 md:col-span-2 flex flex-col gap-3 p-4 bg-gray-50/60 rounded-2xl border border-gray-100">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-700">
                                            {t("executionModeLabel") || "Ijro usuli (Hisobot topshirish tartibi)"}
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div
                                                onClick={() => setForm({ ...form, isIndividualForEach: true })}
                                                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                    form.isIndividualForEach
                                                        ? "bg-white border-[#9327FF] shadow-sm"
                                                        : "bg-transparent border-gray-200 hover:bg-white"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="executionMode"
                                                    checked={form.isIndividualForEach}
                                                    onChange={() => setForm({ ...form, isIndividualForEach: true })}
                                                    className="mt-1 accent-[#9327FF]"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-900">
                                                        {t("modeIndividualEach")}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                        {t("modeIndividualEachDesc")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => setForm({ ...form, isIndividualForEach: false })}
                                                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                    !form.isIndividualForEach
                                                        ? "bg-white border-[#9327FF] shadow-sm"
                                                        : "bg-transparent border-gray-200 hover:bg-white"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="executionMode"
                                                    checked={!form.isIndividualForEach}
                                                    onChange={() => setForm({ ...form, isIndividualForEach: false })}
                                                    className="mt-1 accent-[#9327FF]"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-900">
                                                        {t("modeCollective")}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                        {t("modeCollectiveDesc")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Maqsad (Objective)</label>
                                <input 
                                    type="text"
                                    className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors"
                                    placeholder="Masalan: HR jarayonlarini avtomatlashtirish"
                                    value={form.title}
                                    onChange={(e) => setForm({...form, title: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tavsif (Description)</label>
                                <textarea 
                                    className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors resize-none"
                                    rows={3}
                                    placeholder="Maqsad haqida qisqacha ma'lumot..."
                                    value={form.description}
                                    onChange={(e) => setForm({...form, description: e.target.value})}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("minExpectedProgress")}</label>
                                <input 
                                    type="number"
                                    className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors"
                                    placeholder="Masalan: 5"
                                    value={form.minExpectedProgress}
                                    onChange={(e) => setForm({...form, minExpectedProgress: e.target.value === "" ? "" : Number(e.target.value)})}
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Asosiy Natijalar ({t("keyResults")})</label>
                                    <button 
                                        type="button" 
                                        onClick={handleAddKr}
                                        className="text-[10px] font-bold uppercase tracking-wider text-[#9327FF] hover:underline cursor-pointer"
                                    >
                                        + QO'SHISH
                                    </button>
                                </div>
                                {form.keyResults.map((kr, index) => (
                                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/70 relative group">
                                        <div className="flex-1 flex flex-col gap-3">
                                            <input 
                                                type="text"
                                                className="rounded-lg border border-gray-200 bg-white p-2.5 text-sm focus:border-[#9327FF] outline-none"
                                                placeholder="Vazifa nomi (masalan: Yangi mijoz topish)"
                                                value={kr.title}
                                                onChange={(e) => handleKrChange(index, "title", e.target.value)}
                                                required
                                            />
                                        </div>
                                        {form.keyResults.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveKr(index)}
                                                className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity p-2 cursor-pointer"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-gray-100">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                                >
                                    Bekor qilish
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-[#9327FF] hover:bg-[#7e22ce] text-white px-8 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                                >
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isCycleModalOpen && (
                <div id="cycle-form" className="mt-12 flex justify-center">
                    <div className="bg-white max-w-2xl w-full rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">{t("createCycleTitle")}</h2>
                            <button onClick={() => setIsCycleModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 transition-colors cursor-pointer">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateCycle} className="p-6 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sikl Nomi</label>
                                <input 
                                    type="text"
                                    className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none"
                                    placeholder="Masalan: 2026 yillik Q3"
                                    value={cycleForm.title}
                                    onChange={(e) => setCycleForm({...cycleForm, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Boshlanish Sanasi</label>
                                <input 
                                    type="date"
                                    className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none"
                                    value={cycleForm.startDate}
                                    onChange={(e) => setCycleForm({...cycleForm, startDate: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tugash Sanasi</label>
                                <input 
                                    type="date"
                                    className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none"
                                    value={cycleForm.endDate}
                                    onChange={(e) => setCycleForm({...cycleForm, endDate: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Kutilayotgan progress (%)</label>
                                <input 
                                    type="number"
                                    className="rounded-xl border border-gray-200 p-3 text-sm focus:border-[#9327FF] focus:ring-2 focus:ring-purple-500/20 outline-none"
                                    value={cycleForm.minExpectedProgress}
                                    onChange={(e) => setCycleForm({...cycleForm, minExpectedProgress: e.target.value === "" ? "" : Number(e.target.value)})}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox"
                                    id="isCurrent"
                                    checked={cycleForm.isCurrent}
                                    onChange={(e) => setCycleForm({...cycleForm, isCurrent: e.target.checked})}
                                    className="accent-[#9327FF] w-4 h-4 rounded"
                                />
                                <label htmlFor="isCurrent" className="text-sm font-medium text-gray-800">Joriy sikl qilib belgilash</label>
                            </div>
                            <div className="flex justify-end gap-3 mt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCycleModalOpen(false)}
                                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                                >
                                    Bekor qilish
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-[#9327FF] hover:bg-[#7e22ce] text-white px-8 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                                >
                                    Yaratish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
