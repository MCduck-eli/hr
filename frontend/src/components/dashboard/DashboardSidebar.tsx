"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, LayoutDashboard, Clock } from "lucide-react";
import { getTrialRequests } from "@/src/services/trial-service";

interface DashboardSidebarProps {
    locale: string;
}

export default function DashboardSidebar({ locale }: DashboardSidebarProps) {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState<number>(0);

    const fetchUnreadCount = async () => {
        try {
            const data = await getTrialRequests();
            let readIds: string[] = [];
            try {
                const stored = localStorage.getItem("read_trial_ids");
                if (stored) {
                    readIds = JSON.parse(stored);
                }
            } catch {
                readIds = [];
            }
            const count = data.filter((t) => !readIds.includes(t.id)).length;
            setUnreadCount(count);
        } catch {
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        if (pathname?.includes("/super-admin/trials")) {
            getTrialRequests().then((data) => {
                const allIds = data.map((t) => t.id);
                try {
                    localStorage.setItem("read_trial_ids", JSON.stringify(allIds));
                } catch {}
                setUnreadCount(0);
            }).catch(() => {});
        } else {
            fetchUnreadCount();
        }
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [pathname]);

    useEffect(() => {
        const handleStorage = () => fetchUnreadCount();
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const navItems = [
        {
            href: `/${locale}/dashboard/backup`,
            label: "Baza zaxirasi",
            icon: Database,
            exact: false,
        },
        {
            href: `/${locale}/dashboard`,
            label: "Kompaniyalar",
            icon: LayoutDashboard,
            exact: true,
        },
        {
            href: `/${locale}/super-admin/trials`,
            label: "Sinov so'rovlari",
            icon: Clock,
            exact: false,
            badge: unreadCount,
        },
    ];

    const isActive = (href: string, exact: boolean) => {
        if (!pathname) return false;
        if (exact) {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <aside className="w-64 lg:w-72 shrink-0 bg-white rounded-3xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden flex flex-col justify-between p-4 md:p-6 sticky top-20 h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] border border-slate-100/60">
            <div
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none bg-repeat opacity-[0.05]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3Cpath d='M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180'/%3E%3Cpath d='M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216'/%3E%3Cpath d='M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230'/%3E%3Cpath d='M120 0V60M120 180V240M0 120H60M180 120H240'/%3E%3Cpath d='M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240'/%3E%3Cpath d='M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198'/%3E%3Cpath d='M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60'/%3E%3Cpath d='M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90'/%3E%3C/g%3E%3C/svg%3E\")`,
                    backgroundSize: "240px 240px",
                }}
            />

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex flex-col gap-6">
                    <div className="px-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff]">
                                ⚡
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                    Boshqaruv Paneli
                                </h3>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                    Super Admin
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-3">
                        {navItems.map((item) => {
                            const active = isActive(item.href, item.exact);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                        active
                                            ? "bg-white text-purple-600 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] border border-purple-100/60"
                                            : "bg-white text-slate-700 hover:text-purple-600 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] border border-transparent hover:border-slate-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-purple-600" : "text-slate-500"}`} />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {item.badge > 99 ? "99+" : item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-100/80 shadow-[inset_2px_2px_5px_#f1f5f9,inset_-2px_-2px_5px_#ffffff] flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 truncate">Tizim holati</p>
                            <p className="text-[10px] text-emerald-600 font-medium">Faol va himoyalangan</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
