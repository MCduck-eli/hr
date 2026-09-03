"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchMyPayrolls } from "@/src/services/payroll-service";
import PayslipModal from "./PayslipModal";

export default function EmployeePayslipsSection() {
    const t = useTranslations("Payroll");
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

    const loadPayrolls = async () => {
        setLoading(true);
        try {
            const data = await fetchMyPayrolls();
            setPayrolls(data || []);
        } catch (err: any) {
            console.error("Failed to fetch my payrolls", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayrolls();
    }, []);

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString("uz-UZ") + " UZS";
    };

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

            {loading ? (
                <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-gray-400 animate-pulse bg-white border border-gray-200">
                    {t("loading")}
                </div>
            ) : payrolls.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">🧾</span>
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

                        return (
                            <div
                                key={payroll.id}
                                className="bg-white border border-gray-200 p-5 flex flex-col justify-between gap-4 hover:border-black transition-colors shadow-xs"
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

                                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-xs border ${
                                            payroll.status === "PAID"
                                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                                : payroll.status === "CANCELLED"
                                                ? "bg-rose-50 text-rose-800 border-rose-300"
                                                : "bg-amber-50 text-amber-800 border-amber-300"
                                        }`}>
                                            {payroll.status === "PAID" ? t("statusPaid") : payroll.status === "CANCELLED" ? t("statusCancelled") : t("statusPending")}
                                        </span>
                                    </div>

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
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                                            {t("takeHome")}
                                        </span>
                                        <span className="text-base font-black text-black">
                                            {formatMoney(payroll.netSalary)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setSelectedPayslip(payroll)}
                                        className="px-3 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                                    >
                                        🧾 {t("viewPayslip")}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
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
