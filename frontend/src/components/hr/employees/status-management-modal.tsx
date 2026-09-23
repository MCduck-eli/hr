import { useState } from "react";
import {
    createStatus,
    updateStatus,
    deleteStatus,
} from "@/src/services/employee-status-service";

interface StatusManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    statuses: any[];
    onRefresh: () => void;
}

const PRESET_COLORS = [
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#6b7280",
    "#06b6d4",
];

export default function StatusManagementModal({
    isOpen,
    onClose,
    statuses,
    onRefresh,
}: StatusManagementModalProps) {
    const [editingStatus, setEditingStatus] = useState<any>(null);
    const [name, setName] = useState("");
    const [color, setColor] = useState("#3b82f6");
    const [durationDays, setDurationDays] = useState<string>("");
    const [nextStatusId, setNextStatusId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleStartEdit = (st: any) => {
        setEditingStatus(st);
        setName(st.name || "");
        setColor(st.color || "#3b82f6");
        setDurationDays(st.durationDays !== null && st.durationDays !== undefined ? String(st.durationDays) : "");
        setNextStatusId(st.nextStatusId || "");
        setError("");
    };

    const handleResetForm = () => {
        setEditingStatus(null);
        setName("");
        setColor("#3b82f6");
        setDurationDays("");
        setNextStatusId("");
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError("");

        try {
            const payload = {
                name: name.trim(),
                color,
                durationDays: durationDays !== "" ? Number(durationDays) : null,
                nextStatusId: nextStatusId || null,
            };

            if (editingStatus) {
                await updateStatus(editingStatus.id, payload);
            } else {
                await createStatus(payload);
            }

            handleResetForm();
            onRefresh();
        } catch (err: any) {
            setError(err.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Haqiqatan ham bu statusni o'chirmoqchimisiz?")) return;

        setLoading(true);
        setError("");

        try {
            await deleteStatus(id);
            if (editingStatus?.id === id) {
                handleResetForm();
            }
            onRefresh();
        } catch (err: any) {
            setError(err.message || "O'chirishda xatolik");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            Xodim Statuslari Sozlamasi
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Statuslar muddati va avtomatik o'tish zanjirini boshqarish
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center justify-center font-bold text-sm"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="bg-slate-50 p-5 border border-slate-100 rounded-2xl flex flex-col gap-4"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                                {editingStatus ? "Statusni Tahrirlash" : "+ Yangi Status Qo'shish"}
                            </span>
                            {editingStatus && (
                                <button
                                    type="button"
                                    onClick={handleResetForm}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                                >
                                    Bekor qilish
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Status Nomi
                                </label>
                                <input
                                    type="text"
                                    placeholder="Masalan: Sinov muddati"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="p-2.5 border border-slate-200 text-xs bg-white rounded-xl outline-none focus:border-[#9327FF] font-semibold"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Muddati (Kunlarda, bo'sh bo'lsa doimiy)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Masalan: 30 yoki 90"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(e.target.value)}
                                    className="p-2.5 border border-slate-200 text-xs bg-white rounded-xl outline-none focus:border-[#9327FF] font-semibold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Keyingi avtomatik status (Muddat tugagach)
                                </label>
                                <select
                                    value={nextStatusId}
                                    onChange={(e) => setNextStatusId(e.target.value)}
                                    className="p-2.5 border border-slate-200 text-xs bg-white rounded-xl outline-none focus:border-[#9327FF] font-semibold"
                                >
                                    <option value="">-- Keyingi status yo'q (Muddatsiz) --</option>
                                    {statuses
                                        .filter((s) => !editingStatus || s.id !== editingStatus.id)
                                        .map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Belgi Rangi
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            style={{ backgroundColor: c }}
                                            className={`w-6 h-6 rounded-full transition-transform ${
                                                color === c
                                                    ? "scale-125 ring-2 ring-[#9327FF] ring-offset-1"
                                                    : "opacity-80 hover:opacity-100"
                                            }`}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="py-2.5 px-5 bg-[#9327FF] hover:bg-[#7e22ce] text-white text-xs font-medium rounded-xl transition-all shadow-sm w-fit self-end disabled:opacity-50"
                        >
                            {loading ? "Saqlanmoqda..." : editingStatus ? "Yangilash" : "Qo'shish"}
                        </button>
                    </form>

                    <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Mavjud Statuslar Ro'yxati
                        </span>
                        <div className="flex flex-col gap-2">
                            {statuses.map((st) => (
                                <div
                                    key={st.id}
                                    className="flex items-center justify-between p-3.5 border border-slate-100 bg-white hover:border-purple-200 transition-colors rounded-xl shadow-xs"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            style={{
                                                backgroundColor: `${st.color}15`,
                                                color: st.color,
                                                borderColor: `${st.color}35`,
                                            }}
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5"
                                        >
                                            <span
                                                style={{ backgroundColor: st.color }}
                                                className="w-2 h-2 rounded-full"
                                            />
                                            {st.name}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-700">
                                                {st.durationDays
                                                    ? `Muddat: ${st.durationDays} kun`
                                                    : "Muddatsiz (Doimiy)"}
                                            </span>
                                            {st.nextStatus && (
                                                <span className="text-[10px] text-slate-400">
                                                    &rarr; O'tadi: {st.nextStatus.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(st)}
                                            className="px-2.5 py-1 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors rounded-lg"
                                        >
                                            Tahrirlash
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(st.id)}
                                            className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors rounded-lg"
                                        >
                                            O'chirish
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
