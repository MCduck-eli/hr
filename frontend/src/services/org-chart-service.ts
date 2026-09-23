const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export interface OrgEmployeeNode {
    id: string;
    firstName: string;
    lastName: string;
    user?: {
        id: string;
        email: string;
        role: string;
        companyName?: string | null;
    };
    department?: {
        id: string;
        name: string;
        companyName?: string | null;
    } | null;
    position?: {
        id: string;
        title: string;
    } | null;
    grade?: {
        id: string;
        title?: string;
        code?: string;
        level?: number;
    } | null;
    managerId?: string | null;
    manager?: {
        id: string;
        firstName: string;
        lastName: string;
        position?: { title: string } | null;
        department?: { name: string } | null;
    } | null;
    subordinates?: Array<{
        id: string;
        firstName: string;
        lastName: string;
        position?: { title: string } | null;
        department?: { name: string } | null;
    }>;
    matrixManagers?: Array<{
        id: string;
        manager?: {
            id: string;
            firstName: string;
            lastName: string;
            position?: { title: string } | null;
            department?: { name: string } | null;
        } | null;
    }>;
    matrixSubordinates?: Array<{
        id: string;
        employee?: {
            id: string;
            firstName: string;
            lastName: string;
            position?: { title: string } | null;
            department?: { name: string } | null;
        } | null;
    }>;
    children?: OrgEmployeeNode[];
    secondaryChildren?: OrgEmployeeNode[];
}

export interface OrgDepartmentItem {
    id: string;
    name: string;
    companyName?: string | null;
    parentId?: string | null;
    parent?: { id: string; name: string } | null;
    children?: Array<{ id: string; name: string }>;
    _count?: { employees: number };
}

export interface OrgTreeResponse {
    companyName: string;
    totalEmployees: number;
    departmentsCount: number;
    tree: OrgEmployeeNode[];
    flatEmployees: OrgEmployeeNode[];
    departments: OrgDepartmentItem[];
}

export interface MyOrgContextResponse {
    me: {
        id: string;
        firstName: string;
        lastName: string;
        department?: { id: string; name: string } | null;
        position?: { id: string; title: string } | null;
        grade?: { id: string; title?: string; code?: string; level?: number } | null;
    };
    manager?: any;
    matrixManagers?: any[];
    subordinates: any[];
    matrixSubordinates?: any[];
    teamMates: any[];
}

export const fetchOrgTree = async (query?: {
    departmentId?: string;
    search?: string;
}): Promise<OrgTreeResponse> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const params = new URLSearchParams();
    if (query?.departmentId) params.append("departmentId", query.departmentId);
    if (query?.search) params.append("search", query.search);

    const res = await fetch(`${API_URL}/org-chart/tree?${params.toString()}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Tashkiliy tuzilma ma'lumotlarini yuklashda xatolik yuz berdi");
    }

    const json = await res.json();
    return json.data;
};

export const fetchMyOrgContext = async (): Promise<MyOrgContextResponse> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_URL}/org-chart/my-context`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Xodim ierarxiya ma'lumotlarini yuklashda xatolik yuz berdi");
    }

    const json = await res.json();
    return json.data;
};

export const updateEmployeeHierarchy = async (
    employeeId: string,
    payload: {
        departmentId?: string;
        positionId?: string;
        managerId?: string | null;
        matrixManagerIds?: string[];
        reason?: string;
    },
) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_URL}/org-chart/employees/${employeeId}/hierarchy`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Ierarxiyani yangilashda xatolik yuz berdi");
    }

    const json = await res.json();
    return json.data;
};
