const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export interface OffboardingTask {
    id: string;
    offboardingId: string;
    category: "IT_ACCESS" | "ASSET_RETURN" | "FINANCE" | "HR_DOCUMENTS";
    title: string;
    isCompleted: boolean;
    completedAt: string | null;
    createdAt: string;
}

export interface OffboardingItem {
    id: string;
    employeeId: string;
    reason: string;
    lastWorkingDay: string;
    exitInterviewNotes?: string | null;
    isAssetsReturned: boolean;
    status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PENDING";
    createdAt: string;
    updatedAt: string;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        department?: { id: string; name: string } | null;
        position?: { id: string; title: string } | null;
        user?: { id: string; email: string; avatar?: string | null; companyName?: string | null } | null;
    };
    tasks: OffboardingTask[];
}

export const fetchAllOffboardingRequests = async (): Promise<OffboardingItem[]> => {
    const res = await fetch(`${API_URL}/lifecycle/offboarding`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Offboarding ma'lumotlarini olishda xatolik");
    return data.data || [];
};

export const fetchOffboardingDetails = async (employeeId: string): Promise<OffboardingItem | null> => {
    const res = await fetch(`${API_URL}/lifecycle/employee/${employeeId}/offboarding`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Offboarding tafsilotlarini olishda xatolik");
    return data.data;
};

export const startOffboarding = async (
    employeeId: string,
    payload: {
        reason: string;
        lastWorkingDay: string;
        exitInterviewNotes?: string;
        customTasks?: { title: string; category?: string }[];
    },
): Promise<OffboardingItem> => {
    const res = await fetch(`${API_URL}/lifecycle/employee/${employeeId}/offboarding`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Offboarding boshlashda xatolik");
    return data.data;
};

export const toggleOffboardingTask = async (
    taskId: string,
    isCompleted: boolean,
): Promise<OffboardingTask> => {
    const res = await fetch(`${API_URL}/lifecycle/offboarding/tasks/${taskId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ isCompleted }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Topshiriq holatini o'zgartirishda xatolik");
    return data.data;
};

export const editOffboardingTask = async (
    taskId: string,
    payload: { title?: string; category?: string; isCompleted?: boolean },
): Promise<OffboardingTask> => {
    const res = await fetch(`${API_URL}/lifecycle/offboarding/tasks/${taskId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Topshiriqni tahrirlashda xatolik");
    return data.data;
};

export const addOffboardingTask = async (
    offboardingId: string,
    payload: { title: string; category?: string },
): Promise<OffboardingTask> => {
    const res = await fetch(`${API_URL}/lifecycle/offboarding/${offboardingId}/tasks`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Topshiriq qo'shishda xatolik");
    return data.data;
};

export const deleteOffboardingTask = async (taskId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/lifecycle/offboarding/tasks/${taskId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Topshiriqni o'chirishda xatolik");
};

export const submitExitInterview = async (
    employeeId: string,
    payload: { exitInterviewNotes: string; reason?: string },
): Promise<OffboardingItem> => {
    const res = await fetch(`${API_URL}/lifecycle/employee/${employeeId}/exit-interview`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Exit interview topshirishda xatolik");
    return data.data;
};

export const updateOffboardingStatus = async (
    offboardingId: string,
    status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
): Promise<OffboardingItem> => {
    const res = await fetch(`${API_URL}/lifecycle/offboarding/${offboardingId}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Statusni o'zgartirishda xatolik");
    return data.data;
};
