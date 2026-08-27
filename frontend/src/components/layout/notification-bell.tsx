"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
    AppNotification,
    fetchMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "@/src/services/notification-service";

export default function NotificationBell() {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const locale = (params?.locale as string) || "uz";

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadNotifications = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const data = await fetchMyNotifications();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {}
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleItemClick = async (notif: AppNotification) => {
        if (!notif.isRead) {
            try {
                await markNotificationAsRead(notif.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (err) {}
        }
        setIsOpen(false);
        if (notif.metadata?.link) {
            router.push(`/${locale}${notif.metadata.link.startsWith("/") ? "" : "/"}${notif.metadata.link}`);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {}
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-black rounded-full hover:bg-gray-200/50 transition-colors focus:outline-none flex items-center justify-center"
                aria-label="Notifications"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-red-600 rounded-full ring-2 ring-white animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 shadow-2xl rounded-sm z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3.5 bg-[#fcfcfc] border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-black">
                                Bildirishnomalar
                            </span>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[9px] font-black bg-red-100 text-red-700 rounded-full">
                                    {unreadCount} yangi
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] font-bold text-gray-500 hover:text-black uppercase tracking-wider transition-colors"
                            >
                                Hammasini o'qish
                            </button>
                        )}
                    </div>

                    <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Bildirishnomalar mavjud emas
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleItemClick(notif)}
                                    className={`p-3.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3 ${
                                        !notif.isRead ? "bg-blue-50/40" : "bg-white"
                                    }`}
                                >
                                    <div className="mt-1 shrink-0">
                                        {!notif.isRead ? (
                                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col gap-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={`text-xs ${
                                                    !notif.isRead
                                                        ? "font-black text-black"
                                                        : "font-bold text-gray-700"
                                                }`}
                                            >
                                                {notif.title}
                                            </span>
                                            <span className="text-[9px] font-medium text-gray-400 shrink-0">
                                                {new Date(notif.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">
                                            {notif.message}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
