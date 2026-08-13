import QuickActions from "@/src/components/dashboard/quick-actions";

export default function DashboardPage() {
    const mockUser = {
        firstName: "Eldorjon",
        role: "Frontend Developer",
        grade: "Middle (Grade 2)",
    };

    const stats = [
        {
            label: "Current OKR Progress",
            value: "75%",
            trend: "+5% this month",
        },
        { label: "Pending 360 Feedbacks", value: "2", trend: "Due in 3 days" },
        { label: "Leave Balance", value: "14 Days", trend: "Annual" },
    ];

    return (
        <div className="flex flex-col gap-12 py-12 px-4 md:px-8">
            <div className="flex flex-col gap-4">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-black">
                    Welcome back, <br className="md:hidden" />{" "}
                    {mockUser.firstName}
                </h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    {mockUser.role} • {mockUser.grade}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="border border-gray-200 bg-white p-6 flex flex-col gap-4 hover:border-black transition-colors"
                    >
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            {stat.label}
                        </span>
                        <span className="text-3xl font-black tracking-tighter">
                            {stat.value}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                            {stat.trend}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                        Recent Activities
                    </h2>
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map((_, i) => (
                            <div
                                key={i}
                                className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0"
                            >
                                <div className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold">
                                        Q3 OKR Cycle Started
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Please align your individual objectives
                                        with the department goals.
                                    </span>
                                </div>
                                <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    2 days ago
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                        Quick Actions
                    </h2>
                    <QuickActions />
                </div>
            </div>
        </div>
    );
}
