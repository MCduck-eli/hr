"use client";

import { useState } from "react";

export default function QuickActions() {
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCheckIn = () => {
        setLoading(true);
        setTimeout(() => {
            setIsCheckedIn(!isCheckedIn);
            setLoading(false);
        }, 800);
    };

    return (
        <div className="flex flex-col gap-3">
            <button
                onClick={handleCheckIn}
                disabled={loading}
                className={`w-full py-4 px-6 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-between ${
                    isCheckedIn
                        ? "bg-white border border-gray-200 text-black hover:border-black"
                        : "bg-[#1a1a1a] text-white hover:bg-black"
                }`}
            >
                <span>{isCheckedIn ? "Check Out" : "Check In (Face ID)"}</span>
                {loading ? (
                    <span className="animate-pulse">...</span>
                ) : (
                    <span>&#9654;</span>
                )}
            </button>

            <button className="w-full py-4 px-6 bg-white border border-gray-200 text-black hover:border-black text-xs font-bold uppercase tracking-widest transition-colors text-left flex items-center justify-between">
                <span>Request Leave</span>
                <span>+</span>
            </button>

            <button className="w-full py-4 px-6 bg-white border border-gray-200 text-black hover:border-black text-xs font-bold uppercase tracking-widest transition-colors text-left flex items-center justify-between">
                <span>Update OKR Progress</span>
                <span>+</span>
            </button>
        </div>
    );
}
