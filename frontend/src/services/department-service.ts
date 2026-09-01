export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    let token = "";
    if (typeof window !== "undefined") {
        token = localStorage.getItem("token") || "";
    }
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

export const fetchDepartments = async () => {
    try {
        const res = await fetch(`${API_URL}/departments`, {
            headers: getHeaders(),
        });
        if (!res.ok) {
            return [];
        }
        const json = await res.json();
        return Array.isArray(json) ? json : json.data || [];
    } catch {
        return [];
    }
};

export const createDepartment = async (payload: { name: string; parentId?: string }) => {
    const res = await fetch(`${API_URL}/departments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create department");
    }
    const json = await res.json();
    return json.data || json;
};

export const deleteDepartment = async (id: string) => {
    const res = await fetch(`${API_URL}/departments/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete department");
    }
    const json = await res.json();
    return json.data || json;
};
