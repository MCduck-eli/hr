import { useState } from "react";
import { useTranslations } from "next-intl";
import EmailActionModal from "./EmailActionModal";

interface RecruitingBoardProps {
    vacancies: any[];
    departments: any[];
    managers: any[];
    onStageChange: (candidateId: string, stage: string, testTaskDeadline?: string | null) => void;
    onHire: (candidateId: string, departmentId: string, managerId: string) => void;
    onEdit: (vacancy: any) => void;
    onDelete: (vacancyId: string) => void;
}

const STAGE_KEYS: Record<string, string> = {
    APPLIED: "stages.APPLIED",
    SCREENING: "stages.SCREENING",
    INTERVIEW: "stages.INTERVIEW",
    TEST_TASK: "stages.TEST_TASK",
    OFFER: "stages.OFFER",
    HIRED: "stages.HIRED",
    REJECTED: "stages.REJECTED",
};

const STAGE_VALUES = ["APPLIED", "INTERVIEW", "TEST_TASK", "OFFER", "HIRED", "REJECTED"];

const getStageBadgeStyle = (stage: string) => {
    switch (stage) {
        case "APPLIED":
            return "bg-gray-100 text-gray-800 border-gray-300";
        case "SCREENING":
            return "bg-purple-50 text-purple-700 border-purple-200";
        case "INTERVIEW":
            return "bg-blue-50 text-blue-700 border-blue-300 font-extrabold";
        case "TEST_TASK":
            return "bg-amber-50 text-amber-700 border-amber-300";
        case "OFFER":
            return "bg-teal-50 text-teal-700 border-teal-300";
        case "HIRED":
            return "bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold";
        case "REJECTED":
            return "bg-red-50 text-red-700 border-red-300 font-extrabold";
        default:
            return "bg-white text-gray-700 border-gray-200";
    }
};

