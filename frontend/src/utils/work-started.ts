export function hasWorkStarted(hireDate?: string | Date | null): boolean {
    if (!hireDate) return true;

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return new Date(hireDate).getTime() <= endOfToday.getTime();
}
