const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const fetchMyPayrolls = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return [];
    try {
        const res = await fetch(`${API_URL}/payroll/my`, {
            headers: getHeaders(),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || "Failed to fetch my payrolls");
        }
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn("Error fetching my payrolls:", err);
        return [];
    }
};

export const fetchAllPayrolls = async (params?: {
    month?: number;
    year?: number;
    status?: string;
    search?: string;
}) => {
    const query = new URLSearchParams();
    if (params?.month) query.set("month", params.month.toString());
    if (params?.year) query.set("year", params.year.toString());
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);

    const res = await fetch(`${API_URL}/payroll?${query.toString()}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch payrolls");
    }
    const json = await res.json();
    return json.data;
};

export const calculateAutoPayroll = async (payload: {
    month: number;
    year: number;
    employeeId?: string;
}) => {
    const res = await fetch(`${API_URL}/payroll/calculate-auto`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to calculate auto payroll");
    }
    const json = await res.json();
    return json.data;
};

export const generateBatchPayroll = async (payload: {
    month: number;
    year: number;
}) => {
    const res = await fetch(`${API_URL}/payroll/generate-batch`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate batch payroll");
    }
    const json = await res.json();
    return json.data;
};

export const createPayroll = async (payload: {
    employeeId: string;
    month: number;
    year: number;
    baseSalary: number;
    bonus?: number;
    deductions?: number;
}) => {
    const res = await fetch(`${API_URL}/payroll`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create payroll");
    }
    const json = await res.json();
    return json.data;
};

export const updatePayrollStatus = async (
    id: string,
    status: "PENDING" | "PAID" | "CANCELLED",
) => {
    const res = await fetch(`${API_URL}/payroll/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update payroll status");
    }
    const json = await res.json();
    return json.data;
};

export const deletePayroll = async (id: string) => {
    const res = await fetch(`${API_URL}/payroll/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete payroll");
    }
    const json = await res.json();
    return json.data;
};

export const fetchPenaltyRules = async () => {
    const res = await fetch(`${API_URL}/payroll/penalty-rules`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch penalty rules");
    }
    const json = await res.json();
    return json.data;
};

export const createPenaltyRule = async (payload: {
    name: string;
    code: string;
    penaltyType: string;
    amount: number;
    isAuto?: boolean;
    description?: string;
}) => {
    const res = await fetch(`${API_URL}/payroll/penalty-rules`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create penalty rule");
    }
    const json = await res.json();
    return json.data;
};

export const updatePenaltyRule = async (
    id: string,
    payload: {
        name?: string;
        penaltyType?: string;
        amount?: number;
        isAuto?: boolean;
        description?: string;
    },
) => {
    const res = await fetch(`${API_URL}/payroll/penalty-rules/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update penalty rule");
    }
    const json = await res.json();
    return json.data;
};

export const deletePenaltyRule = async (id: string) => {
    const res = await fetch(`${API_URL}/payroll/penalty-rules/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete penalty rule");
    }
    const json = await res.json();
    return json.data;
};

export const fetchEmployeePenalties = async (params?: {
    month?: number;
    year?: number;
    employeeId?: string;
}) => {
    const query = new URLSearchParams();
    if (params?.month) query.set("month", params.month.toString());
    if (params?.year) query.set("year", params.year.toString());
    if (params?.employeeId) query.set("employeeId", params.employeeId);

    const res = await fetch(`${API_URL}/payroll/employee-penalties?${query.toString()}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch employee penalties");
    }
    const json = await res.json();
    return json.data;
};

export const createEmployeePenalty = async (payload: {
    employeeId: string;
    ruleId?: string;
    reason: string;
    amount: number;
    month: number;
    year: number;
    date?: string;
}) => {
    const res = await fetch(`${API_URL}/payroll/employee-penalties`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create employee penalty");
    }
    const json = await res.json();
    return json.data;
};

export const updateEmployeePenalty = async (
    id: string,
    payload: {
        reason?: string;
        amount?: number;
        ruleId?: string;
        date?: string;
    },
) => {
    const res = await fetch(`${API_URL}/payroll/employee-penalties/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update employee penalty");
    }
    const json = await res.json();
    return json.data;
};

export const deleteEmployeePenalty = async (id: string) => {
    const res = await fetch(`${API_URL}/payroll/employee-penalties/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete employee penalty");
    }
    const json = await res.json();
    return json.data;
};

