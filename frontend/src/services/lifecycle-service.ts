const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export interface JourneyEvent {
    id: string;
    stage: string;
    title: string;
    date: string;
    details: string;
    metadata?: any;
    isCustom?: boolean;
}

export interface RoadmapStage {
    index: number;
    code: string;
    title: string;
    description: string;
    icon: string;
    status: "COMPLETED" | "CURRENT" | "UPCOMING";
}

export interface EmployeeJourneyResponse {
    employee: {
        id: string;
        fullName: string;
        department?: string;
        position?: string;
        manager?: string | null;
    };
    currentStage?: string;
    currentStageIndex?: number;
    stages?: RoadmapStage[];
    timeline: JourneyEvent[];
}

export interface LifecycleTemplateTask {
    id?: string;
    title: string;
    description?: string;
    dueDays: number;
}

export interface LifecycleTemplate {
    id: string;
    title: string;
    description?: string;
    stage: string;
    tasks: LifecycleTemplateTask[];
    createdAt?: string;
    updatedAt?: string;
}

export async function fetchEmployeeJourney(
    employeeId: string,
    filters?: { startDate?: string; endDate?: string; eventType?: string }
): Promise<EmployeeJourneyResponse> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.eventType) params.append("eventType", filters.eventType);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_URL}/lifecycle/employee/${employeeId}/journey${qs}`, {
        headers: getHeaders(),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch employee journey");
    }

    const json = await res.json();
    return json.data;
}

export async function createLifecycleEvent(
    employeeId: string,
    payload: {
        eventType: string;
        title: string;
        description?: string;
        eventDate?: string;
        metadata?: any;
    }
): Promise<any> {
    const res = await fetch(`${API_URL}/lifecycle/employee/${employeeId}/events`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create lifecycle event");
    }

    const json = await res.json();
    return json.data;
}

export async function updateLifecycleEvent(
    eventId: string,
    payload: {
        eventType?: string;
        title?: string;
        description?: string;
        eventDate?: string;
        metadata?: any;
    }
): Promise<any> {
    const res = await fetch(`${API_URL}/lifecycle/events/${eventId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update lifecycle event");
    }

    const json = await res.json();
    return json.data;
}

export async function deleteLifecycleEvent(eventId: string): Promise<any> {
    const res = await fetch(`${API_URL}/lifecycle/events/${eventId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete lifecycle event");
    }

    const json = await res.json();
    return json.data;
}

export async function fetchLifecycleTemplates(): Promise<LifecycleTemplate[]> {
    const res = await fetch(`${API_URL}/lifecycle/templates`, {
        headers: getHeaders(),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch templates");
    }

    const json = await res.json();
    return json.data;
}

export async function createLifecycleTemplate(payload: {
    title: string;
    description?: string;
    stage: string;
    tasks: { title: string; description?: string; dueDays: number }[];
}): Promise<LifecycleTemplate> {
    const res = await fetch(`${API_URL}/lifecycle/templates`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create template");
    }

    const json = await res.json();
    return json.data;
}

export async function updateLifecycleTemplate(
    templateId: string,
    payload: {
        title?: string;
        description?: string;
        stage?: string;
        tasks?: { title: string; description?: string; dueDays: number }[];
    }
): Promise<LifecycleTemplate> {
    const res = await fetch(`${API_URL}/lifecycle/templates/${templateId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update template");
    }

    const json = await res.json();
    return json.data;
}

export async function deleteLifecycleTemplate(templateId: string): Promise<any> {
    const res = await fetch(`${API_URL}/lifecycle/templates/${templateId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete template");
    }

    const json = await res.json();
    return json.data;
}