export default function RecruitingBoard({
    vacancies,
    departments,
    managers,
    onStageChange,
    onHire,
    onEdit,
    onDelete,
}: RecruitingBoardProps) {
    const t = useTranslations("Recruiting");
    const [selectedVacancyId, setSelectedVacancyId] = useState<string>(vacancies[0]?.id || "");

    const getTaskDeadlineInfo = (candidate: any) => {
        if (candidate.stage !== "TEST_TASK") return null;

        if (candidate.testTaskSubmittedAt) {
            return {
                status: "SUBMITTED",
                label: t("taskStatus.submitted"),
                colorClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
                icon: "✅",
                isSubmitted: true,
            };
        }

        if (!candidate.testTaskDeadline) {
            return {
                status: "PENDING",
                label: t("taskStatus.pending"),
                colorClass: "bg-amber-100 text-amber-800 border-amber-300",
                icon: "⏳",
                isExpired: false,
            };
        }

        const deadline = new Date(candidate.testTaskDeadline).getTime();
        const now = Date.now();
        const diffHours = Math.round((deadline - now) / (1000 * 60 * 60));

        if (diffHours < 0) {
            const expiredDays = Math.abs(Math.floor(diffHours / 24));
            return {
                status: "EXPIRED",
                label: expiredDays === 0 ? t("taskStatus.expiredToday") : t("taskStatus.expiredDays", { days: expiredDays }),
                colorClass: "bg-rose-100 text-rose-800 border-rose-300 font-bold",
                icon: "⚠️",
                isExpired: true,
            };
        } else {
            const remainingDays = Math.ceil(diffHours / 24);
            return {
                status: "ACTIVE",
                label: t("taskStatus.remainingDays", { days: remainingDays }),
                colorClass: "bg-amber-100 text-amber-800 border-amber-300",
                icon: "⏰",
                isExpired: false,
            };
        }
    };

    const activeVacancyId = selectedVacancyId && vacancies.some(v => v.id === selectedVacancyId)
        ? selectedVacancyId
        : vacancies[0]?.id || "";

    const selectedVacancy = vacancies.find((v) => v.id === activeVacancyId) || null;
    const [viewCandidate, setViewCandidate] = useState<any>(null);
    const [emailModal, setEmailModal] = useState<{ open: boolean; candidate: any; type: string | null }>({
        open: false,
        candidate: null,
        type: null,
    });

    const handleStageSelect = (candidate: any, stage: string) => {
        if (stage === candidate.stage) return;
        if (stage === "HIRED") {
            const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "ru" : "ru";
            const [firstName, ...lastNameParts] = (candidate.fullName || "").trim().split(" ");
            const lastName = lastNameParts.join(" ");

            const params = new URLSearchParams({
                candidateId: candidate.id,
                email: candidate.email || "",
                firstName: firstName || "",
                lastName: lastName || "",
                phone: candidate.phone || "",
                vacancyTitle: selectedVacancy?.title || "",
                departmentId: selectedVacancy?.departmentId || "",
            });

            window.location.href = `/${locale}/hr/employees?${params.toString()}`;
            return;
        } else {
            setEmailModal({ open: true, candidate, type: stage });
        }
    };

    const serverOrigin = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "") : "http://localhost:5001";

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4 overflow-x-auto pb-4">
                {vacancies.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setSelectedVacancyId(v.id)}
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
                            {t("publicLinkTitle")}
                        </div>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => onEdit(selectedVacancy)}
                                className="text-[10px] font-bold uppercase tracking-widest bg-white border border-gray-200 text-black px-4 py-2 hover:bg-gray-100 transition-colors"
                            >
                                {t("edit")}
                            </button>
                            <button
                                onClick={() => {
                                    if(confirm(t("confirmDeleteVacancy"))) {
                                        onDelete(selectedVacancy.id);
                                    }
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest bg-white border border-red-200 text-red-500 px-4 py-2 hover:bg-red-50 transition-colors"
                            >
                                {t("delete")}
                            </button>
                            <button
                                onClick={() => {
                                    const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "ru" : "ru";
                                    const url = `${window.location.origin}/${locale}/jobs/${selectedVacancy.id}`;
                                    navigator.clipboard.writeText(url);
                                    alert(t("linkCopied") + url);
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors ml-2"
                            >
                                {t("copyLink")}
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-[11px] text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                    <th className="p-4">{t("thFullName")}</th>
                                    <th className="p-4">{t("thContact")}</th>
                                    <th className="p-4">{t("thSource")}</th>
                                    <th className="p-4">{t("thStage")}</th>
                                    <th className="p-4 text-right">{t("thActions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedVacancy.candidates?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500 text-xs">
                                            {t("noCandidates")}
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
                                            const taskInfo = getTaskDeadlineInfo(c);

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
                                                    {t("match")}: {matchScore}%
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
                                            <td className="p-4 min-w-[200px]">
                                                 <select
                                                     value={c.stage}
                                                     onChange={(e) => handleStageSelect(c, e.target.value)}
                                                     className={`w-full p-2.5 border text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-black rounded transition-all cursor-pointer shadow-sm ${getStageBadgeStyle(c.stage)}`}
                                                 >
                                                     {STAGE_VALUES.map((val) => (
                                                         <option key={val} value={val} className="bg-white text-gray-900 font-semibold py-1">
                                                             {t(STAGE_KEYS[val] || val)}
                                                         </option>
                                                     ))}
                                                 </select>

                                                 {taskInfo && (
                                                     <div className={`mt-2 px-2.5 py-1 text-[10px] uppercase font-bold border rounded flex items-center justify-between gap-1.5 shadow-sm ${taskInfo.colorClass}`}>
                                                         <span className="flex items-center gap-1">
                                                             <span>{taskInfo.icon}</span>
                                                             <span>{taskInfo.label}</span>
                                                         </span>
                                                         {c.testTaskSubmittedAt && (
                                                             <button
                                                                 onClick={() => setViewCandidate(c)}
                                                                 className="text-[9px] underline font-black hover:text-black"
                                                             >
                                                                 {t("taskStatus.view")}
                                                             </button>
                                                         )}
                                                     </div>
                                                 )}
                                             </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                                    {c.stage === "TEST_TASK" && taskInfo?.isExpired && !c.testTaskSubmittedAt && (
                                                        <>
                                                            <button
                                                                onClick={() => setEmailModal({ open: true, candidate: c, type: "TASK_REMINDER" })}
                                                                className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded transition-colors shadow-sm"
                                                                title={t("taskStatus.sendReminder")}
                                                            >
                                                                {t("taskStatus.remind")}
                                                            </button>
                                                            <button
                                                                onClick={() => handleStageSelect(c, "REJECTED")}
                                                                className="text-[10px] font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded transition-colors shadow-sm"
                                                                title={t("taskStatus.rejectCandidate")}
                                                            >
                                                                {t("taskStatus.reject")}
                                                            </button>
                                                        </>
                                                    )}
                                                    <a
                                                        href={c.resumeUrl?.startsWith("/") ? serverOrigin + c.resumeUrl : c.resumeUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline border border-blue-200 bg-blue-50 px-2.5 py-1.5 rounded"
                                                    >
                                                        {t("resume")}
                                                    </a>
                                                </div>
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
                                    <span className="text-green-600">{t("match")}: {viewCandidate.vacancyMatches?.find((m: any) => m.vacancyId === selectedVacancy.id)?.matchScore || 0}%</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewCandidate(null)}
                                className="text-gray-400 hover:text-black transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("email")}</div>
                                    <div className="text-sm font-bold text-black">{viewCandidate.email}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("phone")}</div>
                                    <div className="text-sm font-bold text-black">{viewCandidate.phone}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("location")}</div>
                                    <div className="text-sm font-bold text-black">{viewCandidate.location || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("resume")}</div>
                                    <a
                                        href={viewCandidate.resumeUrl?.startsWith("/") ? serverOrigin + viewCandidate.resumeUrl : viewCandidate.resumeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-bold text-blue-600 hover:underline"
                                    >
                                        {t("viewDocument")} &rarr;
                                    </a>
                                </div>
                            </div>
                            
                            {/* Test Task details section in candidate modal */}
                            {(viewCandidate.stage === "TEST_TASK" || viewCandidate.testTaskSubmittedAt) && (
                                <div className="p-5 bg-amber-50/60 border border-amber-200 rounded flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                                            <span>📌</span>
                                            <span>{t("taskStatus.title")}</span>
                                        </h3>
                                        {viewCandidate.testTaskSubmittedAt ? (
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">
                                                {t("taskStatus.submittedBadge")}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">
                                                {t("taskStatus.pendingBadge")}
                                            </span>
                                        )}
                                    </div>

                                    {viewCandidate.testTaskSubmittedAt && (
                                        <div className="text-xs text-gray-700 flex flex-col gap-2 bg-white p-3 border border-amber-200 rounded">
                                            <div>
                                                <span className="font-bold text-gray-500">{t("taskStatus.submittedAt")}</span>{" "}
                                                <span className="font-bold">{new Date(viewCandidate.testTaskSubmittedAt).toLocaleString()}</span>
                                            </div>
                                            {viewCandidate.testTaskSubmissionUrl && (
                                                <div>
                                                    <span className="font-bold text-gray-500">{t("taskStatus.solutionUrl")}</span>{" "}
                                                    <a href={viewCandidate.testTaskSubmissionUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline break-all">
                                                        {viewCandidate.testTaskSubmissionUrl}
                                                    </a>
                                                </div>
                                            )}
                                            {viewCandidate.testTaskSubmissionFile && (
                                                <div>
                                                    <span className="font-bold text-gray-500">{t("taskStatus.solutionFile")}</span>{" "}
                                                    <a
                                                        href={viewCandidate.testTaskSubmissionFile.startsWith("http") ? viewCandidate.testTaskSubmissionFile : `${serverOrigin}${viewCandidate.testTaskSubmissionFile}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-600 font-bold hover:underline"
                                                    >
                                                        {t("taskStatus.downloadFile")}
                                                    </a>
                                                </div>
                                            )}
                                            {viewCandidate.testTaskSubmissionNote && (
                                                <div>
                                                    <span className="font-bold text-gray-500">{t("taskStatus.candidateNote")}</span>{" "}
                                                    <span className="italic text-gray-800">{viewCandidate.testTaskSubmissionNote}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {getTaskDeadlineInfo(viewCandidate)?.isExpired && !viewCandidate.testTaskSubmittedAt && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <button
                                                onClick={() => {
                                                    setEmailModal({ open: true, candidate: viewCandidate, type: "TASK_REMINDER" });
                                                    setViewCandidate(null);
                                                }}
                                                className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded transition-colors"
                                            >
                                                {t("taskStatus.sendReminder")}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleStageSelect(viewCandidate, "REJECTED");
                                                    setViewCandidate(null);
                                                }}
                                                className="text-[10px] font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors"
                                            >
                                                {t("taskStatus.rejectCandidate")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {viewCandidate.coverLetter && (
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t("coverLetter")}</div>
                                    <div className="text-sm text-gray-800 bg-gray-50 p-4 border border-gray-100 rounded whitespace-pre-wrap">
                                        {viewCandidate.coverLetter}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t("thStage")}</div>
                                <select
                                     value={viewCandidate.stage}
                                     onChange={(e) => {
                                         handleStageSelect(viewCandidate, e.target.value);
                                         setViewCandidate({ ...viewCandidate, stage: e.target.value });
                                     }}
                                     className={`w-full max-w-xs p-3 border text-xs font-bold uppercase tracking-widest focus:outline-none rounded transition-all cursor-pointer ${getStageBadgeStyle(viewCandidate.stage)}`}
                                 >
                                     {STAGE_VALUES.map((val) => (
                                         <option key={val} value={val} className="bg-white text-gray-900 font-semibold py-1">
                                             {t(STAGE_KEYS[val] || val)}
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
                    vacancyTitle={selectedVacancy?.title}
                    type={emailModal.type}
                    onClose={() => setEmailModal({ open: false, candidate: null, type: null })}
                    onSuccess={(meta) => {
                        if (emailModal.type && emailModal.type !== "HIRE" && emailModal.type !== "HIRED") {
                            if (emailModal.type === "TASK_REMINDER") {
                                // Just a reminder email, keep stage
                            } else {
                                const nextStage = emailModal.type === "REJECT" ? "REJECTED" : emailModal.type;
                                onStageChange(emailModal.candidate.id, nextStage, meta?.testTaskDeadline);
                            }
                        }
                        setEmailModal({ open: false, candidate: null, type: null });
                        setViewCandidate(null);
                    }}
                />
            )}
        </div>
    );
}

