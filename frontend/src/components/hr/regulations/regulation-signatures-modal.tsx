"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PolicyItem, PolicySignatureItem } from "@/src/services/policy-service";

interface RegulationSignaturesModalProps {
    policy: PolicyItem | null;
    onClose: () => void;
}

function SignerAvatar({ sig }: { sig: PolicySignatureItem }) {
    const [imageError, setImageError] = useState(false);
    const rawAvatar = sig.avatar || "";

    let avatarSrc: string | null = null;
    if (rawAvatar && !imageError) {
        if (
            rawAvatar.startsWith("http://") ||
            rawAvatar.startsWith("https://") ||
            rawAvatar.startsWith("data:")
        ) {
            avatarSrc = rawAvatar;
        } else {
            const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
            const baseOrigin = rawApi.replace(/\/api(\/v\d+)?\/?$/, "").replace(/\/+$/, "");
            const cleanPath = rawAvatar.startsWith("/") ? rawAvatar : `/${rawAvatar}`;
            avatarSrc = `${baseOrigin}${cleanPath}`;
        }
    }

    const name = sig.employeeName || `${sig.firstName || ""} ${sig.lastName || ""}`.trim() || "Xodim";
    const parts = name.trim().split(/\s+/);
    const initials = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase() || "X";

    return (
        <div className="w-8 h-8 rounded-full bg-violet-100 text-[#9327FF] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-violet-200">
            {avatarSrc ? (
                <img
                    src={avatarSrc}
                    alt={name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}

export default function RegulationSignaturesModal({
    policy,
    onClose,
}: RegulationSignaturesModalProps) {
    const t = useTranslations("HRRegulations");

    if (!policy) return null;

    const signatures = policy.stats?.signatures || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {t("signaturesModalTitle")}
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            {policy.title} (v{policy.version}) &bull; {policy.stats?.signedCount || 0} /{" "}
                            {policy.stats?.totalEmployees || 0} ({policy.stats?.signedPercentage || 0}%)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1 leading-none rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {signatures.length === 0 ? (
                        <div className="p-12 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 border border-dashed border-gray-200 rounded-xl">
                            {t("noSignatures")}
                        </div>
                    ) : (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        <th className="p-3.5">Xodim</th>
                                        <th className="p-3.5">Email</th>
                                        <th className="p-3.5">Bo'lim</th>
                                        <th className="p-3.5">Versiya</th>
                                        <th className="p-3.5">Sana</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                                    {signatures.map((sig) => (
                                        <tr key={sig.id} className="hover:bg-gray-50/50">
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <SignerAvatar sig={sig} />
                                                    <span className="font-bold text-gray-900">
                                                        {sig.employeeName || `${sig.firstName || ""} ${sig.lastName || ""}`.trim()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3.5 text-gray-500">{sig.email}</td>
                                            <td className="p-3.5 text-gray-600">
                                                {sig.department || "-"}
                                            </td>
                                            <td className="p-3.5">
                                                <span
                                                    className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-lg ${
                                                        sig.isCurrentVersion
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                            : "bg-amber-50 text-amber-700 border border-amber-100"
                                                    }`}
                                                >
                                                    v{sig.signedVersion}{" "}
                                                    {sig.isCurrentVersion ? "(Joriy)" : "(Eski)"}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-gray-500">
                                                {new Date(sig.signedAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                        {t("cancel")}
                    </button>
                </div>
            </div>
        </div>
    );
}
