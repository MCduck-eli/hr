const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

export const fetchCycles = async () => {
    const res = await fetch(`${API_URL}/feedback-360/cycles`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch cycles");
    return res.json().then((data) => data.data);
};

export const createCycle = async (data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    questions: any[];
}) => {
    const res = await fetch(`${API_URL}/feedback-360/cycles`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create cycle");
    return res.json().then((data) => data.data);
};

export const updateCycle = async (id: string, data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    questions: any[];
}) => {
    const res = await fetch(`${API_URL}/feedback-360/cycles/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update cycle");
    return res.json().then((data) => data.data);
};

export const deleteCycle = async (id: string) => {
    const res = await fetch(`${API_URL}/feedback-360/cycles/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete cycle");
    return res.json().then((data) => data.data);
};

export const fetchAssignments = async (cycleId: string, targetId?: string) => {
    let url = `${API_URL}/feedback-360/assignments?cycleId=${cycleId}`;
    if (targetId) {
        url += `&targetId=${targetId}`;
    }
    const res = await fetch(url, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch assignments");
    return res.json().then((data) => data.data);
};

export const assignReviewers = async (
    cycleId: string,
    targetId: string,
    reviewers: { reviewerId: string; type: string }[]
) => {
    const res = await fetch(`${API_URL}/feedback-360/assign`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ cycleId, targetId, reviewers }),
    });
    if (!res.ok) throw new Error("Failed to assign reviewers");
    return res.json().then((data) => data.data);
};

export const fetchMyPendingTasks = async (targetUserId?: string) => {
    let url = `${API_URL}/feedback-360/my-pending-tasks`;
    if (targetUserId) {
        url += `?userId=${targetUserId}`;
    }
    const res = await fetch(url, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch pending tasks");
    return res.json().then((data) => data.data);
};

export const fetchAssignmentById = async (assignmentId: string) => {
    const res = await fetch(`${API_URL}/feedback-360/assignments/${assignmentId}`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch assignment details");
    return res.json().then((data) => data.data);
};

export const deleteAssignment = async (assignmentId: string) => {
    const res = await fetch(`${API_URL}/feedback-360/assignments/${assignmentId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete assignment");
    }
    return res.json().then((data) => data.data);
};

export const submitFeedback = async (
    assignmentId: string,
    answers: { questionId: string; score: number; comment?: string }[]
) => {
    const res = await fetch(
        `${API_URL}/feedback-360/assignments/${assignmentId}/submit`,
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ answers }),
        }
    );
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit feedback");
    }
    return res.json().then((data) => data.data);
};

export const fetchTargetReport = async (employeeId: string, cycleId?: string) => {
    let url = `${API_URL}/feedback-360/report/${employeeId}`;
    if (cycleId) {
        url += `?cycleId=${cycleId}`;
    }
    const res = await fetch(url, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch report");
    return res.json().then((data) => data.data);
};
