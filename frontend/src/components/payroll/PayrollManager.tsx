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
    clearAllPaymentRecords,
    fetchPenaltiesSummary,
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
    const [penaltySummaries, setPenaltySummaries] = useState<Record<string, any>>({});
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
            const [payrollsData, usersData, dueData, advancesData, penaltiesData] = await Promise.all([
                fetchAllPayrolls({
                    month: selectedMonth,
                    year: selectedYear,
                    status: statusFilter === "ALL" ? undefined : statusFilter,
                    search: searchQuery || undefined,
                }),
                fetchAllUsers(),
                fetchDueReminders().catch(() => null),
                fetchAdvances({
                    month: selectedMonth,
                    year: selectedYear,
                }).catch(() => []),
                fetchPenaltiesSummary({
                    month: selectedMonth,
                    year: selectedYear,
                }).catch(() => null),
            ]);
            setPayrolls(payrollsData || []);
            setAdvancesList(advancesData || []);

            const pMap: Record<string, any> = {};
            if (penaltiesData?.employeeSummaries) {
                penaltiesData.employeeSummaries.forEach((s: any) => {
                    pMap[s.employeeId] = s;
                });
            }
            setPenaltySummaries(pMap);

            const validEmployees = (usersData || [])
                .filter((u: any) => u.role !== "DIRECTOR" && u.role !== "SUPER_ADMIN")
                .map((u: any) => u.employee ? { ...u.employee, email: u.email } : null)
                .filter(Boolean);
            setEmployees(validEmployees);
            setDueReminders(dueData || null);
        } catch (err: any) {
            console.error("Failed to load payroll data", err);
        } finally {
            setLoading(false);
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
                alert(t("salaryDisbursedSuccess"));
            } else {
                await updateAdvanceStatus(payModalTarget.id, {
                    status: "AWAITING_CONFIRMATION",
                    paidDate: new Date().toISOString(),
                    paymentMethod: payForm.paymentMethod,
                    note: payForm.note,
                });
                alert(t("advanceDisbursedSuccess"));
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
        } else if (currentStatus === "AWAITING_CONFIRMATION") {
            alert(t("pendingSalaryConfirmAlert"));
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

    const getEmployeeAvailableAdvanceLimit = (empId: string, month: number, year: number) => {
        const emp = employees.find((e) => e.id === empId);
        const baseSal = emp?.salary || 5000000;
        const targetPayroll = payrolls.find((p) => p.employeeId === empId && p.month === month && p.year === year);
        const isSalaryPaid = targetPayroll?.status === "PAID";
        let cutoffDay = 1;
        if (isSalaryPaid) {
            if (targetPayroll?.disbursedAt) {
                cutoffDay = new Date(targetPayroll.disbursedAt).getDate();
            } else if (targetPayroll?.confirmedAt) {
                cutoffDay = Math.min(new Date(targetPayroll.confirmedAt).getDate(), 5);
            } else {
                cutoffDay = 5;
            }
        }

        const startFromDay = isSalaryPaid && month === (new Date().getMonth() + 1) && year === new Date().getFullYear()
            ? cutoffDay + 1
            : 1;

        const daysInMonthCount = new Date(year, month, 0).getDate();
        let totalWorkingDays = 0;
        let passedWorkingDays = 0;
        const now = new Date();
        const isTargetCurrent = year === now.getFullYear() && month === (now.getMonth() + 1);
        const isWorkDayEnded = now.getHours() >= 18;

        for (let d = 1; d <= daysInMonthCount; d++) {
            const checkDate = new Date(year, month - 1, d);
            const dow = checkDate.getDay();
            if (dow !== 0 && dow !== 6) {
                totalWorkingDays++;
                if (d >= startFromDay) {
                    if (isTargetCurrent) {
                        if (d < now.getDate()) {
                            passedWorkingDays++;
                        } else if (d === now.getDate() && isWorkDayEnded) {
                            passedWorkingDays++;
                        }
                    } else if (year < now.getFullYear() || (year === now.getFullYear() && month < (now.getMonth() + 1))) {
                        passedWorkingDays++;
                    }
                }
            }
        }
        if (totalWorkingDays === 0) totalWorkingDays = 22;

        const dailyRate = Math.round(baseSal / totalWorkingDays);
        const empAdvances = advancesList.filter((a) => a.employeeId === empId && a.month === month && a.year === year && a.status !== "CANCELLED");
        const postBaselineAdvances = empAdvances.filter((a) => {
            if (!isSalaryPaid) return true;
            const aDate = new Date(a.paidDate || a.createdAt);
            return aDate.getDate() > cutoffDay;
        });
        const alreadyTakenAdvancesTotal = postBaselineAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const grossEarnedSoFar = passedWorkingDays * dailyRate;
        const availableEarnedSalary = Math.max(0, grossEarnedSoFar - alreadyTakenAdvancesTotal);

        return {
            totalWorkingDays,
            passedWorkingDays,
            dailyRate,
            grossEarnedSoFar,
            alreadyTakenAdvancesTotal,
            availableEarnedSalary,
        };
    };

    const handleOpenAddAdvance = (preselectedEmpId?: string) => {
        const empId = preselectedEmpId || (employees[0]?.id || "");
        const limitInfo = getEmployeeAvailableAdvanceLimit(empId, selectedMonth, selectedYear);
        const defaultAmt = limitInfo.availableEarnedSalary > 0 ? limitInfo.availableEarnedSalary : 0;

        setAdvanceForm({
            employeeId: empId,
            amount: defaultAmt > 0 ? defaultAmt.toString() : "0",
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

        const reqAmount = parseFloat(advanceForm.amount);
        const targetM = Number(advanceForm.month || selectedMonth);
        const targetY = Number(advanceForm.year || selectedYear);
        const limitInfo = getEmployeeAvailableAdvanceLimit(advanceForm.employeeId, targetM, targetY);

        if (reqAmount > limitInfo.availableEarnedSalary) {
            alert(
                `Xatolik: Avans miqdori hozirgi kungacha ishlangan to'plangan maoshdan (${formatMoney(limitInfo.availableEarnedSalary)}) oshmasligi kerak! Kunlik stavka: ${formatMoney(limitInfo.dailyRate)}/kun (${limitInfo.passedWorkingDays} ish kuni o'tgan).`
            );
            return;
        }

        try {
            await createAdvance({
                employeeId: advanceForm.employeeId,
                amount: reqAmount,
                month: targetM,
                year: targetY,
                dueDate: advanceForm.dueDate || undefined,
                isEarly: advanceForm.isEarly,
                reason: advanceForm.reason.trim() || undefined,
            });
            setIsAddAdvanceModalOpen(false);
            alert("✅ Avans biriktirildi va tasdiqlandi! Xodim tasdiqlashi kutilmoqda.");
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

    const handleClearAllPaymentRecords = async () => {
        if (currentUserRole !== "DIRECTOR" && currentUserRole !== "SUPER_ADMIN") {
            alert(t("onlyDirectorCanDelete"));
            return;
        }

        if (!confirm(t("clearHistoryConfirm"))) return;

        try {
            await clearAllPaymentRecords();
            await loadPaymentRecords();
            alert(t("clearHistorySuccess"));
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const generatePdfDocument = (title: string, subtitle: string, records: any[], isFromHistory: boolean = true) => {
        const printWindow = window.open("", "_blank", "width=1100,height=850");
        if (!printWindow) {
            alert("Iltimos, brauzerda pop-up oynalarga ruxsat bering.");
            return;
        }

        const totalAmount = records.reduce((sum, r) => sum + (isFromHistory ? (r.amount || 0) : (r.netSalary || 0)), 0);
        const formattedTotal = totalAmount.toLocaleString("uz-UZ") + " UZS";
        const dateStr = new Date().toLocaleDateString("uz-UZ");

        const rowsHtml = records.map((r, idx) => {
            const emp = r.employee || {};
            const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "-";
            const email = emp.user?.email || "-";
            const deptPos = `${emp.department?.name || "-"} / ${emp.position?.title || "-"}`;
            const payType = isFromHistory
                ? (r.paymentType === "SALARY" ? "Oylik Maosh" : "Avans")
                : "Oylik Maosh";
            const amountVal = (isFromHistory ? (r.amount || 0) : (r.netSalary || 0)).toLocaleString("uz-UZ") + " UZS";
            const method = isFromHistory
                ? (r.paymentMethod === "CASH" ? "Naqd Pulda" : r.paymentMethod === "TRANSFER" ? "Bank O'tkazmasi" : "Bank Kartasiga")
                : (r.paymentMethod === "CASH" ? "Naqd Pulda" : r.paymentMethod === "TRANSFER" ? "Bank O'tkazmasi" : "Bank Kartasiga");
            const paidDate = isFromHistory
                ? (r.paidAt ? new Date(r.paidAt).toLocaleDateString("uz-UZ") : "-")
                : (r.confirmedAt ? new Date(r.confirmedAt).toLocaleDateString("uz-UZ") : r.disbursedAt ? new Date(r.disbursedAt).toLocaleDateString("uz-UZ") : dateStr);
            const note = r.note || r.paymentNote || "-";

            return `
                <tr>
                    <td style="padding: 9px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280;">${idx + 1}</td>
                    <td style="padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: bold; color: #111827;">${fullName}</td>
                    <td style="padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #4b5563;">${email}</td>
                    <td style="padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #4b5563;">${deptPos}</td>
                    <td style="padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-weight: 600; color: #374151;">${payType}</td>
                    <td style="padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: bold; text-align: right; color: #047857;">${amountVal}</td>
                    <td style="padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #4b5563;">${method}</td>
                    <td style="padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-family: monospace; color: #374151;">${paidDate}</td>
                    <td style="padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">${note}</td>
                </tr>
            `;
        }).join("");

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="uz">
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    @page { size: landscape; margin: 12mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 24px; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 20px; }
                    .title { font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 0.02em; }
                    .subtitle { font-size: 12px; color: #6b7280; margin: 0; }
                    .meta { text-align: right; font-size: 11px; color: #4b5563; }
                    .summary-box { display: flex; gap: 24px; margin-bottom: 20px; background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px 18px; border-radius: 4px; }
                    .summary-item { font-size: 12px; }
                    .summary-item span { font-weight: bold; color: #111827; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: #f3f4f6; color: #374151; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db; font-size: 12px; page-break-inside: avoid; }
                    .sign-line { width: 220px; border-bottom: 1px solid #000; margin-top: 30px; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 class="title">${title}</h1>
                        <p class="subtitle">${subtitle}</p>
                    </div>
                    <div class="meta">
                        <div><strong>Hujjat sanasi:</strong> ${dateStr}</div>
                        <div><strong>Tizim:</strong> HR & Payroll Management</div>
                    </div>
                </div>

                <div class="summary-box">
                    <div class="summary-item">Jami to'lovlar soni: <span>${records.length} ta</span></div>
                    <div class="summary-item">Jami to'langan summa: <span style="color: #047857;">${formattedTotal}</span></div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center; width: 35px;">№</th>
                            <th>Xodim (F.I.SH)</th>
                            <th>Elektron pochta</th>
                            <th>Bo'lim / Lavozim</th>
                            <th>To'lov turi</th>
                            <th style="text-align: right;">To'langan Summa</th>
                            <th>To'lov usuli</th>
                            <th>To'langan sana</th>
                            <th>Izoh</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div class="signatures">
                    <div>
                        <div><strong>Rahbar (Direktor):</strong></div>
                        <div class="sign-line"></div>
                        <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">(imzo / F.I.SH)</div>
                    </div>
                    <div>
                        <div><strong>Bosh Buxgalter:</strong></div>
                        <div class="sign-line"></div>
                        <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">(imzo / F.I.SH)</div>
                    </div>
                    <div>
                        <div><strong>M.O'. (Muhr o'rni):</strong></div>
                        <div style="width: 75px; height: 75px; border: 1px dashed #9ca3af; border-radius: 50%; margin-top: 8px;"></div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 250);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleExportPaidListPdf = () => {
        const paidItems: any[] = [];

        payrolls.filter((p) => p.status === "PAID").forEach((p) => {
            paidItems.push({
                ...p,
                paymentType: "SALARY",
                amount: p.netSalary,
                paidAt: p.confirmedAt || p.disbursedAt || p.updatedAt,
                note: p.paymentNote || `${p.month}/${p.year} oylik maoshi to'lovi`,
            });
        });

        advancesList.filter((a) => a.status === "PAID").forEach((a) => {
            paidItems.push({
                ...a,
                paymentType: "ADVANCE",
                amount: a.amount,
                paidAt: a.paidDate || a.updatedAt,
                note: a.reason ? `${a.isEarly ? "Muddatidan oldin avans" : "Avans"}: ${a.reason}` : (a.isEarly ? "Muddatidan oldin avans" : "Avans to'lovi"),
            });
        });

        if (paidItems.length === 0) {
            alert("To'langan to'lovlar mavjud emas.");
            return;
        }

        generatePdfDocument(
            `TO'LANGAN TO'LOVLAR JADVALI (${getMonthName(selectedMonth)} ${selectedYear})`,
            `${getMonthName(selectedMonth)} ${selectedYear} davri uchun rasmiy to'langan barcha oyliklar va avanslar ro'yxati`,
            paidItems,
            true
        );
    };

    const handleExportHistoryPdf = () => {
        if (paymentRecords.length === 0) {
            alert("To'lovlar tarixi bo'yicha yozuvlar topilmadi.");
            return;
        }
        generatePdfDocument(
            `TO'LANGAN TO'LOVLAR ARXIVI (${getMonthName(selectedMonth)} ${selectedYear})`,
            `Barcha to'langan oyliklar va avanslar hisoboti`,
            paymentRecords,
            true
        );
    };

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString("uz-UZ") + " UZS";
    };

    const totalBaseSalary = payrolls.reduce((acc, p) => acc + (p.baseSalary || 0), 0);
    const totalBonuses = payrolls.reduce((acc, p) => acc + (p.bonus || 0), 0);
    const totalDeductions = payrolls.reduce((acc, p) => acc + (p.deductions || 0), 0);
    const totalNetSalary = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);
    const paidCount = payrolls.filter((p) => p.status === "PAID").length;
    const pendingCount = payrolls.filter((p) => p.status === "PENDING").length;
    const awaitingPayrollCount = payrolls.filter((p) => p.status === "AWAITING_CONFIRMATION").length;
    const awaitingAdvancesCount = advancesList.filter((a) => a.status === "AWAITING_CONFIRMATION" || a.status === "PENDING").length;
    const totalAwaitingCount = awaitingPayrollCount + awaitingAdvancesCount;
    const unpaidTotalCount = pendingCount + awaitingPayrollCount;

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
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { id: "ALL", label: `Barchasi (${payrolls.length})` },
                        { id: "PENDING", label: `⚠️ To'lanmagan (${pendingCount})` },
                        { id: "AWAITING_CONFIRMATION", label: `⏳ Tasdiqlanmagan (${totalAwaitingCount})` },
                        { id: "PAID", label: `✓ To'langan (${paidCount})` },
                        { id: "CANCELLED", label: `Bekor qilingan (${payrolls.filter(p => p.status === "CANCELLED").length})` },
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

                <div className="flex flex-wrap items-center gap-2">
                    {statusFilter === "PAID" && (payrolls.some((p) => p.status === "PAID") || advancesList.some((a) => a.status === "PAID")) && (
                        <button
                            type="button"
                            onClick={handleExportPaidListPdf}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            <span>📥</span>
                            <span>{t("downloadPdfBtn")}</span>
                        </button>
                    )}

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
                            {payrolls.flatMap((p) => {
                                const emp = p.employee || {};
                                const empAdvances = advancesList.filter((a) => a.employeeId === emp.id);

                                type DateGroup = {
                                    dateKey: string;
                                    advances: any[];
                                    hasSalary: boolean;
                                };

                                const dateGroupsMap: Record<string, DateGroup> = {};

                                // 1. If salary is paid, record under its date
                                if (p.status === "PAID") {
                                    const sDate = p.confirmedAt
                                        ? new Date(p.confirmedAt).toLocaleDateString()
                                        : p.disbursedAt
                                        ? new Date(p.disbursedAt).toLocaleDateString()
                                        : p.updatedAt
                                        ? new Date(p.updatedAt).toLocaleDateString()
                                        : "default";
                                    dateGroupsMap[sDate] = { dateKey: sDate, advances: [], hasSalary: true };
                                }

                                // 2. Map each advance to its date
                                empAdvances.forEach((adv) => {
                                    const advDate = adv.paidDate
                                        ? new Date(adv.paidDate).toLocaleDateString()
                                        : adv.updatedAt
                                        ? new Date(adv.updatedAt).toLocaleDateString()
                                        : adv.createdAt
                                        ? new Date(adv.createdAt).toLocaleDateString()
                                        : "default";
                                    if (!dateGroupsMap[advDate]) {
                                        dateGroupsMap[advDate] = { dateKey: advDate, advances: [adv], hasSalary: false };
                                    } else {
                                        dateGroupsMap[advDate].advances.push(adv);
                                    }
                                });

                                let dateGroups = Object.values(dateGroupsMap);
                                if (dateGroups.length === 0) {
                                    dateGroups = [{ dateKey: "default", advances: [], hasSalary: p.status === "PAID" }];
                                }

                                const daysInMonthCount = new Date(selectedYear, selectedMonth, 0).getDate();
                                let totalWorkingDaysInMonth = 0;
                                let elapsedWorkingDaysInMonth = 0;
                                const now = new Date();
                                const isSelectedCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === (now.getMonth() + 1);
                                const isWorkDayEnded = now.getHours() >= 18;

                                for (let d = 1; d <= daysInMonthCount; d++) {
                                    const checkDate = new Date(selectedYear, selectedMonth - 1, d);
                                    const dow = checkDate.getDay();
                                    if (dow !== 0 && dow !== 6) {
                                        totalWorkingDaysInMonth++;
                                        if (isSelectedCurrentMonth) {
                                            if (d < now.getDate()) {
                                                elapsedWorkingDaysInMonth++;
                                            } else if (d === now.getDate() && isWorkDayEnded) {
                                                elapsedWorkingDaysInMonth++;
                                            }
                                        } else if (selectedYear < now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth < (now.getMonth() + 1))) {
                                            elapsedWorkingDaysInMonth++;
                                        }
                                    }
                                }
                                if (totalWorkingDaysInMonth === 0) totalWorkingDaysInMonth = 22;

                                const dailyRate = Math.round(p.baseSalary / totalWorkingDaysInMonth);
                                const dailyAccruedBase = elapsedWorkingDaysInMonth * dailyRate;
                                const dailyAccruedNet = Math.max(0, dailyAccruedBase + p.bonus - p.deductions);

                                return dateGroups.map((group, gIdx) => {
                                    const groupAwaiting = group.advances.filter((a) => a.status === "AWAITING_CONFIRMATION" || a.status === "PENDING");
                                    const groupPaid = group.advances.filter((a) => a.status === "PAID");
                                    const groupAdvTotal = groupPaid.reduce((sum, a) => sum + Number(a.amount || 0), 0);

                                    const empPenaltyTotal = penaltySummaries[emp.id]?.totalFines || 0;
                                    const rowDeductions = group.hasSalary
                                        ? p.deductions
                                        : (groupAdvTotal + empPenaltyTotal);
                                    const rowNetSalary = group.hasSalary
                                        ? p.netSalary
                                        : Math.max(0, p.baseSalary + p.bonus - rowDeductions);

                                    const limitInfo = getEmployeeAvailableAdvanceLimit(emp.id, selectedMonth, selectedYear);

                                    return (
                                        <tr key={`${p.id}-${group.dateKey}-${gIdx}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                        {emp.firstName ? emp.firstName[0] : "X"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-black">
                                                                {emp.firstName} {emp.lastName}
                                                            </span>
                                                            {p.status === "PENDING" && (
                                                                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded-xs bg-rose-100 text-rose-950 border border-rose-300">
                                                                    ⚠️ To'lanmagan
                                                                </span>
                                                            )}
                                                            {p.status === "AWAITING_CONFIRMATION" && (
                                                                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded-xs bg-orange-100 text-orange-950 border border-orange-300 animate-pulse">
                                                                    ⏳ Tasdiqlanmagan
                                                                </span>
                                                            )}
                                                            {p.status === "PAID" && (
                                                                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded-xs bg-emerald-100 text-emerald-950 border border-emerald-300">
                                                                    ✓ To'langan
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 block">
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
                                                <div>{formatMoney(p.baseSalary)}</div>
                                                <div className="text-[10px] font-normal text-blue-700 font-mono mt-0.5" title={`${totalWorkingDaysInMonth} ish kuni hisobida`}>
                                                    ~{formatMoney(dailyRate)} / kun
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-emerald-600">
                                                +{formatMoney(p.bonus)}
                                            </td>
                                            <td className="p-4 font-bold text-rose-600">
                                                <div>-{formatMoney(rowDeductions)}</div>
                                                {empPenaltyTotal > 0 && !group.hasSalary && (
                                                    <div className="text-[9px] font-normal text-rose-500 font-mono mt-0.5" title="Avanslar va Jarimalar jamlangan">
                                                        {groupAdvTotal > 0 ? `Avans: -${formatMoney(groupAdvTotal)} | Jarima: -${formatMoney(empPenaltyTotal)}` : `Jarima: -${formatMoney(empPenaltyTotal)}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 font-black text-black text-sm">
                                                {p.status === "PAID" && group.hasSalary ? (
                                                    <div>
                                                        <div className="text-gray-900 font-bold">{formatMoney(rowNetSalary)} <span className="text-[10px] text-gray-500 font-normal">(To'langan)</span></div>
                                                        <div className="text-[10px] font-semibold text-emerald-700 font-mono mt-0.5">
                                                            Faol shot: {formatMoney(limitInfo.availableEarnedSalary)} {limitInfo.passedWorkingDays === 0 ? "(0 dan to'planmoqda)" : `(+${limitInfo.passedWorkingDays} ish kuni)`}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div>{formatMoney(rowNetSalary)}</div>
                                                        {p.status !== "PAID" && isSelectedCurrentMonth && (
                                                            <div className="text-[10px] font-semibold text-emerald-700 font-mono mt-0.5" title={`Yakunlangan (${elapsedWorkingDaysInMonth} ish kuni)`}>
                                                                To'plandi: {formatMoney(dailyAccruedNet)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    {/* Salary Status */}
                                                    {group.hasSalary && (
                                                        <div className="flex flex-col items-start gap-0.5">
                                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-xs border bg-emerald-50 text-emerald-800 border-emerald-300">
                                                                ✓ To'langan va Tasdiqlangan
                                                            </span>
                                                            <span className="text-[10px] font-mono text-gray-500">
                                                                {group.dateKey !== "default" ? group.dateKey : ""} • {formatMoney(p.netSalary)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {p.status === "PENDING" && gIdx === 0 && (
                                                        <div className="flex flex-col items-start gap-0.5">
                                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-xs border bg-rose-50 text-rose-950 border-rose-300 block">
                                                                ⚠️ Oylik to'lanmagan
                                                            </span>
                                                            <span className="text-[10px] font-mono text-gray-500">
                                                                Kutilayotgan: {formatMoney(rowNetSalary)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {p.status === "AWAITING_CONFIRMATION" && gIdx === 0 && (
                                                        <div className="flex flex-col items-start gap-0.5">
                                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-xs border bg-orange-100 text-orange-950 border-orange-400 animate-pulse block">
                                                                ⏳ TASDIQLANMAGAN (Xodim tasdiqlashi kutilmoqda)
                                                            </span>
                                                            <span className="text-[10px] font-mono text-gray-500">
                                                                {formatMoney(rowNetSalary)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {p.status === "CANCELLED" && gIdx === 0 && (
                                                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-xs border bg-rose-50 text-rose-800 border-rose-300">
                                                            {t("statusCancelled")}
                                                        </span>
                                                    )}

                                                    {/* Awaiting Advances */}
                                                    {groupAwaiting.map((adv) => (
                                                        <div key={adv.id} className="flex flex-col items-start gap-0.5">
                                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-xs border bg-amber-100 text-amber-950 border-amber-400 animate-pulse">
                                                                ⏳ TASDIQLANMAGAN ({adv.isEarly ? "Muddatidan oldin avans" : "Avans"})
                                                            </span>
                                                            <span className="text-[10px] font-mono text-gray-500">
                                                                {formatMoney(adv.amount)}
                                                            </span>
                                                        </div>
                                                    ))}

                                                    {/* Paid Advances */}
                                                    {groupPaid.map((adv) => (
                                                        <div key={adv.id} className="flex flex-col items-start gap-0.5">
                                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-xs border bg-emerald-50 text-emerald-800 border-emerald-300">
                                                                {adv.isEarly ? "⚡ Muddatidan oldin avans to'landi" : "✓ Avans to'landi"}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-gray-500">
                                                                {adv.paidDate ? new Date(adv.paidDate).toLocaleDateString() : (adv.updatedAt ? new Date(adv.updatedAt).toLocaleDateString() : "")} • {formatMoney(adv.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {groupAwaiting.map((adv) => (
                                                        <button
                                                            key={adv.id}
                                                            type="button"
                                                            onClick={() => setIsAdvancesListModalOpen(true)}
                                                            className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase hover:bg-amber-100 transition-colors animate-pulse cursor-pointer"
                                                            title="Xodim tasdiqlashi kutilmoqda"
                                                        >
                                                            ⏳ Tasdiq ({formatMoney(adv.amount)})
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => handleOpenAddAdvance(emp.id)}
                                                        className="px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-200 cursor-pointer"
                                                        title={t("addAdvanceBtn")}
                                                    >
                                                        + 💳 {t("advanceBtn")}
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedPayslip(p)}
                                                        className="px-2.5 py-1 bg-gray-100 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors border border-gray-300 cursor-pointer"
                                                    >
                                                        🧾 {t("viewPayslip")}
                                                    </button>
                                                    {(currentUserRole === "DIRECTOR" || currentUserRole === "SUPER_ADMIN") && (
                                                        <button
                                                            onClick={() => handleDeletePayroll(p.id)}
                                                            className="px-2 py-1 text-gray-400 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                                                            title={t("delete")}
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                });
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
                                        const limitInfo = getEmployeeAvailableAdvanceLimit(empId, Number(advanceForm.month || selectedMonth), Number(advanceForm.year || selectedYear));
                                        setAdvanceForm({
                                            ...advanceForm,
                                            employeeId: empId,
                                            amount: limitInfo.availableEarnedSalary > 0 ? limitInfo.availableEarnedSalary.toString() : "0",
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

                            {advanceForm.employeeId && (() => {
                                const limitInfo = getEmployeeAvailableAdvanceLimit(
                                    advanceForm.employeeId,
                                    Number(advanceForm.month || selectedMonth),
                                    Number(advanceForm.year || selectedYear)
                                );
                                return (
                                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-xs text-[11px] text-blue-900 flex flex-col gap-1">
                                        <div className="flex justify-between font-bold">
                                            <span>Kunlik stavka:</span>
                                            <span>{formatMoney(limitInfo.dailyRate)} / kun</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Ishlangan kunlar (oy boshidan/to'lovdan):</span>
                                            <span>{limitInfo.passedWorkingDays} / {limitInfo.totalWorkingDays} ish kuni</span>
                                        </div>
                                        <div className="flex justify-between font-black border-t border-blue-200 pt-1 text-emerald-800 text-xs">
                                            <span>Mavjud to'plangan limit:</span>
                                            <span className="font-mono">{formatMoney(limitInfo.availableEarnedSalary)}</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold uppercase text-emerald-600 mb-1">{t("advanceAmount")}</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="500000"
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
                                                        <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-xs border ${
                                                            adv.status === "PAID"
                                                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                                                : adv.status === "AWAITING_CONFIRMATION"
                                                                ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                                                                : "bg-gray-100 text-gray-800 border-gray-300"
                                                        }`}>
                                                            {adv.status === "PAID"
                                                                ? t("statusPaid")
                                                                : adv.status === "AWAITING_CONFIRMATION"
                                                                ? t("statusAwaitingConfirmation")
                                                                : t("statusPending")}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {adv.status === "PENDING" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenPayModal({
                                                                        type: "ADVANCE",
                                                                        id: adv.id,
                                                                        name: empFullName,
                                                                        amount: adv.amount,
                                                                    })}
                                                                    className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700 cursor-pointer"
                                                                >
                                                                    💰 {t("markAsPaid")}
                                                                </button>
                                                            )}
                                                            {adv.status === "AWAITING_CONFIRMATION" && (
                                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 border border-amber-200">
                                                                    ⏳ {t("statusAwaitingConfirmation")}
                                                                </span>
                                                            )}
                                                            {(currentUserRole === "DIRECTOR" || currentUserRole === "SUPER_ADMIN") && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteAdvance(adv.id)}
                                                                    className="px-2 py-1 text-gray-400 hover:text-rose-600 font-bold cursor-pointer"
                                                                    title={t("delete")}
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
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

                            <div className="flex flex-wrap items-center gap-2">
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
                                {paymentRecords.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleExportHistoryPdf}
                                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        <span>📥</span>
                                        <span>{t("downloadPdfBtn")}</span>
                                    </button>
                                )}
                                {(currentUserRole === "DIRECTOR" || currentUserRole === "SUPER_ADMIN") && paymentRecords.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAllPaymentRecords}
                                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase transition-colors"
                                    >
                                        {t("clearAllHistoryBtn")}
                                    </button>
                                )}
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
                                                                : rec.note && rec.note.toLowerCase().includes("muddatidan oldin")
                                                                ? "bg-amber-100 text-amber-900"
                                                                : "bg-emerald-100 text-emerald-900"
                                                        }`}>
                                                            {rec.paymentType === "SALARY"
                                                                ? t("typeSalary")
                                                                : rec.note && rec.note.toLowerCase().includes("muddatidan oldin")
                                                                ? "⚡ Muddatidan oldin avans"
                                                                : t("typeAdvance")}
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
