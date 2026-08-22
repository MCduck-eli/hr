import { useState } from "react";
import EmailActionModal from "./EmailActionModal";

interface RecruitingBoardProps {
    vacancies: any[];
    departments: any[];
    managers: any[];
    onStageChange: (candidateId: string, stage: string) => void;
    onHire: (candidateId: string, departmentId: string, managerId: string) => void;
    onEdit: (vacancy: any) => void;
    onDelete: (vacancyId: string) => void;
}

const STAGES = [
    { value: "APPLIED", label: "YANGI" },
    { value: "SCREENING", label: "SKRINING" },
    { value: "INTERVIEW", label: "SUHBAT" },
    { value: "TEST_TASK", label: "TEST VAZIFA" },
    { value: "OFFER", label: "TAKIF (OFFER)" },
    { value: "HIRED", label: "QABUL QILINDI (HIRE)" },
    { value: "REJECTED", label: "RAD ETILDI" },
];

export default function RecruitingBoard({
    vacancies,
    departments,
    managers,
    onStageChange,
    onHire,
    onEdit,
    onDelete,
}: RecruitingBoardProps) {
    const [selectedVacancy, setSelectedVacancy] = useState<any>(vacancies[0] || null);
    const [hireModalOpen, setHireModalOpen] = useState(false);
    const [hiringCandidate, setHiringCandidate] = useState<any>(null);
    const [hireForm, setHireForm] = useState({ departmentId: "", managerId: "" });
    const [viewCandidate, setViewCandidate] = useState<any>(null);
    const [emailModal, setEmailModal] = useState<{ open: boolean; candidate: any; type: "HIRE" | "REJECT" | null }>({
        open: false,
        candidate: null,
        type: null,
    });

    const handleStageSelect = (candidate: any, stage: string) => {
        if (stage === "HIRED") {
            setHiringCandidate(candidate);
            setHireModalOpen(true);
        } else if (stage === "REJECTED") {
            setEmailModal({ open: true, candidate, type: "REJECT" });
        } else {
            onStageChange(candidate.id, stage);
        }
    };

    const confirmHire = () => {
        if (hiringCandidate) {
            onHire(hiringCandidate.id, hireForm.departmentId, hireForm.managerId);
            setHireModalOpen(false);
            setHiringCandidate(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4 overflow-x-auto pb-4">
                {vacancies.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setSelectedVacancy(v)}
                        className={`px-6 py-3 whitespace-nowrap text-xs font-bold uppercase tracking-widest border transition-colors ${
                            selectedVacancy?.id === v.id
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                    >
                        {v.title} ({v._count?.candidates || 0})
                    </button>
                ))}
            </div>

            {selectedVacancy && (
                <div className="bg-white border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            Nomzodlar uchun havola
                        </div>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => onEdit(selectedVacancy)}
                                className="text-[10px] font-bold uppercase tracking-widest bg-white border border-gray-200 text-black px-4 py-2 hover:bg-gray-100 transition-colors"
                            >
                                Tahrirlash
                            </button>
                            <button
                                onClick={() => {
                                    if(confirm("Rostdan ham ushbu vakansiyani o'chirmoqchimisiz?")) {
                                        onDelete(selectedVacancy.id);
                                    }
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest bg-white border border-red-200 text-red-500 px-4 py-2 hover:bg-red-50 transition-colors"
                            >
                                O'chirish
                            </button>
                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/uz/jobs/${selectedVacancy.id}`;
                                    navigator.clipboard.writeText(url);
                                    alert("Havola nusxalandi: " + url);
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors ml-2"
                            >
                                Havolani Nusxalash
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-[11px] text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                    <th className="p-4">F.I.SH</th>
                                    <th className="p-4">Aloqa</th>
                                    <th className="p-4">Manba</th>
                                    <th className="p-4">Joriy Bosqich</th>
                                    <th className="p-4 text-right">Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedVacancy.candidates?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500 text-xs">
                                            Bu vakansiya uchun nomzodlar yo'q
                                        </td>
                                    </tr>
                                ) : (
                                    [...(selectedVacancy.candidates || [])]
                                        .sort((a: any, b: any) => {
                                            const scoreA = a.vacancyMatches?.find((m: any) => m.vacancyId === selectedVacancy.id)?.matchScore || 0;
                                            const scoreB = b.vacancyMatches?.find((m: any) => m.vacancyId === selectedVacancy.id)?.matchScore || 0;
                                            return scoreB - scoreA;
                                        })
                                        .map((c: any) => {
                                            const matchScore = c.vacancyMatches?.find((m: any) => m.vacancyId === selectedVacancy.id)?.matchScore || 0;
                                            return (
                                        <tr key={c.id} className="border-b border-gray-100 hover:bg-[#f8f8f8]">
                                            <td className="p-4">
                                                <div 
                                                    className="text-xs font-bold text-blue-600 cursor-pointer hover:underline"
                                                    onClick={() => setViewCandidate(c)}
                                                >
                                                    {c.fullName}
                                                </div>
                                                <div className="text-[10px] font-bold mt-1 uppercase tracking-widest text-green-600">
                                                    Moslik: {matchScore}%
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-gray-600">
                                                <div>{c.email}</div>
                                                <div className="font-bold">{c.phone}</div>
                                                {c.location && (
                                                    <div className="mt-1 text-[10px] text-gray-500 uppercase flex items-center gap-1">
                                                        <span title={c.location}>📍 {c.location.length > 20 ? c.location.substring(0, 20) + "..." : c.location}</span>
                                                    </div>
                                                )}
                                                {c.coverLetter && (
                                                    <div className="mt-1 text-[10px] text-gray-500 italic max-w-[200px] truncate" title={c.coverLetter}>
                                                        "{c.coverLetter}"
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs font-bold uppercase text-gray-500">{c.source}</td>
                                            <td className="p-4">
                                                <select
                                                    value={c.stage}
                                                    onChange={(e) => handleStageSelect(c, e.target.value)}
                                                    className="w-full p-2 border border-gray-200 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-black bg-white"
                                                >
                                                    {STAGES.map((s) => (
                                                        <option key={s.value} value={s.value}>
                                                            {s.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-4 text-right">
                                                <a
                                                    href={c.resumeUrl?.startsWith("/") ? new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api").origin + c.resumeUrl : c.resumeUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline"
                                                >
                                                    Rezyume
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {hireModalOpen && hiringCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white border border-gray-200 p-8 max-w-md w-full flex flex-col gap-6">
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-2">
                                Nomzodni Qabul Qilish
                            </h2>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                {hiringCandidate.fullName} ni ishga qabul qilish uchun ma'lumotlarni kiriting.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                    Bo'lim
                                </label>
                                <select
                                    value={hireForm.departmentId}
                                    onChange={(e) => setHireForm({ ...hireForm, departmentId: e.target.value })}
                                    className="w-full p-3 border border-gray-200 text-xs focus:outline-none focus:border-black"
                                >
                                    <option value="">-- Bo'limni tanlang --</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                    Rahbar
                                </label>
                                <select
                                    value={hireForm.managerId}
                                    onChange={(e) => setHireForm({ ...hireForm, managerId: e.target.value })}
                                    className="w-full p-3 border border-gray-200 text-xs focus:outline-none focus:border-black"
                                >
                                    <option value="">-- Rahbarni tanlang --</option>
                                    {managers.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            <button
                                onClick={() => {
                                    onHire(hiringCandidate.id, hireForm.departmentId, hireForm.managerId);
                                    setHireModalOpen(false);
                                    setHiringCandidate(null);
                                    setEmailModal({ open: true, candidate: hiringCandidate, type: "HIRE" });
                                }}
                                className="flex-1 bg-black text-white text-[12px] font-bold uppercase tracking-wider py-3 hover:bg-gray-800 transition-colors"
                            >
                                Qabul qilish
                            </button>
                            <button
                                onClick={() => setHireModalOpen(false)}
                                className="flex-1 bg-gray-100 text-black text-[12px] font-bold uppercase tracking-wider py-3 hover:bg-gray-200 transition-colors"
                            >
                                Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-1">
                                    {viewCandidate.fullName}
                                </h2>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <span>{viewCandidate.source}</span>
                                    <span>•</span>
                                    <span className="text-green-600">Moslik: {viewCandidate.vacancyMatches?.find((m: any) => m.vacancyId === selectedVacancy.id)?.matchScore || 0}%</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewCandidate(null)}
                                className="text-gray-400 hover:text-black transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</div>
                                    <div className="text-sm font-bold text-black">{viewCandidate.email}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Telefon</div>
                                    <div className="text-sm font-bold text-black">{viewCandidate.phone}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Yashash joyi</div>
                                    <div className="text-sm font-bold text-black">{viewCandidate.location || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rezyume</div>
                                    <a
                                        href={viewCandidate.resumeUrl?.startsWith("/") ? new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api").origin + viewCandidate.resumeUrl : viewCandidate.resumeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-bold text-blue-600 hover:underline"
                                    >
                                        Hujjatni ko'rish &rarr;
                                    </a>
                                </div>
                            </div>
                            
                            {viewCandidate.coverLetter && (
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Qo'shimcha ma'lumot</div>
                                    <div className="text-sm text-gray-800 bg-gray-50 p-4 border border-gray-100 rounded whitespace-pre-wrap">
                                        {viewCandidate.coverLetter}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Joriy Bosqich</div>
                                <select
                                    value={viewCandidate.stage}
                                    onChange={(e) => {
                                        handleStageSelect(viewCandidate, e.target.value);
                                        setViewCandidate({ ...viewCandidate, stage: e.target.value });
                                    }}
                                    className="w-full max-w-xs p-3 border border-gray-200 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-black bg-white"
                                >
                                    {STAGES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {emailModal.open && emailModal.candidate && emailModal.type && (
                <EmailActionModal
                    candidate={emailModal.candidate}
                    type={emailModal.type}
                    onClose={() => setEmailModal({ open: false, candidate: null, type: null })}
                    onSuccess={() => {
                        if (emailModal.type === "REJECT") {
                            onStageChange(emailModal.candidate.id, "REJECTED");
                        }
                        setEmailModal({ open: false, candidate: null, type: null });
                        setViewCandidate(null);
                    }}
                />
            )}
        </div>
    );
}
