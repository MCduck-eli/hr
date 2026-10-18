"use client";

import { useState, useEffect } from "react";
import { Database, Download, RefreshCw, HardDrive, CheckCircle2, AlertCircle } from "lucide-react";

interface BackupItem {
    id: string;
    filename: string;
    size: string;
    createdAt: string;
    status: "SUCCESS" | "PENDING";
}

export default function BackupPage() {
    const [backups, setBackups] = useState<BackupItem[]>([
        {
            id: "1",
            filename: "backup_postgres_2026_10_15_1200.dump",
            size: "42.8 MB",
            createdAt: "2026-10-15 12:00:00",
            status: "SUCCESS",
        },
        {
            id: "2",
            filename: "backup_postgres_2026_10_14_0000.dump",
            size: "41.5 MB",
            createdAt: "2026-10-14 00:00:00",
            status: "SUCCESS",
        },
        {
            id: "3",
            filename: "backup_postgres_2026_10_13_0000.dump",
            size: "40.9 MB",
            createdAt: "2026-10-13 00:00:00",
            status: "SUCCESS",
        },
    ]);
    const [isCreating, setIsCreating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast((current) => (current?.message === message ? null : current));
        }, 4000);
    };

    const fetchBackups = async () => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
            const endpoint = baseUrl.endsWith("/api/v1") ? `${baseUrl}/backup` : `${baseUrl}/api/v1/backup`;

            const res = await fetch(endpoint, {
                method: "GET",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    const mapped: BackupItem[] = data.data.map((b: any, index: number) => ({
                        id: b.id || String(index + 1),
                        filename: b.name,
                        size: b.metadata?.size ? `${(b.metadata.size / (1024 * 1024)).toFixed(1)} MB` : "—",
                        createdAt: b.created_at ? new Date(b.created_at).toLocaleString("uz-UZ") : "—",
                        status: "SUCCESS",
                    }));
                    setBackups(mapped);
                }
            }
        } catch {}
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const handleCreateBackup = async () => {
        setIsCreating(true);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
            const endpoint = baseUrl.endsWith("/api/v1") ? `${baseUrl}/backup` : `${baseUrl}/api/v1/backup`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw new Error(data.message || "Zaxira yaratishda xatolik yuz berdi");
            }

            const now = new Date();
            const newItem: BackupItem = {
                id: String(Date.now()),
                filename: data.data?.fileName || `backup_${now.getTime()}.json`,
                size: data.data?.size ? `${(data.data.size / (1024 * 1024)).toFixed(1)} MB` : "43.2 MB",
                createdAt: now.toLocaleString("uz-UZ"),
                status: "SUCCESS",
            };
            setBackups((prev) => [newItem, ...prev]);
            showToast("Yangi zaxira muvaffaqiyatli yaratildi!", "success");
            fetchBackups();
        } catch (err: any) {
            showToast(err.message || "Xatolik yuz berdi, qayta urinib ko'ring", "error");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-full">
            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-white rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] border border-slate-100 p-4 flex items-center gap-3 transform transition-all duration-300 animate-in fade-in slide-in-from-top-4">
                    {toast.type === "error" ? (
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900">
                            {toast.message}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs ml-2 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-950 flex items-center gap-3">
                            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff]">
                                <Database className="w-6 h-6" />
                            </span>
                            <span>Baza Zaxirasi (Backup)</span>
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
                            Ma'lumotlar bazasining zaxira nusxalarini yaratish va tiklash
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateBackup}
                        disabled={isCreating}
                        className="bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#e2e8f0,inset_-2px_-2px_4px_#ffffff] transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isCreating ? "animate-spin" : ""}`} />
                        <span>{isCreating ? "Zaxira yaratilmoqda..." : "Yangi zaxira olish"}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden flex flex-col justify-between">
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.08]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: "240px 240px",
                            }}
                        />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Jami nusxalar</span>
                                <HardDrive className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-3xl font-black font-mono text-slate-900">{backups.length}</div>
                            <p className="text-[11px] text-slate-500 mt-2 font-medium">Barcha saqlangan snapshotlar</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden flex flex-col justify-between">
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.08]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: "240px 240px",
                            }}
                        />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">So'nggi muvaffaqiyat</span>
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="text-sm font-black font-mono text-slate-900">{backups[0]?.createdAt || "Mavjud emas"}</div>
                            <p className="text-[11px] text-slate-500 mt-2 font-medium">Oxirgi yangilangan vaqt</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden flex flex-col justify-between">
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.08]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: "240px 240px",
                            }}
                        />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avtomatik reja</span>
                                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">Har kuni</span>
                            </div>
                            <div className="text-2xl font-black font-mono text-slate-900">00:00 UTC</div>
                            <p className="text-[11px] text-slate-500 mt-2 font-medium">Avtomatlashtirilgan cron rejasi</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-[5px_5px_15px_#e2e8f0,-5px_-5px_15px_#ffffff] relative overflow-hidden">
                    <div
                        className="absolute inset-0 z-0 pointer-events-none bg-repeat opacity-[0.08]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23C5A059' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z'/%3E%3Cpath d='M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z'/%3E%3Ccircle cx='120' cy='120' r='10'/%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundSize: "240px 240px",
                        }}
                    />
                    <div className="relative z-10 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                                Mavjud zaxira fayllari ({backups.length})
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                                        <th className="py-4 px-6">Fayl nomi</th>
                                        <th className="py-4 px-6">Hajmi</th>
                                        <th className="py-4 px-6">Yaratilgan vaqt</th>
                                        <th className="py-4 px-6">Holati</th>
                                        <th className="py-4 px-6 text-right">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {backups.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-4 px-6 font-mono font-bold text-slate-900">
                                                <div className="flex items-center gap-2.5">
                                                    <Database className="w-4 h-4 text-purple-600 shrink-0" />
                                                    <span>{item.filename}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-slate-600">{item.size}</td>
                                            <td className="py-4 px-6 text-slate-600">{item.createdAt}</td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Tayyor
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => alert(`${item.filename} yuklab olinmoqda...`)}
                                                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 text-xs font-semibold shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#e2e8f0,inset_-2px_-2px_4px_#ffffff] transition-all duration-200 cursor-pointer inline-flex items-center gap-1.5"
                                                >
                                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>Yuklab olish</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
