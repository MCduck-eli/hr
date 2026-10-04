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

export const fetchHRDashboardActivities = async (signal?: AbortSignal): Promise<HRActivityItem[]> => {
    try {
        const res = await fetch(`${API_URL}/dashboard/hr-activities`, {
            headers: getHeaders(),
            signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
        return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    } catch (err: any) {
        if (err.name === "AbortError") return [];
        throw err;
    }
};

export const fetchHRDashboardStats = async (signal?: AbortSignal): Promise<HRDashboardStats> => {
    try {
        const res = await fetch(`${API_URL}/dashboard/hr-summary`, {
            headers: getHeaders(),
            signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
        return data.data || data;
    } catch (err: any) {
        if (err.name === "AbortError") throw err;
        throw err;
    }
};

export const fetchHRMonitoringData = async (signal?: AbortSignal): Promise<any[]> => {
    try {
        const res = await fetch(`${API_URL}/onboarding/monitoring`, {
            headers: getHeaders(),
            signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        return list.filter((record: any) => record.employee?.user?.role !== "DIRECTOR");
    } catch (err: any) {
        if (err.name === "AbortError") return [];
        throw err;
    }
};
