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
    const res = await fetch(`${API_URL}/departments`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        throw new Error("Failed to fetch departments");
    }
    return res.json().then(data => data.data);
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
    return res.json().then(data => data.data);
};
