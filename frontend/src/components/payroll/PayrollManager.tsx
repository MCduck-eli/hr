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
    fetchPenaltyRules,
    createPenaltyRule,
    updatePenaltyRule,
    deletePenaltyRule,
    fetchEmployeePenalties,
    createEmployeePenalty,
    deleteEmployeePenalty,
    fetchPayrollSchedule,
    updatePayrollSchedule,
    fetchDueReminders,
    fetchAdvances,
    createAdvance,
    updateAdvanceStatus,
    deleteAdvance,
    paySalary,
    fetchPaymentRecords,
    deletePaymentRecord,
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

    const [currentUserRole, setCurrentUserRole] = useState<string>("");
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

    const [isPenaltyRulesModalOpen, setIsPenaltyRulesModalOpen] = useState(false);
    const [penaltyRules, setPenaltyRules] = useState<any[]>([]);
    const [editingRule, setEditingRule] = useState<any | null>(null);
    const [ruleForm, setRuleForm] = useState({
        name: "",
        code: "",
        penaltyType: "FIXED",
        amount: "",
        isAuto: false,
        description: "",
    });

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

    const [isPenaltiesListModalOpen, setIsPenaltiesListModalOpen] = useState(false);
    const [employeePenalties, setEmployeePenalties] = useState<any[]>([]);

    const [dueReminders, setDueReminders] = useState<any | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        salaryPayDay: 5,
        advancePayDay: 20,
        advancePercentage: 40,
        isAdvanceEnabled: true,
        notificationLeadDays: 2,
    });

    const [isAddAdvanceModalOpen, setIsAddAdvanceModalOpen] = useState(false);
    const [advanceForm, setAdvanceForm] = useState({
        employeeId: "",
        amount: "",
        month: selectedMonth,
        year: selectedYear,
        dueDate: new Date().toISOString().split("T")[0],
        isEarly: false,
        reason: "",
    });

    const [isAdvancesListModalOpen, setIsAdvancesListModalOpen] = useState(false);
    const [advancesList, setAdvancesList] = useState<any[]>([]);

    const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
    const [paymentRecords, setPaymentRecords] = useState<any[]>([]);
    const [historyFilterType, setHistoryFilterType] = useState<string>("ALL");
    const [historySearch, setHistorySearch] = useState<string>("");

    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [payModalTarget, setPayModalTarget] = useState<{
        type: "SALARY" | "ADVANCE";
        id: string;
        name: string;
        amount: number;
    } | null>(null);
    const [payForm, setPayForm] = useState({
        paymentMethod: "BANK_CARD",
        note: "",
    });

    const getMonthName = (m: number) => {
        return t(`months.${m}` as any) || `${m}-oy`;
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setCurrentUserRole(parsed.role || "");
                }
            } catch (err) {
                console.error(err);
            }
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [payrollsData, usersData, rulesData, dueData] = await Promise.all([
                fetchAllPayrolls({
                    month: selectedMonth,
                    year: selectedYear,
                    status: statusFilter === "ALL" ? undefined : statusFilter,
                    search: searchQuery || undefined,
                }),
                fetchAllUsers(),
                fetchPenaltyRules().catch(() => []),
                fetchDueReminders().catch(() => null),
            ]);
            setPayrolls(payrollsData || []);
            const validEmployees = (usersData || [])
                .filter((u: any) => u.role !== "DIRECTOR" && u.role !== "SUPER_ADMIN")
                .map((u: any) => u.employee ? { ...u.employee, email: u.email } : null)
                .filter(Boolean);
            setEmployees(validEmployees);
            setPenaltyRules(rulesData || []);
            setDueReminders(dueData || null);
        } catch (err: any) {
            console.error("Failed to load payroll data", err);
        } finally {
            setLoading(false);
        }
    };

    const loadPenaltiesList = async () => {
        try {
            const data = await fetchEmployeePenalties({
                month: selectedMonth,
                year: selectedYear,
            });
            setEmployeePenalties(data || []);
        } catch (err: any) {
            console.error("Failed to load penalties", err);
        }
    };

    const loadAdvancesList = async () => {
        try {
            const data = await fetchAdvances({
                month: selectedMonth,
                year: selectedYear,
            });
            setAdvancesList(data || []);
        } catch (err: any) {
            console.error("Failed to load advances", err);
        }
    };

    const loadPaymentRecords = async () => {
        try {
            const data = await fetchPaymentRecords({
                month: selectedMonth,
                year: selectedYear,
                paymentType: historyFilterType === "ALL" ? undefined : historyFilterType,
                search: historySearch || undefined,
            });
            setPaymentRecords(data || []);
        } catch (err: any) {
            console.error("Failed to load payment records", err);
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

    const handleOpenPayModal = (item: {
        type: "SALARY" | "ADVANCE";
        id: string;
        name: string;
        amount: number;
    }) => {
        setPayModalTarget(item);
        setPayForm({
            paymentMethod: "BANK_CARD",
            note: "",
        });
        setIsPayModalOpen(true);
    };

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payModalTarget) return;

        try {
            if (payModalTarget.type === "SALARY") {
                await paySalary(payModalTarget.id, {
                    paymentMethod: payForm.paymentMethod,
                    note: payForm.note,
                });
                alert(t("salaryPaidSuccess"));
            } else {
                await updateAdvanceStatus(payModalTarget.id, {
                    status: "PAID",
                    paidDate: new Date().toISOString(),
                    paymentMethod: payForm.paymentMethod,
                    note: payForm.note,
                });
                alert(t("advancePaidSuccess"));
                if (isAdvancesListModalOpen) {
                    await loadAdvancesList();
                }
            }
            setIsPayModalOpen(false);
            setPayModalTarget(null);
            await loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleStatusToggle = async (payrollId: string, currentStatus: string, empName: string, netSalary: number) => {
        if (currentStatus === "PENDING") {
            handleOpenPayModal({
                type: "SALARY",
                id: payrollId,
                name: empName,
                amount: netSalary,
            });
        } else {
            const nextStatus = "PENDING";
            try {
                await updatePayrollStatus(payrollId, nextStatus as any);
                await loadData();
            } catch (err: any) {
                alert(err.message || "Error");
            }
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

    const handleOpenScheduleModal = async () => {
        try {
            const sched = await fetchPayrollSchedule();
            if (sched) {
                setScheduleForm({
                    salaryPayDay: sched.salaryPayDay || 5,
                    advancePayDay: sched.advancePayDay || 20,
                    advancePercentage: sched.advancePercentage || 40,
                    isAdvanceEnabled: sched.isAdvanceEnabled !== undefined ? sched.isAdvanceEnabled : true,
                    notificationLeadDays: sched.notificationLeadDays || 2,
                });
            }
            setIsScheduleModalOpen(true);
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleSaveSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updatePayrollSchedule({
                salaryPayDay: Number(scheduleForm.salaryPayDay),
                advancePayDay: Number(scheduleForm.advancePayDay),
                advancePercentage: Number(scheduleForm.advancePercentage),
                isAdvanceEnabled: Boolean(scheduleForm.isAdvanceEnabled),
                notificationLeadDays: Number(scheduleForm.notificationLeadDays),
            });
            setIsScheduleModalOpen(false);
            await loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleOpenAddAdvance = (preselectedEmpId?: string) => {
        const empId = preselectedEmpId || (employees[0]?.id || "");
        const emp = employees.find((e) => e.id === empId);
        const baseSal = emp?.salary || 5000000;
        const defaultAmt = Math.round(baseSal * ((scheduleForm.advancePercentage || 40) / 100));

        setAdvanceForm({
            employeeId: empId,
            amount: defaultAmt > 0 ? defaultAmt.toString() : "1000000",
            month: selectedMonth,
            year: selectedYear,
            dueDate: new Date().toISOString().split("T")[0],
            isEarly: false,
            reason: "",
        });
        setIsAddAdvanceModalOpen(true);
    };

    const handleSaveAdvance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!advanceForm.employeeId || !advanceForm.amount) return;

        try {
            await createAdvance({
                employeeId: advanceForm.employeeId,
                amount: parseFloat(advanceForm.amount),
                month: Number(advanceForm.month || selectedMonth),
                year: Number(advanceForm.year || selectedYear),
                dueDate: advanceForm.dueDate || undefined,
                isEarly: advanceForm.isEarly,
                reason: advanceForm.reason.trim() || undefined,
            });
            setIsAddAdvanceModalOpen(false);
            await loadData();
            if (isAdvancesListModalOpen) {
                await loadAdvancesList();
            }
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleOpenAdvancesList = async () => {
        await loadAdvancesList();
        setIsAdvancesListModalOpen(true);
    };

    const handleDeleteAdvance = async (advanceId: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        try {
            await deleteAdvance(advanceId);
            await loadAdvancesList();
            await loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleOpenPaymentHistory = async () => {
        await loadPaymentRecords();
        setIsPaymentHistoryModalOpen(true);
    };

    const handleDeletePaymentRecord = async (recordId: string) => {
        if (currentUserRole !== "DIRECTOR" && currentUserRole !== "SUPER_ADMIN") {
            alert(t("onlyDirectorCanDelete"));
            return;
        }

        if (!confirm(t("deleteHistoryConfirm"))) return;

        try {
            await deletePaymentRecord(recordId);
            await loadPaymentRecords();
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleOpenPenaltyRules = async () => {
        try {
            const rules = await fetchPenaltyRules();
            setPenaltyRules(rules || []);
            setEditingRule(null);
            setRuleForm({
                name: "",
                code: "",
                penaltyType: "FIXED",
                amount: "",
                isAuto: false,
                description: "",
            });
            setIsPenaltyRulesModalOpen(true);
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleForm.name || !ruleForm.code || !ruleForm.amount) return;

        try {
            if (editingRule) {
                await updatePenaltyRule(editingRule.id, {
                    name: ruleForm.name,
                    penaltyType: ruleForm.penaltyType,
                    amount: parseFloat(ruleForm.amount),
                    isAuto: ruleForm.isAuto,
                    description: ruleForm.description,
                });
            } else {
                await createPenaltyRule({
                    name: ruleForm.name,
                    code: ruleForm.code,
                    penaltyType: ruleForm.penaltyType,
                    amount: parseFloat(ruleForm.amount),
                    isAuto: ruleForm.isAuto,
                    description: ruleForm.description,
                });
            }
            const updated = await fetchPenaltyRules();
            setPenaltyRules(updated || []);
            setEditingRule(null);
            setRuleForm({
                name: "",
                code: "",
                penaltyType: "FIXED",
                amount: "",
                isAuto: false,
                description: "",
            });
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm(t("deleteRuleConfirm"))) return;
        try {
            await deletePenaltyRule(ruleId);
            const updated = await fetchPenaltyRules();
            setPenaltyRules(updated || []);
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleOpenAddPenalty = (preselectedEmpId?: string) => {
        setPenaltyForm({
            employeeId: preselectedEmpId || (employees[0]?.id || ""),
            ruleId: "",
            reason: "",
            amount: "",
            month: selectedMonth,
            year: selectedYear,
            date: new Date().toISOString().split("T")[0],
        });
        setIsAddPenaltyModalOpen(true);
    };

    const handleRuleSelectInPenaltyForm = (ruleId: string) => {
        const found = penaltyRules.find((r) => r.id === ruleId);
        if (found) {
            setPenaltyForm({
                ...penaltyForm,
                ruleId,
                reason: found.name,
                amount: found.amount ? found.amount.toString() : penaltyForm.amount,
            });
        } else {
            setPenaltyForm({
                ...penaltyForm,
                ruleId: "",
            });
        }
    };

    const handleSaveEmployeePenalty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!penaltyForm.employeeId || !penaltyForm.reason || !penaltyForm.amount) {
            return;
        }

        try {
            await createEmployeePenalty({
                employeeId: penaltyForm.employeeId,
                ruleId: penaltyForm.ruleId && penaltyForm.ruleId.trim() !== "" ? penaltyForm.ruleId : undefined,
                reason: penaltyForm.reason.trim(),
                amount: parseFloat(penaltyForm.amount),
                month: Number(penaltyForm.month || selectedMonth),
                year: Number(penaltyForm.year || selectedYear),
                date: penaltyForm.date || new Date().toISOString().split("T")[0],
            });
            setIsAddPenaltyModalOpen(false);
            await loadData();
            if (isPenaltiesListModalOpen) {
                await loadPenaltiesList();
            }
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleOpenPenaltiesList = async () => {
        await loadPenaltiesList();
        setIsPenaltiesListModalOpen(true);
    };

    const handleDeletePenalty = async (penaltyId: string) => {
        if (!confirm(t("deletePenaltyConfirm"))) return;
        try {
            await deleteEmployeePenalty(penaltyId);
            await loadPenaltiesList();
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

    const hasDueSalaries = dueReminders?.salaryDue?.isDue && (dueReminders?.salaryDue?.pendingCount > 0);
    const hasDueAdvances = dueReminders?.advanceDue?.isDue && (dueReminders?.advanceDue?.pendingCount > 0);

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

                <div className="flex flex-wrap items-center gap-2.5">
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
                        className="px-3.5 py-2.5 bg-white text-black border-2 border-black text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <span>⚡</span>
                        {calculating ? t("calculating") : t("autoCalculate")}
                    </button>

                    <button
                        onClick={handleOpenScheduleModal}
                        className="px-3.5 py-2.5 bg-indigo-50 text-indigo-900 border border-indigo-300 text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                        {t("scheduleBtn")}
                    </button>

                    <button
                        onClick={() => handleOpenAddAdvance()}
                        className="px-3.5 py-2.5 bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                        {t("addAdvanceBtn")}
                    </button>

                    <button
                        onClick={handleOpenAdvancesList}
                        className="px-3.5 py-2.5 bg-teal-50 text-teal-900 border border-teal-300 text-xs font-bold uppercase tracking-wider hover:bg-teal-100 transition-colors flex items-center gap-1.5"
                    >
                        {t("advancesListBtn")}
                    </button>

                    <button
                        onClick={handleOpenPaymentHistory}
                        className="px-3.5 py-2.5 bg-purple-50 text-purple-900 border border-purple-300 text-xs font-bold uppercase tracking-wider hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                    >
                        {t("paymentHistoryBtn")}
                    </button>

                    <button
                        onClick={handleOpenPenaltyRules}
                        className="px-3.5 py-2.5 bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                    >
                        {t("penaltyRulesBtn")}
                    </button>

                    <button
                        onClick={() => handleOpenAddPenalty()}
                        className="px-3.5 py-2.5 bg-rose-50 text-rose-900 border border-rose-300 text-xs font-bold uppercase tracking-wider hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    >
                        {t("addPenaltyBtn")}
                    </button>

                    <button
                        onClick={handleOpenPenaltiesList}
                        className="px-3.5 py-2.5 bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                    >
                        {t("penaltiesListBtn")}
                    </button>

                    <button
                        onClick={() => setIsManualModalOpen(true)}
                        className="px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                    >
                        + {t("newPayroll")}
                    </button>
                </div>
            </div>

            {(hasDueSalaries || hasDueAdvances) && (
                <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border-2 border-amber-400 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">🔔</span>
                        <div>
                            <h4 className="text-xs font-black uppercase text-amber-900 tracking-wide">
                                {t("dueBannerTitle")}
                            </h4>
                            <p className="text-xs font-medium text-gray-700 mt-0.5">
                                {t("dueBannerDesc")}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                                {hasDueSalaries && (
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                                        📅 {t("dueSalaryNotice", { count: dueReminders.salaryDue.pendingCount, month: getMonthName(selectedMonth) })}
                                    </span>
                                )}
                                {hasDueAdvances && (
                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                                        💳 {t("dueAdvanceNotice", { count: dueReminders.advanceDue.pendingCount })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-center">
                        {hasDueAdvances && (
                            <button
                                onClick={handleOpenAdvancesList}
                                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors"
                            >
                                {t("advancesListBtn")}
                            </button>
                        )}
                        <button
                            onClick={handleOpenScheduleModal}
                            className="px-3.5 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                        >
                            {t("scheduleBtn")}
                        </button>
                    </div>
                </div>
            )}

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
                                const empFullName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
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
                                                onClick={() => handleStatusToggle(p.id, p.status, empFullName, p.netSalary)}
                                                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-xs border transition-transform active:scale-95 cursor-pointer ${
                                                    p.status === "PAID"
                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                                        : p.status === "CANCELLED"
                                                        ? "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                                                        : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                                                }`}
                                            >
                                                {p.status === "PAID" ? t("statusPaid") : p.status === "CANCELLED" ? t("statusCancelled") : `💰 ${t("paySalaryBtn")}`}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenAddAdvance(emp.id)}
                                                    className="px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-200"
                                                    title={t("addAdvanceBtn")}
                                                >
                                                    💳 {t("advanceBtn")}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAddPenalty(emp.id)}
                                                    className="px-2 py-1 bg-rose-50 text-rose-800 text-[10px] font-bold uppercase hover:bg-rose-600 hover:text-white transition-colors border border-rose-200"
                                                    title={t("addPenaltyBtn")}
                                                >
                                                    ✍️ {t("addPenaltyBtn")}
                                                </button>
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
                                        <th className="p-3">{t("manualPenaltiesBreakdown")}</th>
                                        <th className="p-3">{t("advanceBtn")}</th>
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
                                                            -{formatMoney(item.attendanceStats.totalAttendanceDeduction)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {item.manualPenalties && item.manualPenalties.length > 0 ? (
                                                    <div className="flex flex-col gap-1 text-[10px]">
                                                        {item.manualPenalties.map((mp: any) => (
                                                            <div key={mp.id} className="text-rose-700 font-medium">
                                                                • {mp.reason}: <span className="font-bold">-{formatMoney(mp.amount)}</span>
                                                            </div>
                                                        ))}
                                                        <span className="font-bold text-rose-800 text-[11px]">
                                                            {t("totalManualPenalties", { amount: formatMoney(item.manualPenaltiesTotal) })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-[11px]">-</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {item.advances && item.advances.length > 0 ? (
                                                    <div className="flex flex-col gap-1 text-[10px]">
                                                        {item.advances.map((adv: any) => (
                                                            <div key={adv.id} className="text-emerald-700 font-medium">
                                                                • {adv.reason || t("typeAdvance")}: <span className="font-bold">-{formatMoney(adv.amount)}</span>
                                                            </div>
                                                        ))}
                                                        <span className="font-bold text-emerald-800 text-[11px]">
                                                            {t("totalAdvances", { amount: formatMoney(item.advancesTotal) })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-[11px]">-</span>
                                                )}
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

            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                            <h3 className="text-sm font-black uppercase text-black flex items-center gap-2">
                                <span>📅</span> {t("scheduleModalTitle")}
                            </h3>
                            <button
                                onClick={() => setIsScheduleModalOpen(false)}
                                className="text-sm font-bold text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            {t("scheduleModalDesc")}
                        </p>

                        <form onSubmit={handleSaveSchedule} className="flex flex-col gap-3 text-xs">
                            <div>
                                <label className="block font-bold uppercase text-gray-700 mb-1">
                                    {t("salaryPayDayLabel")}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="28"
                                    required
                                    value={scheduleForm.salaryPayDay}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, salaryPayDay: parseInt(e.target.value, 10) || 5 })}
                                    className="w-full p-2.5 bg-white border border-gray-300 font-bold focus:outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-gray-700 mb-1">
                                    {t("advancePayDayLabel")}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="28"
                                    required
                                    value={scheduleForm.advancePayDay}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, advancePayDay: parseInt(e.target.value, 10) || 20 })}
                                    className="w-full p-2.5 bg-white border border-gray-300 font-bold focus:outline-none focus:border-black"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold uppercase text-gray-700 mb-1">
                                        {t("advancePercentageLabel")}
                                    </label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="80"
                                        required
                                        value={scheduleForm.advancePercentage}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, advancePercentage: parseFloat(e.target.value) || 40 })}
                                        className="w-full p-2.5 bg-white border border-gray-300 font-bold focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold uppercase text-gray-700 mb-1">
                                        {t("notificationLeadDaysLabel")}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="7"
                                        required
                                        value={scheduleForm.notificationLeadDays}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, notificationLeadDays: parseInt(e.target.value, 10) || 2 })}
                                        className="w-full p-2.5 bg-white border border-gray-300 font-bold focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-black">
                                    <input
                                        type="checkbox"
                                        checked={scheduleForm.isAdvanceEnabled}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, isAdvanceEnabled: e.target.checked })}
                                        className="w-4 h-4 accent-black"
                                    />
                                    <span>{t("isAdvanceEnabledLabel")}</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase text-black hover:bg-gray-100"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-neutral-800"
                                >
                                    {t("saveSchedule")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddAdvanceModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                            <h3 className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                                <span>💳</span> {t("advanceModalTitle")}
                            </h3>
                            <button
                                onClick={() => setIsAddAdvanceModalOpen(false)}
                                className="text-sm font-bold text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            {t("advanceModalDesc")}
                        </p>

                        <form onSubmit={handleSaveAdvance} className="flex flex-col gap-3 text-xs">
                            <div>
                                <label className="block font-bold uppercase text-gray-600 mb-1">{t("employee")} *</label>
                                <select
                                    value={advanceForm.employeeId}
                                    onChange={(e) => {
                                        const empId = e.target.value;
                                        const emp = employees.find((em) => em.id === empId);
                                        const baseSal = emp?.salary || 5000000;
                                        const defaultAmt = Math.round(baseSal * ((scheduleForm.advancePercentage || 40) / 100));
                                        setAdvanceForm({
                                            ...advanceForm,
                                            employeeId: empId,
                                            amount: defaultAmt > 0 ? defaultAmt.toString() : advanceForm.amount,
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

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold uppercase text-emerald-600 mb-1">{t("advanceAmount")}</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="2000000"
                                        value={advanceForm.amount}
                                        onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                                        className="w-full p-2.5 bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold uppercase text-gray-600 mb-1">{t("advanceDueDate")}</label>
                                    <input
                                        type="date"
                                        required
                                        value={advanceForm.dueDate}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            let m = selectedMonth;
                                            let y = selectedYear;
                                            if (val) {
                                                const parts = val.split("-");
                                                if (parts.length === 3) {
                                                    y = parseInt(parts[0], 10);
                                                    m = parseInt(parts[1], 10);
                                                }
                                            }
                                            setAdvanceForm({ ...advanceForm, dueDate: val, month: m, year: y });
                                        }}
                                        className="w-full p-2 bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                                    <input
                                        type="checkbox"
                                        checked={advanceForm.isEarly}
                                        onChange={(e) => setAdvanceForm({ ...advanceForm, isEarly: e.target.checked })}
                                        className="w-4 h-4 accent-amber-600"
                                    />
                                    <span>⚡ {t("isEarlyAdvance")}</span>
                                </label>
                                <p className="text-[10px] text-amber-800 mt-1">
                                    {t("isEarlyAdvanceDesc")}
                                </p>
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-gray-600 mb-1">{t("advanceReason")}</label>
                                <input
                                    type="text"
                                    placeholder={t("advanceReasonPlaceholder")}
                                    value={advanceForm.reason}
                                    onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                                    className="w-full p-2.5 bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-black"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddAdvanceModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase text-black hover:bg-gray-100"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-neutral-800"
                                >
                                    {t("saveAdvance")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAdvancesListModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <div>
                                <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
                                    <span>💳</span> {t("advancesListModalTitle", { month: getMonthName(selectedMonth), year: selectedYear })}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {t("advancesListModalDesc")}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAdvancesListModalOpen(false)}
                                className="text-sm font-bold text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        {advancesList.length === 0 ? (
                            <div className="p-12 text-center border border-dashed border-gray-300 text-xs font-bold uppercase text-gray-400">
                                {t("noAdvances")}
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-600">
                                            <th className="p-3">{t("employee")}</th>
                                            <th className="p-3">{t("advanceDueDate")}</th>
                                            <th className="p-3">{t("amount")}</th>
                                            <th className="p-3">{t("advanceReason")}</th>
                                            <th className="p-3">{t("status")}</th>
                                            <th className="p-3 text-right">{t("actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {advancesList.map((adv) => {
                                            const empFullName = `${adv.employee?.firstName || ""} ${adv.employee?.lastName || ""}`.trim();
                                            return (
                                                <tr key={adv.id} className="hover:bg-gray-50">
                                                    <td className="p-3">
                                                        <span className="font-bold text-black block">
                                                            {empFullName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {adv.employee?.department?.name || "-"} • {adv.employee?.position?.title || "-"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-mono text-gray-600">
                                                        {adv.dueDate ? new Date(adv.dueDate).toISOString().split("T")[0] : "-"}
                                                        {adv.isEarly && (
                                                            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-bold">
                                                                {t("earlyAdvanceBadge")}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 font-black text-emerald-700 text-sm">
                                                        {formatMoney(adv.amount)}
                                                    </td>
                                                    <td className="p-3 text-gray-700">
                                                        {adv.reason || "-"}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-xs ${
                                                            adv.status === "PAID"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-amber-100 text-amber-800"
                                                        }`}>
                                                            {adv.status === "PAID" ? t("statusPaid") : t("statusPending")}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {adv.status !== "PAID" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenPayModal({
                                                                        type: "ADVANCE",
                                                                        id: adv.id,
                                                                        name: empFullName,
                                                                        amount: adv.amount,
                                                                    })}
                                                                    className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700"
                                                                >
                                                                    💰 {t("markAsPaid")}
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAdvance(adv.id)}
                                                                className="px-2 py-1 text-gray-400 hover:text-rose-600 font-bold"
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

                        <div className="flex justify-between items-center pt-2">
                            <button
                                type="button"
                                onClick={() => handleOpenAddAdvance()}
                                className="px-4 py-2 bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold uppercase hover:bg-emerald-100"
                            >
                                + {t("addAdvanceBtn")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAdvancesListModalOpen(false)}
                                className="px-6 py-2 bg-black text-white text-xs font-bold uppercase"
                            >
                                {t("close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPaymentHistoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <div>
                                <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
                                    <span>🏛️</span> {t("paymentHistoryModalTitle")}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {t("paymentHistoryModalDesc")}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPaymentHistoryModalOpen(false)}
                                className="text-sm font-bold text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 border border-gray-200 text-xs">
                            <div className="flex items-center gap-2">
                                {[
                                    { id: "ALL", label: t("all") },
                                    { id: "SALARY", label: t("typeSalary") },
                                    { id: "ADVANCE", label: t("typeAdvance") },
                                ].map((flt) => (
                                    <button
                                        key={flt.id}
                                        type="button"
                                        onClick={async () => {
                                            setHistoryFilterType(flt.id);
                                            const data = await fetchPaymentRecords({
                                                month: selectedMonth,
                                                year: selectedYear,
                                                paymentType: flt.id === "ALL" ? undefined : flt.id,
                                                search: historySearch || undefined,
                                            });
                                            setPaymentRecords(data || []);
                                        }}
                                        className={`px-3 py-1 font-bold uppercase ${
                                            historyFilterType === flt.id
                                                ? "bg-black text-white"
                                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        {flt.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder={t("searchPlaceholder")}
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="px-2.5 py-1 bg-white border border-gray-300 font-medium text-xs focus:outline-none focus:border-black"
                                />
                                <button
                                    type="button"
                                    onClick={loadPaymentRecords}
                                    className="px-3 py-1 bg-black text-white text-xs font-bold uppercase"
                                >
                                    {t("search")}
                                </button>
                            </div>
                        </div>

                        {paymentRecords.length === 0 ? (
                            <div className="p-12 text-center border border-dashed border-gray-300 text-xs font-bold uppercase text-gray-400">
                                {t("noPaymentRecords")}
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-600">
                                            <th className="p-3">{t("employee")}</th>
                                            <th className="p-3">{t("paymentType")}</th>
                                            <th className="p-3">{t("paidAt")}</th>
                                            <th className="p-3">{t("amount")}</th>
                                            <th className="p-3">{t("paymentMethod")}</th>
                                            <th className="p-3">{t("advanceReason")}</th>
                                            <th className="p-3 text-right">{t("actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paymentRecords.map((rec) => {
                                            const empFullName = `${rec.employee?.firstName || ""} ${rec.employee?.lastName || ""}`.trim();
                                            return (
                                                <tr key={rec.id} className="hover:bg-gray-50">
                                                    <td className="p-3">
                                                        <span className="font-bold text-black block">
                                                            {empFullName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {rec.employee?.department?.name || "-"} • {rec.employee?.position?.title || "-"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-xs ${
                                                            rec.paymentType === "SALARY"
                                                                ? "bg-indigo-100 text-indigo-900"
                                                                : "bg-emerald-100 text-emerald-900"
                                                        }`}>
                                                            {rec.paymentType === "SALARY" ? t("typeSalary") : t("typeAdvance")}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-mono text-gray-600">
                                                        {rec.paidAt ? new Date(rec.paidAt).toLocaleDateString() : "-"}
                                                    </td>
                                                    <td className="p-3 font-black text-black text-sm">
                                                        {formatMoney(rec.amount)}
                                                    </td>
                                                    <td className="p-3 text-gray-700">
                                                        {rec.paymentMethod === "CASH" ? t("methodCash") : rec.paymentMethod === "TRANSFER" ? t("methodTransfer") : t("methodBankCard")}
                                                    </td>
                                                    <td className="p-3 text-gray-600">
                                                        {rec.note || "-"}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {(currentUserRole === "DIRECTOR" || currentUserRole === "SUPER_ADMIN") ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeletePaymentRecord(rec.id)}
                                                                className="px-2 py-1 text-gray-400 hover:text-rose-600 font-bold text-xs"
                                                                title={t("delete")}
                                                            >
                                                                ✕
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 font-medium">🔒</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setIsPaymentHistoryModalOpen(false)}
                                className="px-6 py-2 bg-black text-white text-xs font-bold uppercase"
                            >
                                {t("close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPayModalOpen && payModalTarget && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                            <h3 className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                                <span>💰</span> {t("payModalTitle")}
                            </h3>
                            <button
                                onClick={() => setIsPayModalOpen(false)}
                                className="text-sm font-bold text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 bg-gray-50 border border-gray-200 flex flex-col gap-1.5 text-xs">
                            <span className="text-gray-500 font-bold uppercase">{t("employee")}:</span>
                            <span className="text-sm font-black text-black">{payModalTarget.name}</span>
                            <span className="text-gray-500 font-bold uppercase mt-2">{t("netSalary")}:</span>
                            <span className="text-lg font-black text-emerald-600">{formatMoney(payModalTarget.amount)}</span>
                        </div>

                        <form onSubmit={handleConfirmPayment} className="flex flex-col gap-3 text-xs">
                            <div>
                                <label className="block font-bold uppercase text-gray-600 mb-1">
                                    {t("selectPaymentMethod")}
                                </label>
                                <select
                                    value={payForm.paymentMethod}
                                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                                    className="w-full p-2.5 bg-white border border-gray-300 font-medium focus:outline-none focus:border-black"
                                >
                                    <option value="BANK_CARD">{t("methodBankCard")}</option>
                                    <option value="CASH">{t("methodCash")}</option>
                                    <option value="TRANSFER">{t("methodTransfer")}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-gray-600 mb-1">
                                    {t("paymentNote")}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Tranzaksiya raqami yoki izoh..."
                                    value={payForm.note}
                                    onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                                    className="w-full p-2.5 bg-white border border-gray-300 font-medium focus:outline-none focus:border-black"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPayModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase text-black hover:bg-gray-100"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold uppercase hover:bg-emerald-700"
                                >
                                    {t("confirmPayment")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPenaltyRulesModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <div>
                                <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
                                    <span>⚠️</span> {t("penaltyRulesModalTitle")}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {t("penaltyRulesModalDesc")}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPenaltyRulesModalOpen(false)}
                                className="text-sm font-bold text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveRule} className="p-4 bg-gray-50 border border-gray-200 flex flex-col gap-3">
                            <h4 className="text-xs font-black uppercase text-black">
                                {editingRule ? t("editRule") : t("addRuleBtn")}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                    <label className="block font-bold uppercase text-gray-600 mb-1">{t("ruleName")} *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Sababsiz kelmaslik"
                                        value={ruleForm.name}
                                        onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                                        className="w-full p-2 bg-white border border-gray-300 font-medium focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold uppercase text-gray-600 mb-1">{t("ruleCode")} *</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!!editingRule}
                                        placeholder="ABSENCE"
                                        value={ruleForm.code}
                                        onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase() })}
                                        className="w-full p-2 bg-white border border-gray-300 font-bold uppercase focus:outline-none focus:border-black disabled:bg-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold uppercase text-gray-600 mb-1">{t("ruleType")} *</label>
                                    <select
                                        value={ruleForm.penaltyType}
                                        onChange={(e) => setRuleForm({ ...ruleForm, penaltyType: e.target.value })}
                                        className="w-full p-2 bg-white border border-gray-300 font-medium focus:outline-none focus:border-black"
                                    >
                                        <option value="FIXED">{t("typeFixed")}</option>
                                        <option value="PERCENT">{t("typePercent")}</option>
                                        <option value="PER_MINUTE">{t("typePerMinute")}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-center">
                                <div>
                                    <label className="block font-bold uppercase text-gray-600 mb-1">{t("ruleAmount")} *</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="50000"
                                        value={ruleForm.amount}
                                        onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                                        className="w-full p-2 bg-white border border-gray-300 font-bold focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold uppercase text-gray-600 mb-1">{t("ruleDesc")}</label>
                                    <input
                                        type="text"
                                        placeholder="Qoida tavsifi..."
                                        value={ruleForm.description}
                                        onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                                        className="w-full p-2 bg-white border border-gray-300 font-medium focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-4">
                                    <label className="flex items-center gap-2 cursor-pointer font-bold text-black">
                                        <input
                                            type="checkbox"
                                            checked={ruleForm.isAuto}
                                            onChange={(e) => setRuleForm({ ...ruleForm, isAuto: e.target.checked })}
                                            className="w-4 h-4 accent-black"
                                        />
                                        <span>{t("ruleAuto")}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                                {editingRule && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingRule(null);
                                            setRuleForm({ name: "", code: "", penaltyType: "FIXED", amount: "", isAuto: false, description: "" });
                                        }}
                                        className="px-3 py-1.5 border border-gray-300 text-xs font-bold uppercase"
                                    >
                                        {t("cancel")}
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800"
                                >
                                    {t("save")}
                                </button>
                            </div>
                        </form>

                        <div className="overflow-x-auto border border-gray-200">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-600">
                                        <th className="p-3">{t("ruleName")}</th>
                                        <th className="p-3">{t("ruleCode")}</th>
                                        <th className="p-3">{t("ruleType")}</th>
                                        <th className="p-3">{t("ruleAmount")}</th>
                                        <th className="p-3">{t("ruleAuto")}</th>
                                        <th className="p-3 text-right">{t("actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {penaltyRules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                <span className="font-bold text-black block">{rule.name}</span>
                                                {rule.description && <span className="text-[10px] text-gray-500">{rule.description}</span>}
                                            </td>
                                            <td className="p-3 font-mono font-bold text-gray-700">{rule.code}</td>
                                            <td className="p-3 font-medium text-gray-700">
                                                {rule.penaltyType === "PERCENT" ? t("typePercent") : rule.penaltyType === "PER_MINUTE" ? t("typePerMinute") : t("typeFixed")}
                                            </td>
                                            <td className="p-3 font-bold text-black">
                                                {rule.penaltyType === "PERCENT" ? `${rule.amount}%` : formatMoney(rule.amount)}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-xs ${rule.isAuto ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                                                    {rule.isAuto ? t("autoEnabled") : t("autoDisabled")}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingRule(rule);
                                                            setRuleForm({
                                                                name: rule.name,
                                                                code: rule.code,
                                                                penaltyType: rule.penaltyType,
                                                                amount: rule.amount.toString(),
                                                                isAuto: rule.isAuto,
                                                                description: rule.description || "",
                                                            });
                                                        }}
                                                        className="px-2 py-1 bg-gray-100 text-[10px] font-bold uppercase hover:bg-black hover:text-white"
                                                    >
                                                        {t("editRule")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                        className="px-2 py-1 text-gray-400 hover:text-rose-600 font-bold"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setIsPenaltyRulesModalOpen(false)}
                                className="px-5 py-2 bg-black text-white text-xs font-bold uppercase"
                            >
                                {t("close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddPenaltyModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-black pb-3">
                            <h3 className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                                <span>✍️</span> {t("addPenaltyModalTitle")}
                            </h3>
                            <button
                                onClick={() => setIsAddPenaltyModalOpen(false)}
                                className="text-sm font-bold text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveEmployeePenalty} className="flex flex-col gap-3 text-xs">
                            <div>
                                <label className="block font-bold uppercase text-gray-600 mb-1">{t("employee")} *</label>
                                <select
                                    value={penaltyForm.employeeId}
                                    onChange={(e) => setPenaltyForm({ ...penaltyForm, employeeId: e.target.value })}
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
                                <label className="block font-bold uppercase text-gray-600 mb-1">{t("selectRule")}</label>
                                <select
                                    value={penaltyForm.ruleId}
                                    onChange={(e) => handleRuleSelectInPenaltyForm(e.target.value)}
                                    className="w-full p-2.5 bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-black"
                                >
                                    <option value="">{t("selectRule")}</option>
                                    {penaltyRules.map((rule) => (
                                        <option key={rule.id} value={rule.id}>
                                            {rule.name} ({formatMoney(rule.amount)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold uppercase text-gray-600 mb-1">{t("customReason")}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t("customReasonPlaceholder")}
                                    value={penaltyForm.reason}
                                    onChange={(e) => setPenaltyForm({ ...penaltyForm, reason: e.target.value })}
                                    className="w-full p-2.5 bg-white border border-gray-300 text-xs font-medium focus:outline-none focus:border-black"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold uppercase text-rose-600 mb-1">{t("penaltyAmount")}</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="100000"
                                        value={penaltyForm.amount}
                                        onChange={(e) => setPenaltyForm({ ...penaltyForm, amount: e.target.value })}
                                        className="w-full p-2.5 bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold uppercase text-gray-600 mb-1">{t("penaltyDate")}</label>
                                    <input
                                        type="date"
                                        required
                                        value={penaltyForm.date}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            let m = selectedMonth;
                                            let y = selectedYear;
                                            if (val) {
                                                const parts = val.split("-");
                                                if (parts.length === 3) {
                                                    y = parseInt(parts[0], 10);
                                                    m = parseInt(parts[1], 10);
                                                }
                                            }
                                            setPenaltyForm({ ...penaltyForm, date: val, month: m, year: y });
                                        }}
                                        className="w-full p-2 bg-white border border-gray-300 text-xs font-bold focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddPenaltyModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase text-black hover:bg-gray-100"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-neutral-800"
                                >
                                    {t("savePenalty")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPenaltiesListModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <div>
                                <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
                                    <span>📋</span> {t("penaltiesListModalTitle", { month: getMonthName(selectedMonth), year: selectedYear })}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {t("penaltiesListModalDesc")}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPenaltiesListModalOpen(false)}
                                className="text-sm font-bold text-gray-400 hover:text-black"
                            >
                                ✕
                            </button>
                        </div>

                        {employeePenalties.length === 0 ? (
                            <div className="p-12 text-center border border-dashed border-gray-300 text-xs font-bold uppercase text-gray-400">
                                {t("noPenalties")}
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-600">
                                            <th className="p-3">{t("employee")}</th>
                                            <th className="p-3">{t("date")}</th>
                                            <th className="p-3">{t("reason")}</th>
                                            <th className="p-3">{t("amount")}</th>
                                            <th className="p-3 text-right">{t("actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {employeePenalties.map((pen) => (
                                            <tr key={pen.id} className="hover:bg-gray-50">
                                                <td className="p-3">
                                                    <span className="font-bold text-black block">
                                                        {pen.employee?.firstName} {pen.employee?.lastName}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {pen.employee?.department?.name || "-"} • {pen.employee?.position?.title || "-"}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-mono text-gray-600">
                                                    {pen.date ? new Date(pen.date).toISOString().split("T")[0] : "-"}
                                                </td>
                                                <td className="p-3 font-medium text-gray-800">
                                                    {pen.reason}
                                                    {pen.rule && <span className="block text-[10px] text-gray-400">({pen.rule.name})</span>}
                                                </td>
                                                <td className="p-3 font-black text-rose-600 text-sm">
                                                    -{formatMoney(pen.amount)}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePenalty(pen.id)}
                                                        className="px-2 py-1 text-gray-400 hover:text-rose-600 font-bold"
                                                        title={t("delete")}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <button
                                type="button"
                                onClick={() => handleOpenAddPenalty()}
                                className="px-4 py-2 bg-rose-50 text-rose-900 border border-rose-300 text-xs font-bold uppercase hover:bg-rose-100"
                            >
                                + {t("addPenaltyBtn")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPenaltiesListModalOpen(false)}
                                className="px-6 py-2 bg-black text-white text-xs font-bold uppercase"
                            >
                                {t("close")}
                            </button>
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
