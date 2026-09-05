const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const fetchAllRoles = async () => {
    const res = await fetch(`${API_URL}/roles`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error fetching roles");
    return data.data || [];
};

export const createCustomRole = async (payload: {
    name: string;
    code?: string;
    baseRole?: string;
    description?: string;
    color?: string;
}) => {
    const res = await fetch(`${API_URL}/roles`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error creating role");
    return data.data;
};

export const updateCustomRole = async (
    id: string,
    payload: {
        name?: string;
        baseRole?: string;
        description?: string;
        color?: string;
    },
) => {
    const res = await fetch(`${API_URL}/roles/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error updating role");
    return data.data;
};

export const deleteCustomRole = async (id: string) => {
    const res = await fetch(`${API_URL}/roles/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error deleting role");
    return data.data;
};
