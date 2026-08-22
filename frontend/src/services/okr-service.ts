const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

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

export const fetchOkrDashboard = async (cycleId?: string, departmentId?: string) => {
    let url = `${API_URL}/okr/dashboard`;
    const params = new URLSearchParams();
    if (cycleId) params.append("cycleId", cycleId);
    if (departmentId) params.append("departmentId", departmentId);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch OKR dashboard");
    return res.json().then(data => data.data);
};

export const fetchOkrCycles = async () => {
    const res = await fetch(`${API_URL}/okr/cycles`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch OKR cycles");
    return res.json().then(data => data.data);
};

export const createOkrCycle = async (data: any) => {
    const res = await fetch(`${API_URL}/okr/cycles`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create cycle");
    return res.json().then(data => data.data);
};

export const createObjective = async (data: any) => {
    const res = await fetch(`${API_URL}/okr/objectives`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create objective");
    }
    return res.json().then(data => data.data);
};

export const updateObjective = async (objectiveId: string, data: any) => {
    const res = await fetch(`${API_URL}/okr/objectives/${objectiveId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update objective");
    }
    return res.json().then(data => data.data);
};

export const updateObjectiveStatus = async (objectiveId: string, status: string) => {
    const res = await fetch(`${API_URL}/okr/objectives/${objectiveId}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update status");
    }
    return res.json().then(data => data.data);
};

export const deleteObjective = async (objectiveId: string) => {
    const res = await fetch(`${API_URL}/okr/objectives/${objectiveId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete objective");
    }
};

export const checkInKeyResult = async (keyResultId: string, formData: FormData) => {
    let token = "";
    if (typeof window !== "undefined") {
        token = localStorage.getItem("token") || "";
    }
    const res = await fetch(`${API_URL}/okr/key-results/${keyResultId}/check-in`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to check-in");
    return res.json().then(data => data.data);
};

export const fetchPendingCheckIns = async () => {
    const res = await fetch(`${API_URL}/okr/check-ins/pending`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch pending check-ins");
    return res.json().then(data => data.data);
};

export const reviewCheckIn = async (checkInId: string, status: "APPROVED" | "REJECTED") => {
    const res = await fetch(`${API_URL}/okr/check-ins/${checkInId}/review`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to review check-in");
    }
    return res.json().then(data => data.data);
};
