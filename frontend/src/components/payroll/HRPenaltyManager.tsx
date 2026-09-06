"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    fetchPenaltyRules,
    createPenaltyRule,
    updatePenaltyRule,
    deletePenaltyRule,
    fetchEmployeePenalties,
    createEmployeePenalty,
    deleteEmployeePenalty,
    fetchPenaltiesSummary,
} from "@/src/services/payroll-service";
import { fetchAllUsers } from "@/src/services/user-service";

export default function HRPenaltyManager() {
    const t = useTranslations("Payroll");
    const params = useParams();
    const locale = (params?.locale as string) || "uz";
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "lateness" | "disciplinary">("overview");

    const [employees, setEmployees] = useState<any[]>([]);
    const [penaltyRules, setPenaltyRules] = useState<any[]>([]);
    const [employeePenalties, setEmployeePenalties] = useState<any[]>([]);
    const [lateAttendances, setLateAttendances] = useState<any[]>([]);
    const [employeeSummaries, setEmployeeSummaries] = useState<any[]>([]);
    const [summaryStats, setSummaryStats] = useState<any>({
        totalLateCount: 0,
        totalLateMinutes: 0,
        totalLateFines: 0,
        totalAbsentDays: 0,
        totalAbsentFines: 0,
        totalDisciplinaryCount: 0,
        totalDisciplinaryFines: 0,
        grandTotalFines: 0,
        totalPenalizedEmployees: 0,
        totalActiveRules: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isAddPenaltyModalOpen, setIsAddPenaltyModalOpen] = useState(false);
    const [penaltyForm, setPenaltyForm] = useState({
        employeeId: "",
        ruleId: "",
        reason: "",
        amount: "",
        month: selectedMonth,
        year: selectedYear,
        date: new Date().toISOString().split("T")[0],
    });

    const [isPenaltyRulesModalOpen, setIsPenaltyRulesModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<any | null>(null);
    const [ruleForm, setRuleForm] = useState({
        name: "",
        code: "",
        penaltyType: "FIXED",
        amount: "",
        isAuto: false,
        description: "",
    });

    const [actionLoading, setActionLoading] = useState(false);

    const getMonthName = (m: number) => {
        try {
            return t(`months.${m}`);
        } catch {
            return `${m}-oy`;
        }
    };

    const formatLateTime = (minutes: number) => {
        if (!minutes || minutes <= 0) return `0 ${t("unitMinutes")}`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours} ${t("unitHours")} ${mins > 0 ? `${mins} ${t("unitMinutes")}` : ""}`.trim();
        }
        return `${mins} ${t("unitMinutes")}`;
    };

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [usersData, summaryData, rulesData] = await Promise.all([
                fetchAllUsers().catch(() => []),
                fetchPenaltiesSummary({
                    month: selectedMonth,
                    year: selectedYear,
                }).catch(() => null),
                fetchPenaltyRules().catch(() => []),
            ]);

            const validEmployees = (usersData || [])
                .filter((u: any) => u.employee && u.role !== "SUPER_ADMIN" && u.role !== "DIRECTOR")
                .map((u: any) => ({
                    id: u.employee.id,
                    userId: u.id,
                    name: `${u.employee.firstName || ""} ${u.employee.lastName || ""}`.trim() || u.email,
                    email: u.email,
                    department: u.employee.department?.name || "-",
                    position: u.employee.position?.title || "-",
                }));

            setEmployees(validEmployees);
            setPenaltyRules(rulesData || summaryData?.penaltyRules || []);

            if (summaryData) {
                setLateAttendances(summaryData.lateAttendances || []);
                setEmployeePenalties(summaryData.disciplinaryPenalties || []);
                setEmployeeSummaries(summaryData.employeeSummaries || []);
                setSummaryStats(summaryData.stats || {
                    totalLateCount: 0,
                    totalLateMinutes: 0,
                    totalLateFines: 0,
                    totalAbsentDays: 0,
                    totalAbsentFines: 0,
                    totalDisciplinaryCount: 0,
                    totalDisciplinaryFines: 0,
                    grandTotalFines: 0,
                    totalPenalizedEmployees: 0,
                    totalActiveRules: rulesData?.length || 0,
                });
            } else {
                const penaltiesData = await fetchEmployeePenalties({
                    month: selectedMonth,
                    year: selectedYear,
                }).catch(() => []);
                setEmployeePenalties(penaltiesData || []);
            }
        } catch (err: any) {
            setError(err.message || t("loadDataError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear]);

    const handleOpenAddPenalty = () => {
        setPenaltyForm({
            employeeId: employees[0]?.id || "",
            ruleId: "",
            reason: "",
            amount: "",
            month: selectedMonth,
            year: selectedYear,
            date: new Date().toISOString().split("T")[0],
        });
        setIsAddPenaltyModalOpen(true);
    };

    const handleRuleSelectChange = (ruleId: string) => {
        const selectedRule = penaltyRules.find((r) => r.id === ruleId);
        if (selectedRule) {
            setPenaltyForm((prev) => ({
                ...prev,
                ruleId: selectedRule.id,
                amount: selectedRule.penaltyType === "FIXED" ? String(selectedRule.amount) : prev.amount,
                reason: prev.reason || selectedRule.name,
            }));
        } else {
            setPenaltyForm((prev) => ({
                ...prev,
                ruleId: "",
            }));
        }
    };

    const handleCreatePenalty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!penaltyForm.employeeId) {
            alert(t("alertSelectEmployee"));
            return;
        }
        if (!penaltyForm.amount || Number(penaltyForm.amount) <= 0) {
            alert(t("alertEnterValidAmount"));
            return;
        }

        setActionLoading(true);
        try {
            await createEmployeePenalty({
                employeeId: penaltyForm.employeeId,
                ruleId: penaltyForm.ruleId || undefined,
                reason: penaltyForm.reason || t("reason"),
                amount: Number(penaltyForm.amount),
                month: Number(penaltyForm.month),
                year: Number(penaltyForm.year),
                date: penaltyForm.date,
            });

            setIsAddPenaltyModalOpen(false);
            await loadData();
        } catch (err: any) {
            alert(err.message || t("alertErrorAddingPenalty"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePenalty = async (id: string) => {
        if (!confirm(t("confirmDeletePenalty"))) return;
        try {
            await deleteEmployeePenalty(id);
            await loadData();
        } catch (err: any) {
            alert(err.message || t("alertDeleteError"));
        }
    };

    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleForm.name.trim() || !ruleForm.code.trim()) {
            alert(t("alertNameCodeRequired"));
            return;
        }

        setActionLoading(true);
        try {
            if (editingRule) {
                await updatePenaltyRule(editingRule.id, {
                    name: ruleForm.name,
                    penaltyType: ruleForm.penaltyType,
                    amount: Number(ruleForm.amount) || 0,
                    isAuto: ruleForm.isAuto,
                    description: ruleForm.description,
                });
            } else {
                await createPenaltyRule({
                    name: ruleForm.name,
                    code: ruleForm.code,
                    penaltyType: ruleForm.penaltyType,
                    amount: Number(ruleForm.amount) || 0,
                    isAuto: ruleForm.isAuto,
                    description: ruleForm.description,
                });
            }

            setEditingRule(null);
            setRuleForm({
                name: "",
                code: "",
                penaltyType: "FIXED",
                amount: "",
                isAuto: false,
                description: "",
            });
            const updated = await fetchPenaltyRules();
            setPenaltyRules(updated || []);
            await loadData();
        } catch (err: any) {
            alert(err.message || t("alertSaveRuleError"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm(t("confirmDeleteRule"))) return;
        try {
            await deletePenaltyRule(id);
            const updated = await fetchPenaltyRules();
            setPenaltyRules(updated || []);
            await loadData();
        } catch (err: any) {
            alert(err.message || t("alertDeleteError"));
        }
    };

    const applyRulePreset = (preset: {
        name: string;
        code: string;
        penaltyType: string;
        amount: string;
        isAuto: boolean;
        description: string;
    }) => {
        setRuleForm({
            name: preset.name,
            code: preset.code,
            penaltyType: preset.penaltyType,
            amount: preset.amount,
            isAuto: preset.isAuto,
            description: preset.description,
        });
    };

    const filteredSummaries = employeeSummaries.filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (s.name || "").toLowerCase().includes(q) ||
            (s.department || "").toLowerCase().includes(q) ||
            (s.position || "").toLowerCase().includes(q)
        );
    });

    const filteredLateAttendances = lateAttendances.filter((l) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const empName = `${l.employee?.firstName || ""} ${l.employee?.lastName || ""}`.toLowerCase();
        return empName.includes(q);
    });

    const filteredDisciplinaryPenalties = employeePenalties.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const empName = `${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`.toLowerCase();
        const reason = (p.reason || "").toLowerCase();
        return empName.includes(q) || reason.includes(q);
    });

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                        <span>⚖️</span>
                        <span>{t("penaltyManagerTitle")}</span>
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mt-1">
                        {t("penaltyManagerSubtitle")}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setIsPenaltyRulesModalOpen(true)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-gray-300 transition-colors"
                    >
                        <span>⚙️</span>
                        <span>{t("penaltyRulesBtnText")}</span>
                    </button>
                    <button
                        onClick={handleOpenAddPenalty}
                        className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <span>➕</span>
                        <span>{t("addPenaltyBtnText")}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 border border-gray-200 bg-white flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            {t("cardTotalFines")} ({getMonthName(selectedMonth)})
                        </span>
                        <span className="text-base">💰</span>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-rose-600">
                            -{Number(summaryStats.grandTotalFines || 0).toLocaleString()} UZS
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {t("cardTotalFinesSub")}
                        </div>
                    </div>
                </div>

                <div className="p-5 border border-gray-200 bg-white flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            {t("cardLatenessAuto")}
                        </span>
                        <span className="text-base">⏱️</span>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-amber-600">
                            {summaryStats.totalLateCount || 0} {t("unitItems")}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {t("totalLabel")} {formatLateTime(summaryStats.totalLateMinutes || 0)} (-{Number(summaryStats.totalLateFines || 0).toLocaleString()} UZS)
                        </div>
                    </div>
                </div>

                <div className="p-5 border border-gray-200 bg-white flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            {t("cardAbsenceAuto")}
                        </span>
                        <span className="text-base">🚫</span>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-red-600">
                            {summaryStats.totalAbsentDays || 0} {t("unitDays")}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {t("totalLabel")} (-{Number(summaryStats.totalAbsentFines || 0).toLocaleString()} UZS)
                        </div>
                    </div>
                </div>

                <div className="p-5 border border-gray-200 bg-white flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            {t("cardDisciplinaryManual")}
                        </span>
                        <span className="text-base">📝</span>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-gray-900">
                            {summaryStats.totalDisciplinaryCount || 0} {t("unitItems")}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {t("cardDisciplinarySub")} (-{Number(summaryStats.totalDisciplinaryFines || 0).toLocaleString()} UZS)
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 border border-gray-200">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-gray-500">{t("monthLabel")}</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-white border border-gray-300 text-xs font-bold uppercase px-3 py-2 outline-none focus:border-black cursor-pointer"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                <option key={m} value={m}>
                                    {getMonthName(m)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-gray-500">{t("yearLabel")}</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-white border border-gray-300 text-xs font-bold uppercase px-3 py-2 outline-none focus:border-black cursor-pointer"
                        >
                            {[2024, 2025, 2026, 2027, 2028].map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="w-full md:w-80">
                    <input
                        type="text"
                        placeholder={t("searchEmployeeOrReason")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-xs px-3 py-2 outline-none focus:border-black"
                    />
                </div>
            </div>

            <div className="flex items-center border-b border-gray-200 gap-2">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === "overview"
                            ? "border-black text-black bg-gray-50"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    <span>📊</span>
                    <span>{t("tabOverview")} ({filteredSummaries.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("lateness")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === "lateness"
                            ? "border-black text-black bg-gray-50"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    <span>⏱️</span>
                    <span>{t("tabLateness")} ({filteredLateAttendances.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("disciplinary")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === "disciplinary"
                            ? "border-black text-black bg-gray-50"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    <span>📝</span>
                    <span>{t("tabDisciplinary")} ({filteredDisciplinaryPenalties.length})</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                    {t("loading")}
                </div>
            ) : (
                <>
                    {activeTab === "overview" && (
                        <div className="border border-gray-200 bg-white">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    {t("overviewTableTitle")} ({getMonthName(selectedMonth)} {selectedYear})
                                </span>
                                <span className="text-xs font-semibold text-gray-500">
                                    {t("totalEmployeesCount", { count: filteredSummaries.length })}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-4">{t("colEmployee")}</th>
                                            <th className="py-3 px-4">{t("colDeptPos")}</th>
                                            <th className="py-3 px-4 text-center">{t("colLateAuto")}</th>
                                            <th className="py-3 px-4 text-center">{t("colAbsentAuto")}</th>
                                            <th className="py-3 px-4 text-center">{t("colDisciplinaryManual")}</th>
                                            <th className="py-3 px-4 text-right">{t("colTotalFineAmount")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs">
                                        {filteredSummaries.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-gray-400 font-semibold">
                                                    {t("noDataFound")}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSummaries.map((summary) => (
                                                <tr key={summary.employeeId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-black">
                                                        {summary.name}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-500">
                                                        <div>{summary.department}</div>
                                                        <div className="text-[11px] text-gray-400">{summary.position}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {summary.lateCount > 0 ? (
                                                            <div className="inline-flex flex-col items-center">
                                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[11px]">
                                                                    {summary.lateCount} {t("unitTimes")} ({formatLateTime(summary.totalLateMinutes)})
                                                                </span>
                                                                <span className="text-[10px] text-rose-600 font-bold mt-0.5">
                                                                    -{Number(summary.totalLateFines || 0).toLocaleString()} UZS
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 font-semibold">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {summary.absentDays > 0 ? (
                                                            <div className="inline-flex flex-col items-center">
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded text-[11px]">
                                                                    {summary.absentDays} {t("unitDays")}
                                                                </span>
                                                                <span className="text-[10px] text-rose-600 font-bold mt-0.5">
                                                                    -{Number(summary.absentFines || 0).toLocaleString()} UZS
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 font-semibold">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {summary.disciplinaryCount > 0 ? (
                                                            <div className="inline-flex flex-col items-center">
                                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[11px]">
                                                                    {summary.disciplinaryCount} {t("unitItems")}
                                                                </span>
                                                                <span className="text-[10px] text-rose-600 font-bold mt-0.5">
                                                                    -{Number(summary.totalDisciplinaryFines || 0).toLocaleString()} UZS
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 font-semibold">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {summary.totalFines > 0 ? (
                                                            <span className="font-black text-rose-600">
                                                                -{Number(summary.totalFines || 0).toLocaleString()} UZS
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-600 font-bold">0 UZS</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "lateness" && (
                        <div className="border border-gray-200 bg-white">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    {t("latenessTableTitle")} ({filteredLateAttendances.length})
                                </span>
                                <span className="text-xs font-semibold text-gray-500">
                                    {getMonthName(selectedMonth)} {selectedYear}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-4">{t("colEmployee")}</th>
                                            <th className="py-3 px-4">{t("colDate")}</th>
                                            <th className="py-3 px-4">{t("colArrivalTime")}</th>
                                            <th className="py-3 px-4">{t("colLateDuration")}</th>
                                            <th className="py-3 px-4 text-right">{t("colCalculatedFine")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs">
                                        {filteredLateAttendances.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-400 font-semibold">
                                                    {t("noLateFoundMonth")}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLateAttendances.map((late) => (
                                                <tr key={late.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-black">
                                                        <div>{`${late.employee?.firstName || ""} ${late.employee?.lastName || ""}`.trim() || "-"}</div>
                                                        <div className="text-[11px] text-gray-400 font-normal">
                                                            {late.employee?.department?.name || "-"} • {late.employee?.position?.title || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600 font-medium">
                                                        {late.date ? new Date(late.date).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US") : "-"}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-700 font-mono">
                                                        {late.checkIn ? new Date(late.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[11px]">
                                                            {formatLateTime(late.lateMinutes || 0)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-black text-rose-600">
                                                        -{Number(late.fineAmount || 0).toLocaleString()} UZS
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "disciplinary" && (
                        <div className="border border-gray-200 bg-white">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    {t("disciplinaryTableTitle")} ({filteredDisciplinaryPenalties.length})
                                </span>
                                <span className="text-xs font-semibold text-gray-500">
                                    {getMonthName(selectedMonth)} {selectedYear}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-4">{t("colEmployee")}</th>
                                            <th className="py-3 px-4">{t("colDate")}</th>
                                            <th className="py-3 px-4">{t("colRuleReason")}</th>
                                            <th className="py-3 px-4">{t("colCommentNote")}</th>
                                            <th className="py-3 px-4 text-right">{t("colPenaltyAmount")}</th>
                                            <th className="py-3 px-4 text-center">{t("colAction")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs">
                                        {filteredDisciplinaryPenalties.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-gray-400 font-semibold">
                                                    {t("noDisciplinaryFoundMonth")}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDisciplinaryPenalties.map((penalty) => (
                                                <tr key={penalty.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-black">
                                                        <div>{`${penalty.employee?.firstName || ""} ${penalty.employee?.lastName || ""}`.trim() || "-"}</div>
                                                        <div className="text-[11px] text-gray-400 font-normal">
                                                            {penalty.employee?.department?.name || "-"} • {penalty.employee?.position?.title || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600 font-medium">
                                                        {penalty.date ? new Date(penalty.date).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US") : "-"}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[11px] border border-rose-200">
                                                            {penalty.rule?.name || penalty.reason || t("reason")}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600">
                                                        {penalty.reason}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-black text-rose-600">
                                                        -{Number(penalty.amount || 0).toLocaleString()} UZS
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => handleDeletePenalty(penalty.id)}
                                                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold uppercase text-[10px] rounded border border-rose-200 transition-colors"
                                                        >
                                                            {t("btnDelete")}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {isAddPenaltyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl p-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
                                <span>⚖️</span>
                                <span>{t("modalAddPenaltyTitle")}</span>
                            </h3>
                            <button
                                onClick={() => setIsAddPenaltyModalOpen(false)}
                                className="text-gray-400 hover:text-black text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreatePenalty} className="flex flex-col gap-4 mt-5">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-600 block mb-1">
                                    {t("labelEmployee")}
                                </label>
                                <select
                                    required
                                    value={penaltyForm.employeeId}
                                    onChange={(e) =>
                                        setPenaltyForm({ ...penaltyForm, employeeId: e.target.value })
                                    }
                                    className="w-full p-2.5 border border-gray-300 text-xs bg-white font-medium outline-none focus:border-black"
                                >
                                    <option value="" disabled>{t("selectEmployeeOption")}</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} ({emp.department} - {emp.position})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-gray-600 block mb-1">
                                    {t("labelRuleTemplate")}
                                </label>
                                <select
                                    value={penaltyForm.ruleId}
                                    onChange={(e) => handleRuleSelectChange(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 text-xs bg-white font-medium outline-none focus:border-black"
                                >
                                    <option value="">{t("ruleDirectOption")}</option>
                                    {penaltyRules.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.isAuto ? `${t("badgeAuto")} ` : `${t("badgeManual")} `}
                                            {r.name} ({r.penaltyType === "FIXED" ? `${Number(r.amount).toLocaleString()} UZS` : `${r.amount}%`})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-gray-600 block mb-1">
                                    {t("labelReason")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("placeholderReason")}
                                    value={penaltyForm.reason}
                                    onChange={(e) =>
                                        setPenaltyForm({ ...penaltyForm, reason: e.target.value })
                                    }
                                    className="w-full p-2.5 border border-gray-300 text-xs outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-gray-600 block mb-1">
                                    {t("labelAmount")}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder={t("placeholderAmount")}
                                    value={penaltyForm.amount}
                                    onChange={(e) =>
                                        setPenaltyForm({ ...penaltyForm, amount: e.target.value })
                                    }
                                    className="w-full p-2.5 border border-gray-300 text-xs outline-none focus:border-black font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-600 block mb-1">
                                        {t("labelMonthYear")}
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        value={`${getMonthName(Number(penaltyForm.month))} ${penaltyForm.year}`}
                                        className="w-full p-2.5 border border-gray-200 bg-gray-100 text-xs text-gray-600 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-600 block mb-1">
                                        {t("labelViolationDate")}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={penaltyForm.date}
                                        onChange={(e) =>
                                            setPenaltyForm({ ...penaltyForm, date: e.target.value })
                                        }
                                        className="w-full p-2.5 border border-gray-300 text-xs outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddPenaltyModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100"
                                >
                                    {t("btnCancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    {actionLoading ? t("btnSaving") : t("btnSavePenalty")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPenaltyRulesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl border border-gray-300 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <div>
                                <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
                                    <span>⚙️</span>
                                    <span>{t("modalRulesTitle")}</span>
                                </h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {t("modalRulesSubtitle")}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsPenaltyRulesModalOpen(false);
                                    setEditingRule(null);
                                }}
                                className="text-gray-400 hover:text-black text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveRule} className="mt-4 p-4 border border-gray-200 bg-gray-50 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-gray-700">
                                    {editingRule ? t("formEditRule") : t("formAddRule")}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRuleForm((prev) => ({ ...prev, isAuto: false }))}
                                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded border transition-all ${
                                            !ruleForm.isAuto
                                                ? "bg-black text-white border-black"
                                                : "bg-white text-gray-600 border-gray-300"
                                        }`}
                                    >
                                        {t("modeManual")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRuleForm((prev) => ({ ...prev, isAuto: true }))}
                                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded border transition-all ${
                                            ruleForm.isAuto
                                                ? "bg-emerald-600 text-white border-emerald-600"
                                                : "bg-white text-gray-600 border-gray-300"
                                        }`}
                                    >
                                        {t("modeAuto")}
                                    </button>
                                </div>
                            </div>

                            <div className="p-2.5 bg-white border border-gray-200 text-[11px] text-gray-600">
                                {ruleForm.isAuto ? (
                                    <div className="flex flex-col gap-1.5">
                                        <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                                            <span>🤖</span>
                                            <span>{t("autoModeTitle")}</span>
                                            <span className="font-normal text-gray-600">
                                                {t("autoModeDesc")}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <span className="text-[10px] font-bold uppercase text-gray-400">{t("templatesLabel")}</span>
                                            <button
                                                type="button"
                                                onClick={() => applyRulePreset({
                                                    name: "Sababsiz ishga kelmaslik",
                                                    code: "ABSENCE",
                                                    penaltyType: "PERCENT",
                                                    amount: "100",
                                                    isAuto: true,
                                                    description: "Xodim ishga sababsiz kelmagan kunlar uchun oylik maoshidan ushlab qolinadi",
                                                })}
                                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold"
                                            >
                                                ABSENCE (Kelmaslik: 100%)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyRulePreset({
                                                    name: "Kechikish (belgilangan summa)",
                                                    code: "LATE_FIXED",
                                                    penaltyType: "FIXED",
                                                    amount: "50000",
                                                    isAuto: true,
                                                    description: "Har bir kechikish holati uchun belgilangan summa",
                                                })}
                                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold"
                                            >
                                                LATE_FIXED (50 000 UZS)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyRulePreset({
                                                    name: "Kechikish (har bir daqiqa uchun)",
                                                    code: "LATE_MINUTES",
                                                    penaltyType: "FIXED",
                                                    amount: "2000",
                                                    isAuto: true,
                                                    description: "Har bir kechikilgan daqiqa uchun jarima",
                                                })}
                                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold"
                                            >
                                                LATE_MINUTES (2 000 UZS/daq)
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5">
                                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                                            <span>✍️</span>
                                            <span>{t("manualModeTitle")}</span>
                                            <span className="font-normal text-gray-600">
                                                {t("manualModeDesc")}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <span className="text-[10px] font-bold uppercase text-gray-400">{t("templatesLabel")}</span>
                                            <button
                                                type="button"
                                                onClick={() => applyRulePreset({
                                                    name: "So'kinish va nojo'ya so'zlar",
                                                    code: "SWEARING",
                                                    penaltyType: "FIXED",
                                                    amount: "30000",
                                                    isAuto: false,
                                                    description: "Xodim ish joyida nojo'ya xulq-atvor ko'rsatganda",
                                                })}
                                                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-[10px] font-bold"
                                            >
                                                SWEARING (So'kinish)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyRulePreset({
                                                    name: "Noto'g'ri joyda chekish",
                                                    code: "SMOKING",
                                                    penaltyType: "FIXED",
                                                    amount: "50000",
                                                    isAuto: false,
                                                    description: "Belgilanmagan joyda chekish",
                                                })}
                                                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-[10px] font-bold"
                                            >
                                                SMOKING (Chekish)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyRulePreset({
                                                    name: "Ichki tartib-qoidani buzish",
                                                    code: "VIOLATION",
                                                    penaltyType: "FIXED",
                                                    amount: "100000",
                                                    isAuto: false,
                                                    description: "Kompaniya ichki reglamentini buzish",
                                                })}
                                                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-[10px] font-bold"
                                            >
                                                VIOLATION (Tartibbuzarlik)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                        {t("ruleNameLabel")}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={t("ruleNamePlaceholder")}
                                        value={ruleForm.name}
                                        onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                                        className="w-full p-2 border border-gray-300 text-xs bg-white outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                        {t("ruleCodeLabel")}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={Boolean(editingRule)}
                                        placeholder={t("ruleCodePlaceholder")}
                                        value={ruleForm.code}
                                        onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                                        className="w-full p-2 border border-gray-300 text-xs bg-white outline-none focus:border-black disabled:bg-gray-200 font-mono font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                        {t("ruleAmountLabel")}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder={t("ruleAmountPlaceholder")}
                                        value={ruleForm.amount}
                                        onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                                        className="w-full p-2 border border-gray-300 text-xs bg-white outline-none focus:border-black font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                        {t("ruleTypeLabel")}
                                    </label>
                                    <select
                                        value={ruleForm.penaltyType}
                                        onChange={(e) => setRuleForm({ ...ruleForm, penaltyType: e.target.value })}
                                        className="w-full p-2 border border-gray-300 text-xs bg-white outline-none focus:border-black font-semibold"
                                    >
                                        <option value="FIXED">{t("typeFixedOption")}</option>
                                        <option value="PERCENT">{t("typePercentOption")}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 mt-2">
                                {editingRule && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingRule(null);
                                            setRuleForm({
                                                name: "",
                                                code: "",
                                                penaltyType: "FIXED",
                                                amount: "",
                                                isAuto: false,
                                                description: "",
                                            });
                                        }}
                                        className="px-3 py-1.5 border border-gray-300 text-xs font-bold uppercase text-gray-600 hover:bg-gray-100"
                                    >
                                        {t("btnCancel")}
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-1.5 bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-bold uppercase tracking-wider"
                                >
                                    {actionLoading ? t("btnSaving") : editingRule ? t("btnUpdate") : t("btnAdd")}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="text-xs font-black uppercase text-gray-700 mb-3">
                                {t("existingRulesTitle")} ({penaltyRules.length})
                            </div>
                            <div className="divide-y divide-gray-200 border border-gray-200">
                                {penaltyRules.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-gray-400 font-semibold">
                                        {t("noRulesYet")}
                                    </div>
                                ) : (
                                    penaltyRules.map((rule) => (
                                        <div key={rule.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                                            <div>
                                                <div className="font-bold text-xs text-black flex items-center gap-2">
                                                    <span>{rule.name}</span>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                                                        {rule.code}
                                                    </span>
                                                    {rule.isAuto ? (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                                                            {t("badgeAuto")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                                                            {t("badgeManual")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-gray-500 mt-0.5 font-semibold">
                                                    {t("amountPrefix")} {rule.penaltyType === "FIXED" ? `${Number(rule.amount).toLocaleString()} UZS` : `${rule.amount}%`}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingRule(rule);
                                                        setRuleForm({
                                                            name: rule.name,
                                                            code: rule.code,
                                                            penaltyType: rule.penaltyType,
                                                            amount: String(rule.amount),
                                                            isAuto: Boolean(rule.isAuto),
                                                            description: rule.description || "",
                                                        });
                                                    }}
                                                    className="px-2.5 py-1 text-[11px] font-bold uppercase bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                                                >
                                                    {t("btnEdit")}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    className="px-2.5 py-1 text-[11px] font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                                >
                                                    {t("btnDelete")}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
