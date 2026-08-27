const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const fetchAllStatuses = async () => {
    const res = await fetch(`${API_URL}/employee-statuses`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error fetching statuses");
    return data.data || [];
};

export const createStatus = async (payload: {
    name: string;
    code?: string;
    color?: string;
    durationDays?: number | null;
    nextStatusId?: string | null;
}) => {
    const res = await fetch(`${API_URL}/employee-statuses`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error creating status");
    return data.data;
};

export const updateStatus = async (
    id: string,
    payload: {
        name?: string;
        color?: string;
        durationDays?: number | null;
        nextStatusId?: string | null;
    },
) => {
    const res = await fetch(`${API_URL}/employee-statuses/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error updating status");
    return data.data;
};

export const deleteStatus = async (id: string) => {
    const res = await fetch(`${API_URL}/employee-statuses/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error deleting status");
    return data.data;
};
