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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-sm shadow-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-base font-bold uppercase tracking-wider text-black">
                            Xodim Statuslari Sozlamasi
                        </h2>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-0.5">
                            Statuslar muddati va avtomatik o'tish zanjirini boshqarish
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black text-lg font-black transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold uppercase rounded-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="bg-[#fafafa] p-4 border border-gray-200 rounded-sm flex flex-col gap-4"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-black">
                                {editingStatus ? "Statusni Tahrirlash" : "+ Yangi Status Qo'shish"}
                            </span>
                            {editingStatus && (
                                <button
                                    type="button"
                                    onClick={handleResetForm}
                                    className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black"
                                >
                                    Bekor qilish
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    Status Nomi
                                </label>
                                <input
                                    type="text"
                                    placeholder="Masalan: Sinov muddati"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="p-2.5 border border-gray-200 text-xs bg-white outline-none focus:border-black font-semibold"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    Muddati (Kunlarda, bo'sh bo'lsa doimiy)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Masalan: 30 yoki 90"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(e.target.value)}
                                    className="p-2.5 border border-gray-200 text-xs bg-white outline-none focus:border-black font-semibold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    Keyingi avtomatik status (Muddat tugagach)
                                </label>
                                <select
                                    value={nextStatusId}
                                    onChange={(e) => setNextStatusId(e.target.value)}
                                    className="p-2.5 border border-gray-200 text-xs bg-white outline-none focus:border-black font-semibold"
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

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
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
                                                    ? "scale-125 ring-2 ring-black ring-offset-1"
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
                            className="py-2.5 px-4 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors w-fit self-end disabled:opacity-50"
                        >
                            {loading ? "Saqlanmoqda..." : editingStatus ? "Yangilash" : "Qo'shish"}
                        </button>
                    </form>

                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            Mavjud Statuslar Ro'yxati
                        </span>
                        <div className="flex flex-col gap-2">
                            {statuses.map((st) => (
                                <div
                                    key={st.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 bg-white hover:border-black transition-colors rounded-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            style={{
                                                backgroundColor: `${st.color}20`,
                                                color: st.color,
                                                borderColor: `${st.color}40`,
                                            }}
                                            className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-1.5"
                                        >
                                            <span
                                                style={{ backgroundColor: st.color }}
                                                className="w-2 h-2 rounded-full"
                                            />
                                            {st.name}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-gray-700">
                                                {st.durationDays
                                                    ? `Muddat: ${st.durationDays} kun`
                                                    : "Muddatsiz (Doimiy)"}
                                            </span>
                                            {st.nextStatus && (
                                                <span className="text-[10px] font-semibold text-gray-500">
                                                    &rarr; O'tadi: {st.nextStatus.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(st)}
                                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-gray-100 hover:bg-black hover:text-white transition-colors rounded-sm"
                                        >
                                            Tahrirlash
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(st.id)}
                                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-colors rounded-sm"
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
