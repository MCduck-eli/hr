"use client";

import { useState, useEffect } from "react";
import {
    TodayAttendanceStatus,
    fetchTodayAttendanceStatus,
    checkOutAttendance,
} from "@/src/services/attendance-service";
import FaceCheckInModal from "@/src/components/dashboard/face-checkin-modal";

export default function HRAttendanceWidget() {
    const [attendanceStatus, setAttendanceStatus] =
        useState<TodayAttendanceStatus | null>(null);
    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
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
        } catch (err: any) {
            alert(err.message || "Check Out qilishda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleFaceCheckInSuccess = () => {
        loadStatus();
    };

    const isCheckedIn = Boolean(attendanceStatus?.isCheckedIn);
    const isCheckedOut = Boolean(attendanceStatus?.isCheckedOut);

    return (
        <div className="flex items-center gap-3">
            {isCheckedOut ? (
                <div className="py-2.5 px-4 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-sm shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Davomat yakunlandi</span>
                    <span className="text-[10px] text-gray-500 font-mono font-bold">
                        (
                        {attendanceStatus?.checkInTime
                            ? new Date(
                                  attendanceStatus.checkInTime,
                              ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })
                            : ""}
                        {" - "}
                        {attendanceStatus?.checkOutTime
                            ? new Date(
                                  attendanceStatus.checkOutTime,
                              ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })
                            : ""}
                        )
                    </span>
                </div>
            ) : isCheckedIn ? (
                <button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="py-2.5 px-4 bg-white border border-gray-300 text-black hover:border-black text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2.5 shadow-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Check Out</span>
                    {loading ? (
                        <span className="animate-pulse">...</span>
                    ) : (
                        <span className="text-[10px] font-bold text-gray-500 font-mono">
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
                    className="py-2.5 px-5 bg-[#1a1a1a] text-white hover:bg-black text-xs font-black uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2 shadow-sm group"
                >
                    <span>📷</span>
                    <span>Check In (Face ID)</span>
                    <span className="group-hover:translate-x-0.5 transition-transform text-[10px]">
                        &#9654;
                    </span>
                </button>
            )}

            <FaceCheckInModal
                isOpen={isFaceModalOpen}
                onClose={() => setIsFaceModalOpen(false)}
                onSuccess={handleFaceCheckInSuccess}
            />
        </div>
    );
}
