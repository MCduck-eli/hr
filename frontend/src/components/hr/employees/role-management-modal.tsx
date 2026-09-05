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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-sm shadow-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-base font-bold uppercase tracking-wider text-black flex items-center gap-2">
                            <span>🛡️</span>
                            <span>Kompaniya Rollarini Boshqarish</span>
                        </h2>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-0.5">
                            Ixtiyoriy yangi rollar qo'shish, mavjudlarini tahrirlash va o'chirish
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
                                {editingRole ? "Rolni Tahrirlash" : "+ Yangi Rol Yaratish"}
                            </span>
                            {editingRole && (
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
                                    Rol Nomi *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Masalan: Yetakchi Muhandis, Bosh Hisobchi"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="p-2.5 border border-gray-200 text-xs bg-white outline-none focus:border-black font-semibold"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    Asosiy Tizim Huquqi (Baza roli)
                                </label>
                                <select
                                    value={baseRole}
                                    onChange={(e) => setBaseRole(e.target.value)}
                                    className="p-2.5 border border-gray-200 text-xs bg-white outline-none focus:border-black font-semibold"
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
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    Tavsif (Ixtiyoriy)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Rol vazifasi yoki izoh"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="p-2.5 border border-gray-200 text-xs bg-white outline-none focus:border-black font-semibold"
                                />
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
                            {loading ? "Saqlanmoqda..." : editingRole ? "Yangilash" : "Rolni Saqlash"}
                        </button>
                    </form>

                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            Mavjud Rollar Ro'yxati ({roles.length})
                        </span>
                        <div className="flex flex-col gap-2">
                            {roles.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 bg-white hover:border-black transition-colors rounded-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            style={{
                                                backgroundColor: `${r.color || "#6366f1"}15`,
                                                color: r.color || "#6366f1",
                                                borderColor: `${r.color || "#6366f1"}35`,
                                            }}
                                            className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-1.5 whitespace-nowrap"
                                        >
                                            <span
                                                style={{ backgroundColor: r.color || "#6366f1" }}
                                                className="w-2 h-2 rounded-full"
                                            />
                                            {r.name}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-gray-700">
                                                {r.isSystem ? "Tizim Standart Roli" : `Asosiy huquq: ${r.baseRole}`}
                                            </span>
                                            {r.description && (
                                                <span className="text-[10px] font-semibold text-gray-500">
                                                    {r.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {r.isSystem ? (
                                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 rounded-sm">
                                                Standart
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(r)}
                                                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-gray-100 hover:bg-black hover:text-white transition-colors rounded-sm"
                                                >
                                                    Tahrirlash
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(r.id)}
                                                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-colors rounded-sm"
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
