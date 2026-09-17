const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

export interface EnpsQuestion {
    id: string;
    companyName?: string | null;
    question: string;
    description?: string | null;
    minScale: number;
    maxScale: number;
    minLabel: string;
    maxLabel: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const fetchEnpsQuestions = async (activeOnly = false): Promise<EnpsQuestion[]> => {
    const res = await fetch(`${API_URL}/enps/questions${activeOnly ? "?activeOnly=true" : ""}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch questions");
    }
    const data = await res.json();
    return data.data;
};

export const createEnpsQuestion = async (payload: {
    question: string;
    description?: string;
    minScale?: number;
    maxScale?: number;
    minLabel?: string;
    maxLabel?: string;
    isActive?: boolean;
}): Promise<EnpsQuestion> => {
    const res = await fetch(`${API_URL}/enps/questions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create question");
    }
    const data = await res.json();
    return data.data;
};

export const updateEnpsQuestion = async (
    id: string,
    payload: Partial<{
        question: string;
        description: string;
        minScale: number;
        maxScale: number;
        minLabel: string;
        maxLabel: string;
        isActive: boolean;
    }>
): Promise<EnpsQuestion> => {
    const res = await fetch(`${API_URL}/enps/questions/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update question");
    }
    const data = await res.json();
    return data.data;
};

export const deleteEnpsQuestion = async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/enps/questions/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete question");
    }
    const data = await res.json();
    return data.data;
};

export const submitEnps = async (data: { score: number; comment?: string; questionId?: string }) => {
    const res = await fetch(`${API_URL}/enps/submit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit eNPS");
    }
    return res.json().then((data) => data.data);
};

export const fetchMyLatestEnps = async (questionId?: string) => {
    const res = await fetch(`${API_URL}/enps/my-latest${questionId ? `?questionId=${questionId}` : ""}`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch latest eNPS");
    return res.json().then((data) => data.data);
};

export const fetchEnpsAnalytics = async () => {
    const res = await fetch(`${API_URL}/enps/analytics`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch eNPS analytics");
    return res.json().then((data) => data.data);
};
