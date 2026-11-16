export function workStartedWhere(): {
    OR: Array<{ hireDate: null } | { hireDate: { lte: Date } }>;
} {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return {
        OR: [{ hireDate: null }, { hireDate: { lte: endOfToday } }],
    };
}
