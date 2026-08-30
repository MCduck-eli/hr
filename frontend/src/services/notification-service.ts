const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
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

export const fetchMyNotifications = async (): Promise<MyNotificationsResponse> => {
    const res = await fetch(`${API_URL}/notifications/my-notifications`, {
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

export const markNotificationAsRead = async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
    const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
};
