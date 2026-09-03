const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const getVacancies = async () => {
    const res = await fetch(`${API_URL}/recruitment/vacancies`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch vacancies");
    }
    const json = await res.json();
    return json.data;
};

export const getPublicVacancies = async (params?: { company?: string; search?: string; departmentId?: string }) => {
    const query = new URLSearchParams();
    if (params?.company) query.set("company", params.company);
    if (params?.search) query.set("search", params.search);
    if (params?.departmentId) query.set("departmentId", params.departmentId);

    const res = await fetch(`${API_URL}/recruitment/public/vacancies?${query.toString()}`, {
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch public vacancies");
    }
    const json = await res.json();
    return json.data;
};

export const getCandidateDetails = async (candidateId: string) => {
    const res = await fetch(`${API_URL}/recruitment/candidates/${candidateId}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch candidate details");
    }

    const json = await res.json();
    return json.data;
};

export const updateVacancy = async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/recruitment/vacancies/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        let errMsg = err.message;
        if (err.error && err.error.issues && err.error.issues.length > 0) {
            errMsg = err.error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join(", ");
        }
        throw new Error(errMsg || "Failed to update vacancy");
    }
    const json = await res.json();
    return json.data;
};

export const deleteVacancy = async (id: string) => {
    const res = await fetch(`${API_URL}/recruitment/vacancies/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete vacancy");
    }
    const json = await res.json();
    return json.data;
};

export const updateCandidateStage = async (
    candidateId: string,
    stage: string,
    testTaskDeadline?: string | null,
    options?: {
        notifyCandidate?: boolean;
        notifyChannel?: "EMAIL" | "SMS" | "BOTH";
        customMessage?: string;
    },
) => {
    const res = await fetch(`${API_URL}/recruitment/candidates/${candidateId}/stage`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
            stage,
            ...(testTaskDeadline !== undefined ? { testTaskDeadline } : {}),
            ...(options?.notifyCandidate !== undefined ? { notifyCandidate: options.notifyCandidate } : {}),
            ...(options?.notifyChannel ? { notifyChannel: options.notifyChannel } : {}),
            ...(options?.customMessage ? { customMessage: options.customMessage } : {}),
        }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update stage");
    }
    const json = await res.json();
    return json.data;
};

export const getPublicCandidateTask = async (candidateId: string) => {
    const res = await fetch(`${API_URL}/recruitment/public/candidates/${candidateId}/task`, {
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to load candidate task");
    }
    const json = await res.json();
    return json.data;
};

export const submitCandidateTask = async (candidateId: string, formData: FormData) => {
    const res = await fetch(`${API_URL}/recruitment/public/candidates/${candidateId}/submit-task`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit test task");
    }
    const json = await res.json();
    return json.data;
};

export const hireCandidate = async (candidateId: string, departmentId?: string, managerId?: string) => {
    const res = await fetch(`${API_URL}/recruitment/candidates/${candidateId}/hire`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ departmentId, managerId }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to hire candidate");
    }
    const json = await res.json();
    return json.data;
};

export const createVacancy = async (payload: { title: string; description: string; requirements: string; departmentId?: string; companyName?: string }) => {
    const res = await fetch(`${API_URL}/recruitment/vacancies`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json();
        let errMsg = err.message;
        if (err.error && err.error.issues && err.error.issues.length > 0) {
            errMsg = err.error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join(", ");
        }
        throw new Error(errMsg || "Failed to create vacancy");
    }
    const json = await res.json();
    return json.data;
};

export const getPublicVacancy = async (id: string) => {
    const res = await fetch(`${API_URL}/recruitment/public/vacancies/${id}`, {
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch vacancy");
    }
    const json = await res.json();
    return json.data;
};

export const applyForJob = async (formData: FormData) => {
    const res = await fetch(`${API_URL}/recruitment/apply`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to apply");
    }
    const json = await res.json();
    return json.data;
};

export const parseResume = async (fileOrFormData: File | FormData | { rawText: string }) => {
    let body: any;
    let headers: Record<string, string> = {};

    if (fileOrFormData instanceof FormData) {
        body = fileOrFormData;
    } else if (fileOrFormData instanceof File) {
        const fd = new FormData();
        fd.append("file", fileOrFormData);
        body = fd;
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(fileOrFormData);
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/recruitment/parse-cv`, {
        method: "POST",
        headers,
        body,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Rezyumeni o'qishda xatolik");
    }
    const json = await res.json();
    return json.data;
};

export const sendCandidateEmail = async (candidateId: string, payload: { subject: string; text: string; type: string }) => {
    const res = await fetch(`${API_URL}/recruitment/candidates/${candidateId}/email`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send email");
    }
    const json = await res.json();
    return json.data;
};

export const sendCandidateSms = async (candidateId: string, payload: { message: string; type?: string }) => {
    const res = await fetch(`${API_URL}/recruitment/candidates/${candidateId}/sms`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send SMS");
    }
    const json = await res.json();
    return json.data;
};

export const uploadTaskFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_URL}/recruitment/upload-task`, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Faylni yuklashda xatolik yuz berdi");
    }
    const json = await res.json();
    return json.data as { fileUrl: string; fileName: string };
};
