"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    fetchMyPayrolls,
    confirmSalaryReceipt,
    fetchMyAdvances,
    confirmAdvanceReceipt,
} from "@/src/services/payroll-service";

export default function EmployeePayslipsSection() {
    const t = useTranslations("Payroll");
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [confirmingAdvanceId, setConfirmingAdvanceId] = useState<string | null>(null);
    const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [payrollsData, advancesData] = await Promise.all([
                fetchMyPayrolls(),
                fetchMyAdvances().catch(() => []),
            ]);
            setPayrolls(payrollsData || []);
            setAdvances(advancesData || []);
        } catch (err: any) {
            console.error("Failed to fetch my payrolls or advances", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleConfirmReceipt = async (payrollId: string) => {
        setConfirmingId(payrollId);
        try {
            await confirmSalaryReceipt(payrollId);
            alert(t("salaryConfirmedSuccess"));
            await loadData();
            if (selectedPayroll && selectedPayroll.id === payrollId) {
                setSelectedPayroll(null);
            }
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setConfirmingId(null);
        }
    };

    const handleConfirmAdvanceReceipt = async (advanceId: string) => {
        setConfirmingAdvanceId(advanceId);
        try {
            await confirmAdvanceReceipt(advanceId);
            alert(t("advanceConfirmedSuccess"));
            await loadData();
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setConfirmingAdvanceId(null);
        }
    };

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString("uz-UZ") + " UZS";
    };

    const awaitingPayroll = payrolls.find((p) => p.status === "AWAITING_CONFIRMATION");
    const awaitingAdvances = advances.filter((a) => a.status === "AWAITING_CONFIRMATION" || a.status === "PENDING");

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-black flex items-center gap-2">
                        <span>💳</span> {t("myPayrollsTitle")}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                        {t("myPayrollsSubtitle")}
                    </p>
                </div>

                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("totalPayslips", { count: payrolls.length })}
                </span>
            </div>

            {/* Awaiting Salary Confirmation Banner */}
            {awaitingPayroll && (
                <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔔</span>
                        <div>
                            <h4 className="text-xs font-black uppercase text-amber-950">
                                {t("statusAwaitingConfirmation")} ({t("typeSalary")})
                            </h4>
                            <p className="text-xs font-medium text-amber-900">
                                {t("pendingSalaryConfirmAlert")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleConfirmReceipt(awaitingPayroll.id)}
                        disabled={confirmingId === awaitingPayroll.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                        {confirmingId === awaitingPayroll.id ? t("loading") : t("confirmSalaryReceiptBtn")}
                    </button>
                </div>
            )}

            {/* Awaiting Advance Confirmation Banners */}
            {awaitingAdvances.map((adv) => (
                <div
                    key={adv.id}
                    className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚡</span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black uppercase text-amber-950">
                                    {t("statusAwaitingConfirmation")} ({t("typeAdvance")})
                                </h4>
                                {adv.isEarly && (
                                    <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[9px] font-black uppercase rounded-xs">
                                        ⚡ {t("isEarlyAdvance")}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-medium text-amber-900 mt-0.5">
                                {t(`months.${adv.month}` as any) || `${adv.month}-oy`} {adv.year} uchun <strong className="font-bold text-black">{formatMoney(adv.amount)}</strong> miqdorida avans o'tkazildi. Iltimos, qabul qilganingizni tasdiqlang. {adv.reason ? `(Izoh: ${adv.reason})` : ""}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleConfirmAdvanceReceipt(adv.id)}
                        disabled={confirmingAdvanceId === adv.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                        {confirmingAdvanceId === adv.id ? t("loading") : t("confirmAdvanceReceiptBtn")}
                    </button>
                </div>
            ))}

            {/* Daily Accrued Salary Live Tracker */}
            {(() => {
                const now = new Date();
                const curMonth = now.getMonth() + 1;
                const curYear = now.getFullYear();
                const activePayroll = payrolls.find((p) => p.month === curMonth && p.year === curYear) || payrolls[0];
                if (!activePayroll) return null;

                const baseSal = activePayroll.baseSalary || 5000000;
                const bonusSal = activePayroll.bonus || 0;
                const deductSal = activePayroll.deductions || 0;

                // Check if salary was paid for this month
                const isSalaryPaid = activePayroll.status === "PAID";
                let cutoffDay = 1;
                if (isSalaryPaid) {
                    if (activePayroll.disbursedAt) {
                        cutoffDay = new Date(activePayroll.disbursedAt).getDate();
                    } else if (activePayroll.confirmedAt) {
                        cutoffDay = Math.min(new Date(activePayroll.confirmedAt).getDate(), 5);
                    } else {
                        cutoffDay = 5;
                    }
                }

                const startFromDay = isSalaryPaid ? cutoffDay + 1 : 1;

                const daysInMonthCount = new Date(curYear, curMonth, 0).getDate();
                let totalWorkingDays = 0;
                let passedWorkingDays = 0;
                const isWorkDayEnded = now.getHours() >= 18;
                const isTodayWeekday = now.getDay() !== 0 && now.getDay() !== 6;

                for (let d = 1; d <= daysInMonthCount; d++) {
                    const checkDate = new Date(curYear, curMonth - 1, d);
                    const dow = checkDate.getDay();
                    if (dow !== 0 && dow !== 6) {
                        totalWorkingDays++;
                        if (d >= startFromDay) {
                            if (d < now.getDate()) {
                                passedWorkingDays++;
                            } else if (d === now.getDate() && isWorkDayEnded) {
                                passedWorkingDays++;
                            }
                        }
                    }
                }
                if (totalWorkingDays === 0) totalWorkingDays = 22;

                const dailyRate = Math.round(baseSal / totalWorkingDays);
                const postPaymentAdvances = advances.filter((a) => {
                    if (!isSalaryPaid) return true;
                    const aDate = new Date(a.paidDate || a.createdAt);
                    return aDate.getDate() > cutoffDay;
                });
                const postPaymentDeductions = isSalaryPaid
                    ? postPaymentAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0)
                    : deductSal;
                const activeBonus = isSalaryPaid ? 0 : bonusSal;

                const grossAccrued = passedWorkingDays * dailyRate;
                const netAccrued = Math.max(0, grossAccrued + activeBonus - postPaymentDeductions);

                return (
                    <div className="bg-white border-2 border-black p-5 rounded-xs shadow-xs flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xl">⏱️</span>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-black">
                                        Kunlik Ish Haqi Hisoblagichi ({t(`months.${curMonth}` as any) || `${curMonth}-oy`} {curYear})
                                    </h3>
                                    {isSalaryPaid ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase rounded-xs">
                                            ✓ To'lov qabul qilingan (0 ga tushirildi)
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase rounded-xs">
                                            ⚠️ To'lanmagan / Kutilmoqda
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                    {isSalaryPaid
                                        ? "Maosh to'liq qabul qilib olingan. Hisobingiz 0 ga tushirildi va har bir yangi ish kuni tugagach (soat 18:00 dan so'ng) hisobingiz 0 dan to'lib bormoqda."
                                        : "Dam olish kunlari chiqarib tashlangan holda har bir o'tgan ish kuni uchun to'plangan maosh"}
                                </p>
                                {isTodayWeekday && !isWorkDayEnded && (
                                    <div className="text-[10px] font-semibold text-blue-700 mt-1 flex items-center gap-1">
                                        <span>ℹ️</span>
                                        <span>Bugungi ish kuni davom etmoqda — soat 18:00 da yakunlangach, kunlik oylikka qo'shiladi.</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xs self-start md:self-auto">
                                <span className="text-[10px] font-bold uppercase text-blue-800">Kunlik stavka:</span>
                                <span className="text-xs font-black font-mono text-blue-900">
                                    {formatMoney(dailyRate)} / kun
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
                            <div className="bg-gray-50 p-3 rounded-xs border border-gray-200">
                                <span className="text-[9px] font-bold uppercase text-gray-400 block">Jami ish kunlari</span>
                                <span className="text-sm font-black text-black">{totalWorkingDays} kun</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xs border border-gray-200">
                                <span className="text-[9px] font-bold uppercase text-gray-400 block">
                                    {isSalaryPaid ? "Yakunlangan ish kunlari (Yangi)" : "Yakunlangan ish kunlari"}
                                </span>
                                <span className="text-sm font-black text-black">{passedWorkingDays} kun</span>
                            </div>
                            <div className="bg-blue-50/60 p-3 rounded-xs border border-blue-100">
                                <span className="text-[9px] font-bold uppercase text-blue-700 block">Kunlik yig'ildi</span>
                                <span className="text-sm font-black text-blue-900 font-mono">+{formatMoney(grossAccrued)}</span>
                            </div>
                            <div className="bg-emerald-50/60 p-3 rounded-xs border border-emerald-100">
                                <span className="text-[9px] font-bold uppercase text-emerald-700 block">Bonus (+)</span>
                                <span className="text-sm font-black text-emerald-800 font-mono">+{formatMoney(activeBonus)}</span>
                            </div>
                            <div className="bg-rose-50/60 p-3 rounded-xs border border-rose-100">
                                <span className="text-[9px] font-bold uppercase text-rose-700 block">Ushlanma / Yangi Avans (-)</span>
                                <span className="text-sm font-black text-rose-800 font-mono">-{formatMoney(postPaymentDeductions)}</span>
                            </div>
                            <div className="bg-emerald-100/70 p-3 rounded-xs border border-emerald-300">
                                <span className="text-[9px] font-black uppercase text-emerald-950 block">Bugungi sof balans</span>
                                <span className="text-sm font-black text-emerald-950 font-mono">{formatMoney(netAccrued)}</span>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {loading ? (
                <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-gray-400 animate-pulse bg-white border border-gray-200">
                    {t("loading")}
                </div>
            ) : payrolls.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">💰</span>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                        {t("noPayslips")}
                    </p>
                    <p className="text-[11px] text-gray-400">
                        {t("noPayslipsDesc")}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payrolls.map((payroll) => {
                        const monthKey = (payroll.month || 1).toString();
                        const monthLabel = t(`months.${monthKey}` as any) || `${payroll.month}-oy`;

                        const isPaid = payroll.status === "PAID";
                        const isAwaiting = payroll.status === "AWAITING_CONFIRMATION";
                        const isPending = payroll.status === "PENDING";
                        const now = new Date();
                        const curMonth = now.getMonth() + 1;
                        const curYear = now.getFullYear();
                        const isCurrentPeriod = payroll.month === curMonth && payroll.year === curYear;
                        const isWorkDayEnded = now.getHours() >= 18;

                        // Calculate daily accumulation since payment
                        let cutoffDay = 1;
                        if (isPaid) {
                            if (payroll.disbursedAt) {
                                cutoffDay = new Date(payroll.disbursedAt).getDate();
                            } else if (payroll.confirmedAt) {
                                cutoffDay = Math.min(new Date(payroll.confirmedAt).getDate(), 5);
                            } else {
                                cutoffDay = 5;
                            }
                        }

                        const startFromDay = isPaid && isCurrentPeriod
                            ? cutoffDay + 1
                            : 1;

                        const daysInMonthCount = new Date(payroll.year, payroll.month, 0).getDate();
                        let totalWorkingDays = 0;
                        let passedWorkingDays = 0;

                        for (let d = 1; d <= daysInMonthCount; d++) {
                            const checkDate = new Date(payroll.year, payroll.month - 1, d);
                            const dow = checkDate.getDay();
                            if (dow !== 0 && dow !== 6) {
                                totalWorkingDays++;
                                if (d >= startFromDay) {
                                    if (d < now.getDate()) {
                                        passedWorkingDays++;
                                    } else if (d === now.getDate() && isWorkDayEnded) {
                                        passedWorkingDays++;
                                    }
                                }
                            }
                        }
                        if (totalWorkingDays === 0) totalWorkingDays = 22;

                        const dailyRate = Math.round((payroll.baseSalary || 0) / totalWorkingDays);
                        const postPaymentAdvances = advances.filter((a) => {
                            if (!isPaid) return true;
                            const aDate = new Date(a.paidDate || a.createdAt);
                            return aDate.getDate() > cutoffDay;
                        });
                        const postPaymentDeductions = isPaid
                            ? postPaymentAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0)
                            : (payroll.deductions || 0);

                        const grossAccrued = passedWorkingDays * dailyRate;
                        const cardNetAccrued = isPaid
                            ? Math.max(0, grossAccrued - postPaymentDeductions)
                            : (payroll.netSalary || 0);

                        return (
                            <div
                                key={payroll.id}
                                className={`bg-white border p-5 flex flex-col justify-between gap-4 transition-colors shadow-xs ${
                                    isAwaiting
                                        ? "border-amber-400 bg-amber-50/20"
                                        : isPending
                                        ? "border-gray-300 hover:border-black"
                                        : "border-gray-200 hover:border-black"
                                }`}
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-widest">
                                                {t("monthlyPeriod")}
                                            </span>
                                            <h3 className="text-base font-black text-black uppercase">
                                                {monthLabel} {payroll.year}
                                            </h3>
                                        </div>

                                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-xs border ${
                                            isPaid
                                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                                : isAwaiting
                                                ? "bg-amber-100 text-amber-950 border-amber-400 animate-pulse"
                                                : payroll.status === "CANCELLED"
                                                ? "bg-rose-50 text-rose-800 border-rose-300"
                                                : "bg-gray-100 text-gray-800 border-gray-300 font-bold"
                                        }`}>
                                            {isPaid
                                                ? "✓ TO'LANGAN VA QABUL QILINGAN"
                                                : isAwaiting
                                                ? "⏳ TASDIQLASH KUTILMOQDA (Tasdiqlanmagan)"
                                                : payroll.status === "CANCELLED"
                                                ? t("statusCancelled")
                                                : "⚠️ TO'LANMAGAN (Kutilmoqda)"}
                                        </span>
                                    </div>

                                    {isPaid ? (
                                        <div className="p-3 bg-emerald-50/60 border border-emerald-200 text-xs flex flex-col gap-2 rounded-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 font-medium">To'langan summa (Qabul qilingan):</span>
                                                <span className="font-bold text-gray-900 font-mono">{formatMoney(payroll.netSalary)}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/60 text-[11px]">
                                                <span className="text-emerald-950 font-bold">To'lovdan keyin to'planayotgan balans:</span>
                                                <span className="font-black text-emerald-900 font-mono">
                                                    {formatMoney(cardNetAccrued)} {passedWorkingDays === 0 ? "(0 UZS dan to'planmoqda)" : `(+${passedWorkingDays} ish kuni)`}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 border border-gray-100 text-[11px]">
                                            <div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase block">{t("base")}</span>
                                                <span className="font-bold text-gray-800">{formatMoney(payroll.baseSalary)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase block">{t("bonus")}</span>
                                                <span className="font-bold text-emerald-600">+{formatMoney(payroll.bonus)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-rose-600 uppercase block">{t("deduction")}</span>
                                                <span className="font-bold text-rose-600">-{formatMoney(payroll.deductions)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                                            {isPaid ? "Joriy Faol Balans (0 dan boshlangan)" : t("takeHome")}
                                        </span>
                                        <span className={`text-base font-black ${isPaid ? "text-emerald-700 font-mono" : "text-black"}`}>
                                            {isPaid ? formatMoney(cardNetAccrued) : formatMoney(payroll.netSalary)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isAwaiting && (
                                            <button
                                                type="button"
                                                onClick={() => handleConfirmReceipt(payroll.id)}
                                                disabled={confirmingId === payroll.id}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 animate-pulse"
                                            >
                                                {confirmingId === payroll.id ? t("loading") : "✓ Qabul qildim (Tasdiqlash)"}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPayroll(payroll)}
                                            className="px-3 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <span>📊</span>
                                            <span>{t("whyThisAmountBtn")}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Advances Section */}
            {advances.length > 0 && (
                <div className="flex flex-col gap-4 mt-2 border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold uppercase tracking-wider text-black flex items-center gap-2">
                                <span>⚡</span> {t("myAdvancesTitle")}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                {t("myAdvancesSubtitle")}
                            </p>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {advances.length} ta
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {advances.map((adv) => {
                            const monthKey = (adv.month || 1).toString();
                            const monthLabel = t(`months.${monthKey}` as any) || `${adv.month}-oy`;
                            return (
                                <div
                                    key={adv.id}
                                    className="bg-white border border-gray-200 p-5 flex flex-col justify-between gap-4 hover:border-black transition-colors shadow-xs"
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-widest">
                                                    {t("typeAdvance")}
                                                </span>
                                                <h4 className="text-base font-black text-black uppercase">
                                                    {monthLabel} {adv.year}
                                                </h4>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {adv.isEarly && (
                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-black uppercase rounded-xs">
                                                        ⚡ {t("isEarlyAdvance")}
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-xs border ${
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
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 border border-gray-100 text-xs flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 text-[11px]">{t("advanceDueDate")}:</span>
                                                <span className="font-mono font-bold text-gray-800">
                                                    {adv.dueDate ? new Date(adv.dueDate).toLocaleDateString("uz-UZ") : "-"}
                                                </span>
                                            </div>
                                            {adv.reason && (
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500">{t("advanceReason")}:</span>
                                                    <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">
                                                        {adv.reason}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                                        <div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                                                {t("advanceAmount")}
                                            </span>
                                            <span className="text-base font-black text-emerald-700">
                                                {formatMoney(adv.amount)}
                                            </span>
                                        </div>

                                        {(adv.status === "AWAITING_CONFIRMATION" || adv.status === "PENDING") && (
                                            <button
                                                type="button"
                                                onClick={() => handleConfirmAdvanceReceipt(adv.id)}
                                                disabled={confirmingAdvanceId === adv.id}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
                                            >
                                                {confirmingAdvanceId === adv.id ? t("loading") : t("confirmAdvanceReceiptBtn")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Detailed Salary Reasons and Breakdown Modal */}
            {selectedPayroll && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
                                    <span>💰</span> {t("calculationModalTitle")}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    {t("calculationModalDesc", {
                                        month: t(`months.${selectedPayroll.month}` as any) || `${selectedPayroll.month}-oy`,
                                        year: selectedPayroll.year,
                                    })}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPayroll(null)}
                                className="text-sm font-bold text-gray-400 hover:text-black px-2 py-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Employee & Period Summary */}
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-gray-400 block">{t("employee")}</span>
                                <span className="font-bold text-black text-sm">
                                    {selectedPayroll.employee?.firstName} {selectedPayroll.employee?.lastName}
                                </span>
                                <span className="text-[11px] text-gray-500 block">
                                    {selectedPayroll.employee?.department?.name || "-"} • {selectedPayroll.employee?.position?.title || "-"}
                                </span>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] font-bold uppercase text-gray-400 block">{t("status")}</span>
                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-xs border inline-block mt-0.5 ${
                                    selectedPayroll.status === "PAID"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                        : selectedPayroll.status === "AWAITING_CONFIRMATION"
                                        ? "bg-amber-50 text-amber-800 border-amber-300"
                                        : "bg-gray-100 text-gray-800 border-gray-300"
                                }`}>
                                    {selectedPayroll.status === "PAID"
                                        ? t("statusPaid")
                                        : selectedPayroll.status === "AWAITING_CONFIRMATION"
                                        ? t("statusAwaitingConfirmation")
                                        : t("statusPending")}
                                </span>
                            </div>
                        </div>

                        {/* Breakdown Sections */}
                        <div className="flex flex-col gap-4">
                            {/* 1. Base Salary & Bonuses */}
                            <div className="border border-gray-200 p-4 rounded-xs flex flex-col gap-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-2 flex items-center justify-between">
                                    <span>1. Asosiy Maosh va Bonuslar (Daromadlar)</span>
                                    <span className="text-emerald-700 font-bold">
                                        +{formatMoney((selectedPayroll.baseSalary || 0) + (selectedPayroll.bonus || 0))}
                                    </span>
                                </h4>

                                <div className="flex flex-col gap-2 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-dashed border-gray-100">
                                        <div>
                                            <span className="font-bold text-black">Asosiy Lavozim Maoshi (Oklad)</span>
                                            <span className="text-[10px] text-gray-400 block">Shartnoma bo'yicha belgilangan asosiy oylik</span>
                                        </div>
                                        <span className="font-bold text-gray-900 font-mono">
                                            {formatMoney(selectedPayroll.baseSalary)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-1">
                                        <div>
                                            <span className="font-bold text-emerald-700">Qo'shilgan Bonuslar (OKR / KPI)</span>
                                            <span className="text-[10px] text-gray-400 block">Eriashilgan natijalar va rag'batlantirish</span>
                                        </div>
                                        <span className="font-bold text-emerald-700 font-mono">
                                            +{formatMoney(selectedPayroll.bonus)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Deductions & Penalties Details */}
                            <div className="border border-gray-200 p-4 rounded-xs flex flex-col gap-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-2 flex items-center justify-between">
                                    <span>2. {t("penaltiesListTitle")}</span>
                                    <span className="text-rose-700 font-bold">
                                        -{formatMoney(selectedPayroll.deductions)}
                                    </span>
                                </h4>

                                <div className="flex flex-col gap-2.5 text-xs">
                                    {/* Detailed Penalties List */}
                                    {selectedPayroll.breakdown?.penalties && selectedPayroll.breakdown.penalties.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {selectedPayroll.breakdown.penalties.map((pen: any) => (
                                                <div
                                                    key={pen.id}
                                                    className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xs flex items-start justify-between gap-2"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-rose-950">
                                                            {pen.rule?.name || "Intizomiy / Davomat Jarimasi"}
                                                        </span>
                                                        <span className="text-[11px] text-rose-800">
                                                            Sababi: {pen.reason || "-"}
                                                        </span>
                                                        <span className="text-[10px] text-rose-600 font-mono mt-0.5">
                                                            Sana: {new Date(pen.date).toLocaleDateString()} {pen.isAuto ? "• (Avtomatik)" : ""}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-rose-700 font-mono shrink-0">
                                                        -{formatMoney(pen.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}

                                    {/* Detailed Advances List (Only confirmed/paid advances) */}
                                    {selectedPayroll.breakdown?.advances && selectedPayroll.breakdown.advances.filter((a: any) => a.status === "PAID").length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {selectedPayroll.breakdown.advances.filter((a: any) => a.status === "PAID").map((adv: any) => (
                                                <div
                                                    key={adv.id}
                                                    className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xs flex items-start justify-between gap-2"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-amber-950">
                                                            💳 Olingan Avans Ushlanmasi
                                                        </span>
                                                        <span className="text-[11px] text-amber-800">
                                                            Izoh: {adv.reason || "Oy davomida berilgan avans"}
                                                        </span>
                                                        <span className="text-[10px] text-amber-700 font-mono mt-0.5">
                                                            Sana: {new Date(adv.dueDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-amber-800 font-mono shrink-0">
                                                        -{formatMoney(adv.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}

                                    {/* Fallback if deductions > 0 but no breakdown list */}
                                    {(!selectedPayroll.breakdown?.penalties || selectedPayroll.breakdown.penalties.length === 0) &&
                                     (!selectedPayroll.breakdown?.advances || selectedPayroll.breakdown.advances.length === 0) &&
                                     selectedPayroll.deductions > 0 && (
                                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xs flex items-center justify-between text-rose-900">
                                            <span>Kechikishlar va davomat hisob-kitobiga ko'ra ushlanma</span>
                                            <span className="font-bold font-mono">-{formatMoney(selectedPayroll.deductions)}</span>
                                        </div>
                                    )}

                                    {selectedPayroll.deductions === 0 && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium">
                                            ✓ {t("noPenaltiesRecorded")}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. Net Take-Home Calculation */}
                            <div className="bg-black text-white p-4 rounded-xs flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300 block">
                                        {t("netSalaryUpper")}
                                    </span>
                                    <span className="text-[11px] text-gray-400">
                                        Asosiy + Bonus - Ushlanmalar hisobidan so'ng
                                    </span>
                                </div>
                                <span className="text-xl font-black text-emerald-400 font-mono">
                                    {formatMoney(selectedPayroll.netSalary)}
                                </span>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                            {selectedPayroll.status === "AWAITING_CONFIRMATION" && (
                                <button
                                    type="button"
                                    onClick={() => handleConfirmReceipt(selectedPayroll.id)}
                                    disabled={confirmingId === selectedPayroll.id}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                    {confirmingId === selectedPayroll.id ? t("loading") : t("confirmSalaryReceiptBtn")}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setSelectedPayroll(null)}
                                className="px-5 py-2 bg-gray-100 text-black text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
                            >
                                {t("close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
