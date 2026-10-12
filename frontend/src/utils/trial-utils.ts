export interface TrialRemainingResult {
    text: string;
    isExpired: boolean;
    daysRemaining: number;
}

export function getTrialRemainingDays(endDate: string | Date | null | undefined): TrialRemainingResult {
    if (!endDate) {
        return { text: "Noma'lum", isExpired: true, daysRemaining: 0 };
    }

    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (days <= 0) {
        return {
            text: "Muddati tugagan",
            isExpired: true,
            daysRemaining: 0,
        };
    }

    return {
        text: `${days} kun qoldi`,
        isExpired: false,
        daysRemaining: days,
    };
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return "";
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "Hozirgina";
    if (diffMin < 60) return `${diffMin} daq oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays < 7) return `${diffDays} kun oldin`;
    return past.toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
}
