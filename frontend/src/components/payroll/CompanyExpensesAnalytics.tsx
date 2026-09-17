"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    fetchCompanyExpensesAnalytics,
    fetchCompanyExpensesItems,
    createCompanyExpenseItem,
    updateCompanyExpenseItem,
    deleteCompanyExpenseItem,
} from "@/src/services/payroll-service";

export default function CompanyExpensesAnalytics() {
    const t = useTranslations("Payroll");
    const params = useParams();
    const locale = (params?.locale as string) || "uz";
    const isRu = locale === "ru";

    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(currentDate.getMonth() + 1);
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [manualExpenseSearch, setManualExpenseSearch] = useState("");
    const [selectedDrilldownMonth, setSelectedDrilldownMonth] = useState<any | null>(null);

    // Modals
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [isAllExpensesListModalOpen, setIsAllExpensesListModalOpen] = useState(false);
    const [allExpensesList, setAllExpensesList] = useState<any[]>([]);
    const [allExpensesLoading, setAllExpensesLoading] = useState(false);
    const [allExpensesCategoryFilter, setAllExpensesCategoryFilter] = useState<string>("ALL");
    const [allExpensesMonthFilter, setAllExpensesMonthFilter] = useState<string>("ALL");
    const [editingExpense, setEditingExpense] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [expenseForm, setExpenseForm] = useState({
        title: "",
        category: "RENT",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        month: selectedMonthIndex,
        year: selectedYear,
        description: "",
        paymentMethod: "BANK_TRANSFER",
        isRecurring: false,
        recurringDay: Math.min(new Date().getDate(), 28),
        recurringScope: "ALL_YEAR" as "ALL_YEAR" | "FROM_SELECTED_MONTH",
        updateScope: "ALL_RECURRING" as "ALL_RECURRING" | "ONLY_THIS",
    });

    const categoryOptions = [
        { code: "RENT", labelUz: "Ofis ijarasi", labelRu: "Аренда офиса", icon: "🏢" },
        { code: "UTILITIES", labelUz: "Kommunal to'lovlar & Tozalash", labelRu: "Коммунальные услуги и клининг", icon: "💡" },
        { code: "SOFTWARE", labelUz: "Dasturlar & IT xizmatlar", labelRu: "ПО и IT сервисы", icon: "💻" },
        { code: "OFFICE", labelUz: "Ofis & Kanselyariya", labelRu: "Офис и канцелярия", icon: "📑" },
        { code: "MARKETING", labelUz: "Marketing & Reklama", labelRu: "Маркетинг и реклама", icon: "📢" },
        { code: "HARDWARE", labelUz: "Texnika va jihozlar", labelRu: "Техника и оборудование", icon: "🖥️" },
        { code: "TRAVEL", labelUz: "Xizmat safari & Transport", labelRu: "Командировки и транспорт", icon: "✈️" },
        { code: "TAXES", labelUz: "Soliqlar & Davlat bojlari", labelRu: "Налоги и сборы", icon: "🏛️" },
        { code: "OTHER", labelUz: "Boshqa xarajatlar", labelRu: "Прочие расходы", icon: "📦" },
    ];

    const getCategoryLabel = (code: string) => {
        const item = categoryOptions.find((c) => c.code === code);
        if (!item) return code;
        return `${item.icon} ${isRu ? item.labelRu : item.labelUz}`;
    };

    const loadAnalytics = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetchCompanyExpensesAnalytics({ year: selectedYear });
            setData(res);
            if (res?.monthlyAnalytics && res.monthlyAnalytics.length > 0) {
                const curMonth = res.monthlyAnalytics.find((m: any) => m.month === selectedMonthIndex) || res.monthlyAnalytics[0];
                setSelectedDrilldownMonth(curMonth);
            }
        } catch (err: any) {
            setError(err.message || (isRu ? "Ошибка при загрузке аналитики" : "Ma'lumotlarni yuklashda xatolik yuz berdi"));
        } finally {
            setLoading(false);
        }
    };

    const loadAllExpensesList = async () => {
        setAllExpensesLoading(true);
        try {
            const list = await fetchCompanyExpensesItems({
                year: selectedYear,
                month: allExpensesMonthFilter,
                category: allExpensesCategoryFilter,
            });
            setAllExpensesList(list || []);
        } catch (err: any) {
            alert(err.message || "Error");
        } finally {
            setAllExpensesLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [selectedYear]);

    useEffect(() => {
        if (isAllExpensesListModalOpen) {
            loadAllExpensesList();
        }
    }, [isAllExpensesListModalOpen, selectedYear, allExpensesMonthFilter, allExpensesCategoryFilter]);

    const formatMoney = (amount: number) => {
        return (amount || 0).toLocaleString("uz-UZ") + " UZS";
    };

    const handleSelectMonth = (monthItem: any) => {
        setSelectedMonthIndex(monthItem.month);
        setSelectedDrilldownMonth(monthItem);
    };

    const handleOpenAddExpense = (presetMonth?: number) => {
        const m = presetMonth || selectedMonthIndex || currentDate.getMonth() + 1;
        const todayDay = Math.min(new Date().getDate(), 28);
        setEditingExpense(null);
        setExpenseForm({
            title: "",
            category: "RENT",
            amount: "",
            date: new Date(selectedYear, m - 1, todayDay).toISOString().split("T")[0],
            month: m,
            year: selectedYear,
            description: "",
            paymentMethod: "BANK_TRANSFER",
            isRecurring: true,
            recurringDay: todayDay,
            recurringScope: "FROM_SELECTED_MONTH",
            updateScope: "ALL_RECURRING",
        });
        setIsAddExpenseModalOpen(true);
    };

    const handleOpenEditExpense = (exp: any) => {
        setEditingExpense(exp);
        const expDate = exp.date ? new Date(exp.date) : new Date();
        const isRec = Boolean(exp.isRecurring || exp.recurringGroupId);
        setExpenseForm({
            title: exp.title || "",
            category: exp.category || "OTHER",
            amount: String(exp.amount || ""),
            date: exp.date ? new Date(exp.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            month: exp.month || selectedMonthIndex,
            year: exp.year || selectedYear,
            description: exp.description || "",
            paymentMethod: exp.paymentMethod || "BANK_TRANSFER",
            isRecurring: isRec,
            recurringDay: exp.recurringDay || expDate.getDate() || 1,
            recurringScope: "ALL_YEAR",
            updateScope: "ALL_RECURRING",
        });
        setIsAddExpenseModalOpen(true);
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.title.trim() || !expenseForm.amount) {
            alert(isRu ? "Пожалуйста, введите название и сумму" : "Iltimos, xarajat nomi va summasini kiriting");
            return;
        }

        setActionLoading(true);
        try {
            const numAmount = Number(expenseForm.amount);
            const expDate = new Date(expenseForm.date);
            const expMonth = expDate.getMonth() + 1;
            const expYear = expDate.getFullYear();

            if (editingExpense) {
                await updateCompanyExpenseItem(editingExpense.id, {
                    title: expenseForm.title,
                    category: expenseForm.category,
                    amount: numAmount,
                    date: expenseForm.date,
                    month: expMonth,
                    year: expYear,
                    description: expenseForm.description,
                    paymentMethod: expenseForm.paymentMethod,
                    updateScope: editingExpense.recurringGroupId ? expenseForm.updateScope : "ONLY_THIS",
                });
            } else {
                await createCompanyExpenseItem({
                    title: expenseForm.title,
                    category: expenseForm.category,
                    amount: numAmount,
                    date: expenseForm.date,
                    month: expMonth,
                    year: expYear,
                    description: expenseForm.description,
                    paymentMethod: expenseForm.paymentMethod,
                    isRecurring: expenseForm.isRecurring,
                    recurringDay: Number(expenseForm.recurringDay) || expDate.getDate() || 1,
                    recurringScope: expenseForm.recurringScope,
                });
            }

            setIsAddExpenseModalOpen(false);
            setEditingExpense(null);
            await loadAnalytics();
            if (isAllExpensesListModalOpen) {
                await loadAllExpensesList();
            }
        } catch (err: any) {
            alert(err.message || (isRu ? "Ошибка при сохранении расхода" : "Xarajatni saqlashda xatolik"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteExpense = async (exp: any) => {
        const id = typeof exp === "string" ? exp : exp.id;
        const isRec = typeof exp === "object" && Boolean(exp.recurringGroupId || exp.isRecurring);

        if (isRec) {
            const confirmed = confirm(
                isRu
                    ? "Этот расход является ежемесячным регулярным.\n\nНажмите 'OK', чтобы удалить этот расход во ВСЕХ месяцах года.\nНажмите 'Отмена', чтобы не удалять."
                    : "Ushbu xarajat har oylik takroriy xarajat hisoblanadi.\n\n'OK' ni bosing - YILNING BARCHA OYLARIDAGI ushbu takroriy xarajatni o'chirish uchun.\nBekor qilish uchun 'Отмена'ni bosing."
            );
            if (!confirmed) return;

            try {
                await deleteCompanyExpenseItem(id, { deleteScope: "ALL_RECURRING" });
                await loadAnalytics();
                if (isAllExpensesListModalOpen) {
                    await loadAllExpensesList();
                }
            } catch (err: any) {
                alert(err.message || "Error");
            }
            return;
        }

        if (!confirm(isRu ? "Удалить этот расход компании?" : "Ushbu kompaniya xarajatini o'chirishni tasdiqlaysizmi?")) return;
        try {
            await deleteCompanyExpenseItem(id, { deleteScope: "ONLY_THIS" });
            await loadAnalytics();
            if (isAllExpensesListModalOpen) {
                await loadAllExpensesList();
            }
        } catch (err: any) {
            alert(err.message || "Error");
        }
    };

    const handleExportMonthPdf = (monthData: any) => {
        if (!monthData) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("Iltimos, brauzerda pop-up oynalarga ruxsat bering.");
            return;
        }

        const dateStr = new Date().toLocaleDateString(isRu ? "ru-RU" : "uz-UZ");
        const rowsHtml = (monthData.employeeList || []).map((emp: any, idx: number) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.department || "-"}</td>
                <td>${emp.position || "-"}</td>
                <td style="text-align: right;">${Number(emp.baseSalary || 0).toLocaleString()} UZS</td>
                <td style="text-align: right; color: #047857;">+${Number(emp.bonus || 0).toLocaleString()} UZS</td>
                <td style="text-align: right; color: #b91c1c;">-${Number(emp.deductions || 0).toLocaleString()} UZS</td>
                <td style="text-align: right; color: #4338ca;">${Number(emp.advances || 0).toLocaleString()} UZS</td>
                <td style="text-align: right; font-weight: bold; color: #111827;">${Number(emp.totalExpense || 0).toLocaleString()} UZS</td>
            </tr>
        `).join("");

        const manualRowsHtml = (monthData.manualExpensesList || []).map((exp: any, idx: number) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${exp.title}</strong></td>
                <td>${getCategoryLabel(exp.category)}</td>
                <td>${exp.description || "-"}</td>
                <td>${exp.date ? new Date(exp.date).toLocaleDateString() : "-"}</td>
                <td style="text-align: right; font-weight: bold; color: #b91c1c;">${Number(exp.amount || 0).toLocaleString()} UZS</td>
            </tr>
        `).join("");

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="${isRu ? "ru" : "uz"}">
            <head>
                <meta charset="UTF-8">
                <title>${data?.companyName || "Kompaniya"} - ${monthData.monthName} ${selectedYear} ${isRu ? "Финансовый отчет" : "Xarajatlar Tahlili"}</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 24px; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 20px; }
                    .title { font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 0.02em; }
                    .subtitle { font-size: 12px; color: #4b5563; margin: 0; }
                    .meta { text-align: right; font-size: 11px; color: #4b5563; }
                    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
                    .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 4px; }
                    .stat-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #6b7280; }
                    .stat-value { font-size: 15px; font-weight: 900; color: #111827; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
                    th { background: #f3f4f6; color: #374151; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 8px 10px; text-align: left; border-bottom: 2px solid #d1d5db; }
                    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
                    .section-title { font-size: 13px; font-weight: 900; text-transform: uppercase; margin: 20px 0 10px 0; border-left: 3px solid #111827; padding-left: 8px; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db; font-size: 11px; page-break-inside: avoid; }
                    .sign-line { width: 180px; border-bottom: 1px solid #000; margin-top: 25px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 class="title">${data?.companyName || "Kompaniya"} — ${isRu ? "Отчет по расходам компании" : "Kompaniya Xarajatlari Hisoboti"}</h1>
                        <p class="subtitle">${monthData.monthName} ${selectedYear} ${isRu ? "Месячный отчет" : "Oylik to'liq hisobot"}</p>
                    </div>
                    <div class="meta">
                        <div><strong>${isRu ? "Дата:" : "Sana:"}</strong> ${dateStr}</div>
                        <div><strong>${isRu ? "Компания:" : "Kompaniya:"}</strong> ${data?.companyName || "-"}</div>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">${isRu ? "Общие расходы за месяц" : "Jami Oylik Xarajat"}</div>
                        <div class="stat-value" style="color: #b91c1c;">${Number(monthData.totalExpense || 0).toLocaleString()} UZS</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">${isRu ? "Зарплаты сотрудников" : "Xodimlar oyligi"} (${monthData.percentages?.baseSalary || 0}%)</div>
                        <div class="stat-value">${Number(monthData.baseSalary || 0).toLocaleString()} UZS</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">${isRu ? "Авансы и бонусы" : "Avans & Bonuslar"}</div>
                        <div class="stat-value" style="color: #4338ca;">${Number((monthData.advances || 0) + (monthData.bonuses || 0)).toLocaleString()} UZS</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">${isRu ? "Операционные расходы" : "Operatsion xarajatlar"} (${monthData.percentages?.manualExpenses || 0}%)</div>
                        <div class="stat-value" style="color: #ea580c;">${Number(monthData.manualExpenses || 0).toLocaleString()} UZS</div>
                    </div>
                </div>

                <div class="section-title">1. ${isRu ? "Прямые операционные расходы компании" : "Kompaniya Operatsion va Boshqa Xarajatlari"}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center; width: 25px;">№</th>
                            <th>${isRu ? "Наименование расхода" : "Xarajat nomi"}</th>
                            <th>${isRu ? "Категория" : "Toifasi"}</th>
                            <th>${isRu ? "Описание" : "Izoh"}</th>
                            <th>${isRu ? "Дата" : "Sana"}</th>
                            <th style="text-align: right;">${isRu ? "Сумма" : "Summasi"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${manualRowsHtml || `<tr><td colspan="6" style="text-align: center;">${isRu ? "Операционные расходы отсутствуют" : "Ushbu oyda qo'lda kiritilgan xarajatlar yo'q"}</td></tr>`}
                    </tbody>
                </table>

                <div class="section-title">2. ${isRu ? "Расходы по фонду оплаты труда (Сотрудники)" : "Xodimlar Oyliklari va To'lovlar"}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center; width: 25px;">№</th>
                            <th>${isRu ? "Сотрудник" : "Xodim (F.I.SH)"}</th>
                            <th>${isRu ? "Отдел" : "Bo'lim"}</th>
                            <th>${isRu ? "Должность" : "Lavozim"}</th>
                            <th style="text-align: right;">${isRu ? "Оклад" : "Asosiy oylik"}</th>
                            <th style="text-align: right;">${isRu ? "Бонус" : "Bonus"}</th>
                            <th style="text-align: right;">${isRu ? "Удержание" : "Ushlanma"}</th>
                            <th style="text-align: right;">${isRu ? "Аванс" : "Avans"}</th>
                            <th style="text-align: right;">${isRu ? "Итого" : "Jami Xarajat"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || `<tr><td colspan="9" style="text-align: center;">${isRu ? "Нет данных по сотрудникам" : "Xodimlar ma'lumoti yo'q"}</td></tr>`}
                    </tbody>
                </table>

                <div class="signatures">
                    <div>
                        <div><strong>${isRu ? "Генеральный Директор:" : "Bosh Direktor:"}</strong></div>
                        <div class="sign-line"></div>
                        <div style="font-size: 9px; color: #6b7280; margin-top: 4px;">(imzo / F.I.SH)</div>
                    </div>
                    <div>
                        <div><strong>${isRu ? "Главный Бухгалтер:" : "Bosh Buxgalter:"}</strong></div>
                        <div class="sign-line"></div>
                        <div style="font-size: 9px; color: #6b7280; margin-top: 4px;">(imzo / F.I.SH)</div>
                    </div>
                    <div>
                        <div><strong>M.O'.:</strong></div>
                        <div style="width: 60px; height: 60px; border: 1px dashed #9ca3af; border-radius: 50%; margin-top: 6px;"></div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 250);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-xs font-bold uppercase tracking-wider text-gray-400 bg-white border border-gray-200">
                {isRu ? "Загрузка финансовой аналитики компании..." : "Kompaniya moliyaviy tahlil ma'lumotlari yuklanmoqda..."}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {error}
                <button
                    onClick={loadAnalytics}
                    className="ml-3 underline uppercase cursor-pointer"
                >
                    {isRu ? "Повторить" : "Qayta urinish"}
                </button>
            </div>
        );
    }

    const monthlyList = data?.monthlyAnalytics || [];
    const maxBarValue = Math.max(...monthlyList.map((m: any) => m.totalExpense || 0), 1);
    const activeDrillMonth = selectedDrilldownMonth || monthlyList.find((m: any) => m.month === selectedMonthIndex) || monthlyList[0];

    const filteredEmployeeList = (activeDrillMonth?.employeeList || []).filter((emp: any) => {
        if (!employeeSearch.trim()) return true;
        const q = employeeSearch.toLowerCase();
        return (
            emp.name.toLowerCase().includes(q) ||
            (emp.email || "").toLowerCase().includes(q) ||
            (emp.department || "").toLowerCase().includes(q) ||
            (emp.position || "").toLowerCase().includes(q)
        );
    });

    const filteredManualExpensesList = (activeDrillMonth?.manualExpensesList || []).filter((exp: any) => {
        if (!manualExpenseSearch.trim()) return true;
        const q = manualExpenseSearch.toLowerCase();
        return (
            exp.title.toLowerCase().includes(q) ||
            (exp.description || "").toLowerCase().includes(q) ||
            (exp.category || "").toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex flex-col gap-8 w-full animate-in fade-in duration-150">
            {/* Top Controls & Company Isolation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                            <span>📊</span> {isRu ? "Расходы компании и Финансовая аналитика" : "Kompaniya Xarajatlari & Moliya Tahlili"}
                        </h2>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-bold rounded-xs uppercase tracking-wider">
                            🔒 {data?.companyName || "Aktiv Kompaniya"}
                        </span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">
                        {isRu
                            ? "Динамика расходов за месяц и год, доля окладов и ручных расходов компании"
                            : "Oylik va yillik xarajatlar dinamikasi, ish haqi va kompaniyaning boshqa barcha xarajatlari tahlili"}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-300 p-1">
                        <span className="text-[11px] font-bold uppercase text-gray-500 px-2">{isRu ? "Год:" : "Yil:"}</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="text-xs font-bold uppercase p-1.5 bg-transparent focus:outline-none cursor-pointer border-l border-gray-200"
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>
                                    {y} {isRu ? "Год" : "Yil"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => handleOpenAddExpense(selectedMonthIndex)}
                        className="px-3.5 py-2 bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <span>+</span> {isRu ? "Добавить расход" : "Xarajat kiritish"}
                    </button>

                    <button
                        onClick={() => setIsAllExpensesListModalOpen(true)}
                        className="px-3.5 py-2 bg-indigo-50 text-indigo-900 border border-indigo-300 text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                        <span>📑</span> {isRu ? "Все расходы (Список)" : "Barcha xarajatlar"}
                    </button>

                    <button
                        onClick={loadAnalytics}
                        className="px-3 py-2 bg-white text-black border border-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    >
                        <span>🔄</span> {isRu ? "Обновить" : "Yangilash"}
                    </button>

                    <button
                        onClick={() => handleExportMonthPdf(activeDrillMonth)}
                        className="px-3.5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                    >
                        <span>🖨️</span> {activeDrillMonth?.monthName} (PDF)
                    </button>
                </div>
            </div>

            {/* Oylarni tanlash menyusi (Faqat kelgan oylar tanlanadi, kelajak oylar esa hisoblanmaydi) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
                {monthlyList.map((mItem: any) => {
                    const isSelected = activeDrillMonth?.month === mItem.month;
                    const isFuture = mItem.isFutureMonth;

                    return (
                        <button
                            key={mItem.month}
                            disabled={isFuture}
                            onClick={() => handleSelectMonth(mItem)}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 shrink-0 ${
                                isSelected
                                    ? "bg-black text-white shadow-xs"
                                    : isFuture
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
                            }`}
                        >
                            <span>📅</span>
                            <span>{mItem.monthName}</span>
                            {mItem.totalExpense > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-800"}`}>
                                    {Math.round(mItem.totalExpense / 1000000)}M
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Active Selected Month Drilldown Section (O'sha oyga bosganda chiqadigan batafsil taqsimot) */}
            {activeDrillMonth && (
                <div className="bg-white border-2 border-black p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔍</span>
                                <h3 className="text-base font-black uppercase tracking-wider text-black">
                                    {activeDrillMonth.monthName} {selectedYear} — {isRu ? "Структура и процентное распределение расходов" : "Xarajatlarining Foizli Taqsimoti"}
                                </h3>
                                {data?.maxExpenseMonth?.month === activeDrillMonth.month && (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold rounded uppercase">
                                        🔴 {isRu ? "Макс. расход" : "Eng ko'p xarajatli oy"}
                                    </span>
                                )}
                                {data?.minExpenseMonth?.month === activeDrillMonth.month && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded uppercase">
                                        🟢 {isRu ? "Мин. расход" : "Eng kam xarajatli oy"}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 font-semibold mt-1">
                                {isRu
                                    ? "Оклады, бонусы, авансы и прямые расходы компании в этом месяце"
                                    : "Ushbu oyda ish haqi, avanslar, bonuslar va qo'lda kiritilgan kompaniya operatsion xarajatlari"}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleOpenAddExpense(activeDrillMonth.month)}
                                className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors shadow-xs"
                            >
                                + {isRu ? "Добавить расход в этот месяц" : "Ushbu oyga xarajat qo'shish"}
                            </button>
                            <div className="text-right pl-3 border-l border-gray-200">
                                <div className="text-[10px] font-bold uppercase text-gray-400">{isRu ? "Итого за месяц" : "Jami Oylik Xarajat"}</div>
                                <div className="text-xl font-black text-rose-600">
                                    {formatMoney(activeDrillMonth.totalExpense)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Percentage Breakdown (Foizlar bo'yicha) */}
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-gray-700 mb-3">
                            1. {isRu ? "Распределение расходов по долям (%)" : "Xarajat Turlari Bo'yicha Foizlar Taqsimoti"}
                        </div>

                        {/* Visual Proportion Bar */}
                        <div className="h-5 w-full bg-gray-100 rounded flex overflow-hidden border border-gray-200 mb-4 shadow-inner">
                            <div
                                style={{ width: `${activeDrillMonth.percentages?.netSalary || activeDrillMonth.percentages?.baseSalary || 0}%` }}
                                title={`Xodimlar Sof Maoshi: ${formatMoney(activeDrillMonth.netSalary ?? activeDrillMonth.baseSalary)} (${activeDrillMonth.percentages?.netSalary || activeDrillMonth.percentages?.baseSalary || 0}%)`}
                                className="bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                            >
                                {(activeDrillMonth.percentages?.netSalary || activeDrillMonth.percentages?.baseSalary || 0) > 10
                                    ? `${activeDrillMonth.percentages?.netSalary || activeDrillMonth.percentages?.baseSalary}%`
                                    : ""}
                            </div>
                            <div
                                style={{ width: `${activeDrillMonth.percentages?.taxes || 0}%` }}
                                title={`Daromad Solig'i (12%): ${formatMoney(activeDrillMonth.taxes || 0)} (${activeDrillMonth.percentages?.taxes || 0}%)`}
                                className="bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                            >
                                {activeDrillMonth.percentages?.taxes > 8 ? `${activeDrillMonth.percentages?.taxes}%` : ""}
                            </div>
                            <div
                                style={{ width: `${activeDrillMonth.percentages?.bonuses || 0}%` }}
                                title={`Bonuslar: ${formatMoney(activeDrillMonth.bonuses)} (${activeDrillMonth.percentages?.bonuses || 0}%)`}
                                className="bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                            >
                                {activeDrillMonth.percentages?.bonuses > 8 ? `${activeDrillMonth.percentages?.bonuses}%` : ""}
                            </div>
                            <div
                                style={{ width: `${activeDrillMonth.percentages?.advances || 0}%` }}
                                title={`Avanslar: ${formatMoney(activeDrillMonth.advances)} (${activeDrillMonth.percentages?.advances || 0}%)`}
                                className="bg-purple-600 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                            >
                                {activeDrillMonth.percentages?.advances > 8 ? `${activeDrillMonth.percentages?.advances}%` : ""}
                            </div>
                            <div
                                style={{ width: `${activeDrillMonth.percentages?.manualExpenses || 0}%` }}
                                title={`Operatsion xarajatlar: ${formatMoney(activeDrillMonth.manualExpenses || 0)} (${activeDrillMonth.percentages?.manualExpenses || 0}%)`}
                                className="bg-orange-500 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                            >
                                {activeDrillMonth.percentages?.manualExpenses > 8 ? `${activeDrillMonth.percentages?.manualExpenses}%` : ""}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div className="p-3 bg-blue-50/70 border border-blue-200 flex flex-col justify-between">
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-blue-900 flex items-center justify-between">
                                        <span>💼 {isRu ? "Чистые оклады" : "Xodimlar Sof Oyligi"}</span>
                                        <span className="font-black text-sm">{activeDrillMonth.percentages?.netSalary || activeDrillMonth.percentages?.baseSalary || 0}%</span>
                                    </div>
                                    <div className="text-sm font-black text-blue-950 mt-1">
                                        {formatMoney(activeDrillMonth.netSalary ?? activeDrillMonth.baseSalary)}
                                    </div>
                                </div>
                                {activeDrillMonth.baseSalary > (activeDrillMonth.netSalary || 0) && (
                                    <div className="text-[10px] text-blue-700 font-semibold mt-1">
                                        {isRu ? `(ФОТ: ${formatMoney(activeDrillMonth.baseSalary)})` : `(Asosiy FOT: ${formatMoney(activeDrillMonth.baseSalary)})`}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-amber-900 flex items-center justify-between">
                                        <span>🏛️ {isRu ? "Подоходный налог (12%)" : "Daromad Solig'i (12%)"}</span>
                                        <span className="font-black text-sm">{activeDrillMonth.percentages?.taxes || 0}%</span>
                                    </div>
                                    <div className="text-sm font-black text-amber-950 mt-1">
                                        {formatMoney(activeDrillMonth.taxes || 0)}
                                    </div>
                                </div>
                                <div className="text-[10px] text-amber-700 font-medium mt-1">
                                    {isRu ? "В госбюджет" : "Davlat budjetiga"}
                                </div>
                            </div>

                            <div className="p-3 bg-purple-50/70 border border-purple-200 flex flex-col justify-between">
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-purple-900 flex items-center justify-between">
                                        <span>⚡ {isRu ? "Выданные авансы" : "Berilgan Avanslar"}</span>
                                        <span className="font-black text-sm">{activeDrillMonth.percentages?.advances || 0}%</span>
                                    </div>
                                    <div className="text-sm font-black text-purple-950 mt-1">
                                        {formatMoney(activeDrillMonth.advances)}
                                    </div>
                                </div>
                                <div className="text-[10px] text-purple-700 font-medium mt-1">
                                    {isRu ? "Выплачено до зарплаты" : "Muddatidan oldin berilgan"}
                                </div>
                            </div>

                            <div className="p-3 bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-emerald-900 flex items-center justify-between">
                                        <span>🎁 {isRu ? "Бонусы и премии" : "Bonus & Mukofotlar"}</span>
                                        <span className="font-black text-sm">{activeDrillMonth.percentages?.bonuses || 0}%</span>
                                    </div>
                                    <div className="text-sm font-black text-emerald-950 mt-1">
                                        +{formatMoney(activeDrillMonth.bonuses)}
                                    </div>
                                </div>
                                <div className="text-[10px] text-emerald-700 font-medium mt-1">
                                    {isRu ? "Премиальный фонд" : "Rag'batlantirish to'lovlari"}
                                </div>
                            </div>

                            <div className="p-3 bg-orange-50/70 border border-orange-200 flex flex-col justify-between">
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-orange-900 flex items-center justify-between">
                                        <span>🏢 {isRu ? "Операционные расходы" : "Operatsion xarajatlar"}</span>
                                        <span className="font-black text-sm">{activeDrillMonth.percentages?.manualExpenses || 0}%</span>
                                    </div>
                                    <div className="text-sm font-black text-orange-950 mt-1">
                                        {formatMoney(activeDrillMonth.manualExpenses || 0)}
                                    </div>
                                </div>
                                <div className="text-[10px] text-orange-700 font-medium mt-1">
                                    {isRu ? "Аренда, коммунальные, IT" : "Ofis ijarasi, kommunal va h.k."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Manual Company Operational Expenses Table in this month */}
                    <div className="bg-gray-50/70 border border-gray-200 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div>
                                <div className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
                                    <span>🏢</span>
                                    <span>{isRu ? "Прямые операционные расходы компании за" : "Kompaniyaning operatsion xarajatlari —"} {activeDrillMonth.monthName} ({filteredManualExpensesList.length} ta)</span>
                                </div>
                                <div className="text-[11px] text-gray-500 font-medium">
                                    {isRu ? "Аренда, коммунальные, IT сервисы, маркетинг и прочие расходы" : "Ofis ijarasi, kommunal, IT xizmatlar, marketing va boshqa xarajatlar"}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder={isRu ? "Поиск по расходам..." : "Xarajatlar bo'yicha qidirish..."}
                                    value={manualExpenseSearch}
                                    onChange={(e) => setManualExpenseSearch(e.target.value)}
                                    className="p-1.5 border border-gray-300 text-xs bg-white outline-none focus:border-black w-48"
                                />
                                <button
                                    onClick={() => handleOpenAddExpense(activeDrillMonth.month)}
                                    className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shrink-0"
                                >
                                    + {isRu ? "Добавить" : "Qo'shish"}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 bg-white">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                        <th className="py-2.5 px-3 text-center w-10">№</th>
                                        <th className="py-2.5 px-3">{isRu ? "Наименование" : "Xarajat nomi"}</th>
                                        <th className="py-2.5 px-3">{isRu ? "Категория" : "Toifasi"}</th>
                                        <th className="py-2.5 px-3">{isRu ? "Описание / Примечание" : "Izoh / Tafsilot"}</th>
                                        <th className="py-2.5 px-3">{isRu ? "Дата" : "Sana"}</th>
                                        <th className="py-2.5 px-3 text-right">{isRu ? "Сумма" : "Summasi"}</th>
                                        <th className="py-2.5 px-3 text-center">{isRu ? "Действия" : "Amallar"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredManualExpensesList.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-6 text-center text-gray-400 font-medium">
                                                {isRu ? "В этом месяце еще не добавлены прямые расходы компании." : "Ushbu oyda qo'lda kiritilgan operatsion xarajatlar yo'q."}
                                                <button
                                                    onClick={() => handleOpenAddExpense(activeDrillMonth.month)}
                                                    className="ml-2 text-blue-600 underline font-bold"
                                                >
                                                    {isRu ? "+ Добавить расход" : "+ Xarajat qo'shish"}
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredManualExpensesList.map((exp: any, expIdx: number) => (
                                            <tr key={exp.id || expIdx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-2.5 px-3 text-center text-gray-400 font-bold">
                                                    {expIdx + 1}
                                                </td>
                                                <td className="py-2.5 px-3 font-bold text-black">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span>{exp.title}</span>
                                                        {(exp.isRecurring || exp.recurringGroupId) && (
                                                            <span
                                                                className="px-1.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 text-[9px] font-black uppercase tracking-wider rounded inline-flex items-center gap-0.5"
                                                                title={isRu ? "Ежемесячный автоматический расход" : "Har oylik avtomatik takrorlanuvchi xarajat"}
                                                            >
                                                                🔁 {isRu ? "Ежемесячно" : "Har oylik"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-bold uppercase rounded border border-gray-200">
                                                        {getCategoryLabel(exp.category)}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-gray-600">
                                                    {exp.description || "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                                                    {exp.date ? new Date(exp.date).toLocaleDateString() : "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-black text-rose-600">
                                                    {formatMoney(exp.amount)}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenEditExpense(exp)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded text-xs font-bold"
                                                            title={isRu ? "Редактировать" : "Tahrirlash"}
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteExpense(exp)}
                                                            className="p-1 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded text-xs font-bold"
                                                            title={isRu ? "Удалить" : "O'chirish"}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Itemized Employees Table */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="text-xs font-black uppercase tracking-wider text-gray-700">
                                3. {isRu ? "Список сотрудников и выплаты за месяц" : "Xodimlar Kesimida Oyliklar va To'lovlar"} ({filteredEmployeeList.length} ta)
                            </div>
                            <input
                                type="text"
                                placeholder={isRu ? "Поиск по сотрудникам..." : "Xodim ismi yoki bo'limi bo'yicha qidirish..."}
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                className="p-2 border border-gray-300 text-xs bg-white outline-none focus:border-black w-full sm:w-72"
                            />
                        </div>

                        <div className="overflow-x-auto border border-gray-200">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                        <th className="py-2.5 px-3 text-center w-10">№</th>
                                        <th className="py-2.5 px-3">{isRu ? "Сотрудник" : "Xodim"}</th>
                                        <th className="py-2.5 px-3">{isRu ? "Отдел и Должность" : "Bo'lim & Lavozim"}</th>
                                        <th className="py-2.5 px-3 text-right">{isRu ? "Оклад" : "Asosiy oylik"}</th>
                                        <th className="py-2.5 px-3 text-right">{isRu ? "Бонус" : "Bonus"}</th>
                                        <th className="py-2.5 px-3 text-right">{isRu ? "Удержание" : "Ushlanma"}</th>
                                        <th className="py-2.5 px-3 text-right">{isRu ? "Аванс" : "Avans"}</th>
                                        <th className="py-2.5 px-3 text-right">{isRu ? "Итого ФОТ" : "Jami Xarajat"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEmployeeList.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-gray-400 font-semibold">
                                                {isRu ? "Записи по сотрудникам не найдены." : "Xodimlar bo'yicha yozuvlar topilmadi."}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployeeList.map((emp: any, eIdx: number) => (
                                            <tr key={emp.employeeId || eIdx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-2.5 px-3 text-center text-gray-400 font-medium">
                                                    {eIdx + 1}
                                                </td>
                                                <td className="py-2.5 px-3 font-bold text-black">
                                                    <div>{emp.name}</div>
                                                    {emp.email && (
                                                        <div className="text-[10px] text-gray-400 font-normal">{emp.email}</div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-gray-600">
                                                    <div>{emp.department}</div>
                                                    <div className="text-[10px] text-gray-400">{emp.position}</div>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-medium text-gray-800">
                                                    {Number(emp.baseSalary || 0).toLocaleString()} UZS
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                                                    {emp.bonus > 0 ? `+${Number(emp.bonus).toLocaleString()} UZS` : "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                                                    {emp.deductions > 0 ? `-${Number(emp.deductions).toLocaleString()} UZS` : "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-bold text-purple-600">
                                                    {emp.advances > 0 ? `${Number(emp.advances).toLocaleString()} UZS` : "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-black text-black">
                                                    {formatMoney(emp.totalExpense)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add or Edit Manual Company Expense */}
            {isAddExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
                    <div className="bg-white border border-gray-300 w-full max-w-lg shadow-2xl p-6 relative">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                                    <span>{editingExpense ? "✏️" : "➕"}</span>
                                    <span>{editingExpense ? (isRu ? "Редактировать расход" : "Xarajatni tahrirlash") : (isRu ? "Добавить расход компании" : "Kompaniya xarajatini kiritish")}</span>
                                </h3>
                                <div className="text-[11px] text-gray-500 font-bold mt-0.5">
                                    🏢 {data?.companyName || "Kompaniya"} ({selectedYear})
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddExpenseModalOpen(false)}
                                className="text-gray-400 hover:text-black font-bold text-lg leading-none p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveExpense} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                    {isRu ? "Наименование расхода *" : "Xarajat nomi *"}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={isRu ? "Например: Аренда офиса за сентябрь, покупка монитора..." : "Masalan: Sentyabr oyi ofis ijarasi, server to'lovi, kanselyariya..."}
                                    value={expenseForm.title}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 text-xs bg-white outline-none focus:border-black font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                        {isRu ? "Категория расхода *" : "Xarajat toifasi *"}
                                    </label>
                                    <select
                                        value={expenseForm.category}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 text-xs bg-white outline-none focus:border-black font-semibold"
                                    >
                                        {categoryOptions.map((cat) => (
                                            <option key={cat.code} value={cat.code}>
                                                {cat.icon} {isRu ? cat.labelRu : cat.labelUz}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                        {isRu ? "Сумма расхода (UZS) *" : "Xarajat summasi (UZS) *"}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="1000"
                                        placeholder="1 000 000"
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 text-xs bg-white outline-none focus:border-black font-black text-rose-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                        {isRu ? "Дата расхода *" : "Xarajat sanasi *"}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={expenseForm.date}
                                        onChange={(e) => {
                                            const d = e.target.value;
                                            if (d) {
                                                const parsed = new Date(d);
                                                const day = parsed.getDate();
                                                const m = parsed.getMonth() + 1;
                                                setExpenseForm({ ...expenseForm, date: d, recurringDay: day, month: m });
                                            } else {
                                                setExpenseForm({ ...expenseForm, date: d });
                                            }
                                        }}
                                        className="w-full p-2.5 border border-gray-300 text-xs bg-white outline-none focus:border-black font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                        {isRu ? "Способ оплаты" : "To'lov usuli"}
                                    </label>
                                    <select
                                        value={expenseForm.paymentMethod}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 text-xs bg-white outline-none focus:border-black"
                                    >
                                        <option value="BANK_TRANSFER">{isRu ? "Банковский перевод (Hisob raqam)" : "Bank o'tkazmasi (Hisob raqam)"}</option>
                                        <option value="CARD">{isRu ? "Корпоративная карта" : "Korporativ karta"}</option>
                                        <option value="CASH">{isRu ? "Наличные (Kassa)" : "Naqd pul (Kassa)"}</option>
                                        <option value="OTHER">{isRu ? "Другое" : "Boshqa"}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Recurrence Settings Section */}
                            {!editingExpense ? (
                                <div className="bg-purple-50/70 border border-purple-200 p-3.5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase text-purple-900 flex items-center gap-1.5">
                                            <span>🔁</span>
                                            <span>{isRu ? "Периодичность расхода" : "Xarajat takrorlanishi"}</span>
                                        </span>
                                        <div className="flex items-center gap-1.5 bg-white p-0.5 border border-purple-200 rounded">
                                            <button
                                                type="button"
                                                onClick={() => setExpenseForm({ ...expenseForm, isRecurring: false })}
                                                className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all rounded ${
                                                    !expenseForm.isRecurring
                                                        ? "bg-black text-white shadow-xs"
                                                        : "text-gray-600 hover:text-black"
                                                }`}
                                            >
                                                {isRu ? "Разовый" : "Bir martalik"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setExpenseForm({ ...expenseForm, isRecurring: true })}
                                                className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all rounded ${
                                                    expenseForm.isRecurring
                                                        ? "bg-purple-700 text-white shadow-xs"
                                                        : "text-gray-600 hover:text-black"
                                                }`}
                                            >
                                                {isRu ? "🔁 Ежемесячно" : "🔁 Har oylik (Takroriy)"}
                                            </button>
                                        </div>
                                    </div>

                                    {expenseForm.isRecurring && (
                                        <div className="pt-2 border-t border-purple-200 space-y-2.5 animate-in fade-in duration-150">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-purple-900 block mb-1">
                                                        {isRu ? "Период применения *" : "Qaysi oylar uchun qo'llanilsin *"}
                                                    </label>
                                                    <select
                                                        value={expenseForm.recurringScope}
                                                        onChange={(e) => setExpenseForm({ ...expenseForm, recurringScope: e.target.value as any })}
                                                        className="w-full p-2 border border-purple-300 text-xs bg-white outline-none focus:border-purple-600 font-semibold"
                                                    >
                                                        <option value="FROM_SELECTED_MONTH">
                                                            {isRu ? `С выбранного (${expenseForm.month}-й) месяца до конца года (Рекомендуется)` : `Tanlangan (${expenseForm.month}-oy) oydan yil oxirigacha (Tavsiya etiladi)`}
                                                        </option>
                                                        <option value="ALL_YEAR">
                                                            {isRu ? `Все 12 месяцев ${selectedYear} года` : `${selectedYear}-yilning barcha 12 oyi uchun`}
                                                        </option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-purple-900 block mb-1">
                                                        {isRu ? "Число каждого месяца (1-31) *" : "Har oyning sanasi (1-31) *"}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="31"
                                                        required
                                                        value={expenseForm.recurringDay}
                                                        onChange={(e) => setExpenseForm({ ...expenseForm, recurringDay: Number(e.target.value) })}
                                                        className="w-full p-2 border border-purple-300 text-xs bg-white outline-none focus:border-purple-600 font-black text-purple-950"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-purple-900 leading-relaxed bg-purple-100/70 p-2.5 rounded border border-purple-200 font-medium">
                                                ⚡ {isRu
                                                    ? `Автоматическое списание: каждый месяц ${expenseForm.recurringDay}-го числа расход будет автоматически добавляться и учитываться в ежемесячной финансовой аналитике компании.`
                                                    : `Avtomatik hisoblash: har oyning ${expenseForm.recurringDay}-sanasi kelganda, ushbu xarajat avtomatik tarzda o'sha oy hisobiga qo'shiladi va kompaniya moliyaviy tahlilida hisoblanadi.`}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                editingExpense?.recurringGroupId ? (
                                    <div className="bg-purple-50 border border-purple-300 p-3.5 space-y-2.5">
                                        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-900">
                                            <span>🔁</span>
                                            <span>{isRu ? "Это регулярный ежемесячный расход" : "Ushbu xarajat har oylik takroriy guruhga tegishli"}</span>
                                        </div>
                                        <div className="text-[11px] text-purple-950 font-medium">
                                            {isRu ? "Как применить изменения к расходу?" : "O'zgarishlarni qaysi davr uchun saqlamoqchisiz?"}
                                        </div>
                                        <div className="space-y-1.5 pt-1">
                                            <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="updateScope"
                                                    checked={expenseForm.updateScope === "ALL_RECURRING"}
                                                    onChange={() => setExpenseForm({ ...expenseForm, updateScope: "ALL_RECURRING" })}
                                                    className="accent-purple-700"
                                                />
                                                <span>{isRu ? "Обновить для ВСЕХ месяцев года (Рекомендуется)" : "Yilning BARCHA oylaridagi ushbu xarajatlarni birgalikda yangilash"}</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="updateScope"
                                                    checked={expenseForm.updateScope === "ONLY_THIS"}
                                                    onChange={() => setExpenseForm({ ...expenseForm, updateScope: "ONLY_THIS" })}
                                                    className="accent-purple-700"
                                                />
                                                <span>{isRu ? "Изменить только для выбранного месяца" : "Faqat ushbu oy xarajatini o'zgartirish"}</span>
                                            </label>
                                        </div>
                                    </div>
                                ) : null
                            )}

                            <div>
                                <label className="text-[11px] font-bold uppercase text-gray-600 block mb-1">
                                    {isRu ? "Описание / Примечание" : "Tavsif / Qo'shimcha izoh"}
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder={isRu ? "Укажите детали платежа, номер чека или счета..." : "To'lov tafsilotlari, chek yoki hisob-faktura ma'lumotlari..."}
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 text-xs bg-white outline-none focus:border-black"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddExpenseModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase text-gray-700 hover:bg-gray-100"
                                >
                                    {isRu ? "Отмена" : "Bekor qilish"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-bold uppercase tracking-wider shadow-xs"
                                >
                                    {actionLoading ? (isRu ? "Сохранение..." : "Saqlanmoqda...") : (isRu ? "Сохранить расход" : "Xarajatni saqlash")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: All Company Expenses List View */}
            {isAllExpensesListModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
                    <div className="bg-white border border-gray-300 w-full max-w-4xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4 shrink-0">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wider text-black flex items-center gap-2">
                                    <span>📑</span>
                                    <span>{isRu ? "Все операционные расходы компании" : "Kompaniyaning barcha qo'lda kiritilgan xarajatlari"}</span>
                                </h3>
                                <div className="text-xs text-gray-500 font-bold mt-0.5">
                                    🔒 {data?.companyName || "Aktiv Kompaniya"} ({selectedYear})
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAllExpensesListModalOpen(false)}
                                className="text-gray-400 hover:text-black font-bold text-lg leading-none p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Filters & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-gray-50 p-3 border border-gray-200 shrink-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={allExpensesMonthFilter}
                                    onChange={(e) => setAllExpensesMonthFilter(e.target.value)}
                                    className="p-1.5 border border-gray-300 text-xs bg-white font-bold"
                                >
                                    <option value="ALL">{isRu ? "Все месяцы" : "Barcha oylar"}</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                        <option key={m} value={m}>
                                            {monthlyList[m - 1]?.monthName || `${m}-oy`}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={allExpensesCategoryFilter}
                                    onChange={(e) => setAllExpensesCategoryFilter(e.target.value)}
                                    className="p-1.5 border border-gray-300 text-xs bg-white font-bold"
                                >
                                    <option value="ALL">{isRu ? "Все категории" : "Barcha toifalar"}</option>
                                    {categoryOptions.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.icon} {isRu ? c.labelRu : c.labelUz}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => handleOpenAddExpense()}
                                className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800"
                            >
                                + {isRu ? "Новый расход" : "Yangi xarajat"}
                            </button>
                        </div>

                        {/* Scrollable Table */}
                        <div className="overflow-y-auto flex-1 border border-gray-200">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="sticky top-0 bg-gray-100 z-10">
                                    <tr className="border-b border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-600">
                                        <th className="py-2.5 px-3 text-center w-10">№</th>
                                        <th className="py-2.5 px-3">{isRu ? "Наименование" : "Xarajat nomi"}</th>
                                        <th className="py-2.5 px-3">{isRu ? "Категория" : "Toifasi"}</th>
                                        <th className="py-2.5 px-3">{isRu ? "Описание" : "Tavsif"}</th>
                                        <th className="py-2.5 px-3">{isRu ? "Дата" : "Sana"}</th>
                                        <th className="py-2.5 px-3 text-right">{isRu ? "Сумма" : "Summasi"}</th>
                                        <th className="py-2.5 px-3 text-center">{isRu ? "Действия" : "Amallar"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {allExpensesLoading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                                                {isRu ? "Загрузка..." : "Yuklanmoqda..."}
                                            </td>
                                        </tr>
                                    ) : allExpensesList.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                                                {isRu ? "Расходы не найдены" : "Hech qanday xarajat topilmadi"}
                                            </td>
                                        </tr>
                                    ) : (
                                        allExpensesList.map((exp: any, idx: number) => (
                                            <tr key={exp.id || idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-2.5 px-3 text-center text-gray-400 font-bold">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-2.5 px-3 font-bold text-black">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span>{exp.title}</span>
                                                        {(exp.isRecurring || exp.recurringGroupId) && (
                                                            <span
                                                                className="px-1.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 text-[9px] font-black uppercase tracking-wider rounded inline-flex items-center gap-0.5"
                                                                title={isRu ? "Ежемесячный автоматический расход" : "Har oylik avtomatik takrorlanuvchi xarajat"}
                                                            >
                                                                🔁 {isRu ? "Ежемесячно" : "Har oylik"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-bold uppercase rounded border border-gray-200">
                                                        {getCategoryLabel(exp.category)}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-gray-600">
                                                    {exp.description || "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                                                    {exp.date ? new Date(exp.date).toLocaleDateString() : "-"}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-black text-rose-600">
                                                    {formatMoney(exp.amount)}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenEditExpense(exp)}
                                                            className="px-2 py-1 text-[11px] font-bold uppercase bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteExpense(exp)}
                                                            className="px-2 py-1 text-[11px] font-bold uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-4 shrink-0">
                            <div className="text-xs font-bold text-gray-600">
                                {isRu ? "Итого расходов в списке:" : "Ro'yxatdagi jami xarajat:"} <span className="font-black text-black">{formatMoney(allExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0))}</span>
                            </div>
                            <button
                                onClick={() => setIsAllExpensesListModalOpen(false)}
                                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-black text-xs font-bold uppercase"
                            >
                                {isRu ? "Закрыть" : "Yopish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
