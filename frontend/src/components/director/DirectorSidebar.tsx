"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
    BarChart3,
    Network,
    Users,
    Building2,
    Bell,
    Target,
    TrendingUp,
    Compass,
    RefreshCw,
    Wallet,
} from "lucide-react";
import {
    AppNotification,
    fetchMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "@/src/services/notification-service";
import GirihPattern from "@/src/components/ui/GirihPattern";

interface DirectorSidebarProps {
    locale: string;
}

export default function DirectorSidebar({ locale }: DirectorSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const currentTab = searchParams.get("tab") || "analytics";

    const [companyName, setCompanyName] = useState<string>("");
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const loadNotifications = async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        try {
            const data = await fetchMyNotifications();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch {}
    };

    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                setCompanyName(user.companyName || user.employee?.companyName || "");
            }
        } catch {}

        loadNotifications();
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif: AppNotification) => {
        if (!notif.isRead) {
            try {
                await markNotificationAsRead(notif.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch {}
        }
        setIsNotifOpen(false);
        if (notif.metadata?.link) {
            router.push(`/${locale}${notif.metadata.link.startsWith("/") ? "" : "/"}${notif.metadata.link}`);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {}
    };

    const isDashboardActive = pathname === `/${locale}/director/dashboard` || pathname === `/${locale}/director`;

    const navTabs = [
        {
            id: "analytics",
            label: "BI & 9-Box Analitika",
            icon: BarChart3,
            href: `/${locale}/director/dashboard?tab=analytics`,
        },
        {
            id: "orgchart",
            label: "Tashkiliy Tuzilma",
            icon: Network,
            href: `/${locale}/director/dashboard?tab=orgchart`,
        },
        {
            id: "employees",
            label: "Xodimlar",
            icon: Users,
            href: `/${locale}/director/dashboard?tab=employees`,
        },
        {
            id: "departments",
            label: "Bo'limlar",
            icon: Building2,
            href: `/${locale}/director/dashboard?tab=departments`,
        },
    ];

    const platformLinks = [
        {
            href: `/${locale}/hr/okr`,
            label: "OKR Maqsadlar",
            icon: Target,
        },
        {
            href: `/${locale}/grading`,
            label: "Greyding Tizimi",
            icon: TrendingUp,
        },
        {
            href: `/${locale}/disc`,
            label: "DISC Modeli",
            icon: Compass,
        },
        {
            href: `/${locale}/hr/feedback360`,
            label: "360° Baholash",
            icon: RefreshCw,
        },
        {
            href: `/${locale}/profile?tab=payroll`,
            label: "Oylik & Moliya",
            icon: Wallet,
        },
    ];

    return (
        <aside className="w-64 lg:w-72 shrink-0 bg-white rounded-3xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] m-4 relative flex flex-col justify-between p-4 md:p-6 sticky top-20 h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] overflow-hidden">
            <GirihPattern className="opacity-[0.11]" />

            <div className="relative z-10 flex flex-col justify-between h-full overflow-y-auto pr-1">
                <div className="flex flex-col gap-5">
                    <div className="px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white text-purple-600 flex items-center justify-center font-black text-sm shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] shrink-0">
                                {companyName ? companyName[0].toUpperCase() : "👑"}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 truncate">
                                    {companyName || "Direktor Paneli"}
                                </h3>
                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                                    Boshqaruv Kabineti
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Asosiy Menyular
                        </span>

                        <div className="flex flex-col gap-2.5">
                            {navTabs.map((item) => {
                                const active = isDashboardActive && currentTab === item.id;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                            active
                                                ? "bg-white text-purple-600 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]"
                                                : "bg-white text-slate-700 hover:text-purple-600 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-purple-600" : "text-slate-500"}`} />
                                            <span>{item.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}

                            <div className="relative" ref={notifRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                        isNotifOpen
                                            ? "bg-white text-purple-600 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]"
                                            : "bg-white text-slate-700 hover:text-purple-600 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Bell className={`w-4 h-4 shrink-0 ${isNotifOpen ? "text-purple-600" : "text-slate-500"}`} />
                                        <span>Bildirishnomalar</span>
                                    </div>
                                    {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {isNotifOpen && (
                                    <div className="absolute left-full ml-4 top-0 w-80 sm:w-96 bg-white rounded-3xl shadow-[10px_10px_30px_#cbd5e1,-10px_-10px_30px_#ffffff] z-50 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150 relative">
                                        <GirihPattern className="opacity-[0.11]" />
                                        <div className="relative z-10">
                                            <div className="p-4 bg-slate-50/70 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                                        Bildirishnomalar
                                                    </span>
                                                    {unreadCount > 0 && (
                                                        <span className="px-2 py-0.5 text-[9px] font-black bg-red-100 text-red-700 rounded-full">
                                                            {unreadCount} yangi
                                                        </span>
                                                    )}
                                                </div>
                                                {unreadCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={handleMarkAllAsRead}
                                                        className="text-[10px] font-bold text-purple-600 hover:text-purple-800 uppercase tracking-wider transition-colors cursor-pointer"
                                                    >
                                                        Hammasini o'qish
                                                    </button>
                                                )}
                                            </div>

                                            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                        Bildirishnomalar mavjud emas
                                                    </div>
                                                ) : (
                                                    notifications.map((notif) => (
                                                        <div
                                                            key={notif.id}
                                                            onClick={() => handleNotificationClick(notif)}
                                                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                                                                !notif.isRead ? "bg-purple-50/40" : "bg-white"
                                                            }`}
                                                        >
                                                            <div className="mt-1 shrink-0">
                                                                {!notif.isRead ? (
                                                                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                                                                ) : (
                                                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 flex flex-col gap-0.5">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span
                                                                        className={`text-xs ${
                                                                            !notif.isRead
                                                                                ? "font-black text-slate-900"
                                                                                : "font-bold text-slate-700"
                                                                        }`}
                                                                    >
                                                                        {notif.title}
                                                                    </span>
                                                                    <span className="text-[9px] font-medium text-slate-400 shrink-0">
                                                                        {new Date(notif.createdAt).toLocaleTimeString([], {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                                                                    {notif.message}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Platforma Bo'limlari
                        </span>

                        <div className="flex flex-col gap-2.5">
                            {platformLinks.map((link) => {
                                const active = pathname?.startsWith(link.href);
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                            active
                                                ? "bg-white text-purple-600 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]"
                                                : "bg-white text-slate-700 hover:text-purple-600 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-purple-600" : "text-slate-500"}`} />
                                            <span>{link.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <div className="p-3.5 rounded-2xl bg-white shadow-[inset_2px_2px_5px_#f1f5f9,inset_-2px_-2px_5px_#ffffff] flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 truncate">Direktor Hub</p>
                            <p className="text-[10px] text-emerald-600 font-medium">Faol va himoyalangan</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
