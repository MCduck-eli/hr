"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    TodayAttendanceStatus,
    fetchTodayAttendanceStatus,
    checkOutAttendance,
} from "@/src/services/attendance-service";
import FaceCheckInModal from "./face-checkin-modal";
import AbsenceReasonModal from "../hr/attendance/absence-reason-modal";

interface QuickActionsProps {
    onAttendanceUpdated?: () => void;
}

export default function QuickActions({ onAttendanceUpdated }: QuickActionsProps) {
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    const [attendanceStatus, setAttendanceStatus] =
        useState<TodayAttendanceStatus | null>(null);
    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
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
            alert(err.message || "Check Out qilishda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleFaceCheckInSuccess = () => {
        loadStatus();
        if (onAttendanceUpdated) onAttendanceUpdated();
    };

    const isCheckedIn = Boolean(attendanceStatus?.isCheckedIn);
    const isCheckedOut = Boolean(attendanceStatus?.isCheckedOut);

    return (
        <div className="flex flex-col gap-3">
            {isCheckedOut ? (
                <div className="w-full py-4 px-6 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-widest flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Davomat yakunlandi</span>
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
                    className="w-full py-4 px-6 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-between bg-white border border-gray-300 text-black hover:border-black shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Check Out</span>
                    </div>
                    {loading ? (
                        <span className="animate-pulse">...</span>
                    ) : (
                        <span className="text-[10px] font-bold text-gray-500">
                            (Kirildi:{" "}
                            {attendanceStatus?.checkInTime
                                ? new Date(
                                      attendanceStatus.checkInTime,
                                  ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })
                                : ""}
                            )
                        </span>
                    )}
                </button>
            ) : (
                <button
                    onClick={() => setIsFaceModalOpen(true)}
                    disabled={loading}
                    className="w-full py-4 px-6 bg-[#1a1a1a] text-white hover:bg-black text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-between shadow-sm group"
                >
                    <div className="flex items-center gap-2">
                        <span>📷</span>
                        <span>Check In (Face ID)</span>
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform">
                        &#9654;
                    </span>
                </button>
            )}

            {!isCheckedIn && !isCheckedOut && (
                <button
                    onClick={() => setIsReasonModalOpen(true)}
                    className="w-full py-3 px-6 bg-amber-50/50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-bold uppercase tracking-widest transition-colors text-left flex items-center justify-between"
                >
                    <span className="flex items-center gap-2">
                        <span>📝</span>
                        <span>
                            {attendanceStatus?.absenceReason
                                ? `Sabab: ${attendanceStatus.absenceReason}`
                                : "Kelolmaslik sababini bildirish"}
                        </span>
                    </span>
                    <span>&rarr;</span>
                </button>
            )}

            <Link
                href={`/${locale}/regulations`}
                className="w-full py-4 px-6 bg-white border border-gray-200 text-black hover:border-black text-xs font-bold uppercase tracking-widest transition-colors text-left flex items-center justify-between"
            >
                <span className="flex items-center gap-2">
                    <span>⚖️</span>
                    <span>Ichki Nizomlar</span>
                </span>
                <span>&rarr;</span>
            </Link>

            <button className="w-full py-4 px-6 bg-white border border-gray-200 text-black hover:border-black text-xs font-bold uppercase tracking-widest transition-colors text-left flex items-center justify-between">
                <span>Request Leave</span>
                <span>+</span>
            </button>

            <button className="w-full py-4 px-6 bg-white border border-gray-200 text-black hover:border-black text-xs font-bold uppercase tracking-widest transition-colors text-left flex items-center justify-between">
                <span>Update OKR Progress</span>
                <span>+</span>
            </button>

            <FaceCheckInModal
                isOpen={isFaceModalOpen}
                onClose={() => setIsFaceModalOpen(false)}
                onSuccess={handleFaceCheckInSuccess}
            />

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
