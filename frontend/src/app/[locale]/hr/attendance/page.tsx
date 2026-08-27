"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    AttendanceRecord,
    AttendanceSummary,
    WorkScheduleInfo,
    fetchAllAttendance,
} from "@/src/services/attendance-service";
import WorkScheduleModal from "@/src/components/hr/attendance/work-schedule-modal";
import AbsenceReasonModal from "@/src/components/hr/attendance/absence-reason-modal";

export default function HRAttendancePage() {
    const t = useTranslations("HRAttendance");
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || "uz";

    const [records, setRecords] = useState<AttendanceRecord[]>([]);
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
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState("");

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedEmployeeForReason, setSelectedEmployeeForReason] = useState<{
        employeeId: string;
        employeeName: string;
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
            if (user.role !== "HR_ADMIN" && user.role !== "SUPER_ADMIN") {
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
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${locale}/hr/dashboard`}
                            className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider transition-colors"
                        >
                            &larr; HR Dashboard
                        </Link>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
                        <span>{t("title")}</span>
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {t("liveMonitoring")}
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="px-4 py-2.5 bg-black text-white hover:bg-gray-800 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <span>⚙️</span>
                        <span>{t("configureSchedule")}</span>
                    </button>
                    <button
                        onClick={loadData}
                        className="px-4 py-2.5 bg-white border border-gray-300 text-black hover:border-black text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2"
                    >
                        <span>🔄</span>
                        <span>{t("refresh")}</span>
                    </button>
                </div>
            </div>

            {schedule && (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-6 font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-normal">{t("standardSchedule")}:</span>
                            <span className="font-mono bg-white px-2 py-1 border border-gray-200 text-black">
                                {schedule.startTime} - {schedule.endTime}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-normal">{t("gracePeriod")}:</span>
                            <span className="bg-white px-2 py-1 border border-gray-200 text-amber-700">
                                {schedule.gracePeriodMinutes} {t("minutes")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-normal">{t("workingDaysLabel")}:</span>
                            <span className="bg-white px-2 py-1 border border-gray-200 text-black">
                                {formatWorkingDays(schedule.workingDays)}
                            </span>
                        </div>
                    </div>
                    <div>
                        <span
                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                                summary.isWorkingDay
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-gray-200 text-gray-700"
                            }`}
                        >
                            {summary.isWorkingDay ? t("todayWorkDay") : t("todayOffDay")}
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 border border-gray-200 flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {t("totalEmployees")}
                    </span>
                    <span className="text-2xl font-black text-black">
                        {summary.totalEmployees}
                    </span>
                </div>

                <div className="bg-white p-4 border border-emerald-200 bg-emerald-50/20 flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        {t("onTime")}
                    </span>
                    <span className="text-2xl font-black text-emerald-700">
                        {summary.todayPresent}
                    </span>
                </div>

                <div className="bg-white p-4 border border-amber-200 bg-amber-50/20 flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                        {t("late")}
                    </span>
                    <span className="text-2xl font-black text-amber-700">
                        {summary.todayLate}
                    </span>
                </div>

                <div className="bg-white p-4 border border-rose-200 bg-rose-50/20 flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                        {t("earlyDepartures")}
                    </span>
                    <span className="text-2xl font-black text-rose-700">
                        {summary.todayEarly}
                    </span>
                </div>

                <div className="bg-white p-4 border border-blue-200 bg-blue-50/20 flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                        {t("checkedOut")}
                    </span>
                    <span className="text-2xl font-black text-blue-700">
                        {summary.todayCheckedOut}
                    </span>
                </div>

                <div className="bg-white p-4 border border-red-200 bg-red-50/20 flex flex-col gap-1 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                        {t("unmarked")}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-red-700">
                            {summary.todayUnmarked}
                        </span>
                        {summary.todayReasonGiven > 0 && (
                            <span className="text-[10px] text-gray-500 font-bold">
                                ({summary.todayReasonGiven} {t("withReason")})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm flex flex-col">
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setStatusFilter("ALL")}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                                statusFilter === "ALL"
                                    ? "bg-[#1a1a1a] text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:text-black"
                            }`}
                        >
                            {t("filterAll")} ({records.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter("PRESENT")}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                                statusFilter === "PRESENT"
                                    ? "bg-[#1a1a1a] text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:text-black"
                            }`}
                        >
                            {t("filterPresent")} ({records.filter((r) => r.status === "PRESENT").length})
                        </button>
                        <button
                            onClick={() => setStatusFilter("LATE")}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                                statusFilter === "LATE"
                                    ? "bg-[#1a1a1a] text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:text-black"
                            }`}
                        >
                            {t("filterLate")} ({records.filter((r) => r.status === "LATE").length})
                        </button>
                        <button
                            onClick={() => setStatusFilter("EARLY")}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                                statusFilter === "EARLY"
                                    ? "bg-[#1a1a1a] text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:text-black"
                            }`}
                        >
                            {t("filterEarly")} ({records.filter((r) => r.earlyMinutes > 0).length})
                        </button>
                        <button
                            onClick={() => setStatusFilter("BELGILANMADI")}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                                statusFilter === "BELGILANMADI"
                                    ? "bg-[#1a1a1a] text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:text-black"
                            }`}
                        >
                            {t("filterUnmarked")} ({records.filter((r) => r.status === "BELGILANMADI").length})
                        </button>
                        <button
                            onClick={() => setStatusFilter("SABABLI")}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${
                                statusFilter === "SABABLI"
                                    ? "bg-[#1a1a1a] text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:text-black"
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
                            className="p-2 border border-gray-200 bg-white text-xs font-bold text-black rounded-sm"
                        />
                        <input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="p-2 border border-gray-200 bg-white text-xs font-medium text-black rounded-sm w-48 sm:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-100/60 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                <th className="py-3.5 px-4">{t("colEmployee")}</th>
                                <th className="py-3.5 px-4">{t("colDepartment")}</th>
                                <th className="py-3.5 px-4 min-w-[170px]">{t("colCheckIn")}</th>
                                <th className="py-3.5 px-4 min-w-[170px]">{t("colCheckOut")}</th>
                                <th className="py-3.5 px-4">{t("colWorkedHours")}</th>
                                <th className="py-3.5 px-4">{t("colStatusReason")}</th>
                                <th className="py-3.5 px-4">{t("colActions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400">
                                        <div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-2" />
                                        <div className="text-xs font-bold uppercase tracking-wider">
                                            {t("loading")}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-gray-400 font-bold uppercase tracking-wider"
                                    >
                                        {t("noRecords")}
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr
                                        key={record.id}
                                        className="hover:bg-gray-50/80 transition-colors"
                                    >
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-black text-xs text-gray-700 uppercase shrink-0">
                                                    {record.employee.firstName[0]}
                                                    {record.employee.lastName[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-black">
                                                        {record.employee.firstName}{" "}
                                                        {record.employee.lastName}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        {record.employee.user?.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-gray-700">
                                                    {record.employee.department?.name || t("noDepartment")}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {record.scheduleName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    <span className="text-gray-400 text-[10px] font-medium">
                                                        {t("plan")}: <strong className="font-mono text-gray-600">{record.expectedCheckIn}</strong>
                                                    </span>
                                                    <span>&rarr;</span>
                                                    <span className="font-mono font-bold text-black">
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
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 w-fit">
                                                            {formatMinutes(record.lateMinutes)} {t("lateBadge")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 w-fit">
                                                            {t("onTimeBadge")}
                                                        </span>
                                                    )
                                                ) : record.status === "DAM_OLISH" ? (
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                        {t("offDay")}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 w-fit">
                                                        {t("unmarkedBadge")}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    <span className="text-gray-400 text-[10px] font-medium">
                                                        {t("plan")}: <strong className="font-mono text-gray-600">{record.expectedCheckOut}</strong>
                                                    </span>
                                                    <span>&rarr;</span>
                                                    <span className="font-mono font-bold text-black">
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
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </span>
                                                </div>

                                                {record.earlyMinutes > 0 ? (
                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 w-fit">
                                                        {formatMinutes(record.earlyMinutes)} {t("earlyBadge")}
                                                    </span>
                                                ) : record.checkOut ? (
                                                    <span className="text-[9px] font-bold text-gray-500">
                                                        {t("onTimeOutBadge")}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {record.durationHours !== null ? (
                                                <span className="font-bold text-gray-800 font-mono">
                                                    {record.durationHours} {t("hours")}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-medium">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {record.absenceReason ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-gray-900 bg-amber-50 border border-amber-200 px-2 py-1 rounded-sm">
                                                        {record.absenceReason}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                        {t("submittedBy")}: {record.reasonSubmittedBy || "HR"}
                                                    </span>
                                                </div>
                                            ) : record.status === "BELGILANMADI" ? (
                                                <span className="text-[11px] text-red-600 font-bold">
                                                    {t("noReason")}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    {record.note || t("recorded")}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <button
                                                onClick={() =>
                                                    setSelectedEmployeeForReason({
                                                        employeeId: record.employee.id,
                                                        employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
                                                        initialReason: record.absenceReason,
                                                    })
                                                }
                                                className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 hover:text-black hover:border-black text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors"
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
                date={dateFilter || undefined}
                initialReason={selectedEmployeeForReason?.initialReason}
                submittedBy="HR"
                onSaved={loadData}
            />
        </div>
    );
}
