import DashboardSidebar from "@/src/components/dashboard/DashboardSidebar";

export default async function SuperAdminLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    return (
        <div className="flex min-h-[calc(100vh-64px)] w-full bg-[#F8FAFC] p-4 md:p-6 gap-6">
            <DashboardSidebar locale={locale} />
            <div className="flex-1 min-w-0 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
