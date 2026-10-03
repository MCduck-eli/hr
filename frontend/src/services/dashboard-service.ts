const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export interface HRActivityItem {
    id: string;
    employeeName: string;
    avatarInitials: string;
    avatarBg: string;
    avatarUrl?: string | null;
    department: string;
    eventText: string;
    timeAgo: string;
    category: "all" | "delay" | "onboarding" | "leave" | "evaluation";
    badgeText: string;
    badgeClass: string;
    progress?: number;
    progressColor?: string;
    progressLabel?: string;
    rawDate?: number;
}

export interface HRDashboardStats {
    totalEmployees: number;
    totalDepartments: number;
    onboardingPercentage: number;
    onboardingStatusText: string;
    attendancePercentage: number;
    attendanceStatusText: string;
    todayCheckedInCount: number;
    regulationsPercentage?: number;
    regulationsStatusText?: string;
}

export const fetchHRDashboardActivities = async (): Promise<HRActivityItem[]> => {
    const res = await fetch(`${API_URL}/dashboard/hr-activities`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
    return Array.isArray(data.data) ? data.data : [];
};

export const fetchHRDashboardStats = async (): Promise<HRDashboardStats> => {
    const res = await fetch(`${API_URL}/dashboard/hr-summary`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
    return data.data;
};
