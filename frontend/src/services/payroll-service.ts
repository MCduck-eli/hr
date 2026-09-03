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
