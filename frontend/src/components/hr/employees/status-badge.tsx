interface StatusBadgeProps {
    status?: string;
    statusConfig?: {
        name: string;
        code: string;
        color: string;
        durationDays?: number | null;
        nextStatus?: {
            name: string;
        } | null;
    } | null;
    statusExpiresAt?: string | Date | null;
}

export default function StatusBadge({
    status,
    statusConfig,
    statusExpiresAt,
}: StatusBadgeProps) {
    const name = statusConfig?.name || status || "Yangi";
    const color = statusConfig?.color || (status === "ACTIVE" ? "#10b981" : (status === "INACTIVE" ? "#6b7280" : "#f59e0b"));

    let remainingDays: number | null = null;
    if (statusExpiresAt) {
        const diffTime = new Date(statusExpiresAt).getTime() - new Date().getTime();
        remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return (
        <div className="inline-flex flex-col gap-0.5">
            <span
                style={{
                    backgroundColor: `${color}18`,
                    color: color,
                    borderColor: `${color}40`,
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border uppercase"
            >
                <span
                    style={{ backgroundColor: color }}
                    className="w-1.5 h-1.5 rounded-full"
                />
                {name}
            </span>
            {remainingDays !== null && statusConfig?.nextStatus && (
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">
                    {remainingDays > 0 ? `${remainingDays} kun qoldi` : "Muddat tugadi"} &rarr; {statusConfig.nextStatus.name}
                </span>
            )}
        </div>
    );
}
