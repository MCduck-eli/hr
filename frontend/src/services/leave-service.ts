const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export type LeaveType = "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "OTHER";

export interface CreateLeaveRequestPayload {
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
}

export interface LeaveRequestItem {
    id: string;
    employeeId: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    approvedBy?: string | null;
    createdAt: string;
    updatedAt: string;
}

export const createLeaveRequest = async (
    data: CreateLeaveRequestPayload,
): Promise<LeaveRequestItem> => {
    const res = await fetch(`${API_URL}/leaves`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
        throw new Error(result.message || "Ta'til so'rovini yuborishda xatolik yuz berdi");
    }
    return result.data;
};

export const getMyLeaveRequests = async (): Promise<LeaveRequestItem[]> => {
    const res = await fetch(`${API_URL}/leaves/my`, {
        headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) {
        throw new Error(result.message || "Ta'tillar ro'yxatini yuklashda xatolik");
    }
    return result.data;
};

export interface LeaveRequestWithEmployee extends LeaveRequestItem {
    employee?: {
        id: string;
        firstName: string;
        lastName: string;
        department?: { name: string } | null;
    };
}

export const getAllLeaveRequests = async (
    status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
): Promise<LeaveRequestWithEmployee[]> => {
    const url = status ? `${API_URL}/leaves?status=${status}` : `${API_URL}/leaves`;
    const res = await fetch(url, {
        headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) {
        throw new Error(result.message || "Ta'tillar ro'yxatini yuklashda xatolik");
    }
    return result.data;
};

export const updateLeaveStatus = async (
    id: string,
    status: "APPROVED" | "REJECTED",
): Promise<LeaveRequestItem> => {
    const res = await fetch(`${API_URL}/leaves/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (!res.ok) {
        throw new Error(result.message || "Statusni yangilashda xatolik yuz berdi");
    }
    return result.data;
};
