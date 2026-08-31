const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export interface JobGrade {
    id: string;
    code: string;
    title: string;
    level: number;
    minSalary: number;
    maxSalary: number;
    requirements?: string | null;
    responsibilities?: string | null;
    companyName?: string | null;
    _count?: { employees: number };
    employees?: {
        id: string;
        firstName: string;
        lastName: string;
        position?: string | null;
        salary?: number | null;
        department?: { name: string } | null;
    }[];
    createdAt?: string;
    updatedAt?: string;
}

export interface EmployeeWithGrade {
    id: string;
    firstName: string;
    lastName: string;
    position?: string | null;
    salary?: number | null;
    gradeId?: string | null;
    grade?: JobGrade | null;
    department?: { id: string; name: string } | null;
    user?: { email: string; role: string } | null;
}

export interface PromotionRequest {
    id: string;
    employeeId: string;
    employee?: {
        id: string;
        firstName: string;
        lastName: string;
        salary?: number | null;
        department?: { name: string } | null;
        position?: string | null;
    };
    currentGradeId?: string | null;
    currentGrade?: JobGrade | null;
    targetGradeId: string;
    targetGrade?: JobGrade | null;
    proposedSalary: number;
    reason: string;
    okrScore?: number | null;
    feedback360Score?: number | null;
    status: "PENDING" | "APPROVED_BY_MANAGER" | "APPROVED_BY_HR" | "REJECTED" | "CANCELLED";
    managerApproval: boolean;
    hrApproval: boolean;
    createdAt: string;
}

export interface CareerHistoryItem {
    id: string;
    employeeId: string;
    oldGradeTitle?: string | null;
    newGradeTitle: string;
    oldSalary?: number | null;
    newSalary: number;
    changedAt: string;
    reason?: string | null;
}

export const fetchGrades = async (): Promise<JobGrade[]> => {
    const res = await fetch(`${API_URL}/grading/grades`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Greydlarni yuklashda xatolik");
    return data.data || [];
};

export const createGrade = async (gradeData: {
    code: string;
    title: string;
    level: number;
    minSalary: number;
    maxSalary: number;
    requirements?: string;
    responsibilities?: string;
}): Promise<JobGrade> => {
    const res = await fetch(`${API_URL}/grading/grades`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(gradeData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Greyd yaratishda xatolik");
    return data.data;
};

export const updateGrade = async (
    gradeId: string,
    gradeData: Partial<JobGrade>,
): Promise<JobGrade> => {
    const res = await fetch(`${API_URL}/grading/grades/${gradeId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(gradeData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Greydni tahrirlashda xatolik");
    return data.data;
};

export const deleteGrade = async (gradeId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/grading/grades/${gradeId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Greydni o'chirishda xatolik");
};

export const fetchEmployeesWithGrades = async (): Promise<EmployeeWithGrade[]> => {
    const res = await fetch(`${API_URL}/grading/employees`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xodimlarni yuklashda xatolik");
    return data.data || [];
};

export const assignGradeToEmployee = async (
    employeeId: string,
    gradeId: string,
): Promise<any> => {
    const res = await fetch(`${API_URL}/grading/employee/${employeeId}/assign-grade`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ gradeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Greyd biriktirishda xatolik");
    return data.data;
};

export const fetchPromotionRequests = async (): Promise<PromotionRequest[]> => {
    const res = await fetch(`${API_URL}/grading/promotion-requests`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "So'rovlarni yuklashda xatolik");
    return data.data || [];
};

export const createPromotionRequest = async (requestData: {
    employeeId: string;
    targetGradeId: string;
    proposedSalary: number;
    reason: string;
}): Promise<PromotionRequest> => {
    const res = await fetch(`${API_URL}/grading/promotion-requests`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(requestData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Ko'tarilish so'rovini yuborishda xatolik");
    return data.data;
};

export const processPromotionApproval = async (
    requestId: string,
    action: "APPROVE" | "REJECT",
): Promise<PromotionRequest> => {
    const res = await fetch(`${API_URL}/grading/promotion-requests/${requestId}/approval`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "So'rovni qayta ishlashda xatolik");
    return data.data;
};

export const fetchCareerHistory = async (employeeId: string): Promise<CareerHistoryItem[]> => {
    const res = await fetch(`${API_URL}/grading/career-history/${employeeId}`, {
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Karyera tarixini yuklashda xatolik");
    return data.data || [];
};
