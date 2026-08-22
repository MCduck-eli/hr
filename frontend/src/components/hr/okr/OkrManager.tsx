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
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
    const [editingObjective, setEditingObjective] = useState<any>(null);
    
    // Form state
    const [form, setForm] = useState({
        level: "INDIVIDUAL",
        title: "",
        description: "",
        employeeId: "",
        departmentId: "",
        minExpectedProgress: "" as number | string,
        keyResults: [{ id: "", title: "", targetValue: 1, unit: "" }]
    });

    const [cycleForm, setCycleForm] = useState({
        title: "",
        startDate: "",
        endDate: "",
        isCurrent: true,
        minExpectedProgress: 0
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1"}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter users who have employee records
                setEmployees(data.data?.filter((u: any) => u.employee) || []);
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
                keyResults: [{ id: "", title: "", targetValue: 1, unit: "" }]
            });
        }
        setIsModalOpen(true);
        setIsCycleModalOpen(false); // close other form if open
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
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">{t("title")}</h1>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">{t("subtitle")}</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        className="bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-widest px-4 py-3 min-w-[200px]"
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
                            setIsModalOpen(false); // close other form if open
                            setTimeout(() => {
                                document.getElementById('cycle-form')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }}
                        className="bg-white border border-gray-200 text-gray-700 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:border-black hover:text-black transition-colors"
                    >
                        {t("newCycle")}
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                        {t("newOkr")}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20 text-xs font-bold uppercase tracking-widest text-gray-400">{t("loading")}</div>
            ) : !dashboard ? (
                <div className="flex justify-center py-20 text-xs font-bold uppercase tracking-widest text-gray-400">{t("noData")}</div>
            ) : (
                <div className="flex flex-col gap-12">
                    {/* Pending Approvals */}
                    {pendingCheckIns.length > 0 && (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-4 text-orange-600">
                                {t("pendingTasks")} ({pendingCheckIns.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingCheckIns.map((ci: any) => (
                                    <div key={ci.id} className="border border-orange-200 bg-orange-50/50 p-6 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                    {ci.keyResult?.objective?.employee?.firstName} {ci.keyResult?.objective?.employee?.lastName}
                                                </span>
                                                <h3 className="text-sm font-bold">{ci.keyResult?.title}</h3>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-100 text-orange-800 px-2 py-1">
                                                {t("pending")}
                                            </span>
                                        </div>
                                        {ci.comment && (
                                            <p className="text-sm text-gray-700 bg-white p-3 border border-gray-200 italic">"{ci.comment}"</p>
                                        )}
                                        {ci.imageUrl && (
                                            <div className="relative h-48 w-full bg-gray-100 border border-gray-200 overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:5001"}${ci.imageUrl}`} alt="Proof" className="object-contain w-full h-full" />
                                            </div>
                                        )}
                                        <div className="flex gap-3 mt-2">
                                            <button 
                                                onClick={() => handleReviewCheckIn(ci.id, "APPROVED")}
                                                className="flex-1 bg-black text-white py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-800"
                                            >
                                                {t("approve")}
                                            </button>
                                            <button 
                                                onClick={() => handleReviewCheckIn(ci.id, "REJECTED")}
                                                className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 text-xs font-bold uppercase tracking-widest hover:border-black hover:text-black"
                                            >
                                                {t("reject")}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="border border-gray-200 bg-white p-6 relative overflow-hidden group hover:border-black transition-colors">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t("companyProgress")}</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold tracking-tighter">{Math.round(dashboard.summary?.overallCompanyProgress || 0)}</span>
                                <span className="text-gray-400 font-bold mb-1">%</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-black transition-all" style={{ width: `${dashboard.summary?.overallCompanyProgress || 0}%` }} />
                        </div>
                        <div className="border border-gray-200 bg-white p-6 relative overflow-hidden group hover:border-black transition-colors">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t("departmentProgress")}</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold tracking-tighter">{Math.round(dashboard.summary?.overallDepartmentProgress || 0)}</span>
                                <span className="text-gray-400 font-bold mb-1">%</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-black transition-all" style={{ width: `${dashboard.summary?.overallDepartmentProgress || 0}%` }} />
                        </div>
                        <div className="border border-gray-200 bg-white p-6 relative overflow-hidden group hover:border-black transition-colors">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t("employeeProgress")}</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold tracking-tighter">{Math.round(dashboard.summary?.overallIndividualProgress || 0)}</span>
                                <span className="text-gray-400 font-bold mb-1">%</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-black transition-all" style={{ width: `${dashboard.summary?.overallIndividualProgress || 0}%` }} />
                        </div>
                    </div>

                    {/* OKR List */}
                    <div className="flex flex-col gap-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-4">{t("allOkrs")}</h2>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {[...(dashboard.tree?.company || []), ...(dashboard.tree?.department || []), ...(dashboard.tree?.individual || [])].map((okr: any) => (
                                <div key={okr.id} className="border border-gray-200 bg-white p-6 flex flex-col gap-6 hover:border-gray-400 transition-colors relative group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${okr.level === 'COMPANY' ? 'bg-purple-100 text-purple-800' : okr.level === 'DEPARTMENT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {okr.level}
                                                </span>
                                                {okr.employee && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                        {okr.employee.firstName} {okr.employee.lastName}
                                                    </span>
                                                )}
                                                {okr.department && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                        {t("departmentLabel")}: {okr.department.name}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    {t("statusLabel")}: {okr.status}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold">{okr.title}</h3>
                                            {okr.description && <p className="text-sm text-gray-500">{okr.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-2xl font-bold tracking-tighter">{Math.round(okr.progress)}%</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("total")}</span>
                                            </div>
                                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(okr)} className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800">{t("edit")}</button>
                                                <button onClick={() => handleDelete(okr.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800">{t("delete")}</button>
                                            </div>
                                        </div>
                                    </div>

                                    {okr.keyResults?.length > 0 && (
                                        <div className="bg-gray-50 p-4 flex flex-col gap-4 border border-gray-100">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("keyResults")}</h4>
                                            <div className="flex flex-col gap-3">
                                                {okr.keyResults.map((kr: any) => (
                                                    <div key={kr.id} className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">{kr.title}</span>
                                                        <div className="flex items-center gap-4 w-1/3">
                                                            <div className="flex-1 h-1.5 bg-gray-200 overflow-hidden">
                                                                <div className="h-full bg-black" style={{ width: `${kr.progress}%` }} />
                                                            </div>
                                                            <span className="text-xs font-bold w-20 text-right">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {[...(dashboard.tree?.company || []), ...(dashboard.tree?.department || []), ...(dashboard.tree?.individual || [])].length === 0 && (
                                <div className="text-center py-12 text-sm text-gray-400 font-medium">{t("noOkrsInCycle")}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit OKR Modal */}
            {isModalOpen && (
                <div id="okr-form" className="mt-12 flex justify-center">
                    <div className="bg-white max-w-3xl w-full border border-gray-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-sm font-bold uppercase tracking-widest">{editingObjective ? t("editOkrTitle") : t("newOkrTitle")}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("level")}</label>
                                    <select 
                                        className="border border-gray-200 p-3 text-sm focus:border-black outline-none transition-colors"
                                        value={form.level}
                                        onChange={(e) => setForm({...form, level: e.target.value})}
                                    >
                                        <option value="INDIVIDUAL">{t("levelIndividual")}</option>
                                        <option value="DEPARTMENT">{t("levelDepartment")}</option>
                                        <option value="COMPANY">{t("levelCompany")}</option>
                                    </select>
                                </div>
                                {form.level === "INDIVIDUAL" && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("employee")}</label>
                                        <select 
                                            className="border border-gray-200 p-3 text-sm focus:border-black outline-none transition-colors"
                                            value={form.employeeId}
                                            onChange={(e) => setForm({...form, employeeId: e.target.value})}
                                            required
                                        >
                                            <option value="">-- Xodimni tanlang --</option>
                                            {employees.map(u => (
                                                <option key={u.id} value={u.employee.id}>{u.employee?.firstName} {u.employee?.lastName} ({u.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {form.level === "DEPARTMENT" && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t("levelDepartment")}</label>
                                        <select 
                                            className="border border-gray-200 p-3 text-sm focus:border-black outline-none transition-colors"
                                            value={form.departmentId}
                                            onChange={(e) => setForm({...form, departmentId: e.target.value})}
                                            required
                                        >
                                            <option value="">-- Bo'limni tanlang --</option>
                                            {departments.map((d: any) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Maqsad (Objective)</label>
                                <input 
                                    type="text"
                                    className="border border-gray-200 p-3 text-sm focus:border-black outline-none transition-colors"
                                    placeholder="Masalan: HR jarayonlarini avtomatlashtirish"
                                    value={form.title}
                                    onChange={(e) => setForm({...form, title: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tavsif (Description)</label>
                                <textarea 
                                    className="border border-gray-200 p-3 text-sm focus:border-black outline-none transition-colors resize-none"
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
                                    className="border border-gray-200 p-3 text-sm focus:border-black outline-none transition-colors"
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
                                        className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800"
                                    >
                                        + QO'SHISH
                                    </button>
                                </div>
                                {form.keyResults.map((kr, index) => (
                                    <div key={index} className="flex items-start gap-4 p-4 border border-gray-100 bg-gray-50 relative group">
                                        <div className="flex-1 flex flex-col gap-3">
                                            <input 
                                                type="text"
                                                className="border border-gray-200 p-2 text-sm focus:border-black outline-none"
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
                                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-gray-100">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                                >
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Cycle Modal */}
            {isCycleModalOpen && (
                <div id="cycle-form" className="mt-12 flex justify-center">
                    <div className="bg-white max-w-2xl w-full border border-gray-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-sm font-bold uppercase tracking-widest">{t("createCycleTitle")}</h2>
                            <button onClick={() => setIsCycleModalOpen(false)} className="text-gray-400 hover:text-black">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateCycle} className="p-6 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sikl Nomi</label>
                                <input 
                                    type="text"
                                    className="border border-gray-200 p-3 text-sm focus:border-black outline-none"
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
                                    className="border border-gray-200 p-3 text-sm focus:border-black outline-none"
                                    value={cycleForm.startDate}
                                    onChange={(e) => setCycleForm({...cycleForm, startDate: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tugash Sanasi</label>
                                <input 
                                    type="date"
                                    className="border border-gray-200 p-3 text-sm focus:border-black outline-none"
                                    value={cycleForm.endDate}
                                    onChange={(e) => setCycleForm({...cycleForm, endDate: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Kutilayotgan progress (%)</label>
                                <input 
                                    type="number"
                                    className="border border-gray-200 p-3 text-sm focus:border-black outline-none"
                                    value={cycleForm.minExpectedProgress}
                                    onChange={(e) => setCycleForm({...cycleForm, minExpectedProgress: parseFloat(e.target.value)})}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox"
                                    id="isCurrent"
                                    checked={cycleForm.isCurrent}
                                    onChange={(e) => setCycleForm({...cycleForm, isCurrent: e.target.checked})}
                                />
                                <label htmlFor="isCurrent" className="text-sm font-medium">Joriy sikl qilib belgilash</label>
                            </div>
                            <div className="flex justify-end gap-4 mt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCycleModalOpen(false)}
                                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black"
                                >
                                    Bekor qilish
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800"
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
