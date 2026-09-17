const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export interface HeadcountMetrics {
    totalActive: number;
    newHiresYear: number;
    terminationsYear: number;
    avgTenureMonths: number;
}

export interface TurnoverTrendItem {
    month: string;
    monthIndex: number;
    year: number;
    hires: number;
    exits: number;
    turnoverRate: number;
    retentionRate: number;
}

export interface TurnoverMetrics {
    turnoverRate: number;
    retentionRate: number;
    trend: TurnoverTrendItem[];
}

export interface ENPSResponseItem {
    id: string;
    score: number;
    comment: string | null;
    createdAt: string;
    employeeName: string;
    department: string;
    position: string;
}

export interface ENPSMetrics {
    score: number;
    avgScore?: number;
    promotersPct: number;
    passivesPct: number;
    detractorsPct: number;
    promotersCount: number;
    passivesCount: number;
    detractorsCount: number;
    totalResponses: number;
    recentResponses?: ENPSResponseItem[];
}

export interface DepartmentAnalyticsItem {
    id: string;
    name: string;
    headcount: number;
    headcountPercentage: number;
    avgOkr: number;
    turnoverRate: number;
}

export interface NineBoxEmployee {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    position: string;
    grade: string;
    okrScore: number;
    performanceScore?: number;
    potentialScore: number;
    performanceLevel: number;
    potentialLevel: number;
    completedCourses?: number;
    discType: string;
    boxKey: string;
    boxTitle: string;
}

export interface NineBoxMatrixCell {
    key: string;
    row: number;
    col: number;
    title: string;
    category: string;
    color: string;
    description: string;
    count: number;
    percentage: number;
    employees: NineBoxEmployee[];
}

export interface NineBoxSummary {
    starsCount: number;
    highPerformersCount: number;
    highPotentialCount: number;
    riskCount: number;
    highPerformersPct: number;
    highPotentialPct: number;
    riskPct: number;
}

export interface ExecutiveSummaryResponse {
    companyName: string;
    headcount: HeadcountMetrics;
    turnover: TurnoverMetrics;
    enps: ENPSMetrics;
    departmentAnalytics: DepartmentAnalyticsItem[];
    nineBoxSummary: NineBoxSummary;
    nineBoxMatrix: NineBoxMatrixCell[];
}

export interface NineBoxGridResponse {
    total: number;
    summary: NineBoxSummary;
    matrix: NineBoxMatrixCell[];
}

export const fetchExecutiveSummary = async (query?: {
    timeframe?: string;
    departmentId?: string;
}): Promise<ExecutiveSummaryResponse> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const params = new URLSearchParams();
    if (query?.timeframe) params.append("timeframe", query.timeframe);
    if (query?.departmentId) params.append("departmentId", query.departmentId);

    const res = await fetch(`${API_URL}/analytics/executive-summary?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch executive analytics");
    }
    return data.data;
};

export const fetchNineBoxGrid = async (query?: {
    departmentId?: string;
}): Promise<NineBoxGridResponse> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const params = new URLSearchParams();
    if (query?.departmentId) params.append("departmentId", query.departmentId);

    const res = await fetch(`${API_URL}/analytics/nine-box-grid?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch 9-box grid");
    }
    return data.data;
};
