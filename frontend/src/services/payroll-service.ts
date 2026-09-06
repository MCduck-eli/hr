const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const fetchMyPayrolls = async () => {
    const res = await fetch(`${API_URL}/payroll/my`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch my payrolls");
    }
    const json = await res.json();
    return json.data;
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

export const fetchDueReminders = async () => {
    const res = await fetch(`${API_URL}/payroll/due-reminders`, {
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
    const res = await fetch(`${API_URL}/payroll/advances/my`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch my advances");
    }
    const json = await res.json();
    return json.data;
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
