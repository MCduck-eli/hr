"use client";

import { useTranslations } from "next-intl";
import { PolicyItem } from "@/src/services/policy-service";

interface RegulationSignaturesModalProps {
    policy: PolicyItem | null;
    onClose: () => void;
}

export default function RegulationSignaturesModal({
    policy,
    onClose,
}: RegulationSignaturesModalProps) {
    const t = useTranslations("HRRegulations");

    if (!policy) return null;

    const signatures = policy.stats?.signatures || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-sm shadow-2xl overflow-hidden border border-gray-200">
                <div className="p-6 bg-[#fcfcfc] border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-black uppercase tracking-wider text-black">
                            {t("signaturesModalTitle")}
                        </h2>
                        <p className="text-xs text-gray-500 font-bold mt-1">
                            {policy.title} (v{policy.version}) &bull; {policy.stats?.signedCount || 0} /{" "}
                            {policy.stats?.totalEmployees || 0} ({policy.stats?.signedPercentage || 0}%)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black text-xl font-bold p-1 leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {signatures.length === 0 ? (
                        <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-gray-400 border border-dashed border-gray-200">
                            {t("noSignatures")}
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-sm overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                        <th className="p-3">Xodim</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Bo'lim</th>
                                        <th className="p-3">Versiya</th>
                                        <th className="p-3">Sana</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                                    {signatures.map((sig) => (
                                        <tr key={sig.id} className="hover:bg-gray-50/50">
                                            <td className="p-3 font-bold text-black">
                                                {sig.employeeName}
                                            </td>
                                            <td className="p-3 text-gray-500">{sig.email}</td>
                                            <td className="p-3 text-gray-600">
                                                {sig.department || "-"}
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 text-[10px] font-black rounded-sm ${
                                                        sig.isCurrentVersion
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-amber-100 text-amber-800"
                                                    }`}
                                                >
                                                    v{sig.signedVersion}{" "}
                                                    {sig.isCurrentVersion ? "(Joriy)" : "(Eski)"}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-500">
                                                {new Date(sig.signedAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-[#fcfcfc] border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors"
                    >
                        {t("cancel")}
                    </button>
                </div>
            </div>
        </div>
    );
}
