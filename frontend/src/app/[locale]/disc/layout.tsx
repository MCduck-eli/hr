import DirectorSidebar from "@/src/components/director/DirectorSidebar";

export default async function DiscLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    return (
        <div className="flex min-h-[calc(100vh-64px)] w-full bg-[#F8FAFC] p-4 md:p-6 gap-6 relative">
            <DirectorSidebar locale={locale} />
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
                {children}
            </main>
        </div>
    );
}
