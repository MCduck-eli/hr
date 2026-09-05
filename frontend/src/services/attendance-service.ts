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

export interface WorkScheduleInfo {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    workingDays: number[];
    gracePeriodMinutes: number;
    departmentId?: string | null;
    employeeId?: string | null;
    departmentName?: string | null;
    employeeName?: string | null;
    isDefault?: boolean;
}

export interface TodayAttendanceStatus {
    isCheckedIn: boolean;
    isCheckedOut: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    expectedCheckIn: string;
    expectedCheckOut: string;
    lateMinutes: number;
    earlyMinutes: number;
    absenceReason: string | null;
    status: string;
    isWorkingDay: boolean;
    attendanceHours: number;
    schedule: {
        name?: string;
        startTime: string;
        endTime: string;
        workingDays: number[];
        gracePeriodMinutes: number;
    };
    employeeName?: string;
    date: string;
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string;
    expectedCheckIn: string;
    expectedCheckOut: string;
    scheduleName: string;
    checkIn: string | null;
    checkOut: string | null;
    lateMinutes: number;
    earlyMinutes: number;
    absenceReason: string | null;
    reasonSubmittedBy: string | null;
    status: string;
    note: string | null;
    durationHours: number | null;
    isWorkingDay: boolean;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        department: { id: string; name: string } | null;
        position: { id: string; title: string } | null;
        user: { email: string } | null;
    };
}

export interface AttendanceSummary {
    totalEmployees: number;
    todayPresent: number;
    todayLate: number;
    todayEarly: number;
    todayCheckedInTotal: number;
    todayCheckedOut: number;
    todayUnmarked: number;
    todayReasonGiven: number;
    isWorkingDay: boolean;
}

export interface AbsentRecord {
    id: string;
    employeeId: string;
    date: string;
    employeeName: string;
    department: string;
    position: string;
    status: "SABABLI" | "SABABSIZ";
    absenceReason: string | null;
    reasonSubmittedBy: string | null;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        department: { id: string; name: string } | null;
        position: { id: string; title: string } | null;
    };
}

export interface ThreeMonthSummary {
    months: {
        month: number;
        year: number;
        monthName: string;
        totalWorkingDays: number;
        attendedCount: number;
        absentCount: number;
        lateCount: number;
    }[];
    employeeSummaries: {
        employeeId: string;
        name: string;
        department: string;
        position: string;
        attendedCount: number;
        absentCount: number;
        lateCount: number;
        attendanceRate: number;
    }[];
}

export interface AllAttendanceResponse {
    records: AttendanceRecord[];
    summary: AttendanceSummary;
    schedule: WorkScheduleInfo;
    absentRecords?: AbsentRecord[];
    threeMonthSummary?: ThreeMonthSummary;
}

export const fetchTodayAttendanceStatus = async (
    targetUserId?: string,
): Promise<TodayAttendanceStatus> => {
    const effectiveId = getEffectiveUserId(targetUserId);
    const query = effectiveId ? `?userId=${encodeURIComponent(effectiveId)}` : "";
    const res = await fetch(`${API_URL}/attendance/today-status${query}`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Davomat holatini olishda xatolik");
    return data.data;
};

export const fetchAllAttendance = async (params?: {
    startDate?: string;
    endDate?: string;
    search?: string;
}): Promise<AllAttendanceResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.search) searchParams.append("search", params.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await fetch(`${API_URL}/attendance${query}`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Davomat ma'lumotlarini olishda xatolik");
    return data.data;
};

export const fetchAllWorkSchedules = async (): Promise<WorkScheduleInfo[]> => {
    const res = await fetch(`${API_URL}/attendance/schedules`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Ish jadvallarini olishda xatolik");
    return data.data;
};

export const createWorkSchedule = async (payload: {
    name: string;
    startTime: string;
    endTime: string;
    workingDays: number[];
    gracePeriodMinutes?: number;
    departmentId?: string | null;
    employeeId?: string | null;
    isDefault?: boolean;
}): Promise<WorkScheduleInfo> => {
    const res = await fetch(`${API_URL}/attendance/schedules`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Jadval yaratishda xatolik");
    return data.data;
};

export const updateWorkSchedule = async (
    id: string,
    payload: {
        name?: string;
        startTime?: string;
        endTime?: string;
        workingDays?: number[];
        gracePeriodMinutes?: number;
        departmentId?: string | null;
        employeeId?: string | null;
        isDefault?: boolean;
    },
): Promise<WorkScheduleInfo> => {
    const res = await fetch(`${API_URL}/attendance/schedules/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Jadvalni yangilashda xatolik");
    return data.data;
};

export const deleteWorkSchedule = async (id: string): Promise<any> => {
    const res = await fetch(`${API_URL}/attendance/schedules/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Jadvalni o'chirishda xatolik");
    return data.data;
};

export const submitAbsenceReason = async (payload: {
    employeeId?: string;
    date?: string;
    reason: string;
    submittedBy?: "HR" | "EMPLOYEE";
}): Promise<any> => {
    const res = await fetch(`${API_URL}/attendance/reason`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Sababni yuborishda xatolik");
    return data.data;
};

export const checkInWithFace = async (payload: {
    image?: string;
    note?: string;
    targetUserId?: string;
}): Promise<any> => {
    const effectiveId = getEffectiveUserId(payload.targetUserId);
    const res = await fetch(`${API_URL}/attendance/check-in`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            userId: effectiveId,
            note: payload.note || "Face ID orqali qayd etildi",
            image: payload.image,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Check In qilishda xatolik");
    return data.data;
};

export const checkOutAttendance = async (payload?: {
    note?: string;
    targetUserId?: string;
}): Promise<any> => {
    const effectiveId = getEffectiveUserId(payload?.targetUserId);
    const res = await fetch(`${API_URL}/attendance/check-out`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            userId: effectiveId,
            note: payload?.note || "Check Out qayd etildi",
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Check Out qilishda xatolik");
    return data.data;
};
