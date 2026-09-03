"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    fetchAllPayrolls,
    calculateAutoPayroll,
    generateBatchPayroll,
    createPayroll,
    updatePayrollStatus,
    deletePayroll,
} from "@/src/services/payroll-service";
import { fetchAllUsers } from "@/src/services/user-service";
import PayslipModal from "./PayslipModal";

export default function PayrollManager() {
    const t = useTranslations("Payroll");
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

    const [isAutoCalcModalOpen, setIsAutoCalcModalOpen] = useState(false);
    const [autoCalcResults, setAutoCalcResults] = useState<any[]>([]);
    const [calculating, setCalculating] = useState(false);
    const [batchGenerating, setBatchGenerating] = useState(false);

    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualForm, setManualForm] = useState({
        employeeId: "",
        baseSalary: "",
        bonus: "0",
        deductions: "0",
    });

    const getMonthName = (m: number) => {
        return t(`months.${m}` as any) || `${m}-oy`;
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [payrollsData, usersData] = await Promise.all([
                fetchAllPayrolls({
                    month: selectedMonth,
                    year: selectedYear,
                    status: statusFilter === "ALL" ? undefined : statusFilter,
                    search: searchQuery || undefined,
                }),
                fetchAllUsers(),
            ]);
            setPayrolls(payrollsData || []);
            const validEmployees = (usersData || [])
                .map((u: any) => u.employee ? { ...u.employee, email: u.email } : null)
                .filter(Boolean);
            setEmployees(validEmployees);
        } catch (err: any) {
            console.error("Failed to load payroll data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear, statusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const handleRunAutoCalculation = async () => {
        setCalculating(true);
        try {
            const results = await calculateAutoPayroll({
                month: selectedMonth,
                year: selectedYear,
            });
            setAutoCalcResults(results || []);
            setIsAutoCalcModalOpen(true);
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setCalculating(false);
        }
    };

    const handleSaveBatchPayroll = async () => {
        setBatchGenerating(true);
        try {
            await generateBatchPayroll({
                month: selectedMonth,
                year: selectedYear,
            });
            setIsAutoCalcModalOpen(false);
            await loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setBatchGenerating(false);
        }
    };

    const handleStatusToggle = async (payrollId: string, currentStatus: string) => {
        const nextStatus = currentStatus === "PAID" ? "PENDING" : "PAID";
        try {
            await updatePayrollStatus(payrollId, nextStatus as any);
            await loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleDeletePayroll = async (payrollId: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        try {
            await deletePayroll(payrollId);
            await loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualForm.employeeId || !manualForm.baseSalary) {
            return;
        }

        try {
            await createPayroll({
                employeeId: manualForm.employeeId,
                month: selectedMonth,
                year: selectedYear,
                baseSalary: parseFloat(manualForm.baseSalary),
                bonus: parseFloat(manualForm.bonus || "0"),
                deductions: parseFloat(manualForm.deductions || "0"),
            });
            setIsManualModalOpen(false);
            setManualForm({ employeeId: "", baseSalary: "", bonus: "0", deductions: "0" });
            await loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString("uz-UZ") + " UZS";
    };

    const totalBaseSalary = payrolls.reduce((acc, p) => acc + (p.baseSalary || 0), 0);
    const totalBonuses = payrolls.reduce((acc, p) => acc + (p.bonus || 0), 0);
    const totalDeductions = payrolls.reduce((acc, p) => acc + (p.deductions || 0), 0);
    const totalNetSalary = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);
    const paidCount = payrolls.filter((p) => p.status === "PAID").length;

    return (
        <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                        <span>💰</span> {t("title")}
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-300 p-1">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="text-xs font-bold uppercase p-1.5 bg-transparent focus:outline-none cursor-pointer"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                <option key={m} value={m}>
                                    {getMonthName(m)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="text-xs font-bold uppercase p-1.5 bg-transparent focus:outline-none cursor-pointer border-l border-gray-200"
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleRunAutoCalculation}
                        disabled={calculating}
                        className="px-4 py-2.5 bg-white text-black border-2 border-black text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <span>⚡</span>
                        {calculating ? t("calculating") : t("autoCalculate")}
                    </button>

                    <button
                        onClick={() => setIsManualModalOpen(true)}
                        className="px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                    >
                        + {t("newPayroll")}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-200 p-5 flex flex-col gap-1 shadow-xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {t("totalFund")}
                    </span>
                    <span className="text-xl font-black text-black tracking-tight">
                        {formatMoney(totalBaseSalary)}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                        {t("employeesCount", { count: payrolls.length })}
                    </span>
                </div>

                <div className="bg-white border border-gray-200 p-5 flex flex-col gap-1 shadow-xs">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                        {t("totalBonuses")}
                    </span>
                    <span className="text-xl font-black text-emerald-600 tracking-tight">
                        +{formatMoney(totalBonuses)}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                        {t("incentivePayments")}
                    </span>
                </div>

                <div className="bg-white border border-gray-200 p-5 flex flex-col gap-1 shadow-xs">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                        {t("totalDeductions")}
                    </span>
                    <span className="text-xl font-black text-rose-600 tracking-tight">
                        -{formatMoney(totalDeductions)}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                        {t("deductionsDesc")}
                    </span>
                </div>

                <div className="bg-white border-2 border-black p-5 flex flex-col gap-1 shadow-xs bg-slate-50">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">
                        {t("totalNet")}
                    </span>
                    <span className="text-xl font-black text-black tracking-tight">
                        {formatMoney(totalNetSalary)}
                    </span>
                    <span className="text-[11px] font-medium text-gray-600">
                        {t("netPayDesc")}
                    </span>
                </div>

                <div className="bg-white border border-gray-200 p-5 flex flex-col gap-1 shadow-xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {t("paidStatus")}
                    </span>
                    <span className="text-xl font-black text-black tracking-tight">
                        {paidCount} / {payrolls.length}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                        {t("paidPercentage", { percent: payrolls.length > 0 ? Math.round((paidCount / payrolls.length) * 100) : 0 })}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {[
                        { id: "ALL", label: t("all") },
                        { id: "PENDING", label: t("pending") },
                        { id: "PAID", label: t("paid") },
                        { id: "CANCELLED", label: t("cancelled") },
                    ].map((st) => (
                        <button
                            key={st.id}
                            onClick={() => setStatusFilter(st.id)}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                                statusFilter === st.id
                                    ? "bg-black text-white"
                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder={t("searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-black w-60"
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800"
                    >
                        {t("search")}
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="p-16 text-center text-xs font-bold uppercase tracking-wider text-gray-400 animate-pulse">
                    {t("loading")}
                </div>
            ) : payrolls.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 bg-white">
                    <span className="text-3xl">📊</span>
                    <p className="text-sm font-bold uppercase tracking-wider text-gray-700">
                        {t("emptyTitle", { month: getMonthName(selectedMonth), year: selectedYear })}
                    </p>
                    <p className="text-xs text-gray-400 max-w-md">
                        {t("emptyDesc")}
                    </p>
                    <button
                        onClick={handleRunAutoCalculation}
                        className="mt-2 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800"
                    >
                        {t("startAutoCalculate")}
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 overflow-x-auto shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <th className="p-4">{t("employee")}</th>
                                <th className="p-4">{t("departmentPosition")}</th>
                                <th className="p-4">{t("baseSalary")}</th>
                                <th className="p-4">{t("bonuses")}</th>
                                <th className="p-4">{t("deductions")}</th>
                                <th className="p-4">{t("netSalary")}</th>
                                <th className="p-4">{t("status")}</th>
                                <th className="p-4 text-right">{t("actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payrolls.map((p) => {
                                const emp = p.employee || {};
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase">
                                                    {emp.firstName ? emp.firstName[0] : "X"}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-black block">
                                                        {emp.firstName} {emp.lastName}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {emp.user?.email || ""}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-gray-700 block">
                                                {emp.department?.name || "-"}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {emp.position?.title || "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">
                                            {formatMoney(p.baseSalary)}
                                        </td>
                                        <td className="p-4 font-bold text-emerald-600">
                                            +{formatMoney(p.bonus)}
                                        </td>
                                        <td className="p-4 font-bold text-rose-600">
                                            -{formatMoney(p.deductions)}
                                        </td>
                                        <td className="p-4 font-black text-black text-sm">
                                            {formatMoney(p.netSalary)}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleStatusToggle(p.id, p.status)}
                                                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-xs border transition-transform active:scale-95 cursor-pointer ${
                                                    p.status === "PAID"
                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                                        : p.status === "CANCELLED"
                                                        ? "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                                                        : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                                                }`}
                                            >
                                                {p.status === "PAID" ? t("statusPaid") : p.status === "CANCELLED" ? t("statusCancelled") : t("statusPending")}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedPayslip(p)}
                                                    className="px-2.5 py-1 bg-gray-100 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors border border-gray-300"
                                                >
                                                    🧾 {t("viewPayslip")}
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePayroll(p.id)}
                                                    className="px-2 py-1 text-gray-400 hover:text-rose-600 text-xs font-bold transition-colors"
                                                    title={t("delete")}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {isAutoCalcModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b-2 border-black pb-4">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                                    <span>⚡</span> {t("autoCalcModalTitle")}
                                </h3>
                                <p className="text-xs font-medium text-gray-500">
                                    {t("autoCalcModalDesc", { month: getMonthName(selectedMonth), year: selectedYear })}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAutoCalcModalOpen(false)}
                                className="text-sm font-bold text-gray-500 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-x-auto border border-gray-200">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-600">
                                        <th className="p-3">{t("employee")}</th>
                                        <th className="p-3">{t("baseSalary")}</th>
                                        <th className="p-3">{t("attendancePenalties")}</th>
                                        <th className="p-3">{t("okrBonus")}</th>
                                        <th className="p-3">{t("netSalary")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {autoCalcResults.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                <span className="font-bold text-black block">{item.firstName} {item.lastName}</span>
                                                <span className="text-[10px] text-gray-400">{item.department} • {item.position}</span>
                                            </td>
                                            <td className="p-3 font-bold text-gray-700">
                                                {formatMoney(item.baseSalary)}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col text-[11px]">
                                                    <span className="text-gray-600">
                                                        {t("attendedDays", { attended: item.attendanceStats.attendedDays, total: item.attendanceStats.workingDays })}
                                                    </span>
                                                    {item.attendanceStats.lateDays > 0 && (
                                                        <span className="text-amber-600 font-bold">
                                                            {t("lateDays", { count: item.attendanceStats.lateDays })}
                                                        </span>
                                                    )}
                                                    {item.attendanceStats.totalAttendanceDeduction > 0 && (
                                                        <span className="text-rose-600 font-bold">
                                                            {t("penalty", { amount: formatMoney(item.attendanceStats.totalAttendanceDeduction) })}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col text-[11px]">
                                                    <span className="font-bold text-gray-700">
                                                        {t("okrProgress", { progress: item.okrStats.averageProgress })}
                                                    </span>
                                                    {item.okrStats.okrBonus > 0 && (
                                                        <span className="text-emerald-600 font-bold">
                                                            {t("bonusAmount", { amount: formatMoney(item.okrStats.okrBonus) })}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 font-black text-black text-sm">
                                                {formatMoney(item.netSalary)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-xs font-bold text-gray-500">
                                {t("totalCalculated", { count: autoCalcResults.length })}
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsAutoCalcModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    onClick={handleSaveBatchPayroll}
                                    disabled={batchGenerating}
                                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    {batchGenerating ? t("saving") : `💾 ${t("saveBatch")}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isManualModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                            <h3 className="text-sm font-black uppercase text-black">
                                {t("createModalTitle")}
                            </h3>
                            <button
                                onClick={() => setIsManualModalOpen(false)}
                                className="text-sm font-bold text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 text-xs">
                            <div>
                                <label className="block font-bold uppercase text-gray-500 mb-1">{t("employee")} *</label>
                                <select
                                    value={manualForm.employeeId}
                                    onChange={(e) => {
                                        const empId = e.target.value;
                                        const empObj = employees.find((emp) => emp.id === empId);
                                        setManualForm({
                                            ...manualForm,
                                            employeeId: empId,
                                            baseSalary: empObj?.salary ? empObj.salary.toString() : manualForm.baseSalary,
                                        });
                                    }}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-xs font-medium focus:outline-none focus:border-black"
                                    required
                                >
                                    <option value="">{t("selectEmployee")}</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} ({emp.department?.name || "-"})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-gray-500 mb-1">{t("baseSalaryLabel")} *</label>
                                <input
                                    type="number"
                                    placeholder="5000000"
                                    value={manualForm.baseSalary}
                                    onChange={(e) => setManualForm({ ...manualForm, baseSalary: e.target.value })}
                                    className="w-full p-2.5 bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-black"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-emerald-600 mb-1">{t("bonusesLabel")}</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={manualForm.bonus}
                                    onChange={(e) => setManualForm({ ...manualForm, bonus: e.target.value })}
                                    className="w-full p-2.5 bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-rose-600 mb-1">{t("deductionsLabel")}</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={manualForm.deductions}
                                    onChange={(e) => setManualForm({ ...manualForm, deductions: e.target.value })}
                                    className="w-full p-2.5 bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-black"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsManualModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase text-black hover:bg-gray-100"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-neutral-800"
                                >
                                    {t("save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <PayslipModal
                isOpen={!!selectedPayslip}
                onClose={() => setSelectedPayslip(null)}
                payroll={selectedPayslip}
            />
        </div>
    );
}
