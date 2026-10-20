import HRSidebar from "./components/HRSidebar";

export default function HRLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <HRSidebar />
            <main className="flex-1 flex flex-col overflow-y-auto relative">{children}</main>
        </div>
    );
}
