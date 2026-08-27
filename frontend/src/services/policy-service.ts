const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = (isMultipart = false) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {};
    if (!isMultipart) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};

const getEffectiveUserId = (explicitId?: string): string | undefined => {
    if (explicitId) return explicitId;
    if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const urlId =
            searchParams.get("userId") ||
            searchParams.get("id") ||
            searchParams.get("employeeId");
        if (urlId) return urlId;

        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                return u.id;
            } catch (e) {}
        }
    }
    return undefined;
};

export interface PolicySignatureItem {
    id: string;
    employeeId: string;
    employeeName: string;
    email: string;
    department: string | null;
    signedVersion: number;
    isCurrentVersion: boolean;
    signedAt: string;
}

export interface PolicyItem {
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
    documentUrl?: string | null;
    version: number;
    isRequired: boolean;
    createdAt: string;
    updatedAt: string;
    isSigned: boolean;
    signedVersion?: number | null;
    signedAt?: string | null;
    isUpToDateSigned: boolean;
    stats?: {
        totalEmployees: number;
        signedCount: number;
        signedPercentage: number;
        signatures: PolicySignatureItem[];
    };
}

export const fetchPolicies = async (
    search?: string,
    targetUserId?: string,
): Promise<PolicyItem[]> => {
    const effectiveId = getEffectiveUserId(targetUserId);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (effectiveId) params.append("userId", effectiveId);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_URL}/policies${query}`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
    return data.data || [];
};

export const fetchPolicyById = async (
    id: string,
    targetUserId?: string,
): Promise<PolicyItem> => {
    const effectiveId = getEffectiveUserId(targetUserId);
    const query = effectiveId ? `?userId=${encodeURIComponent(effectiveId)}` : "";
    const res = await fetch(`${API_URL}/policies/${id}${query}`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Nizom topilmadi");
    return data.data;
};

export const createPolicy = async (formData: FormData): Promise<PolicyItem> => {
    const res = await fetch(`${API_URL}/policies`, {
        method: "POST",
        headers: getHeaders(true),
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Nizom yaratishda xatolik");
    return data.data;
};

export const updatePolicy = async (
    id: string,
    formData: FormData,
): Promise<PolicyItem> => {
    const res = await fetch(`${API_URL}/policies/${id}`, {
        method: "PATCH",
        headers: getHeaders(true),
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Nizomni tahrirlashda xatolik");
    return data.data;
};

export const deletePolicy = async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/policies/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Nizomni o'chirishda xatolik");
};

export const signPolicy = async (
    id: string,
    targetUserId?: string,
): Promise<any> => {
    const effectiveId = getEffectiveUserId(targetUserId);
    const res = await fetch(`${API_URL}/policies/${id}/sign`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ userId: effectiveId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Nizomni tasdiqlashda xatolik");
    return data.data;
};
