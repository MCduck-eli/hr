"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import GirihPattern from "@/src/components/ui/GirihPattern";
import { WorkedHoursEmployee } from "@/src/services/attendance-service";

interface EmployeeHoursModalProps {
    employee: WorkedHoursEmployee;
    monthLabel: string;
    onClose: () => void;
}

function formatTime(value: string | null, locale: string) {
    if (!value) return "-";
    return new Date(value).toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function EmployeeHoursModal({ employee, monthLabel, onClose }: EmployeeHoursModalProps) {
    const t = useTranslations("HRAttendance");
    const params = useParams();
    const locale = (params?.locale as string) || "uz";
    const intlLocale = locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US";

    const days = [...employee.days].reverse();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative w-full max-w-2xl max-h-[85vh] bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            >
                <GirihPattern className="opacity-[0.10] rounded-2xl overflow-hidden" />

                <div className="relative z-10 flex flex-col min-h-0">
                    <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#9327FF] flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                {employee.employeeName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-base font-bold text-slate-900">{employee.employeeName}</h3>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {employee.department} • {employee.position}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold capitalize mt-0.5">
                                    {monthLabel} • {employee.scheduleName} ({employee.startTime} - {employee.endTime})
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                            {t("close")} ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 border-b border-slate-100">
                        <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("hoursTotalLabel")}</div>
                            <div className="text-lg font-extrabold text-[#9327FF] mt-0.5">
                                {employee.totalHours} <span className="text-[10px] text-slate-400 font-bold">{t("hoursUnit")}</span>
                            </div>
                        </div>
                        <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("hoursExpectedLabel")}</div>
                            <div className="text-lg font-extrabold text-slate-700 mt-0.5">
                                {employee.expectedHours} <span className="text-[10px] text-slate-400 font-bold">{t("hoursUnit")}</span>
                            </div>
                        </div>
                        <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("hHoursDays")}</div>
                            <div className="text-lg font-extrabold text-slate-700 mt-0.5">
                                {employee.daysWorked}
                                <span className="text-[10px] text-slate-400 font-bold"> / {employee.scheduledDays}</span>
                            </div>
                        </div>
                        <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("hoursRateLabel")}</div>
                            <div className="text-lg font-extrabold text-slate-700 mt-0.5">{employee.scheduledHoursRatio}%</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                        <span>
                            {t("hoursAbsentLabel")}: <strong className="text-rose-600">{employee.absentDays}</strong>
                        </span>
                        <span>
                            {t("hoursExcusedLabel")}: <strong className="text-amber-600">{employee.excusedDays}</strong>
                        </span>
                        <span>
                            {t("hoursIncompleteLabel")}: <strong className="text-orange-600">{employee.incompleteDays}</strong>
                        </span>
                        <span>
                            {t("hoursLateLabel")}: <strong className="text-slate-700">{employee.lateCount}</strong>
                        </span>
                    </div>

                    <div className="overflow-y-auto min-h-0 flex-1 p-5">
                        {days.length === 0 ? (
                            <div className="py-10 text-center text-xs font-semibold text-slate-400">{t("hoursEmpty")}</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {days.map((day) => (
                                    <div
                                        key={day.date}
                                        className="p-3 border border-slate-100 rounded-xl flex items-center justify-between gap-3 hover:border-[#9327FF]/30 hover:bg-purple-50/30 transition-colors"
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-slate-900">
                                                {new Date(day.date).toLocaleDateString(intlLocale, {
                                                    day: "2-digit",
                                                    month: "long",
                                                    weekday: "short",
                                                })}
                                            </span>
                                            {day.absenceReason ? (
                                                <span className="text-[10px] font-semibold text-amber-700 truncate">{day.absenceReason}</span>
                                            ) : (
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    {day.checkIn || day.checkOut
                                                        ? `${formatTime(day.checkIn, locale)} → ${formatTime(day.checkOut, locale)}`
                                                        : day.isWorkingDay
                                                            ? t("todayAbsent")
                                                            : t("todayOff")}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {day.incomplete && (
                                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                                                    {t("hoursNoCheckOut")}
                                                </span>
                                            )}
                                            {day.lateMinutes > 0 && (
                                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                                                    {day.lateMinutes} {t("minutes")}
                                                </span>
                                            )}
                                            {!day.isWorkingDay && (
                                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                                                    {t("todayOff")}
                                                </span>
                                            )}
                                            <span
                                                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl font-mono ${
                                                    day.hours > 0 ? "bg-purple-50 text-[#9327FF] border border-purple-200" : "bg-slate-50 text-slate-400 border border-slate-200"
                                                }`}
                                            >
                                                {day.hours} {t("hoursUnit")}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
