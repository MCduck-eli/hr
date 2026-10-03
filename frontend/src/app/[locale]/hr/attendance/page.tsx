"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    AttendanceRecord,
    AttendanceSummary,
    WorkScheduleInfo,
    AbsentRecord,
    ThreeMonthSummary,
    fetchAllAttendance,
} from "@/src/services/attendance-service";
import WorkScheduleModal from "@/src/components/hr/attendance/work-schedule-modal";
import AbsenceReasonModal from "@/src/components/hr/attendance/absence-reason-modal";

function CircularProgress({ value, size = 48, strokeWidth = 4, color = "#9327FF" }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-100"
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                    fill="transparent"
                />
            </svg>
            <span className="absolute text-[11px] font-bold" style={{ color }}>{value}%</span>
        </div>
    );
}

export default function HRAttendancePage() {
    const t = useTranslations("HRAttendance");
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "uz";

    const [mainTab, setMainTab] = useState<"daily" | "absent" | "threeMonth">("daily");
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [absentRecords, setAbsentRecords] = useState<AbsentRecord[]>([]);
    const [threeMonthSummary, setThreeMonthSummary] = useState<ThreeMonthSummary | null>(null);

    const [summary, setSummary] = useState<AttendanceSummary>({
        totalEmployees: 0,
        todayPresent: 0,
        todayLate: 0,
        todayEarly: 0,
        todayCheckedInTotal: 0,
        todayCheckedOut: 0,
        todayUnmarked: 0,
        todayReasonGiven: 0,
        isWorkingDay: true,
    });
    const [schedule, setSchedule] = useState<WorkScheduleInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [absentSearch, setAbsentSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState("");

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedEmployeeForReason, setSelectedEmployeeForReason] = useState<{
        employeeId: string;
        employeeName: string;
        date?: string;
        initialReason?: string | null;
    } | null>(null);

    const loadData = async () => {
        try {
            const data = await fetchAllAttendance({
                search: search || undefined,
                startDate: dateFilter || undefined,
                endDate: dateFilter || undefined,
            });
            setRecords(data.records || []);
            setAbsentRecords(data.absentRecords || []);
            setThreeMonthSummary(data.threeMonthSummary || null);
            if (data.summary) {
                setSummary(data.summary);
            }
            if (data.schedule) {
                setSchedule(data.schedule);
            }
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!userStr || !token) {
            router.push(`/${locale}/login`);
            return;
        }
        try {
            const user = JSON.parse(userStr);
            const perms = Array.isArray(user.permissions) ? user.permissions : [];
            if (
                user.role !== "HR_ADMIN" &&
                user.role !== "SUPER_ADMIN" &&
                user.role !== "DIRECTOR" &&
                !perms.includes("attendance") &&
                !perms.includes("hr_dashboard") &&
                !perms.includes("hr")
            ) {
                router.push(`/${locale}/profile`);
                return;
            }
        } catch (e) {
            router.push(`/${locale}/login`);
            return;
        }

        loadData();
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, [locale, router, search, dateFilter]);

    const filteredRecords = records.filter((r) => {
        if (statusFilter === "PRESENT") return r.status === "PRESENT";
        if (statusFilter === "LATE") return r.status === "LATE";
        if (statusFilter === "EARLY") return r.earlyMinutes > 0;
        if (statusFilter === "CHECKED_OUT") return Boolean(r.checkOut);
        if (statusFilter === "IN_PROGRESS") return Boolean(r.checkIn && !r.checkOut);
        if (statusFilter === "BELGILANMADI") return r.status === "BELGILANMADI";
        if (statusFilter === "SABABLI") return Boolean(r.absenceReason);
        if (statusFilter === "DAM_OLISH") return r.status === "DAM_OLISH";
        return true;
    });

    const filteredAbsentRecords = absentRecords.filter((ar) => {
        if (!absentSearch.trim()) return true;
        const q = absentSearch.toLowerCase();
        return (
            (ar.employeeName || "").toLowerCase().includes(q) ||
            (ar.department || "").toLowerCase().includes(q) ||
            (ar.position || "").toLowerCase().includes(q) ||
            (ar.absenceReason || "").toLowerCase().includes(q)
        );
    });

    const departmentStats = (() => {
        const map = new Map<string, { total: number; present: number; late: number; onTime: number; early: number; checkedOut: number; unmarked: number }>();
        records.forEach((r) => {
            const dept = r.employee.department?.name || "Bo'limsiz";
            if (!map.has(dept)) {
                map.set(dept, { total: 0, present: 0, late: 0, onTime: 0, early: 0, checkedOut: 0, unmarked: 0 });
            }
            const st = map.get(dept)!;
            st.total += 1;
            const isLate = r.checkIn && (r.status === "LATE" || (r.lateMinutes && r.lateMinutes > 0));
            const isOnTime = r.checkIn && r.status !== "LATE" && (!r.lateMinutes || r.lateMinutes <= 0);
            const isEarly = Boolean(r.earlyMinutes && r.earlyMinutes > 0);
            const isCheckedOut = Boolean(r.checkOut);
            const isUnmarked = !r.checkIn;

            if (isOnTime) st.onTime += 1;
            if (isLate) st.late += 1;
            if (isEarly) st.early += 1;
            if (isCheckedOut) st.checkedOut += 1;
            if (isUnmarked) st.unmarked += 1;
            if (r.checkIn || r.status === "PRESENT" || r.status === "LATE") {
                st.present += 1;
            }
        });
        return Array.from(map.entries()).map(([department, data]) => {
            const percentage = data.total > 0 ? Math.round((data.onTime / data.total) * 100) : 0;
            return {
                department,
                total: data.total,
                present: data.present,
                late: data.late,
                onTime: data.onTime,
                early: data.early,
                checkedOut: data.checkedOut,
                unmarked: data.unmarked,
                percentage,
            };
        });
    })();

    const totalEmp = records.length > 0 ? records.length : (summary.totalEmployees || 0);
    const todayPresentCount = records.length > 0
        ? records.filter((r) => r.checkIn && r.status !== "LATE" && (!r.lateMinutes || r.lateMinutes <= 0)).length
        : (summary.todayPresent || 0);
    const todayLateCount = records.length > 0
        ? records.filter((r) => r.checkIn && (r.status === "LATE" || (r.lateMinutes && r.lateMinutes > 0))).length
        : (summary.todayLate || 0);
    const todayEarlyCount = records.length > 0
        ? records.filter((r) => r.earlyMinutes && r.earlyMinutes > 0).length
        : (summary.todayEarly || 0);
    const todayCheckedOutCount = records.length > 0
        ? records.filter((r) => Boolean(r.checkOut)).length
        : (summary.todayCheckedOut || 0);
    const todayUnmarkedCount = records.length > 0
        ? records.filter((r) => !r.checkIn).length
        : (summary.todayUnmarked || 0);
    const todayReasonGivenCount = records.length > 0
        ? records.filter((r) => !r.checkIn && Boolean(r.absenceReason)).length
        : (summary.todayReasonGiven || 0);

    const onTimePercent = totalEmp > 0 ? Math.round((todayPresentCount / totalEmp) * 100) : 0;
    const latePercent = totalEmp > 0 ? Math.round((todayLateCount / totalEmp) * 100) : 0;
    const earlyPercent = totalEmp > 0 ? Math.round((todayEarlyCount / totalEmp) * 100) : 0;
    const checkedOutPercent = totalEmp > 0 ? Math.round((todayCheckedOutCount / totalEmp) * 100) : 0;
    const unmarkedPercent = totalEmp > 0 ? Math.round((todayUnmarkedCount / totalEmp) * 100) : 0;

    const attendanceSegments = [
        { label: "Vaqtida kelgan", count: todayPresentCount, percent: onTimePercent, color: "#10b981", dotClass: "bg-emerald-500", textClass: "text-emerald-600" },
        { label: "Kechikkan", count: todayLateCount, percent: latePercent, color: "#f59e0b", dotClass: "bg-amber-500", textClass: "text-amber-600" },
        { label: "Erta ketgan", count: todayEarlyCount, percent: earlyPercent, color: "#8b5cf6", dotClass: "bg-purple-500", textClass: "text-purple-600" },
        { label: "Chiqib ketgan", count: todayCheckedOutCount, percent: checkedOutPercent, color: "#64748b", dotClass: "bg-slate-500", textClass: "text-slate-600" },
        { label: "Belgilanmagan", count: todayUnmarkedCount, percent: unmarkedPercent, color: "#ef4444", dotClass: "bg-rose-500", textClass: "text-rose-600" },
    ];

    const formatMinutes = (minutes: number) => {
        if (!minutes || minutes <= 0) return `0 ${t("minutes")}`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins} ${t("minutes")}`;
        if (mins === 0) return `${hours} ${t("hours")}`;
        return `${hours} ${t("hours")} ${mins} ${t("minutes")}`;
    };

    const getDayShortName = (day: number) => {
        switch (day) {
            case 1:
                return t("monShort");
            case 2:
                return t("tueShort");
            case 3:
                return t("wedShort");
            case 4:
                return t("thuShort");
            case 5:
                return t("friShort");
            case 6:
                return t("satShort");
            case 7:
                return t("sunShort");
            default:
                return String(day);
        }
    };

    const formatWorkingDays = (days?: number[]) => {
        if (!days || days.length === 0) return t("notSpecified");
        return days.map((d) => getDayShortName(d)).join(", ");
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${locale}/hr/dashboard`}
                            className="text-xs font-semibold text-slate-500 hover:text-[#9327FF] transition-colors flex items-center gap-1"
                        >
                            <span>&larr;</span>
                            <span>HR Dashboard</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                            {t("title")}
                        </h1>
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {t("liveMonitoring")}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="px-4 py-2.5 bg-[#9327FF] text-white hover:opacity-90 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                        <span>⚙️</span>
                        <span>{t("configureSchedule")}</span>
                    </button>
                    <button
                        onClick={loadData}
                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                        <span>🔄</span>
                        <span>{t("refresh")}</span>
                    </button>
                </div>
            </div>

            {schedule && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-6 font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-normal">{t("standardSchedule")}:</span>
                            <span className="font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-900 font-bold">
                                {schedule.startTime} - {schedule.endTime}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-normal">{t("gracePeriod")}:</span>
                            <span className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 text-amber-700 font-bold">
                                {schedule.gracePeriodMinutes} {t("minutes")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-normal">{t("workingDaysLabel")}:</span>
                            <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-900 font-bold">
                                {formatWorkingDays(schedule.workingDays)}
                            </span>
                        </div>
                    </div>
                    <div>
                        <span
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${
                                summary.isWorkingDay
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                        >
                            {summary.isWorkingDay ? t("todayWorkDay") : t("todayOffDay")}
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 truncate">
                            {t("totalEmployees")}
                        </span>
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#9327FF] flex items-center justify-center text-xl shrink-0">
                            👥
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5 my-2">
                        <span className="text-3xl font-extrabold text-slate-900">
                            {totalEmp}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                            Faol tarkib
                        </span>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Belgilangan xodimlar</span>
                        <span className="font-bold text-slate-900">
                            {todayPresentCount + todayLateCount + todayCheckedOutCount}
                        </span>
                    </div>
                </div>

                <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Bugungi Davomat Holati
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            <span>Jami qatnashuv:</span>
                            <span className="text-slate-900 font-bold">
                                {totalEmp > 0 ? Math.round(((todayPresentCount + todayLateCount + todayCheckedOutCount) / totalEmp) * 100) : 0}%
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 py-1">
                        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r={56}
                                    fill="none"
                                    stroke="#f1f5f9"
                                    strokeWidth="18"
                                />
                                {(() => {
                                    const circumference = 2 * Math.PI * 56;
                                    let accumulated = 0;
                                    return attendanceSegments.map((seg, idx) => {
                                        if (seg.count <= 0 || totalEmp <= 0) return null;
                                        const dashArray = `${(seg.count / totalEmp) * circumference} ${circumference}`;
                                        const dashOffset = -((accumulated / totalEmp) * circumference);
                                        accumulated += seg.count;
                                        return (
                                            <circle
                                                key={idx}
                                                cx="80"
                                                cy="80"
                                                r={56}
                                                fill="none"
                                                stroke={seg.color}
                                                strokeWidth="18"
                                                strokeDasharray={dashArray}
                                                strokeDashoffset={dashOffset}
                                                className="transition-all duration-500"
                                            />
                                        );
                                    });
                                })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-extrabold text-slate-900 leading-none">
                                    {totalEmp > 0 ? Math.round(((todayPresentCount + todayLateCount + todayCheckedOutCount) / totalEmp) * 100) : 0}%
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                                    Davomat
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full">
                            {attendanceSegments.map((seg, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2.5 h-2.5 rounded-full ${seg.dotClass} shrink-0`}></span>
                                        <span className="text-xs font-medium text-slate-600 truncate">
                                            {seg.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                        <span className="text-xs font-bold text-slate-900">
                                            {seg.count}
                                        </span>
                                        <span className={`text-[10px] font-semibold ${seg.textClass}`}>
                                            ({seg.percent}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                            Bo'limlar bo'yicha ko'rsatkichlar
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            Har bir bo'lim bo'yicha xodimlarning o'z vaqtida kelish foizlari
                        </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                        {departmentStats.length} ta bo'lim
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {departmentStats.map((dept) => {
                        const deptSegments = [
                            { label: "Vaqtida keldi", count: dept.onTime, color: "#10b981", dotClass: "bg-emerald-500" },
                            { label: "Kechikkan", count: dept.late, color: "#f59e0b", dotClass: "bg-amber-500" },
                            { label: "Erta ketgan", count: dept.early, color: "#8b5cf6", dotClass: "bg-purple-500" },
                            { label: "Chiqib ketgan", count: dept.checkedOut, color: "#64748b", dotClass: "bg-slate-500" },
                            { label: "Belgilanmagan", count: dept.unmarked, color: "#ef4444", dotClass: "bg-rose-500" },
                        ];
                        const radius = 38;
                        const circumference = 2 * Math.PI * radius;
                        let accumulated = 0;

                        return (
                            <div
                                key={dept.department}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between gap-3 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-2 h-2 rounded-full bg-[#9327FF] shrink-0" />
                                        <h3 className="text-sm font-bold text-slate-900 truncate">
                                            {dept.department}
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg shrink-0">
                                        {dept.total} xodim
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r={radius}
                                                fill="none"
                                                stroke="#f1f5f9"
                                                strokeWidth="10"
                                            />
                                            {deptSegments.map((seg, sIdx) => {
                                                if (seg.count <= 0 || dept.total <= 0) return null;
                                                const dashArray = `${(seg.count / dept.total) * circumference} ${circumference}`;
                                                const dashOffset = -((accumulated / dept.total) * circumference);
                                                accumulated += seg.count;
                                                return (
                                                    <circle
                                                        key={sIdx}
                                                        cx="50"
                                                        cy="50"
                                                        r={radius}
                                                        fill="none"
                                                        stroke={seg.color}
                                                        strokeWidth="10"
                                                        strokeDasharray={dashArray}
                                                        strokeDashoffset={dashOffset}
                                                        className="transition-all duration-300"
                                                    />
                                                );
                                            })}
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-sm font-extrabold text-slate-900 leading-none">
                                                {dept.percentage}%
                                            </span>
                                            <span className="text-[8px] font-bold text-emerald-600 mt-0.5 uppercase tracking-wider">
                                                Vaqtida
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center gap-1 w-full min-w-0">
                                        {deptSegments.map((seg, sIdx) => (
                                            <div key={sIdx} className="flex items-center justify-between text-xs py-0.5 px-2 rounded-lg bg-slate-50/60 border border-slate-100/70">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${seg.dotClass} shrink-0`} />
                                                    <span className="text-slate-600 text-[10px] font-medium truncate">{seg.label}</span>
                                                </div>
                                                <span className="font-bold text-slate-900 text-[11px] pl-1.5 shrink-0">{seg.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {departmentStats.length === 0 && (
                        <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-8 text-center text-xs text-slate-400 font-medium">
                            Bo'limlar bo'yicha ma'lumotlar hozircha mavjud emas
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 p-1 bg-gray-100/60 rounded-2xl w-fit border border-gray-200/50">
                <button
                    onClick={() => setMainTab("daily")}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                        mainTab === "daily"
                            ? "bg-violet-100 text-violet-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                >
                    <span>📅</span>
                    <span>{t("dailyTab")} ({records.length})</span>
                </button>
                <button
                    onClick={() => setMainTab("absent")}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                        mainTab === "absent"
                            ? "bg-violet-100 text-violet-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                >
                    <span>🚫</span>
                    <span>{t("absentTab")} ({absentRecords.length})</span>
                </button>
                <button
                    onClick={() => setMainTab("threeMonth")}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                        mainTab === "threeMonth"
                            ? "bg-violet-100 text-violet-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                >
                    <span>📊</span>
                    <span>{t("threeMonthTab")}</span>
                </button>
            </div>

            {mainTab === "daily" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setStatusFilter("ALL")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                    statusFilter === "ALL"
                                        ? "bg-[#9327FF] text-white shadow-xs"
                                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {t("filterAll")} ({records.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter("PRESENT")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                    statusFilter === "PRESENT"
                                        ? "bg-[#9327FF] text-white shadow-xs"
                                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {t("filterPresent")} ({records.filter((r) => r.status === "PRESENT").length})
                            </button>
                            <button
                                onClick={() => setStatusFilter("LATE")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                    statusFilter === "LATE"
                                        ? "bg-[#9327FF] text-white shadow-xs"
                                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {t("filterLate")} ({records.filter((r) => r.status === "LATE").length})
                            </button>
                            <button
                                onClick={() => setStatusFilter("EARLY")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                    statusFilter === "EARLY"
                                        ? "bg-[#9327FF] text-white shadow-xs"
                                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {t("filterEarly")} ({records.filter((r) => r.earlyMinutes > 0).length})
                            </button>
                            <button
                                onClick={() => setStatusFilter("BELGILANMADI")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                    statusFilter === "BELGILANMADI"
                                        ? "bg-[#9327FF] text-white shadow-xs"
                                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {t("filterUnmarked")} ({records.filter((r) => r.status === "BELGILANMADI").length})
                            </button>
                            <button
                                onClick={() => setStatusFilter("SABABLI")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                    statusFilter === "SABABLI"
                                        ? "bg-[#9327FF] text-white shadow-xs"
                                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {t("filterWithReason")} ({records.filter((r) => Boolean(r.absenceReason)).length})
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="p-2 border border-gray-200 bg-white text-xs font-semibold text-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                            />
                            <input
                                type="text"
                                placeholder={t("searchPlaceholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="p-2 border border-gray-200 bg-white text-xs font-medium text-slate-800 rounded-xl w-48 sm:w-64 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">{t("colEmployee")}</th>
                                    <th className="py-3.5 px-5">{t("colDepartment")}</th>
                                    <th className="py-3.5 px-5 min-w-[170px]">{t("colCheckIn")}</th>
                                    <th className="py-3.5 px-5 min-w-[170px]">{t("colCheckOut")}</th>
                                    <th className="py-3.5 px-5">{t("colWorkedHours")}</th>
                                    <th className="py-3.5 px-5">{t("colStatusReason")}</th>
                                    <th className="py-3.5 px-5">{t("colActions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <div className="inline-block w-6 h-6 border-2 border-[#9327FF] border-t-transparent rounded-full animate-spin mb-2" />
                                            <div className="text-xs font-semibold tracking-wider">
                                                {t("loading")}
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-12 text-center text-slate-400 font-semibold tracking-wider"
                                        >
                                            {t("noRecords")}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr
                                            key={record.id}
                                            className="hover:bg-slate-50/60 transition-colors"
                                        >
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#9327FF] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                        {record.employee.firstName[0]}
                                                        {record.employee.lastName[0]}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-slate-900">
                                                            {record.employee.firstName}{" "}
                                                            {record.employee.lastName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono truncate">
                                                            {record.employee.user?.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-slate-700">
                                                        {record.employee.department?.name || t("noDepartment")}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {record.scheduleName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-[11px]">
                                                        <span className="text-slate-400 text-[10px] font-medium">
                                                            {t("plan")}: <strong className="font-mono text-slate-600">{record.expectedCheckIn}</strong>
                                                        </span>
                                                        <span className="text-slate-300">&rarr;</span>
                                                        <span className="font-mono font-bold text-slate-900">
                                                            {record.checkIn ? (
                                                                new Date(record.checkIn).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })
                                                            ) : (
                                                                <span className="text-red-500 font-medium text-[10px]">
                                                                    {t("notArrived")}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {record.checkIn ? (
                                                        record.lateMinutes > 0 ? (
                                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                                                                {formatMinutes(record.lateMinutes)} {t("lateBadge")}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                                                                {t("onTimeBadge")}
                                                            </span>
                                                        )
                                                    ) : record.status === "DAM_OLISH" ? (
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {t("offDay")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 w-fit">
                                                            {t("unmarkedBadge")}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-[11px]">
                                                        <span className="text-slate-400 text-[10px] font-medium">
                                                            {t("plan")}: <strong className="font-mono text-slate-600">{record.expectedCheckOut}</strong>
                                                        </span>
                                                        <span className="text-slate-300">&rarr;</span>
                                                        <span className="font-mono font-bold text-slate-900">
                                                            {record.checkOut ? (
                                                                new Date(record.checkOut).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })
                                                            ) : record.checkIn ? (
                                                                <span className="text-blue-600 font-bold text-[10px] flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                                                    {t("atWork")}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {record.earlyMinutes > 0 ? (
                                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 w-fit">
                                                            {formatMinutes(record.earlyMinutes)} {t("earlyBadge")}
                                                        </span>
                                                    ) : record.checkOut ? (
                                                        <span className="text-[10px] font-medium text-slate-500">
                                                            {t("onTimeOutBadge")}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                {record.durationHours !== null ? (
                                                    <span className="font-bold text-slate-800 font-mono">
                                                        {record.durationHours} {t("hours")}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 font-medium">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                {record.absenceReason ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-semibold text-slate-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                                            {record.absenceReason}
                                                        </span>
                                                        <span className="text-[9px] font-semibold text-slate-400 uppercase">
                                                            {t("submittedBy")}: {record.reasonSubmittedBy || "HR"}
                                                        </span>
                                                    </div>
                                                ) : record.status === "BELGILANMADI" ? (
                                                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg inline-block w-fit">
                                                        {t("noReason")}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {record.note || t("recorded")}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <button
                                                    onClick={() =>
                                                        setSelectedEmployeeForReason({
                                                             employeeId: record.employee.id,
                                                             employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
                                                             date: record.date ? record.date.split("T")[0] : undefined,
                                                             initialReason: record.absenceReason,
                                                        })
                                                    }
                                                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                                                >
                                                    {record.absenceReason ? t("editReason") : t("addReason")}
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

            {mainTab === "absent" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                        <div>
                            <span className="text-sm font-bold text-slate-900 block">
                                {t("absentJournalTitle")} ({filteredAbsentRecords.length})
                            </span>
                            <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                                {t("absentJournalSubtitle")}
                            </span>
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder={t("absentSearchPlaceholder")}
                                value={absentSearch}
                                onChange={(e) => setAbsentSearch(e.target.value)}
                                className="p-2.5 border border-gray-200 bg-white text-xs font-medium text-slate-800 rounded-xl w-64 md:w-80 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">{t("colDate")}</th>
                                    <th className="py-3.5 px-5">{t("colEmployee")}</th>
                                    <th className="py-3.5 px-5">{t("colDepartmentPosition")}</th>
                                    <th className="py-3.5 px-5 text-center">{t("colStatus")}</th>
                                    <th className="py-3.5 px-5">{t("colReasonNote")}</th>
                                    <th className="py-3.5 px-5 text-center">{t("colAction")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                                {filteredAbsentRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold tracking-wider">
                                            {t("noAbsentRecords")}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAbsentRecords.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                                                {item.date ? new Date(item.date).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US") : "-"}
                                            </td>
                                            <td className="py-3.5 px-5 font-bold text-slate-900">
                                                {item.employeeName}
                                            </td>
                                            <td className="py-3.5 px-5 text-slate-600">
                                                <div className="font-semibold text-slate-800">{item.department || t("noDepartment")}</div>
                                                <div className="text-[10px] text-slate-400 font-medium">{item.position || t("noPosition")}</div>
                                            </td>
                                            <td className="py-3.5 px-5 text-center">
                                                {item.status === "SABABLI" ? (
                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                                                        {t("statusExcusedAbsent")}
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                                                        {t("statusUnexcusedAbsent")}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                {item.absenceReason ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold text-slate-800">{item.absenceReason}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase">
                                                            {t("submittedBy")}: {item.reasonSubmittedBy || "HR"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 font-medium italic">{t("noReasonEntered")}</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-5 text-center">
                                                <button
                                                    onClick={() =>
                                                        setSelectedEmployeeForReason({
                                                            employeeId: item.employeeId,
                                                            employeeName: item.employeeName,
                                                            date: item.date,
                                                            initialReason: item.absenceReason,
                                                        })
                                                    }
                                                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                                                >
                                                    {item.absenceReason ? t("editReason") : t("addReason")}
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

            {mainTab === "threeMonth" && (
                <div className="flex flex-col gap-6">
                    <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold text-violet-900">
                        <div className="flex items-center gap-2">
                            <span>⚡</span>
                            <span>
                                <strong>{t("autoCleanupTitle")}</strong> {t("autoCleanupNotice")}
                            </span>
                        </div>
                        <span className="text-xs px-3 py-1 bg-violet-100 text-violet-800 font-bold rounded-xl shrink-0">
                            {t("activeRetentionBadge")}
                        </span>
                    </div>

                    {threeMonthSummary && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {threeMonthSummary.months.map((m) => (
                                    <div key={`${m.year}-${m.month}`} className="p-5 border border-gray-100 bg-white rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {m.monthName} {m.year}
                                                </span>
                                                <span className="text-xs text-slate-400 font-semibold">
                                                    {m.totalWorkingDays} {t("workingDaysSuffix")}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                                                    <div className="text-lg font-extrabold text-emerald-700">{m.attendedCount}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mt-0.5">{t("attendedLabel")}</div>
                                                </div>
                                                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
                                                    <div className="text-lg font-extrabold text-rose-700">{m.absentCount}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800 mt-0.5">{t("absentLabel")}</div>
                                                </div>
                                                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                                                    <div className="text-lg font-extrabold text-amber-700">{m.lateCount}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mt-0.5">{t("lateLabel")}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                                <div className="p-5 border-b border-gray-100 bg-slate-50/50">
                                    <span className="text-sm font-bold text-slate-900 block">
                                        {t("threeMonthEmployeeStatsTitle")} ({threeMonthSummary.employeeSummaries.length})
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                <th className="py-3.5 px-5">{t("colEmployee")}</th>
                                                <th className="py-3.5 px-5">{t("colDepartmentPosition")}</th>
                                                <th className="py-3.5 px-5 text-center">{t("colAttendedDays")}</th>
                                                <th className="py-3.5 px-5 text-center">{t("colAbsentDays")}</th>
                                                <th className="py-3.5 px-5 text-center">{t("colLateTimes")}</th>
                                                <th className="py-3.5 px-5 text-right">{t("colAttendancePercentage")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-xs">
                                            {threeMonthSummary.employeeSummaries.map((emp) => (
                                                <tr key={emp.employeeId} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3.5 px-5 font-bold text-slate-900">
                                                        {emp.name}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-slate-600">
                                                        <div className="font-semibold text-slate-800">{emp.department || t("noDepartment")}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{emp.position || t("noPosition")}</div>
                                                    </td>
                                                    <td className="py-3.5 px-5 text-center font-bold text-emerald-700">
                                                        {emp.attendedCount} {t("daysUnit")}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-center font-bold text-rose-700">
                                                        {emp.absentCount} {t("daysUnit")}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-center font-bold text-amber-700">
                                                        {emp.lateCount} {t("timesUnit")}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-right font-black">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                                emp.attendanceRate >= 90
                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                    : emp.attendanceRate >= 75
                                                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                                            }`}
                                                        >
                                                            {emp.attendanceRate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <WorkScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSaved={loadData}
            />

            <AbsenceReasonModal
                isOpen={Boolean(selectedEmployeeForReason)}
                onClose={() => setSelectedEmployeeForReason(null)}
                employeeId={selectedEmployeeForReason?.employeeId}
                employeeName={selectedEmployeeForReason?.employeeName}
                date={selectedEmployeeForReason?.date || dateFilter || undefined}
                initialReason={selectedEmployeeForReason?.initialReason}
                submittedBy="HR"
                onSaved={loadData}
            />
        </div>
    );
}
