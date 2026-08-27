const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
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

export interface AppNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    metadata?: any;
    createdAt: string;
}

export interface MyNotificationsResponse {
    notifications: AppNotification[];
    unreadCount: number;
}

export const fetchMyNotifications = async (
    targetUserId?: string,
): Promise<MyNotificationsResponse> => {
    const effectiveId = getEffectiveUserId(targetUserId);
    const query = effectiveId ? `?userId=${encodeURIComponent(effectiveId)}` : "";
    const res = await fetch(`${API_URL}/notifications/my-notifications${query}`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
    if (Array.isArray(data.data)) {
        return {
            notifications: data.data,
            unreadCount: data.data.filter((n: any) => !n.isRead).length,
        };
    }
    return data.data || { notifications: [], unreadCount: 0 };
};

export const markNotificationAsRead = async (
    id: string,
    targetUserId?: string,
): Promise<void> => {
    const effectiveId = getEffectiveUserId(targetUserId);
    const query = effectiveId ? `?userId=${encodeURIComponent(effectiveId)}` : "";
    const res = await fetch(`${API_URL}/notifications/${id}/read${query}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ userId: effectiveId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
};

export const markAllNotificationsAsRead = async (
    targetUserId?: string,
): Promise<void> => {
    const effectiveId = getEffectiveUserId(targetUserId);
    const query = effectiveId ? `?userId=${encodeURIComponent(effectiveId)}` : "";
    const res = await fetch(`${API_URL}/notifications/read-all${query}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ userId: effectiveId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
};
