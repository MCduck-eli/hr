const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

export const fetchAllUsers = async () => {
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error fetching users");
    return data.data || data.users || [];
};

export const createUser = async (payload: any) => {
    const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error creating user");
    return data;
};

export const updateUser = async (id: string, payload: any) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error updating user");
    return data;
};

export const deleteUser = async (id: string) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error deleting user");
    return data;
};
