"use client";

import { useTranslations } from "next-intl";

interface PayslipModalProps {
    isOpen: boolean;
    onClose: () => void;
    payroll: any;
}

export default function PayslipModal({ isOpen, onClose, payroll }: PayslipModalProps) {
    const t = useTranslations("Payroll");

    if (!isOpen || !payroll) return null;

    const emp = payroll.employee || {};
    const monthKey = (payroll.month || 1).toString();
    const monthLabel = t(`months.${monthKey}` as any) || `${payroll.month}-oy`;

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString("uz-UZ") + " UZS";
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
            <div className="bg-white border-2 border-black w-full max-w-2xl max-h-[95vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col gap-6 print:border-none print:shadow-none print:max-w-none print:p-8 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b-2 border-black pb-4 print:hidden">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🧾</span>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tight text-black">
                                {t("payslipTitle")}
                            </h3>
                            <p className="text-[11px] font-medium text-gray-500">
                                {t("payslipSubtitle", { month: monthLabel, year: payroll.year })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-3 py-1.5 bg-gray-100 text-black text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors border border-black"
                        >
                            🖨 {t("print")}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-lg font-bold text-gray-400 hover:text-black transition-colors px-2"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-6 print:block">
                    <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                                {t("company")}
                            </span>
                            <h2 className="text-xl font-black uppercase text-black">
                                {emp.user?.companyName || "HR PLATFORM"}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {t("payrollReport")}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                                {t("period")}
                            </span>
                            <h4 className="text-sm font-black text-black uppercase">
                                {monthLabel} {payroll.year}
                            </h4>
                            <span className={`inline-block mt-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-xs border ${
                                payroll.status === "PAID"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : payroll.status === "CANCELLED"
                                    ? "bg-rose-50 text-rose-800 border-rose-300"
                                    : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}>
                                {payroll.status === "PAID" ? t("statusPaid") : payroll.status === "CANCELLED" ? t("statusCancelled") : t("statusPending")}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200 text-xs">
                        <div>
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">{t("employee")}</span>
                            <span className="font-bold text-black">{emp.firstName} {emp.lastName}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">{t("department")}</span>
                            <span className="font-bold text-black">{emp.department?.name || "-"}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">{t("position")}</span>
                            <span className="font-bold text-black">{emp.position?.title || "-"}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-gray-400 block">{t("salaryType") || "To'lov Turi"}</span>
                            <span className="font-bold text-black flex items-center gap-1">
                                {payroll.salaryType === "HOURLY" || emp.salaryType === "HOURLY" ? (
                                    <span className="text-blue-700 font-bold">⏱️ {t("typeHourly") || "Soatbay"}</span>
                                ) : (
                                    <span className="text-neutral-900 font-bold">📅 {t("typeMonthly") || "Oylik"}</span>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-black border-b border-black pb-1">
                            {t("earningsDeductions")}
                        </h4>
                        
                        <div className="flex flex-col divide-y divide-gray-100 text-xs">
                            <div className="py-2.5 flex items-center justify-between">
                                <div>
                                    <span className="font-medium text-gray-700">{t("baseSalaryDesc")}</span>
                                    {(payroll.salaryType === "HOURLY" || emp.salaryType === "HOURLY") && (
                                        <span className="text-[10px] text-blue-600 block font-mono">
                                            {payroll.workedHours || 0} soat × {formatMoney(payroll.hourlyRate || emp.hourlyRate || 0)}/soat
                                        </span>
                                    )}
                                </div>
                                <span className="font-bold text-black">{formatMoney(payroll.baseSalary)}</span>
                            </div>

                            <div className="py-2.5 flex items-center justify-between">
                                <div>
                                    <span className="font-medium text-emerald-700">{t("incentiveDesc")}</span>
                                    <span className="text-[10px] text-gray-400 block">{t("incentiveSub")}</span>
                                </div>
                                <span className="font-bold text-emerald-700">+{formatMoney(payroll.bonus)}</span>
                            </div>

                            {(payroll.taxAmount > 0 || (payroll.taxPercent && payroll.taxPercent > 0)) && (
                                <div className="py-2.5 flex items-center justify-between bg-amber-50/50 px-2 -mx-2 rounded-xs">
                                    <div>
                                        <span className="font-medium text-amber-900">{t("taxAmount") || "Daromad Solig'i"} ({payroll.taxPercent || 12}%)</span>
                                        <span className="text-[10px] text-amber-700 block">Jami hisoblangan gross maoshdan ushlab qolinadi</span>
                                    </div>
                                    <span className="font-bold text-amber-800">
                                        -{formatMoney(payroll.taxAmount || Math.round((payroll.baseSalary + payroll.bonus) * ((payroll.taxPercent || 12) / 100)))}
                                    </span>
                                </div>
                            )}

                            <div className="py-2.5 flex items-center justify-between">
                                <div>
                                    <span className="font-medium text-rose-700">{t("totalDeductions")}</span>
                                    <span className="text-[10px] text-gray-400 block">{t("deductionsSub")}</span>
                                </div>
                                <span className="font-bold text-rose-700">-{formatMoney(payroll.deductions)}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-black text-white flex items-center justify-between mt-2">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                                    {t("netSalaryUpper")}
                                </span>
                                <span className="text-xs text-gray-300">{t("afterCalculations")}</span>
                            </div>
                            <span className="text-xl md:text-2xl font-black tracking-tight text-white">
                                {formatMoney(payroll.netSalary)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200 text-xs">
                        <div className="flex flex-col gap-8">
                            <span className="text-[10px] font-bold uppercase text-gray-400">{t("accountantSign")}</span>
                            <div className="border-b border-gray-400 w-40"></div>
                        </div>
                        <div className="flex flex-col gap-8 text-right items-end">
                            <span className="text-[10px] font-bold uppercase text-gray-400">{t("employeeSign")}</span>
                            <div className="border-b border-gray-400 w-40"></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 print:hidden">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                    >
                        {t("close")}
                    </button>
                </div>
            </div>
        </div>
    );
}