export const waivePenalty = async (payload: {
    type: "ABSENCE" | "LATENESS" | "DISCIPLINARY";
    id?: string;
    employeeId: string;
    date: string;
    reason?: string;
}) => {
    const res = await fetch(`${API_URL}/payroll/waive-penalty`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to waive penalty");
    }
    const json = await res.json();
    return json.data;
};

export const editPenalty = async (payload: {
    type: "ABSENCE" | "LATENESS" | "DISCIPLINARY";
    id?: string;
    employeeId: string;
    date: string;
    amount: number;
    reason?: string;
    month?: number;
    year?: number;
}) => {
    const res = await fetch(`${API_URL}/payroll/edit-penalty`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to edit penalty");
    }
    const json = await res.json();
    return json.data;
};

export const fetchPenaltiesSummary = async (params?: {
    month?: number;
    year?: number;
}) => {
    const query = new URLSearchParams();
    if (params?.month) query.set("month", params.month.toString());
    if (params?.year) query.set("year", params.year.toString());

    const res = await fetch(`${API_URL}/payroll/penalties-summary?${query.toString()}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch penalties summary");
    }
    const json = await res.json();
    return json.data;
};

export const fetchPayrollSchedule = async () => {
    const res = await fetch(`${API_URL}/payroll/schedule`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch payroll schedule");
    }
    const json = await res.json();
    return json.data;
};

export const updatePayrollSchedule = async (payload: {
    salaryPayDay?: number;
    advancePayDay?: number;
    advancePercentage?: number;
    isAdvanceEnabled?: boolean;
    notificationLeadDays?: number;
}) => {
    const res = await fetch(`${API_URL}/payroll/schedule`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update payroll schedule");
    }
    const json = await res.json();
    return json.data;
};

export const fetchDueReminders = async (params?: { month?: number; year?: number }) => {
    const url = new URL(`${API_URL}/payroll/due-reminders`);
    if (params?.month) url.searchParams.append("month", String(params.month));
    if (params?.year) url.searchParams.append("year", String(params.year));

    const res = await fetch(url.toString(), {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch due reminders");
    }
    const json = await res.json();
    return json.data;
};

export const fetchAdvances = async (params?: {
    month?: number;
    year?: number;
    employeeId?: string;
    status?: string;
}) => {
    const query = new URLSearchParams();
    if (params?.month) query.set("month", params.month.toString());
    if (params?.year) query.set("year", params.year.toString());
    if (params?.employeeId) query.set("employeeId", params.employeeId);
    if (params?.status) query.set("status", params.status);

    const res = await fetch(`${API_URL}/payroll/advances?${query.toString()}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch advances");
    }
    const json = await res.json();
    return json.data;
};

export const fetchMyAdvances = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return [];
    try {
        const res = await fetch(`${API_URL}/payroll/advances/my`, {
            headers: getHeaders(),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || "Failed to fetch my advances");
        }
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn("Error fetching my advances:", err);
        return [];
    }
};

export const createAdvance = async (payload: {
    employeeId: string;
    amount: number;
    month: number;
    year: number;
    dueDate?: string;
    isEarly?: boolean;
    reason?: string;
}) => {
    const res = await fetch(`${API_URL}/payroll/advances`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create advance");
    }
    const json = await res.json();
    return json.data;
};

export const updateAdvanceStatus = async (
    id: string,
    payload: {
        status: "PENDING" | "AWAITING_CONFIRMATION" | "PAID" | "CANCELLED";
        paidDate?: string;
        paymentMethod?: string;
        note?: string;
    },
) => {
    const res = await fetch(`${API_URL}/payroll/advances/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update advance status");
    }
    const json = await res.json();
    return json.data;
};

export const confirmAdvanceReceipt = async (id: string) => {
    const res = await fetch(`${API_URL}/payroll/advances/confirm-receipt/${id}`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to confirm advance receipt");
    }
    const json = await res.json();
    return json.data;
};

export const deleteAdvance = async (id: string) => {
    const res = await fetch(`${API_URL}/payroll/advances/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete advance");
    }
    const json = await res.json();
    return json.data;
};

