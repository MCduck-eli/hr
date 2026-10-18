export interface TrialRequest {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    status: string;
    createdAt: string;
    trialEndDate: string;
}

export interface CreateTrialPayload {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const createTrialRequest = async (payload: CreateTrialPayload): Promise<TrialRequest> => {
    const res = await fetch(`${API_URL}/trials`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Xatolik yuz berdi");
    }

    return data.data;
};

export const getTrialRequests = async (): Promise<TrialRequest[]> => {
    const res = await fetch(`${API_URL}/trials`, {
        method: "GET",
        headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Ma'lumotlarni yuklashda xatolik");
    }

    return data.data || [];
};

export const approveTrialRequest = async (id: string): Promise<any> => {
    const res = await fetch(`${API_URL}/trials/${id}/approve`, {
        method: "POST",
        headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Tasdiqlashda xatolik yuz berdi");
    }

    return data;
};

export const rejectTrialRequest = async (id: string): Promise<any> => {
    const res = await fetch(`${API_URL}/trials/${id}/reject`, {
        method: "POST",
        headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Rad etishda xatolik yuz berdi");
    }

    return data;
};

export const extendTrialRequest = async (id: string, newEndDate: string): Promise<any> => {
    const res = await fetch(`${API_URL}/trials/${id}/extend`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ newEndDate }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Muddatni uzaytirishda xatolik yuz berdi");
    }

    return data;
};
