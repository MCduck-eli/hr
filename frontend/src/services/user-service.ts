const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchAllUsers = async () => {
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error fetching users");
    return data.data || data.users || [];
};

export const createUser = async (payload: any) => {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    let body: any;
    const headers: Record<string, string> = {
        ...getAuthHeader(),
    };

    if (isFormData) {
        body = payload;
    } else if (
        payload &&
        typeof payload === "object" &&
        (payload.avatar instanceof File || payload.image instanceof File || payload.avatarFile instanceof File)
    ) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === "avatar" || key === "image" || key === "avatarFile") {
                    if (value instanceof File) {
                        formData.append("avatar", value);
                    } else {
                        formData.append(key, String(value));
                    }
                } else if (key === "permissions" && Array.isArray(value)) {
                    formData.append("permissions", JSON.stringify(value));
                } else if (Array.isArray(value)) {
                    value.forEach((item) => formData.append(`${key}[]`, item));
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        body = formData;
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
    }

    const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers,
        body,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error creating user");
    return data;
};

export const updateUser = async (id: string, payload: any) => {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    let body: any;
    const headers: Record<string, string> = {
        ...getAuthHeader(),
    };

    if (isFormData) {
        body = payload;
    } else if (
        payload &&
        typeof payload === "object" &&
        (payload.avatar instanceof File || payload.image instanceof File || payload.avatarFile instanceof File)
    ) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === "avatar" || key === "image" || key === "avatarFile") {
                    if (value instanceof File) {
                        formData.append("avatar", value);
                    } else {
                        formData.append(key, String(value));
                    }
                } else if (key === "permissions" && Array.isArray(value)) {
                    formData.append("permissions", JSON.stringify(value));
                } else if (Array.isArray(value)) {
                    value.forEach((item) => formData.append(`${key}[]`, item));
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        body = formData;
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
    }

    const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PATCH",
        headers,
        body,
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

