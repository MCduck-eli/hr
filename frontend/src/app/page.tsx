import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function getRoleDashboardPath(locale: string, role?: string) {
    if (role === "SUPER_ADMIN") {
        return `/${locale}/dashboard`;
    } else if (role === "DIRECTOR") {
        return `/${locale}/director/dashboard`;
    } else if (role === "HR_ADMIN") {
        return `/${locale}/hr/dashboard`;
    } else if (role === "ACCOUNTANT") {
        return `/${locale}/profile?tab=payroll`;
    } else if (role === "MANAGER" || role === "DEPARTMENT_HEAD") {
        return `/${locale}/manager/okr`;
    } else if (role === "RECRUITER") {
        return `/${locale}/recruiter/vacancies`;
    }
    return `/${locale}/profile`;
}

export default async function RootPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const userRole = cookieStore.get("user_role")?.value;
    const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
    const locale = localeCookie && ["ru", "uz", "en"].includes(localeCookie) ? localeCookie : "uz";

    if (token && userRole) {
        redirect(getRoleDashboardPath(locale, userRole));
    }

    redirect(`/${locale}`);
}
