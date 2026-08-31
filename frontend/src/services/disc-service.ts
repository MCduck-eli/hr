const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export interface DiscOption {
    id: string;
    questionId: string;
    text: string;
    discType: "D" | "I" | "S" | "C";
    score: number;
}

export interface DiscQuestion {
    id: string;
    text: string;
    order: number;
    options: DiscOption[];
}

export interface DiscAssessment {
    id: string;
    employeeId: string;
    dScore: number;
    iScore: number;
    sScore: number;
    cScore: number;
    primaryType: "D" | "I" | "S" | "C";
    secondaryType?: "D" | "I" | "S" | "C" | null;
    createdAt: string;
    employee?: {
        firstName: string;
        lastName: string;
    };
}

export interface DiscProfileResponse {
    hasTakenTest: boolean;
    assessment: DiscAssessment | null;
    description: {
        primary: {
            title: string;
            traits: string;
            communication: string;
            strengths: string;
        } | null;
        secondaryType: string | null;
    } | null;
}

export interface TeamDiscAnalytics {
    totalEmployees: number;
    totalAssessed: number;
    distribution: {
        D: number;
        I: number;
        S: number;
        C: number;
    };
    members: {
        employeeId: string;
        fullName: string;
        department?: string;
        position?: string;
        primaryType: "D" | "I" | "S" | "C";
        secondaryType?: string | null;
        scores: {
            D: number;
            I: number;
            S: number;
            C: number;
        };
    }[];
}

export async function fetchDiscQuestions(): Promise<DiscQuestion[]> {
    const res = await fetch(`${API_URL}/disc/questions`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        throw new Error("Savollarni yuklab bo'lmadi");
    }
    const data = await res.json();
    return data.data;
}

export async function fetchMyDiscProfile(): Promise<DiscProfileResponse> {
    const res = await fetch(`${API_URL}/disc/my-profile`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        throw new Error("DISC profilini yuklab bo'lmadi");
    }
    const data = await res.json();
    return data.data;
}

export async function submitDiscAssessment(
    answers: { questionId: string; optionId: string }[],
): Promise<DiscAssessment> {
    const res = await fetch(`${API_URL}/disc/submit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Test natijasini yuborishda xatolik yuz berdi");
    }
    const data = await res.json();
    return data.data;
}

export async function createDiscQuestion(payload: {
    text: string;
    order?: number;
    options: {
        text: string;
        discType: "D" | "I" | "S" | "C";
        score?: number;
    }[];
}): Promise<DiscQuestion> {
    const res = await fetch(`${API_URL}/disc/questions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Savol yaratishda xatolik yuz berdi");
    }
    const data = await res.json();
    return data.data;
}

export async function updateDiscQuestion(
    id: string,
    payload: {
        text?: string;
        order?: number;
        options?: {
            text: string;
            discType: "D" | "I" | "S" | "C";
            score?: number;
        }[];
    },
): Promise<DiscQuestion> {
    const res = await fetch(`${API_URL}/disc/questions/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Savolni yangilashda xatolik yuz berdi");
    }
    const data = await res.json();
    return data.data;
}

export async function deleteDiscQuestion(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/disc/questions/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Savolni o'chirishda xatolik yuz berdi");
    }
}

export async function fetchTeamDiscAnalytics(
    departmentId?: string,
): Promise<TeamDiscAnalytics> {
    const url = departmentId
        ? `${API_URL}/disc/team-analytics?departmentId=${departmentId}`
        : `${API_URL}/disc/team-analytics`;
    const res = await fetch(url, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        throw new Error("Jamoa tahlilini yuklab bo'lmadi");
    }
    const data = await res.json();
    return data.data;
}
