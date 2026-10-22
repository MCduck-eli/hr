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
            <div className="relative bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                <svg
                    className="absolute inset-0 w-full h-full z-0 opacity-[0.10] pointer-events-none text-slate-300 stroke-current"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="girih-pattern-regulation-signatures" width="240" height="240" patternUnits="userSpaceOnUse">
                            <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M120 60L138 78H162V102L180 120L162 138V162H138L120 180L102 162H78V138L60 120L78 102V78H102Z" />
                                <path d="M120 96L127 103H137V113L144 120L137 127V137H127L120 144L113 137H103V127L96 120L103 113V103H113Z" />
                                <circle cx="120" cy="120" r="10" />
                                <path d="M0 60L18 42H42V18L60 0M180 0L198 18V42H222L240 60M240 180L222 198H198V222L180 240M60 240L42 222V198H18L0 180" />
                                <path d="M0 24L7 17H17V7L24 0M216 0L223 7V17H233L240 24M240 216L233 223H223V233L216 240M24 240L17 233V223H7L0 216" />
                                <path d="M0 10A10 10 0 0 1 10 0M230 0A10 10 0 0 1 240 10M240 230A10 10 0 0 1 230 240M10 240A10 10 0 0 1 0 230" />
                                <path d="M120 0V60M120 180V240M0 120H60M180 120H240" />
                                <path d="M0 0L42 42M198 198L240 240M240 0L198 42M42 198L0 240" />
                                <path d="M42 42L78 78M162 162L198 198M198 42L162 78M78 162L42 198" />
                                <path d="M60 0L120 60L180 0M240 60L180 120L240 180M180 240L120 180L60 240M0 180L60 120L0 60" />
                                <path d="M90 0L120 30L150 0M240 90L210 120L240 150M150 240L120 210L90 240M0 150L30 120L0 90" />
                            </g>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#girih-pattern-regulation-signatures)" />
                </svg>

                <div className="relative z-10 flex flex-col flex-1 min-h-0">
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

                <div className="flex-1 overflow-y-auto p-6 min-h-0">
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
        </div>
    );
}
