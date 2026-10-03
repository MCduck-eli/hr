"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    TodayAttendanceStatus,
    fetchTodayAttendanceStatus,
    checkOutAttendance,
} from "@/src/services/attendance-service";
import AbsenceReasonModal from "../hr/attendance/absence-reason-modal";

interface QuickActionsProps {
    onAttendanceUpdated?: () => void;
}

export default function QuickActions({ onAttendanceUpdated }: QuickActionsProps) {
    const t = useTranslations("DashboardProfile");
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    const [attendanceStatus, setAttendanceStatus] =
        useState<TodayAttendanceStatus | null>(null);
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadStatus = async () => {
        try {
            const data = await fetchTodayAttendanceStatus();
            setAttendanceStatus(data);
        } catch (err) {}
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const handleCheckOut = async () => {
        setLoading(true);
        try {
            await checkOutAttendance();
            await loadStatus();
            if (onAttendanceUpdated) onAttendanceUpdated();
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    const isCheckedIn = Boolean(attendanceStatus?.isCheckedIn);
    const isCheckedOut = Boolean(attendanceStatus?.isCheckedOut);

    return (
        <div className="flex flex-col gap-3">
            {isCheckedOut ? (
                <div className="w-full py-4 px-6 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-widest flex items-center justify-between rounded-xl">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{t("attendanceCompleted")}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">
                        {attendanceStatus?.checkInTime
                            ? new Date(attendanceStatus.checkInTime).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                              )
                            : ""}{" "}
                        -{" "}
                        {attendanceStatus?.checkOutTime
                            ? new Date(
                                  attendanceStatus.checkOutTime,
                              ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })
                            : ""}
                    </span>
                </div>
            ) : isCheckedIn ? (
                <button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="w-full py-4 px-6 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-between bg-white border border-gray-300 text-black hover:border-black shadow-sm rounded-xl cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Check Out</span>
                    </div>
                    {loading ? (
                        <span className="animate-pulse">...</span>
                    ) : (
                        <span className="text-[10px] font-bold text-gray-500">
                            ({t("checkedInAt", {
                                time: attendanceStatus?.checkInTime
                                    ? new Date(
                                          attendanceStatus.checkInTime,
                                      ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      })
                                    : "",
                            })})
                        </span>
                    )}
                </button>
            ) : (
                <button
                    onClick={() => setIsReasonModalOpen(true)}
                    className="w-full py-3.5 px-5 bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-bold uppercase tracking-widest transition-colors text-left flex items-center justify-between rounded-xl cursor-pointer"
                >
                    <span className="flex items-center gap-2">
                        <span>📝</span>
                        <span>
                            {attendanceStatus?.absenceReason
                                ? `${t("reasonPrefix")}: ${attendanceStatus.absenceReason}`
                                : t("reportAbsenceReason")}
                        </span>
                    </span>
                    <span>&rarr;</span>
                </button>
            )}

            <Link
                href={`/${locale}/regulations`}
                className="w-full py-3.5 px-5 bg-white border border-slate-200 text-slate-800 hover:border-[#9327FF] text-xs font-bold uppercase tracking-widest transition-colors text-left flex items-center justify-between rounded-xl"
            >
                <span className="flex items-center gap-2">
                    <span>⚖️</span>
                    <span>{t("internalRegulations")}</span>
                </span>
                <span>&rarr;</span>
            </Link>

            <AbsenceReasonModal
                isOpen={isReasonModalOpen}
                onClose={() => setIsReasonModalOpen(false)}
                initialReason={attendanceStatus?.absenceReason}
                submittedBy="EMPLOYEE"
                onSaved={() => {
                    loadStatus();
                    if (onAttendanceUpdated) onAttendanceUpdated();
                }}
            />
        </div>
    );
}