export const paySalary = async (
    id: string,
    payload?: { paymentMethod?: string; note?: string },
) => {
    const res = await fetch(`${API_URL}/payroll/pay/${id}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to pay salary");
    }
    const json = await res.json();
    return json.data;
};

export const confirmSalaryReceipt = async (id: string) => {
    const res = await fetch(`${API_URL}/payroll/confirm-receipt/${id}`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to confirm salary receipt");
    }
    const json = await res.json();
    return json.data;
};

export const fetchPaymentRecords = async (params?: {
    month?: number;
    year?: number;
    paymentType?: string;
    employeeId?: string;
    search?: string;
}) => {
    const query = new URLSearchParams();
    if (params?.month) query.set("month", params.month.toString());
    if (params?.year) query.set("year", params.year.toString());
    if (params?.paymentType) query.set("paymentType", params.paymentType);
    if (params?.employeeId) query.set("employeeId", params.employeeId);
    if (params?.search) query.set("search", params.search);

    const res = await fetch(`${API_URL}/payroll/payment-records?${query.toString()}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch payment records");
    }
    const json = await res.json();
    return json.data;
};

export const deletePaymentRecord = async (id: string) => {
    const res = await fetch(`${API_URL}/payroll/payment-records/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete payment record");
    }
    const json = await res.json();
    return json.data;
};

export const clearAllPaymentRecords = async () => {
    const res = await fetch(`${API_URL}/payroll/payment-records/clear-all`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to clear all payment records");
    }
    const json = await res.json();
    return json.data;
};

export const fetchCompanyExpensesAnalytics = async (params?: {
    year?: number;
}) => {
    const query = new URLSearchParams();
    if (params?.year) query.set("year", params.year.toString());

    const res = await fetch(`${API_URL}/payroll/company-expenses?${query.toString()}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch company expenses analytics");
    }
    const json = await res.json();
    return json.data;
};

export const fetchCompanyExpensesItems = async (params?: {
    month?: number | string;
    year?: number | string;
    category?: string;
    search?: string;
}) => {
    const query = new URLSearchParams();
    if (params?.month && params.month !== "ALL") query.set("month", params.month.toString());
    if (params?.year) query.set("year", params.year.toString());
    if (params?.category && params.category !== "ALL") query.set("category", params.category);
    if (params?.search) query.set("search", params.search);

    const res = await fetch(`${API_URL}/payroll/company-expenses/items?${query.toString()}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch company expenses items");
    }
    const json = await res.json();
    return json.data;
};

export const createCompanyExpenseItem = async (payload: {
    title: string;
    category?: string;
    amount: number;
    date?: string;
    month?: number;
    year?: number;
    description?: string;
    paymentMethod?: string;
    receiptUrl?: string;
    isRecurring?: boolean;
    recurringDay?: number;
    recurringScope?: "ALL_YEAR" | "FROM_SELECTED_MONTH" | "SELECTED_MONTHS";
    recurringMonths?: number[];
}) => {
    const res = await fetch(`${API_URL}/payroll/company-expenses/items`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create company expense");
    }
    const json = await res.json();
    return json.data;
};

export const updateCompanyExpenseItem = async (
    id: string,
    payload: {
        title?: string;
        category?: string;
        amount?: number;
        date?: string;
        month?: number;
        year?: number;
        description?: string;
        paymentMethod?: string;
        receiptUrl?: string;
        isRecurring?: boolean;
        recurringDay?: number;
        updateScope?: "ONLY_THIS" | "ALL_RECURRING";
    },
) => {
    const res = await fetch(`${API_URL}/payroll/company-expenses/items/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update company expense");
    }
    const json = await res.json();
    return json.data;
};

export const deleteCompanyExpenseItem = async (
    id: string,
    params?: { deleteScope?: "ONLY_THIS" | "ALL_RECURRING" | string },
) => {
    const query = new URLSearchParams();
    if (params?.deleteScope) query.set("deleteScope", params.deleteScope);

    const res = await fetch(
        `${API_URL}/payroll/company-expenses/items/${id}?${query.toString()}`,
        {
            method: "DELETE",
            headers: getHeaders(),
        },
    );
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete company expense");
    }
    const json = await res.json();
    return json.data;
};

export const fetchEmployeeCompensations = async () => {
    const res = await fetch(`${API_URL}/payroll/employee-compensations`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch employee compensations");
    }
    const json = await res.json();
    return json.data;
};

export const updateEmployeeCompensation = async (
    employeeId: string,
    payload: {
        salaryType?: "MONTHLY" | "HOURLY";
        salary?: number;
        hourlyRate?: number;
        taxPercent?: number;
    },
) => {
    const res = await fetch(`${API_URL}/payroll/employee/${employeeId}/compensation`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update employee compensation");
    }
    const json = await res.json();
    return json.data;
};


