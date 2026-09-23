import { useState } from "react";
import {
    createCustomRole,
    updateCustomRole,
    deleteCustomRole,
} from "@/src/services/role-service";

interface RoleManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    roles: any[];
    onRefresh: () => void;
}

const PRESET_COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#64748b",
];

const BASE_ROLES = [
    { value: "EMPLOYEE", label: "Xodim (Oddiy huquqlar)" },
    { value: "ACCOUNTANT", label: "Bugalter / Hisobchi (Moliya, Oyliklar & Jarimalar)" },
    { value: "DEPARTMENT_HEAD", label: "Bo'lim boshlig'i (Bo'lim boshqaruvi)" },
    { value: "HR_ADMIN", label: "HR Admin (Kadrlar boshqaruvi)" },
    { value: "RECRUITER", label: "Rekruter (Nomzodlar & Vakansiyalar)" },
];

export default function RoleManagementModal({
    isOpen,
    onClose,
    roles,
    onRefresh,
}: RoleManagementModalProps) {
    const [editingRole, setEditingRole] = useState<any>(null);
    const [name, setName] = useState("");
    const [baseRole, setBaseRole] = useState("EMPLOYEE");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("#6366f1");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleStartEdit = (r: any) => {
        setEditingRole(r);
        setName(r.name || "");
        setBaseRole(r.baseRole || "EMPLOYEE");
        setDescription(r.description || "");
        setColor(r.color || "#6366f1");
        setError("");
    };

    const handleResetForm = () => {
        setEditingRole(null);
        setName("");
        setBaseRole("EMPLOYEE");
        setDescription("");
        setColor("#6366f1");
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
                baseRole,
                description: description.trim() || undefined,
                color,
            };

            if (editingRole) {
                await updateCustomRole(editingRole.id, payload);
            } else {
                await createCustomRole(payload);
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
        if (!confirm("Haqiqatan ham bu rolni o'chirmoqchimisiz? Ushbu rolga ega xodimlar oddiy xodim sifatida qoladi.")) return;

        setLoading(true);
        setError("");

        try {
            await deleteCustomRole(id);
            if (editingRole?.id === id) {
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
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span>🛡️</span>
                            <span>Kompaniya Rollarini Boshqarish</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Ixtiyoriy yangi rollar qo'shish, mavjudlarini tahrirlash va o'chirish
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
                                {editingRole ? "Rolni Tahrirlash" : "+ Yangi Rol Yaratish"}
                            </span>
                            {editingRole && (
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
                                    Rol Nomi *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Masalan: Yetakchi Muhandis, Bosh Hisobchi"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="p-2.5 border border-slate-200 text-xs bg-white rounded-xl outline-none focus:border-[#9327FF] font-semibold"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Asosiy Tizim Huquqi (Baza roli)
                                </label>
                                <select
                                    value={baseRole}
                                    onChange={(e) => setBaseRole(e.target.value)}
                                    className="p-2.5 border border-slate-200 text-xs bg-white rounded-xl outline-none focus:border-[#9327FF] font-semibold"
                                >
                                    {BASE_ROLES.map((br) => (
                                        <option key={br.value} value={br.value}>
                                            {br.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Tavsif (Ixtiyoriy)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Rol vazifasi yoki izoh"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="p-2.5 border border-slate-200 text-xs bg-white rounded-xl outline-none focus:border-[#9327FF] font-semibold"
                                />
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
                            {loading ? "Saqlanmoqda..." : editingRole ? "Yangilash" : "Rolni Saqlash"}
                        </button>
                    </form>

                    <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Mavjud Rollar Ro'yxati ({roles.length})
                        </span>
                        <div className="flex flex-col gap-2">
                            {roles.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center justify-between p-3.5 border border-slate-100 bg-white hover:border-purple-200 transition-colors rounded-xl shadow-xs"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            style={{
                                                backgroundColor: `${r.color || "#6366f1"}15`,
                                                color: r.color || "#6366f1",
                                                borderColor: `${r.color || "#6366f1"}35`,
                                            }}
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap"
                                        >
                                            <span
                                                style={{ backgroundColor: r.color || "#6366f1" }}
                                                className="w-2 h-2 rounded-full"
                                            />
                                            {r.name}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-700">
                                                {r.isSystem ? "Tizim Standart Roli" : `Asosiy huquq: ${r.baseRole}`}
                                            </span>
                                            {r.description && (
                                                <span className="text-[10px] text-slate-400">
                                                    {r.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {r.isSystem ? (
                                            <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg">
                                                Standart
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(r)}
                                                    className="px-2.5 py-1 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors rounded-lg"
                                                >
                                                    Tahrirlash
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(r.id)}
                                                    className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors rounded-lg"
                                                >
                                                    O'chirish
                                                </button>
                                            </>
                                        )}
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
