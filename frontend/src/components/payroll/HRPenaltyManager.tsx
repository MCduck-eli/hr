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
    updateEmployeePenalty,
    waivePenalty,
    editPenalty,
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
    const [activeTab, setActiveTab] = useState<"overview" | "all" | "lateness" | "absence" | "disciplinary" | "archive">("overview");
    const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});

    const [employees, setEmployees] = useState<any[]>([]);
    const [penaltyRules, setPenaltyRules] = useState<any[]>([]);
    const [employeePenalties, setEmployeePenalties] = useState<any[]>([]);
    const [lateAttendances, setLateAttendances] = useState<any[]>([]);
    const [absentRecords, setAbsentRecords] = useState<any[]>([]);
    const [employeeSummaries, setEmployeeSummaries] = useState<any[]>([]);
    const [archiveData, setArchiveData] = useState<{
        threeMonthPenalties: any[];
        threeMonthAttendances: any[];
    }>({
        threeMonthPenalties: [],
        threeMonthAttendances: [],
    });
    const [archiveMonthFilter, setArchiveMonthFilter] = useState<string>("ALL");
    const [allPenaltiesMonthFilter, setAllPenaltiesMonthFilter] = useState<string>("ALL");
    const [allPenaltiesTypeFilter, setAllPenaltiesTypeFilter] = useState<string>("ALL");
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

    const [isEditPenaltyModalOpen, setIsEditPenaltyModalOpen] = useState(false);
    const [editingPenaltyItem, setEditingPenaltyItem] = useState<{
        id?: string;
        dbId?: string;
        employeeId: string;
        employeeName: string;
        type: "ABSENCE" | "LATENESS" | "DISCIPLINARY";
        typeLabel?: string;
        amount: number | string;
        reason: string;
        date: string;
        month: number;
        year: number;
    } | null>(null);

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

    const toggleEmployeeExpand = (empId: string) => {
        setExpandedEmployees((prev) => ({
            ...prev,
            [empId]: !prev[empId],
        }));
    };

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
                setAbsentRecords(summaryData.absentRecords || []);
                setEmployeeSummaries(summaryData.employeeSummaries || []);
                setArchiveData(summaryData.archive || {
                    threeMonthPenalties: [],
                    threeMonthAttendances: [],
                });
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

    const handleOpenEditPenalty = (item: any) => {
        const empId = item.employeeId || item.employee?.id;
        const empName = item.employeeName || `${item.employee?.firstName || ""} ${item.employee?.lastName || ""}`.trim();
        const rawDate = item.date ? (typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];

        setEditingPenaltyItem({
            id: item.id,
            dbId: item.dbId || item.id,
            employeeId: empId,
            employeeName: empName || "Xodim",
            type: item.type,
            typeLabel: item.typeLabel,
            amount: item.amount || 0,
            reason: item.reason || "",
            date: rawDate,
            month: selectedMonth,
            year: selectedYear,
        });
        setIsEditPenaltyModalOpen(true);
    };

    const handleSaveEditPenalty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPenaltyItem) return;

        setActionLoading(true);
        try {
            await editPenalty({
                type: editingPenaltyItem.type,
                id: editingPenaltyItem.dbId || editingPenaltyItem.id,
                employeeId: editingPenaltyItem.employeeId,
                date: editingPenaltyItem.date,
                amount: Number(editingPenaltyItem.amount) || 0,
                reason: editingPenaltyItem.reason,
                month: Number(editingPenaltyItem.month || selectedMonth),
                year: Number(editingPenaltyItem.year || selectedYear),
            });
            setIsEditPenaltyModalOpen(false);
            setEditingPenaltyItem(null);
            await loadData();
        } catch (err: any) {
            alert(err.message || "Jarimani tahrirlashda xatolik yuz berdi");
        } finally {
            setActionLoading(false);
        }
    };

    const handleWaiveOrDeletePenalty = async (item: any) => {
        const confirmMsg = item.type === "DISCIPLINARY"
            ? "Ushbu intizomiy jarimani o'chirishni tasdiqlaysizmi?"
            : item.type === "ABSENCE"
            ? "Ushbu ishga kelmaganlik jarimasini bekor qilish (uzrli deb belgilash)ni tasdiqlaysizmi?"
            : "Ushbu kechikish jarimasini bekor qilishni tasdiqlaysizmi?";
        
        if (!confirm(confirmMsg)) return;

        setActionLoading(true);
        try {
            if (item.type === "DISCIPLINARY" && item.id && !String(item.id).startsWith("late-") && !String(item.id).startsWith("absent-")) {
                await deleteEmployeePenalty(item.dbId || item.id);
            } else {
                await waivePenalty({
                    type: item.type,
                    id: item.dbId || item.id,
                    employeeId: item.employeeId || item.employee?.id,
                    date: item.date ? (typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0]) : undefined,
                    reason: item.reason,
                });
            }
            await loadData();
        } catch (err: any) {
            alert(err.message || "Jarimani o'chirish/bekor qilishda xatolik yuz berdi");
        } finally {
            setActionLoading(false);
        }
    };

    const getEmployeeAllPenalties = (summary: any) => {
        const list: any[] = [];
        (summary.lateAttendances || []).forEach((l: any) => {
            list.push({
                id: `late-${l.id || Math.random()}`,
                dbId: l.id,
                date: l.date,
                time: l.checkIn ? new Date(l.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
                type: "LATENESS",
                typeLabel: t("tabLateness") || "Kechikish",
                typeBadge: "bg-amber-100 text-amber-900 border-amber-300",
                reason: `Ishga ${l.lateMinutes || 0} daqiqa kechikish${l.checkIn ? ` (Kelgan vaqti: ${new Date(l.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ""}`,
                amount: l.fineAmount || 0,
                raw: l,
                isDisciplinary: false,
                employeeId: summary.employeeId,
                employeeName: summary.name,
            });
        });
        (summary.absentRecords || []).forEach((a: any) => {
            list.push({
                id: a.id || `absent-${a.date}`,
                dbId: a.id,
                date: a.date,
                time: null,
                type: "ABSENCE",
                typeLabel: t("cardAbsenceAuto") || "Sababsiz kelmaslik",
                typeBadge: "bg-red-100 text-red-900 border-red-300",
                reason: a.reason || "Ishga sababsiz kelmaganlik",
                amount: a.fineAmount || 0,
                raw: a,
                isDisciplinary: false,
                employeeId: summary.employeeId,
                employeeName: summary.name,
            });
        });
        (summary.disciplinaryPenalties || []).forEach((d: any) => {
            list.push({
                id: d.id,
                dbId: d.id,
                date: d.date || d.createdAt,
                time: d.createdAt ? new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
                type: "DISCIPLINARY",
                typeLabel: t("tabDisciplinary") || "Intizomiy jarima",
                typeBadge: "bg-rose-100 text-rose-900 border-rose-300",
                reason: d.reason || d.rule?.name || "Intizomiy jarima",
                amount: d.amount || 0,
                raw: d,
                isDisciplinary: true,
                employeeId: summary.employeeId,
                employeeName: summary.name,
            });
        });
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const allCombinedPenalties = employeeSummaries.flatMap((summary) => {
        return getEmployeeAllPenalties(summary).map((p) => ({
            ...p,
            employeeName: summary.name,
            email: summary.email || "",
            department: summary.department,
            position: summary.position,
            employeeId: summary.employeeId,
        }));
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredSummaries = employeeSummaries.filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (s.name || "").toLowerCase().includes(q) ||
            (s.email || "").toLowerCase().includes(q) ||
            (s.department || "").toLowerCase().includes(q) ||
            (s.position || "").toLowerCase().includes(q)
        );
    });

    const filteredLateAttendances = lateAttendances.filter((l) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const empName = `${l.employee?.firstName || ""} ${l.employee?.lastName || ""}`.toLowerCase();
        const empEmail = (l.employee?.user?.email || l.employee?.email || "").toLowerCase();
        return empName.includes(q) || empEmail.includes(q);
    });

    const filteredAbsentRecords = absentRecords.filter((a) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const empName = `${a.employee?.firstName || ""} ${a.employee?.lastName || ""}`.toLowerCase();
        const empEmail = (a.employee?.user?.email || a.employee?.email || "").toLowerCase();
        return empName.includes(q) || empEmail.includes(q) || (a.reason || "").toLowerCase().includes(q);
    });

    const filteredDisciplinaryPenalties = employeePenalties.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const empName = `${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`.toLowerCase();
        const empEmail = (p.employee?.user?.email || p.employee?.email || "").toLowerCase();
        const reason = (p.reason || "").toLowerCase();
        return empName.includes(q) || empEmail.includes(q) || reason.includes(q);
    });

    const last3MonthsList = [
        {
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
            label: `${getMonthName(currentDate.getMonth() + 1)} ${currentDate.getFullYear()}`,
            isCurrent: true,
            key: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
        },
        {
            month: currentDate.getMonth() === 0 ? 12 : currentDate.getMonth(),
            year: currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear(),
            label: `${getMonthName(currentDate.getMonth() === 0 ? 12 : currentDate.getMonth())} ${currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()}`,
            isCurrent: false,
            key: `${currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()}-${currentDate.getMonth() === 0 ? 12 : currentDate.getMonth()}`,
        },
        {
            month: currentDate.getMonth() <= 1 ? currentDate.getMonth() + 11 : currentDate.getMonth() - 1,
            year: currentDate.getMonth() <= 1 ? currentDate.getFullYear() - 1 : currentDate.getFullYear(),
            label: `${getMonthName(currentDate.getMonth() <= 1 ? currentDate.getMonth() + 11 : currentDate.getMonth() - 1)} ${currentDate.getMonth() <= 1 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()}`,
            isCurrent: false,
            key: `${currentDate.getMonth() <= 1 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()}-${currentDate.getMonth() <= 1 ? currentDate.getMonth() + 11 : currentDate.getMonth() - 1}`,
        },
    ];

    const allArchiveItems = [
        ...(archiveData.threeMonthPenalties || []).map((p: any) => {
            const pDate = new Date(p.date || p.createdAt);
            const pMonth = p.month || (pDate.getMonth() + 1);
            const pYear = p.year || pDate.getFullYear();
            return {
                id: `arch-disc-${p.id}`,
                dbId: p.id,
                date: p.date || p.createdAt,
                time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
                employeeName: `${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`.trim() || "-",
                email: p.employee?.user?.email || p.employee?.email || "",
                department: p.employee?.department?.name || "-",
                position: p.employee?.position?.title || "-",
                type: "DISCIPLINARY",
                typeLabel: t("tabDisciplinary") || "Intizomiy jarima",
                typeBadge: "bg-rose-100 text-rose-900 border-rose-300",
                reason: p.reason || p.rule?.name || "Intizomiy jarima",
                amount: p.amount || 0,
                month: pMonth,
                year: pYear,
                monthKey: `${pYear}-${pMonth}`,
                monthLabel: `${getMonthName(pMonth)} ${pYear}`,
                raw: p,
                isDisciplinary: true,
            };
        }),
        ...(archiveData.threeMonthAttendances || []).map((a: any) => {
            const aDate = new Date(a.date);
            const aMonth = aDate.getMonth() + 1;
            const aYear = aDate.getFullYear();
            return {
                id: `arch-late-${a.id}`,
                dbId: a.id,
                date: a.date,
                time: a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
                employeeName: `${a.employee?.firstName || ""} ${a.employee?.lastName || ""}`.trim() || "-",
                email: a.employee?.user?.email || a.employee?.email || "",
                department: a.employee?.department?.name || "-",
                position: a.employee?.position?.title || "-",
                type: "LATENESS",
                typeLabel: t("tabLateness") || "Kechikish",
                typeBadge: "bg-amber-100 text-amber-900 border-amber-300",
                reason: `Ishga ${a.lateMinutes || 0} daqiqa kechikish${a.checkIn ? ` (Kelgan vaqti: ${new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ""}`,
                amount: a.fineAmount || 0,
                month: aMonth,
                year: aYear,
                monthKey: `${aYear}-${aMonth}`,
                monthLabel: `${getMonthName(aMonth)} ${aYear}`,
                raw: a,
                isDisciplinary: false,
            };
        }),
        ...(absentRecords || []).map((ab: any) => {
            const abDate = new Date(ab.date);
            const abMonth = abDate.getMonth() + 1;
            const abYear = abDate.getFullYear();
            return {
                id: `arch-absent-${ab.id || `${ab.employeeId}-${ab.date}`}`,
                dbId: ab.id,
                date: ab.date,
                time: null,
                employeeName: `${ab.employee?.firstName || ""} ${ab.employee?.lastName || ""}`.trim() || "-",
                email: ab.employee?.user?.email || ab.employee?.email || "",
                department: ab.employee?.department?.name || "-",
                position: ab.employee?.position?.title || "-",
                type: "ABSENCE",
                typeLabel: t("cardAbsenceAuto") || "Sababsiz kelmaslik",
                typeBadge: "bg-red-100 text-red-900 border-red-300",
                reason: ab.reason || "Ishga sababsiz kelmaganlik",
                amount: ab.fineAmount || 0,
                month: abMonth,
                year: abYear,
                monthKey: `${abYear}-${abMonth}`,
                monthLabel: `${getMonthName(abMonth)} ${abYear}`,
                raw: ab,
                isDisciplinary: false,
            };
        }),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const all3MonthsAndCurrentPenalties = (() => {
        const map = new Map<string, any>();

        // 1. Add current month penalties (absences, lates, disciplinary)
        allCombinedPenalties.forEach((p) => {
            const pDate = new Date(p.date);
            const m = pDate.getMonth() + 1;
            const y = pDate.getFullYear();
            const key = p.id || `${p.type}-${p.employeeId}-${p.date}`;
            map.set(key, {
                ...p,
                month: m,
                year: y,
                monthKey: `${y}-${m}`,
                monthLabel: `${getMonthName(m)} ${y}`,
                statusLabel: "Joriy davr",
                isArchived: false,
            });
        });

        // 2. Add archive penalties
        allArchiveItems.forEach((a) => {
            const key = a.id || `arch-${a.type}-${a.dbId || a.employeeName}-${a.date}`;
            if (!map.has(key)) {
                map.set(key, {
                    ...a,
                    statusLabel: "Arxivlangan",
                    isArchived: true,
                });
            }
        });

        return Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    })();

    const filteredAllPenalties = all3MonthsAndCurrentPenalties.filter((p) => {
        if (allPenaltiesMonthFilter !== "ALL" && p.monthKey !== allPenaltiesMonthFilter) {
            return false;
        }
        if (allPenaltiesTypeFilter !== "ALL" && p.type !== allPenaltiesTypeFilter) {
            return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (p.employeeName || "").toLowerCase().includes(q) ||
            (p.email || "").toLowerCase().includes(q) ||
            (p.reason || "").toLowerCase().includes(q) ||
            (p.typeLabel || "").toLowerCase().includes(q) ||
            (p.department || "").toLowerCase().includes(q) ||
            (p.monthLabel || "").toLowerCase().includes(q)
        );
    });

    const filteredArchiveItems = allArchiveItems.filter((item) => {
        if (archiveMonthFilter !== "ALL" && item.monthKey !== archiveMonthFilter) {
            return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.employeeName.toLowerCase().includes(q) ||
            item.email.toLowerCase().includes(q) ||
            item.reason.toLowerCase().includes(q) ||
            item.typeLabel.toLowerCase().includes(q) ||
            item.department.toLowerCase().includes(q) ||
            item.monthLabel.toLowerCase().includes(q)
        );
    });

    const generatePenaltiesPdfDocument = (items: any[], customTitle?: string) => {
        const printWindow = window.open("", "_blank", "width=1100,height=850");
        if (!printWindow) {
            alert("Iltimos, brauzerda pop-up oynalarga ruxsat bering.");
            return;
        }

        const totalAmount = items.reduce((sum, r) => sum + (r.amount || 0), 0);
        const formattedTotal = Number(totalAmount).toLocaleString("uz-UZ") + " UZS";
        const dateStr = new Date().toLocaleDateString("uz-UZ");
        const docTitle = customTitle || "XODIMLAR JARIMALARI BO'YICHA YAGONA HISOBOT";
        const docSubtitle = "Oxirgi 3 oylik arxiv va joriy davr bo'yicha barcha kechikishlar, kelmaganliklar va intizomiy jarimalar";

        const rowsHtml = items
            .map((r, idx) => {
                const fullName = r.employeeName || "-";
                const email = r.email || "-";
                const deptPos = `${r.department || "-"} / ${r.position || "-"}`;
                const dateVal = r.date ? new Date(r.date).toLocaleDateString("uz-UZ") : "-";
                const timeVal = r.time ? ` (${r.time})` : "";
                const typeVal = r.typeLabel || r.type || "Jarima";
                const reasonVal = r.reason || "-";
                const amountVal = "-" + Number(r.amount || 0).toLocaleString("uz-UZ") + " UZS";
                const statusVal = r.isArchived ? "Arxivlangan" : "Joriy davr";

                return `
                <tr>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280;">${idx + 1}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: bold; color: #111827;">${fullName}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #4b5563;">${email}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #4b5563;">${deptPos}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-family: monospace; color: #111827; white-space: nowrap;">${dateVal}${timeVal}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-weight: 600; color: #374151;">${typeVal}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #374151;">${reasonVal}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: bold; text-align: right; color: #dc2626; white-space: nowrap;">${amountVal}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10px; text-align: center; font-weight: 600; color: #6b7280;">${statusVal}</td>
                </tr>
            `;
            })
            .join("");

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="uz">
            <head>
                <meta charset="UTF-8">
                <title>${docTitle}</title>
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
                        <h1 class="title">${docTitle}</h1>
                        <p class="subtitle">${docSubtitle}</p>
                    </div>
                    <div class="meta">
                        <div><strong>Hujjat sanasi:</strong> ${dateStr}</div>
                        <div><strong>Tizim:</strong> HR Platform & Penalty Management</div>
                    </div>
                </div>

                <div class="summary-box">
                    <div class="summary-item">Jami jarimalar soni: <span>${items.length} ta</span></div>
                    <div class="summary-item">Jami jarima summasi: <span style="color: #dc2626;">-${formattedTotal}</span></div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center; width: 40px;">№</th>
                            <th>Xodim (F.I.Sh.)</th>
                            <th>Email</th>
                            <th>Bo'lim / Lavozim</th>
                            <th>Sana</th>
                            <th>Jarima turi</th>
                            <th>Sababi</th>
                            <th style="text-align: right;">Summasi</th>
                            <th style="text-align: center;">Holati</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #9ca3af;">Hech qanday ma\'lumot topilmadi</td></tr>'}
                    </tbody>
                </table>

                <div class="signatures">
                    <div>
                        <strong>HR Menejer:</strong>
                        <div class="sign-line"></div>
                        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">(Imzo / F.I.Sh.)</div>
                    </div>
                    <div>
                        <strong>Bosh buxgalter:</strong>
                        <div class="sign-line"></div>
                        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">(Imzo / F.I.Sh.)</div>
                    </div>
                    <div>
                        <strong>Rahbar tasdig'i:</strong>
                        <div class="sign-line"></div>
                        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">(Imzo / Sana)</div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

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
                        onClick={() => generatePenaltiesPdfDocument(filteredAllPenalties)}
                        className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                        title="Barcha jarimalarni PDF formatda yuklab olish yoki chop etish"
                    >
                        <span>📥</span>
                        <span>PDF Yuklab Olish</span>
                    </button>
                    <button
                        onClick={() => setIsPenaltyRulesModalOpen(true)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-gray-300 transition-colors cursor-pointer"
                    >
                        <span>⚙️</span>
                        <span>{t("penaltyRulesBtnText")}</span>
                    </button>
                    <button
                        onClick={handleOpenAddPenalty}
                        className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
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
                <div className="flex flex-wrap items-center gap-4">
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

                    <div className="hidden lg:flex items-center gap-1.5 border-l border-gray-200 pl-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">Tezkor oylar:</span>
                        {last3MonthsList.map((item) => {
                            const isSelected = selectedMonth === item.month && selectedYear === item.year;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => {
                                        setSelectedMonth(item.month);
                                        setSelectedYear(item.year);
                                    }}
                                    className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-all rounded cursor-pointer border ${
                                        isSelected
                                            ? "bg-black text-white border-black"
                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="w-full md:w-80">
                    <input
                        type="text"
                        placeholder={t("searchEmployeeOrReason") || "Xodim ismi, sababi yoki turi bo'yicha qidirish..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-xs px-3 py-2 outline-none focus:border-black"
                    />
                </div>
            </div>

            <div className="flex items-center border-b border-gray-200 gap-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === "overview"
                            ? "border-black text-black bg-gray-50"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    <span>📊</span>
                    <span>{t("tabOverview")} ({filteredSummaries.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === "all"
                            ? "border-black text-black bg-gray-50"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    <span>📋</span>
                    <span>Barcha jarimalar ({filteredAllPenalties.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("lateness")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === "lateness"
                            ? "border-black text-black bg-gray-50"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    <span>⏱️</span>
                    <span>{t("tabLateness")} ({filteredLateAttendances.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("absence")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === "absence"
                            ? "border-black text-black bg-gray-50"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    <span>🚫</span>
                    <span>Kelmaganliklar ({filteredAbsentRecords.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("disciplinary")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === "disciplinary"
                            ? "border-black text-black bg-gray-50"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    <span>📝</span>
                    <span>{t("tabDisciplinary")} ({filteredDisciplinaryPenalties.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("archive")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === "archive"
                            ? "border-black text-black bg-gray-50"
                            : "border-transparent text-gray-500 hover:text-black"
                    }`}
                >
                    <span>📁</span>
                    <span>3 oylik arxiv ({filteredArchiveItems.length})</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-gray-400 animate-pulse">
                    {t("loading")}
                </div>
            ) : (
                <>
                    {activeTab === "overview" && (
                        <div className="border border-gray-200 bg-white shadow-xs">
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
                                            <th className="py-3.5 px-4">{t("colEmployee")}</th>
                                            <th className="py-3.5 px-4">{t("colDeptPos")}</th>
                                            <th className="py-3.5 px-4 text-center">{t("colLateAuto")}</th>
                                            <th className="py-3.5 px-4 text-center">{t("colAbsentAuto")}</th>
                                            <th className="py-3.5 px-4 text-center">{t("colDisciplinaryManual")}</th>
                                            <th className="py-3.5 px-4 text-right">{t("colTotalFineAmount")}</th>
                                            <th className="py-3.5 px-4 text-center">Tafsilotlar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs">
                                        {filteredSummaries.length === 0 ? (
                                             <tr>
                                                <td colSpan={7} className="py-8 text-center text-gray-400 font-semibold">
                                                    {t("noDataFound")}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSummaries.map((summary) => {
                                                const empPenaltiesList = getEmployeeAllPenalties(summary);
                                                const isExpanded = !!expandedEmployees[summary.employeeId];

                                                return (
                                                    <tr key={summary.employeeId} className="group">
                                                        <td colSpan={7} className="p-0">
                                                            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                                                                <div className="grid grid-cols-7 w-full items-center">
                                                                    <div className="col-span-1 font-bold text-black flex flex-col">
                                                                        <span>{summary.name}</span>
                                                                        {summary.email && (
                                                                            <span className="text-[11px] text-gray-500 font-normal truncate">{summary.email}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="col-span-1 text-gray-500">
                                                                        <div className="font-medium text-gray-700">{summary.department}</div>
                                                                        <div className="text-[11px] text-gray-400">{summary.position}</div>
                                                                    </div>
                                                                    <div className="col-span-1 text-center">
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
                                                                    </div>
                                                                    <div className="col-span-1 text-center">
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
                                                                    </div>
                                                                    <div className="col-span-1 text-center">
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
                                                                    </div>
                                                                    <div className="col-span-1 text-right font-black">
                                                                        {summary.totalFines > 0 ? (
                                                                            <span className="text-rose-600 text-sm">
                                                                                -{Number(summary.totalFines || 0).toLocaleString()} UZS
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-emerald-600 font-bold">0 UZS</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="col-span-1 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleEmployeeExpand(summary.employeeId)}
                                                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors cursor-pointer ${
                                                                                isExpanded
                                                                                    ? "bg-black text-white border-black"
                                                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                                            }`}
                                                                        >
                                                                            {isExpanded ? "▲ Yopish" : `▼ ${empPenaltiesList.length} ta jarima`}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Expanded Itemized Penalty Details */}
                                                            {isExpanded && (
                                                                <div className="bg-gray-50/80 p-4 border-b border-gray-200 pl-8 pr-8">
                                                                    <div className="bg-white border border-gray-200 shadow-xs p-4">
                                                                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                                                                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
                                                                                <span>📋</span>
                                                                                <span>{summary.name} {summary.email ? `(${summary.email})` : ""} — Jarimalar va ushlanmalar tafsilotlari</span>
                                                                            </h4>
                                                                            <span className="text-xs font-bold text-rose-600">
                                                                                Jami: -{Number(summary.totalFines || 0).toLocaleString()} UZS
                                                                            </span>
                                                                        </div>

                                                                        {empPenaltiesList.length === 0 ? (
                                                                            <div className="py-6 text-center text-xs text-gray-400 font-medium">
                                                                                Ushbu xodimda jarima yoki ushlanmalar yo'q.
                                                                            </div>
                                                                        ) : (
                                                                            <div className="overflow-x-auto">
                                                                                <table className="w-full text-left border-collapse text-xs">
                                                                                    <thead>
                                                                                        <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                                                                            <th className="py-2.5 px-3">Sana (Qachon)</th>
                                                                                            <th className="py-2.5 px-3">Jarima turi</th>
                                                                                            <th className="py-2.5 px-3">Sababi (Nima sababdan)</th>
                                                                                            <th className="py-2.5 px-3 text-right">Summasi (Qancha)</th>
                                                                                            <th className="py-2.5 px-3 text-center">{t("colAction")}</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-gray-100">
                                                                                        {empPenaltiesList.map((item, pIdx) => (
                                                                                            <tr key={pIdx} className="hover:bg-gray-50 transition-colors">
                                                                                                <td className="py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                                                                                                    <span className="font-bold text-black">
                                                                                                        {item.date ? new Date(item.date).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US") : "-"}
                                                                                                    </span>
                                                                                                    {item.time && (
                                                                                                        <span className="text-[10px] text-gray-400 ml-1.5 font-mono">
                                                                                                            ({item.time})
                                                                                                        </span>
                                                                                                    )}
                                                                                                </td>
                                                                                                <td className="py-2.5 px-3">
                                                                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${item.typeBadge}`}>
                                                                                                        {item.typeLabel}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="py-2.5 px-3 text-gray-800 font-medium">
                                                                                                    {item.reason}
                                                                                                </td>
                                                                                                <td className="py-2.5 px-3 text-right font-black text-rose-600 whitespace-nowrap">
                                                                                                    -{Number(item.amount || 0).toLocaleString()} UZS
                                                                                                </td>
                                                                                                <td className="py-2.5 px-3 text-center">
                                                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() => handleOpenEditPenalty({
                                                                                                                ...item,
                                                                                                                employeeId: summary.employeeId,
                                                                                                                employeeName: summary.name,
                                                                                                            })}
                                                                                                            title="Tahrirlash"
                                                                                                            className="px-2 py-1 text-[10px] font-bold uppercase bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                                                                                                        >
                                                                                                            ✏️ Tahrirlash
                                                                                                        </button>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() => handleWaiveOrDeletePenalty({
                                                                                                                ...item,
                                                                                                                employeeId: summary.employeeId,
                                                                                                                employeeName: summary.name,
                                                                                                            })}
                                                                                                            title="O'chirish / Bekor qilish"
                                                                                                            className="px-2 py-1 text-[10px] font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                                                                                                        >
                                                                                                            🗑️ O'chirish
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "all" && (
                        <div className="border border-gray-200 bg-white shadow-xs">
                            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                                        <span>📋</span>
                                        <span>Barcha jarimalar va ushlanmalar ro'yxati (3 oylik arxiv & joriy davr)</span>
                                    </h3>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        Oxirgi 3 oy va hozirgi kungacha tushgan barcha kechikishlar, kelmaganliklar va intizomiy jarimalar
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 border border-rose-200">
                                        Jami: {filteredAllPenalties.length} ta (-{filteredAllPenalties.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()} UZS)
                                    </span>
                                    <button
                                        onClick={() => generatePenaltiesPdfDocument(filteredAllPenalties, `BARCHA JARIMALAR HISOBOTI (${filteredAllPenalties.length} TA)`)}
                                        className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                        title="Ushbu ro'yxatni PDF formatda yuklab olish yoki chop etish"
                                    >
                                        <span>📥</span>
                                        <span>PDF Yuklab Olish</span>
                                    </button>
                                </div>
                            </div>

                            {/* Filters Bar: Months and Types */}
                            <div className="p-3 bg-white border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase text-gray-400 mr-1">Oylar:</span>
                                    <button
                                        onClick={() => setAllPenaltiesMonthFilter("ALL")}
                                        className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                                            allPenaltiesMonthFilter === "ALL"
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        Barchasi ({all3MonthsAndCurrentPenalties.length})
                                    </button>
                                    {last3MonthsList.map((m) => {
                                        const count = all3MonthsAndCurrentPenalties.filter((p) => p.monthKey === m.key).length;
                                        return (
                                            <button
                                                key={m.key}
                                                onClick={() => setAllPenaltiesMonthFilter(m.key)}
                                                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                                                    allPenaltiesMonthFilter === m.key
                                                        ? "bg-black text-white"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                            >
                                                {m.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase text-gray-400 mr-1">Turi:</span>
                                    <button
                                        onClick={() => setAllPenaltiesTypeFilter("ALL")}
                                        className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors cursor-pointer ${
                                            allPenaltiesTypeFilter === "ALL"
                                                ? "bg-gray-800 text-white border-gray-800"
                                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        Barchasi
                                    </button>
                                    <button
                                        onClick={() => setAllPenaltiesTypeFilter("LATENESS")}
                                        className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors cursor-pointer ${
                                            allPenaltiesTypeFilter === "LATENESS"
                                                ? "bg-amber-600 text-white border-amber-600"
                                                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                        }`}
                                    >
                                        ⏱️ Kechikishlar
                                    </button>
                                    <button
                                        onClick={() => setAllPenaltiesTypeFilter("ABSENCE")}
                                        className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors cursor-pointer ${
                                            allPenaltiesTypeFilter === "ABSENCE"
                                                ? "bg-red-600 text-white border-red-600"
                                                : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
                                        }`}
                                    >
                                        🚫 Kelmaganlik
                                    </button>
                                    <button
                                        onClick={() => setAllPenaltiesTypeFilter("DISCIPLINARY")}
                                        className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors cursor-pointer ${
                                            allPenaltiesTypeFilter === "DISCIPLINARY"
                                                ? "bg-rose-600 text-white border-rose-600"
                                                : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                                        }`}
                                    >
                                        📝 Intizomiy
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-3 text-center w-12">№</th>
                                            <th className="py-3 px-4">{t("colEmployee")}</th>
                                            <th className="py-3 px-4">Sana va Vaqt</th>
                                            <th className="py-3 px-4">Jarima turi</th>
                                            <th className="py-3 px-4">Sababi (Nima sababdan)</th>
                                            <th className="py-3 px-4 text-right">Summasi (Qancha)</th>
                                            <th className="py-3 px-4 text-center">Holati</th>
                                            <th className="py-3 px-4 text-center">{t("colAction")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredAllPenalties.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-gray-400 font-semibold">
                                                    Hech qanday jarima topilmadi.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAllPenalties.map((item, idx) => (
                                                <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-3 text-center text-gray-400 font-medium">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-black">
                                                        <div>{item.employeeName}</div>
                                                        {item.email && (
                                                             <div className="text-[11px] text-gray-500 font-normal truncate">{item.email}</div>
                                                        )}
                                                        <div className="text-[11px] text-gray-400 font-normal">
                                                            {item.department || "-"} • {item.position || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-700 font-medium whitespace-nowrap">
                                                        <span className="font-bold text-black">
                                                            {item.date ? new Date(item.date).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US") : "-"}
                                                        </span>
                                                        {item.time && (
                                                            <span className="text-[10px] text-gray-400 ml-1.5 font-mono">
                                                                ({item.time})
                                                            </span>
                                                        )}
                                                        <div className="text-[10px] text-gray-400 font-normal">
                                                            {item.monthLabel || ""}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${item.typeBadge}`}>
                                                            {item.typeLabel}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-800 font-medium">
                                                        {item.reason}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-black text-rose-600 whitespace-nowrap">
                                                        -{Number(item.amount || 0).toLocaleString()} UZS
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                                                            item.isArchived
                                                                ? "bg-gray-100 text-gray-600 border-gray-300"
                                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        }`}>
                                                            {item.statusLabel || (item.isArchived ? "Arxivlangan" : "Joriy davr")}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {item.isArchived ? (
                                                            <span className="text-[10px] text-gray-400 font-medium">-</span>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenEditPenalty(item)}
                                                                    title="Tahrirlash"
                                                                    className="px-2 py-1 text-[10px] font-bold uppercase bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                                                                >
                                                                    ✏️ Tahrirlash
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleWaiveOrDeletePenalty(item)}
                                                                    title="O'chirish / Bekor qilish"
                                                                    className="px-2 py-1 text-[10px] font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                                                                >
                                                                    🗑️ O'chirish
                                                                </button>
                                                            </div>
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
                        <div className="border border-gray-200 bg-white shadow-xs">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    {t("latenessTableTitle")} ({filteredLateAttendances.length})
                                </span>
                                <span className="text-xs font-semibold text-gray-500">
                                    {getMonthName(selectedMonth)} {selectedYear}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-4">{t("colEmployee")}</th>
                                            <th className="py-3 px-4">{t("colDate")}</th>
                                            <th className="py-3 px-4">{t("colArrivalTime")}</th>
                                            <th className="py-3 px-4">{t("colLateDuration")}</th>
                                            <th className="py-3 px-4 text-right">{t("colCalculatedFine")}</th>
                                            <th className="py-3 px-4 text-center">{t("colAction")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredLateAttendances.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-gray-400 font-semibold">
                                                    {t("noLateFoundMonth")}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLateAttendances.map((late) => (
                                                <tr key={late.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-black">
                                                        <div>{`${late.employee?.firstName || ""} ${late.employee?.lastName || ""}`.trim() || "-"}</div>
                                                        {(late.employee?.user?.email || late.employee?.email) && (
                                                            <div className="text-[11px] text-gray-500 font-normal truncate">
                                                                {late.employee?.user?.email || late.employee?.email}
                                                            </div>
                                                        )}
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
                                                    <td className="py-3 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditPenalty({
                                                                    id: late.id,
                                                                    dbId: late.id,
                                                                    employeeId: late.employeeId,
                                                                    employeeName: `${late.employee?.firstName || ""} ${late.employee?.lastName || ""}`.trim(),
                                                                    type: "LATENESS",
                                                                    typeLabel: "Kechikish",
                                                                    amount: late.fineAmount || 0,
                                                                    reason: `Ishga ${late.lateMinutes || 0} daqiqa kechikish`,
                                                                    date: late.date,
                                                                })}
                                                                className="px-2 py-1 text-[10px] font-bold uppercase bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                                                            >
                                                                ✏️ Tahrirlash
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleWaiveOrDeletePenalty({
                                                                    id: late.id,
                                                                    dbId: late.id,
                                                                    employeeId: late.employeeId,
                                                                    type: "LATENESS",
                                                                    date: late.date,
                                                                    reason: `Ishga ${late.lateMinutes || 0} daqiqa kechikish`,
                                                                })}
                                                                className="px-2 py-1 text-[10px] font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                                                            >
                                                                🗑️ Bekor qilish
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "absence" && (
                        <div className="border border-gray-200 bg-white shadow-xs">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Ishga kelmaganliklar ro'yxati ({filteredAbsentRecords.length})
                                </span>
                                <span className="text-xs font-semibold text-gray-500">
                                    {getMonthName(selectedMonth)} {selectedYear}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-4">{t("colEmployee")}</th>
                                            <th className="py-3 px-4">Sana (Qachon)</th>
                                            <th className="py-3 px-4">Sababi (Nima sababdan)</th>
                                            <th className="py-3 px-4 text-right">Hisoblangan jarima</th>
                                            <th className="py-3 px-4 text-center">{t("colAction")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredAbsentRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-400 font-semibold">
                                                    Bu oyda ishga sababsiz kelmaganliklar qayd etilmagan.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAbsentRecords.map((absent, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-black">
                                                        <div>{`${absent.employee?.firstName || ""} ${absent.employee?.lastName || ""}`.trim() || "-"}</div>
                                                        {(absent.employee?.user?.email || absent.employee?.email) && (
                                                            <div className="text-[11px] text-gray-500 font-normal truncate">
                                                                {absent.employee?.user?.email || absent.employee?.email}
                                                            </div>
                                                        )}
                                                        <div className="text-[11px] text-gray-400 font-normal">
                                                            {absent.employee?.department?.name || "-"} • {absent.employee?.position?.title || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-700 font-medium">
                                                        {absent.date ? new Date(absent.date).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US") : "-"}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-800 font-medium">
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded text-[11px]">
                                                            {absent.reason || "Ishga sababsiz kelmaganlik"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-black text-rose-600">
                                                        -{Number(absent.fineAmount || 0).toLocaleString()} UZS
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditPenalty({
                                                                    id: absent.id,
                                                                    dbId: absent.id,
                                                                    employeeId: absent.employeeId,
                                                                    employeeName: `${absent.employee?.firstName || ""} ${absent.employee?.lastName || ""}`.trim(),
                                                                    type: "ABSENCE",
                                                                    typeLabel: "Sababsiz kelmaslik",
                                                                    amount: absent.fineAmount || 0,
                                                                    reason: absent.reason || "Ishga sababsiz kelmaganlik",
                                                                    date: absent.date,
                                                                })}
                                                                className="px-2 py-1 text-[10px] font-bold uppercase bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                                                            >
                                                                ✏️ Tahrirlash
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleWaiveOrDeletePenalty({
                                                                    id: absent.id,
                                                                    dbId: absent.id,
                                                                    employeeId: absent.employeeId,
                                                                    type: "ABSENCE",
                                                                    date: absent.date,
                                                                    reason: absent.reason,
                                                                })}
                                                                className="px-2 py-1 text-[10px] font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                                                            >
                                                                🗑️ Bekor qilish
                                                            </button>
                                                        </div>
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
                        <div className="border border-gray-200 bg-white shadow-xs">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    {t("disciplinaryTableTitle")} ({filteredDisciplinaryPenalties.length})
                                </span>
                                <span className="text-xs font-semibold text-gray-500">
                                    {getMonthName(selectedMonth)} {selectedYear}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
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
                                    <tbody className="divide-y divide-gray-100">
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
                                                        {(penalty.employee?.user?.email || penalty.employee?.email) && (
                                                            <div className="text-[11px] text-gray-500 font-normal truncate">
                                                                {penalty.employee?.user?.email || penalty.employee?.email}
                                                            </div>
                                                        )}
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
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditPenalty({
                                                                    id: penalty.id,
                                                                    dbId: penalty.id,
                                                                    employeeId: penalty.employeeId,
                                                                    employeeName: `${penalty.employee?.firstName || ""} ${penalty.employee?.lastName || ""}`.trim(),
                                                                    type: "DISCIPLINARY",
                                                                    typeLabel: "Intizomiy jarima",
                                                                    amount: penalty.amount || 0,
                                                                    reason: penalty.reason || penalty.rule?.name || "Intizomiy jarima",
                                                                    date: penalty.date || penalty.createdAt,
                                                                })}
                                                                className="px-2 py-1 text-[10px] font-bold uppercase bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                                                            >
                                                                ✏️ Tahrirlash
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleWaiveOrDeletePenalty({
                                                                    id: penalty.id,
                                                                    dbId: penalty.id,
                                                                    employeeId: penalty.employeeId,
                                                                    type: "DISCIPLINARY",
                                                                    date: penalty.date,
                                                                    reason: penalty.reason,
                                                                })}
                                                                className="px-2 py-1 text-[10px] font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                                                            >
                                                                🗑️ O'chirish
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "archive" && (
                        <div className="flex flex-col gap-6">
                            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">📌</span>
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-blue-950 tracking-wide">
                                            3 Oylik Jarimalar Arxivi va Saqlanish Siyosati
                                        </h4>
                                        <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                                            Jarimalar har oy yangi oy uchun alohida yangidan hisoblanadi. Oxirgi 3 oylik barcha jarimalar tarixi ushbu arxivda saqlanadi. Ma'lumotlar bazasini toza va tizimni tezkor saqlash maqsadida <strong>3 oydan (90 kundan) oshgan</strong> eski jarimalar avtomatik ravishda bazadan tozalanadi.
                                        </p>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <span className="px-3 py-1.5 bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-bold uppercase rounded inline-flex items-center gap-1.5">
                                        <span>🛡️</span>
                                        <span>Avto-tozalash: 90 kun</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 border border-gray-200">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-bold uppercase text-gray-500 mr-1">Oylar bo'yicha:</span>
                                    <button
                                        onClick={() => setArchiveMonthFilter("ALL")}
                                        className={`px-3 py-1 text-xs font-bold uppercase rounded cursor-pointer border transition-colors ${
                                            archiveMonthFilter === "ALL"
                                                ? "bg-black text-white border-black"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                        }`}
                                    >
                                        Barchasi ({allArchiveItems.length})
                                    </button>
                                    {last3MonthsList.map((m) => {
                                        const count = allArchiveItems.filter((i) => i.monthKey === m.key).length;
                                        return (
                                            <button
                                                key={m.key}
                                                onClick={() => setArchiveMonthFilter(m.key)}
                                                className={`px-3 py-1 text-xs font-bold uppercase rounded cursor-pointer border transition-colors ${
                                                    archiveMonthFilter === m.key
                                                        ? "bg-black text-white border-black"
                                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                }`}
                                            >
                                                {m.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-semibold text-gray-500">
                                        Jami: <strong className="text-black">{filteredArchiveItems.length} ta</strong> jarima (
                                        <span className="text-rose-600 font-bold">
                                            -{filteredArchiveItems.reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()} UZS
                                        </span>)
                                    </div>
                                    <button
                                        onClick={() => generatePenaltiesPdfDocument(filteredArchiveItems, `3 OYLIK JARIMALAR ARXIVI HISOBOTI (${filteredArchiveItems.length} TA)`)}
                                        className="px-3 py-1 bg-black hover:bg-zinc-800 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                        title="Arxivdagi jarimalarni PDF formatda yuklab olish"
                                    >
                                        <span>📥</span>
                                        <span>PDF Yuklab Olish</span>
                                    </button>
                                </div>
                            </div>

                            <div className="border border-gray-200 bg-white shadow-xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                                <th className="py-3.5 px-4">Oy va Sana</th>
                                                <th className="py-3.5 px-4">{t("colEmployee")}</th>
                                                <th className="py-3.5 px-4">Jarima turi</th>
                                                <th className="py-3.5 px-4">Sababi (Nima sababdan)</th>
                                                <th className="py-3.5 px-4 text-right">Summasi (Qancha)</th>
                                                <th className="py-3.5 px-4 text-center">Holati</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredArchiveItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-gray-400 font-semibold">
                                                        Oxirgi 3 oylik arxivda jarimalar topilmadi.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredArchiveItems.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-3.5 px-4">
                                                            <div className="font-bold text-gray-900">{item.monthLabel}</div>
                                                            <div className="text-[11px] text-gray-500 font-mono">
                                                                {item.date ? new Date(item.date).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US") : "-"}
                                                                {item.time ? ` ${item.time}` : ""}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 font-bold text-black">
                                                            <div>{item.employeeName}</div>
                                                            {item.email && (
                                                                <div className="text-[11px] text-gray-500 font-normal truncate">{item.email}</div>
                                                            )}
                                                            <div className="text-[11px] text-gray-400 font-normal">
                                                                {item.department} • {item.position}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${item.typeBadge}`}>
                                                                {item.typeLabel}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-gray-700 font-medium">
                                                            {item.reason}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right font-black text-rose-600">
                                                            -{Number(item.amount || 0).toLocaleString()} UZS
                                                        </td>
                                                        <td className="py-3.5 px-4 text-center">
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-bold uppercase text-[10px] rounded border border-gray-200">
                                                                Arxivlangan
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
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
                                            {emp.name} {emp.email ? `(${emp.email})` : ""} - {emp.department} ({emp.position})
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

            {/* Edit Penalty Modal */}
            {isEditPenaltyModalOpen && editingPenaltyItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white border border-gray-300 w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                                    <span>✏️</span>
                                    <span>Jarimani tahrirlash</span>
                                </h3>
                                <div className="text-xs text-gray-500 font-medium mt-0.5">
                                    {editingPenaltyItem.employeeName}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsEditPenaltyModalOpen(false);
                                    setEditingPenaltyItem(null);
                                }}
                                className="text-gray-400 hover:text-black font-bold text-lg leading-none p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveEditPenalty} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                    Jarima turi
                                </label>
                                <div className="p-2.5 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 flex items-center gap-2">
                                    <span className="px-2 py-0.5 text-[10px] uppercase rounded border font-bold bg-amber-50 text-amber-900 border-amber-300">
                                        {editingPenaltyItem.type === "LATENESS" ? "Kechikish (Avto)" : editingPenaltyItem.type === "ABSENCE" ? "Sababsiz kelmaslik (Avto)" : "Intizomiy jarima"}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                    Sana
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={editingPenaltyItem.date}
                                    onChange={(e) => setEditingPenaltyItem({ ...editingPenaltyItem, date: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 text-xs bg-white outline-none focus:border-black font-medium"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                    Jarima summasi (UZS)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1000"
                                    value={editingPenaltyItem.amount}
                                    onChange={(e) => setEditingPenaltyItem({ ...editingPenaltyItem, amount: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 text-xs bg-white outline-none focus:border-black font-black text-rose-600"
                                    placeholder="Jarima summasini kiriting"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                    Sababi / Izoh
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={editingPenaltyItem.reason}
                                    onChange={(e) => setEditingPenaltyItem({ ...editingPenaltyItem, reason: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 text-xs bg-white outline-none focus:border-black"
                                    placeholder="Jarima sababi yoki o'zgartirish izohini yozing..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditPenaltyModalOpen(false);
                                        setEditingPenaltyItem(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase text-gray-700 hover:bg-gray-100"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-bold uppercase tracking-wider"
                                >
                                    {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
