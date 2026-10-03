"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    DiscQuestion,
    DiscProfileResponse,
    TeamDiscAnalytics,
    fetchDiscQuestions,
    fetchMyDiscProfile,
    submitDiscAssessment,
    fetchTeamDiscAnalytics,
    createDiscQuestion,
    updateDiscQuestion,
    deleteDiscQuestion,
} from "@/src/services/disc-service";
import Skeleton from "@/src/components/ui/Skeleton";
import { getQueryData, setQueryData, isQueryStale, invalidateQuery } from "@/src/utils/query-cache";

interface DiscTestManagerProps {
    locale?: string;
}

export default function DiscTestManager({ locale = "uz" }: DiscTestManagerProps) {
    const t = useTranslations("Disc");
    const cachedProfile = getQueryData<DiscProfileResponse>("disc:profile");
    const cachedQuestions = getQueryData<DiscQuestion[]>("disc:questions");
    const cachedTeam = getQueryData<TeamDiscAnalytics>("disc:team");

    const [activeTab, setActiveTab] = useState<"profile" | "test" | "team" | "questions">(() => {
        if (cachedProfile && !cachedProfile.hasTakenTest && (cachedQuestions?.length || 0) > 0) {
            return "test";
        }
        return "profile";
    });
    const [loading, setLoading] = useState(() => !cachedProfile || !cachedQuestions);
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [questions, setQuestions] = useState<DiscQuestion[]>(() => cachedQuestions || []);
    const [profileData, setProfileData] = useState<DiscProfileResponse | null>(() => cachedProfile || null);
    const [teamAnalytics, setTeamAnalytics] = useState<TeamDiscAnalytics | null>(() => cachedTeam || null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");

    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<DiscQuestion | null>(null);
    const [qText, setQText] = useState("");
    const [qOrder, setQOrder] = useState<number>(1);
    const [optD, setOptD] = useState("");
    const [optI, setOptI] = useState("");
    const [optS, setOptS] = useState("");
    const [optC, setOptC] = useState("");
    const [savingQuestion, setSavingQuestion] = useState(false);

    useEffect(() => {
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch {}
        }
        loadInitialData();
    }, []);

    const loadInitialData = async (isBackground = false) => {
        const cachedProf = getQueryData<DiscProfileResponse>("disc:profile");
        const cachedQ = getQueryData<DiscQuestion[]>("disc:questions");
        const isStale = isQueryStale("disc:profile") || isQueryStale("disc:questions");

        if (cachedProf && cachedQ) {
            setProfileData(cachedProf);
            setQuestions(cachedQ);
            if (!cachedProf.hasTakenTest && cachedQ.length > 0) {
                setActiveTab("test");
            }
        } else if (!isBackground) {
            setLoading(true);
        }

        if (cachedProf && cachedQ && !isStale && !isBackground) {
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            let userObj: any = null;
            if (userStr) {
                try {
                    userObj = JSON.parse(userStr);
                } catch {}
            }

            const [profileRes, questionsRes] = await Promise.all([
                fetchMyDiscProfile().catch(() => ({ hasTakenTest: false, assessment: null, description: null })),
                fetchDiscQuestions().catch(() => []),
            ]);

            setProfileData(profileRes);
            setQuestions(questionsRes);
            setQueryData("disc:profile", profileRes);
            setQueryData("disc:questions", questionsRes);

            if (!profileRes.hasTakenTest && questionsRes.length > 0) {
                setActiveTab("test");
            } else {
                setActiveTab("profile");
            }

            const userCanViewTeam = userObj?.role === "SUPER_ADMIN" || userObj?.role === "HR_ADMIN" || userObj?.role === "DIRECTOR" || userObj?.role === "DEPARTMENT_HEAD";
            if (userCanViewTeam) {
                fetchTeamData();
            }
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamData = async (deptId?: string) => {
        const cacheKey = deptId ? `disc:team:${deptId}` : "disc:team";
        const cached = getQueryData<TeamDiscAnalytics>(cacheKey);
        const isStale = isQueryStale(cacheKey);

        if (cached) {
            setTeamAnalytics(cached);
        }
        if (cached && !isStale) {
            return;
        }

        try {
            const data = await fetchTeamDiscAnalytics(deptId);
            setTeamAnalytics(data);
            setQueryData(cacheKey, data);
        } catch {}
    };

    const handleSelectOption = (questionId: string, optionId: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    const handleSubmitTest = async () => {
        if (questions.length === 0) return;

        const unanswered = questions.filter((q) => !answers[q.id]);
        if (unanswered.length > 0) {
            const firstUnansweredIdx = questions.findIndex((q) => !answers[q.id]);
            if (firstUnansweredIdx !== -1) {
                setCurrentQuestionIdx(firstUnansweredIdx);
            }
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            const formattedAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
                questionId,
                optionId,
            }));

            await submitDiscAssessment(formattedAnswers);
            invalidateQuery("disc:profile");
            invalidateQuery("disc:team");
            const updatedProfile = await fetchMyDiscProfile();
            setProfileData(updatedProfile);
            setQueryData("disc:profile", updatedProfile);
            setActiveTab("profile");
            fetchTeamData();
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setSubmitting(false);
        }
    };

    const startRetakeTest = () => {
        setAnswers({});
        setCurrentQuestionIdx(0);
        setError(null);
        setActiveTab("test");
    };

    const openCreateQuestionModal = () => {
        setEditingQuestion(null);
        setQText("");
        setQOrder(questions.length + 1);
        setOptD("");
        setOptI("");
        setOptS("");
        setOptC("");
        setError(null);
        setIsQuestionModalOpen(true);
    };

    const openEditQuestionModal = (q: DiscQuestion) => {
        setEditingQuestion(q);
        setQText(q.text);
        setQOrder(q.order);

        const d = q.options.find((o) => o.discType === "D")?.text || "";
        const i = q.options.find((o) => o.discType === "I")?.text || "";
        const s = q.options.find((o) => o.discType === "S")?.text || "";
        const c = q.options.find((o) => o.discType === "C")?.text || "";

        setOptD(d);
        setOptI(i);
        setOptS(s);
        setOptC(c);
        setError(null);
        setIsQuestionModalOpen(true);
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!qText.trim()) {
            return;
        }
        if (!optD.trim() || !optI.trim() || !optS.trim() || !optC.trim()) {
            return;
        }

        try {
            setSavingQuestion(true);
            setError(null);

            const payload = {
                text: qText.trim(),
                order: Number(qOrder),
                options: [
                    { text: optD.trim(), discType: "D" as const, score: 1 },
                    { text: optI.trim(), discType: "I" as const, score: 1 },
                    { text: optS.trim(), discType: "S" as const, score: 1 },
                    { text: optC.trim(), discType: "C" as const, score: 1 },
                ],
            };

            if (editingQuestion) {
                await updateDiscQuestion(editingQuestion.id, payload);
            } else {
                await createDiscQuestion(payload);
            }

            invalidateQuery("disc:questions");
            setIsQuestionModalOpen(false);
            const freshQuestions = await fetchDiscQuestions();
            setQuestions(freshQuestions);
            setQueryData("disc:questions", freshQuestions);
        } catch (err: any) {
            setError(err.message || "Error");
        } finally {
            setSavingQuestion(false);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm(t("deleteConfirm"))) return;
        try {
            await deleteDiscQuestion(id);
            invalidateQuery("disc:questions");
            const freshQuestions = await fetchDiscQuestions();
            setQuestions(freshQuestions);
            setQueryData("disc:questions", freshQuestions);
        } catch (err: any) {
            setError(err.message || "Error");
        }
    };

    const isHrAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "HR_ADMIN" || currentUser?.role === "DIRECTOR";
    const canViewTeamAnalytics = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "HR_ADMIN" || currentUser?.role === "DIRECTOR" || currentUser?.role === "DEPARTMENT_HEAD";

    if (loading) {
        return (
            <div className="flex flex-col gap-8 max-w-[1400px] mx-auto py-8 px-4 md:px-8 font-sans">
                <div className="flex flex-col gap-2 border-b border-gray-100 pb-6">
                    <Skeleton className="w-24 h-4 rounded" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Skeleton className="w-64 h-9 rounded-xl" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-28 h-10 rounded-xl" />
                            <Skeleton className="w-28 h-10 rounded-xl" />
                            <Skeleton className="w-32 h-10 rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 space-y-6 shadow-sm">
                            <Skeleton className="w-28 h-4 rounded" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="w-32 h-6 rounded-lg" />
                                    <Skeleton className="w-24 h-4 rounded" />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 space-y-2">
                                <Skeleton className="w-full h-4 rounded" />
                                <Skeleton className="w-3/4 h-4 rounded" />
                            </div>
                        </div>

                        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 md:p-8 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <Skeleton className="w-48 h-5 rounded-lg" />
                                <Skeleton className="w-32 h-4 rounded" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                                        <div className="flex justify-between">
                                            <Skeleton className="w-24 h-4 rounded" />
                                            <Skeleton className="w-10 h-4 rounded" />
                                        </div>
                                        <Skeleton className="w-full h-2 rounded-full" />
                                        <Skeleton className="w-full h-3 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3 shadow-sm">
                                <Skeleton className="w-28 h-4 rounded border-b border-gray-100 pb-2" />
                                <div className="space-y-2 pt-2">
                                    <Skeleton className="w-full h-3.5 rounded" />
                                    <Skeleton className="w-5/6 h-3.5 rounded" />
                                    <Skeleton className="w-4/6 h-3.5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIdx];
    const progressPercent = questions.length > 0 ? Math.round(((currentQuestionIdx + 1) / questions.length) * 100) : 0;
    const answeredCount = Object.keys(answers).length;

    const discTypeColors: Record<string, { bg: string; text: string; border: string; bar: string; name: string }> = {
        D: { bg: "bg-red-50", text: "text-red-700", border: "border-red-500", bar: "bg-red-600", name: t("types.D.name") },
        I: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-500", bar: "bg-amber-500", name: t("types.I.name") },
        S: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-500", bar: "bg-emerald-600", name: t("types.S.name") },
        C: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-500", bar: "bg-blue-600", name: t("types.C.name") },
    };

    const departmentsList = teamAnalytics ? Array.from(new Set(teamAnalytics.members.map((m) => m.department).filter(Boolean))) : [];
    const filteredMembers = teamAnalytics
        ? teamAnalytics.members.filter((m) => selectedDepartment === "ALL" || m.department === selectedDepartment)
        : [];

    return (
        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto py-8 px-4 md:px-8 font-sans">
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-6">
                <div className="text-xs font-bold uppercase tracking-widest text-[#9327FF]">
                    {t("badge")}
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                        {t("title")}
                    </h1>
                    <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                activeTab === "profile" ? "bg-violet-100 text-violet-700 shadow-xs" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                        >
                            {t("myProfile")}
                        </button>
                        <button
                            onClick={() => setActiveTab("test")}
                            className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                activeTab === "test" ? "bg-violet-100 text-violet-700 shadow-xs" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                        >
                            {profileData?.hasTakenTest ? t("retakeTest") : t("takeTest")}
                        </button>
                        {canViewTeamAnalytics && (
                            <button
                                onClick={() => setActiveTab("team")}
                                className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                    activeTab === "team" ? "bg-violet-100 text-violet-700 shadow-xs" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                            >
                                {t("teamAnalytics")}
                            </button>
                        )}
                        {isHrAdmin && (
                            <button
                                onClick={() => setActiveTab("questions")}
                                className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                    activeTab === "questions" ? "bg-violet-100 text-violet-700 shadow-xs" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                            >
                                {t("manageQuestions")}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-xs hover:opacity-70 cursor-pointer">✕</button>
                </div>
            )}

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="text-xs hover:opacity-70 cursor-pointer">✕</button>
                </div>
            )}

            {activeTab === "profile" && (
                <div className="flex flex-col gap-8">
                    {profileData?.hasTakenTest && profileData.assessment ? (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 flex flex-col justify-between shadow-sm">
                                    <div className="space-y-4">
                                        <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                            {t("primaryType")}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-16 h-16 rounded-2xl border ${discTypeColors[profileData.assessment.primaryType]?.border || "border-purple-300"} ${discTypeColors[profileData.assessment.primaryType]?.bg || "bg-purple-50"} flex items-center justify-center text-3xl font-black ${discTypeColors[profileData.assessment.primaryType]?.text || "text-purple-700"}`}>
                                                {profileData.assessment.primaryType}
                                            </div>
                                            <div>
                                                <div className="text-xl font-bold uppercase tracking-tight text-gray-900">
                                                    {discTypeColors[profileData.assessment.primaryType]?.name.split(" ")[0]}
                                                </div>
                                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    {discTypeColors[profileData.assessment.primaryType]?.name.split(" ").slice(1).join(" ")}
                                                </div>
                                            </div>
                                        </div>

                                        {profileData.assessment.secondaryType && (
                                            <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs">
                                                <span className="font-bold text-gray-500 uppercase">{t("secondaryType")}:</span>
                                                <span className="font-bold text-gray-800 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                                                    {profileData.assessment.secondaryType} — {discTypeColors[profileData.assessment.secondaryType]?.name.split(" ")[0]}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 mt-6 flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase text-gray-400">
                                            {t("date")}: {new Date(profileData.assessment.createdAt).toLocaleDateString("uz-UZ")}
                                        </span>
                                        <button
                                            onClick={startRetakeTest}
                                            className="text-xs font-bold text-[#9327FF] uppercase hover:underline cursor-pointer"
                                        >
                                            {t("retake")}
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 md:p-8 space-y-6 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                                            {t("distributionTitle")}
                                        </h2>
                                        <span className="text-xs font-medium text-gray-500">
                                            {t("distributionSubtitle")}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {[
                                            { key: "D", label: "D — Dominance", desc: t("types.D.desc"), score: profileData.assessment.dScore, color: "bg-red-500", textColor: "text-red-700", bg: "bg-red-50/50", border: "border-red-100" },
                                            { key: "I", label: "I — Influence", desc: t("types.I.desc"), score: profileData.assessment.iScore, color: "bg-amber-500", textColor: "text-amber-700", bg: "bg-amber-50/50", border: "border-amber-100" },
                                            { key: "S", label: "S — Steadiness", desc: t("types.S.desc"), score: profileData.assessment.sScore, color: "bg-emerald-500", textColor: "text-emerald-700", bg: "bg-emerald-50/50", border: "border-emerald-100" },
                                            { key: "C", label: "C — Conscientiousness", desc: t("types.C.desc"), score: profileData.assessment.cScore, color: "bg-blue-500", textColor: "text-blue-700", bg: "bg-blue-50/50", border: "border-blue-100" },
                                        ].map((item) => (
                                            <div key={item.key} className={`rounded-xl border ${item.border} ${item.bg} p-4 space-y-2`}>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold uppercase ${item.textColor}`}>
                                                        {item.label}
                                                    </span>
                                                    <span className="text-base font-bold text-gray-900">
                                                        {item.score}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-gray-200/60">
                                                    <div
                                                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                                        style={{ width: `${item.score}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] font-medium text-gray-600">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {profileData.description?.primary && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3 shadow-sm">
                                        <div className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
                                            {t("traits")}
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {profileData.description.primary.traits}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3 shadow-sm">
                                        <div className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
                                            {t("communication")}
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {profileData.description.primary.communication}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3 shadow-sm">
                                        <div className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
                                            {t("strengths")}
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {profileData.description.primary.strengths}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center flex flex-col items-center gap-6 shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#9327FF] flex items-center justify-center text-3xl font-black">
                                🎯
                            </div>
                            <div className="space-y-2 max-w-lg">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                                    {t("notTakenTitle")}
                                </h2>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {t("notTakenDesc")}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab("test")}
                                className="px-8 py-3 bg-[#9327FF] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer"
                            >
                                {t("startTest", { count: questions.length })}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "test" && (
                <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                {t("questionNum", { current: currentQuestionIdx + 1, total: questions.length })}
                            </span>
                            <h2 className="text-lg font-bold text-gray-900">
                                {t("testTitle")}
                            </h2>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold text-gray-600">
                                {t("answeredCount", { answered: answeredCount, total: questions.length })}
                            </span>
                            <div className="w-40 sm:w-48 bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {currentQ && (
                        <div className="space-y-6">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 leading-snug">
                                {currentQ.order}. {currentQ.text}
                            </h3>

                            <div className="space-y-3">
                                {currentQ.options.map((option) => {
                                    const isSelected = answers[currentQ.id] === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => handleSelectOption(currentQ.id, option.id)}
                                            className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                                                isSelected
                                                    ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500 shadow-xs font-medium text-gray-900"
                                                    : "border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50 text-gray-800"
                                            }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                                                    isSelected ? "bg-violet-600 text-white font-bold" : "border border-gray-300 bg-white"
                                                }`}
                                            >
                                                {isSelected ? "✓" : ""}
                                            </div>
                                            <span className="text-xs md:text-sm leading-relaxed">
                                                {option.text}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            disabled={currentQuestionIdx === 0}
                            onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                            className="text-gray-500 hover:bg-gray-100 rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {t("previous")}
                        </button>

                        {currentQuestionIdx < questions.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                                className="bg-[#9327FF] text-white rounded-xl px-6 py-3 shadow-sm hover:opacity-90 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                                {t("next")}
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={submitting || answeredCount < questions.length}
                                onClick={handleSubmitTest}
                                className="bg-[#9327FF] text-white rounded-xl px-8 py-3 shadow-sm hover:opacity-90 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submitting ? t("calculating") : t("submitTest")}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "team" && canViewTeamAnalytics && (
                <div className="space-y-8">
                    {teamAnalytics ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-2 shadow-sm">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block">
                                        {t("totalEmployees")}
                                    </span>
                                    <span className="text-3xl font-bold text-gray-900">
                                        {teamAnalytics.totalEmployees}
                                    </span>
                                    <span className="text-xs text-gray-500 block">
                                        {t("companyMembers")}
                                    </span>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-2 shadow-sm">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block">
                                        {t("testedEmployees")}
                                    </span>
                                    <span className="text-3xl font-bold text-emerald-600">
                                        {teamAnalytics.totalAssessed}
                                    </span>
                                    <span className="text-xs text-gray-500 block">
                                        {t("coverage", { percent: Math.round((teamAnalytics.totalAssessed / (teamAnalytics.totalEmployees || 1)) * 100) })}
                                    </span>
                                </div>

                                <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 space-y-4 shadow-sm">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block">
                                        {t("teamDistribution")}
                                    </span>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-red-50/60 border border-red-100 rounded-xl p-2.5">
                                            <span className="text-xs font-black text-red-700 block">D</span>
                                            <span className="text-sm font-bold text-gray-900">{teamAnalytics.distribution.D}%</span>
                                        </div>
                                        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5">
                                            <span className="text-xs font-black text-amber-700 block">I</span>
                                            <span className="text-sm font-bold text-gray-900">{teamAnalytics.distribution.I}%</span>
                                        </div>
                                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5">
                                            <span className="text-xs font-black text-emerald-700 block">S</span>
                                            <span className="text-sm font-bold text-gray-900">{teamAnalytics.distribution.S}%</span>
                                        </div>
                                        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2.5">
                                            <span className="text-xs font-black text-blue-700 block">C</span>
                                            <span className="text-sm font-bold text-gray-900">{teamAnalytics.distribution.C}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                                    <h2 className="text-lg font-bold uppercase text-gray-900">
                                        {t("memberScoresTitle")}
                                    </h2>
                                    {departmentsList.length > 0 && (
                                        <select
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(e.target.value)}
                                            className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF] outline-none bg-white text-gray-700"
                                        >
                                            <option value="ALL">{t("allDepartments")}</option>
                                            {departmentsList.map((d) => (
                                                <option key={d} value={d!}>{d}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredMembers.map((member) => {
                                        const typeStyle = discTypeColors[member.primaryType] || discTypeColors.D;
                                        return (
                                            <div key={member.employeeId} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">
                                                            {member.fullName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium">
                                                            {member.department || "-"} • {member.position || "-"}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${typeStyle.border} ${typeStyle.bg} ${typeStyle.text}`}>
                                                        {member.primaryType} {member.secondaryType ? `+ ${member.secondaryType}` : ""}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-4 gap-1.5 text-[10px] text-center pt-2 border-t border-gray-100 font-bold">
                                                    <div className="bg-gray-50 rounded-lg p-1.5">
                                                        <span className="text-red-700 block font-black">D</span>
                                                        <span className="text-gray-800">{member.scores.D}%</span>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-1.5">
                                                        <span className="text-amber-700 block font-black">I</span>
                                                        <span className="text-gray-800">{member.scores.I}%</span>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-1.5">
                                                        <span className="text-emerald-700 block font-black">S</span>
                                                        <span className="text-gray-800">{member.scores.S}%</span>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-1.5">
                                                        <span className="text-blue-700 block font-black">C</span>
                                                        <span className="text-gray-800">{member.scores.C}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-xs text-gray-400">
                            {t("noTeamData")}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "questions" && isHrAdmin && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-gray-900">
                                {t("questionsTitle")}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {t("questionsSubtitle")}
                            </p>
                        </div>
                        <button
                            onClick={openCreateQuestionModal}
                            className="px-5 py-2.5 bg-[#9327FF] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm shrink-0 cursor-pointer"
                        >
                            {t("newQuestion")}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4 shadow-sm">
                                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-lg bg-[#9327FF] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                            {q.order || idx + 1}
                                        </span>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            {q.text}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => openEditQuestionModal(q)}
                                            className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            {t("edit")}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                            {t("delete")}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {q.options.map((opt) => {
                                        const typeStyle = discTypeColors[opt.discType] || discTypeColors.D;
                                        return (
                                            <div key={opt.id} className={`p-3 rounded-xl border ${typeStyle.border} ${typeStyle.bg} flex items-start gap-2.5 text-xs`}>
                                                <span className={`w-5 h-5 rounded-full ${typeStyle.bar} text-white font-bold flex items-center justify-center text-[10px] shrink-0`}>
                                                    {opt.discType}
                                                </span>
                                                <span className="text-gray-800 leading-relaxed">
                                                    {opt.text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isQuestionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 max-w-2xl w-full p-6 sm:p-8 shadow-xl relative my-8 font-sans">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                                    {editingQuestion ? t("editModalTitle") : t("createModalTitle")}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {t("modalSubtitle")}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsQuestionModalOpen(false)}
                                className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuestion} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        {t("questionText")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={qText}
                                        onChange={(e) => setQText(e.target.value)}
                                        placeholder={t("questionTextPlaceholder")}
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF] outline-none bg-white font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        {t("questionOrder")} *
                                    </label>
                                    <input
                                        type="number"
                                        value={qOrder}
                                        onChange={(e) => setQOrder(Number(e.target.value))}
                                        min={1}
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-[#9327FF] outline-none bg-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-1">
                                    {t("optionsTitle")}
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold uppercase text-red-700">
                                        {t("optDLabel")}
                                    </label>
                                    <input
                                        type="text"
                                        value={optD}
                                        onChange={(e) => setOptD(e.target.value)}
                                        placeholder={t("optDPlaceholder")}
                                        className="w-full rounded-xl border border-red-200 p-2.5 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none bg-red-50/40"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold uppercase text-amber-700">
                                        {t("optILabel")}
                                    </label>
                                    <input
                                        type="text"
                                        value={optI}
                                        onChange={(e) => setOptI(e.target.value)}
                                        placeholder={t("optIPlaceholder")}
                                        className="w-full rounded-xl border border-amber-200 p-2.5 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-amber-50/40"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold uppercase text-emerald-700">
                                        {t("optSLabel")}
                                    </label>
                                    <input
                                        type="text"
                                        value={optS}
                                        onChange={(e) => setOptS(e.target.value)}
                                        placeholder={t("optSPlaceholder")}
                                        className="w-full rounded-xl border border-emerald-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-emerald-50/40"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold uppercase text-blue-700">
                                        {t("optCLabel")}
                                    </label>
                                    <input
                                        type="text"
                                        value={optC}
                                        onChange={(e) => setOptC(e.target.value)}
                                        placeholder={t("optCPlaceholder")}
                                        className="w-full rounded-xl border border-blue-200 p-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-blue-50/40"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsQuestionModalOpen(false)}
                                    disabled={savingQuestion}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingQuestion}
                                    className="px-6 py-2.5 bg-[#9327FF] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {savingQuestion ? t("saving") : editingQuestion ? t("update") : t("add")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
