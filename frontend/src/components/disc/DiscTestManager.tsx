"use client";

import { useState, useEffect } from "react";
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

interface DiscTestManagerProps {
    locale?: string;
}

export default function DiscTestManager({ locale = "uz" }: DiscTestManagerProps) {
    const [activeTab, setActiveTab] = useState<"profile" | "test" | "team" | "questions">("profile");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [questions, setQuestions] = useState<DiscQuestion[]>([]);
    const [profileData, setProfileData] = useState<DiscProfileResponse | null>(null);
    const [teamAnalytics, setTeamAnalytics] = useState<TeamDiscAnalytics | null>(null);
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

    const loadInitialData = async () => {
        try {
            setLoading(true);
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
            setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamData = async (deptId?: string) => {
        try {
            const data = await fetchTeamDiscAnalytics(deptId);
            setTeamAnalytics(data);
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
            setError(`Iltimos, barcha ${questions.length} ta savolga javob bering (${unanswered.length} ta javob berilmagan).`);
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
            const updatedProfile = await fetchMyDiscProfile();
            setProfileData(updatedProfile);
            setActiveTab("profile");
            fetchTeamData();
        } catch (err: any) {
            setError(err.message || "Test natijasini yuborishda xatolik yuz berdi");
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
            setError("Savol matnini kiriting.");
            return;
        }
        if (!optD.trim() || !optI.trim() || !optS.trim() || !optC.trim()) {
            setError("Barcha 4 ta (D, I, S, C) variantlar to'ldirilishi shart.");
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
                setSuccessMessage("Savol muvaffaqiyatli yangilandi!");
            } else {
                await createDiscQuestion(payload);
                setSuccessMessage("Yangi savol muvaffaqiyatli qo'shildi!");
            }

            setIsQuestionModalOpen(false);
            const freshQuestions = await fetchDiscQuestions();
            setQuestions(freshQuestions);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setError(err.message || "Savolni saqlashda xatolik yuz berdi");
        } finally {
            setSavingQuestion(false);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm("Haqiqatan ham bu savolni o'chirmoqchimisiz?")) return;
        try {
            await deleteDiscQuestion(id);
            setSuccessMessage("Savol o'chirildi.");
            const freshQuestions = await fetchDiscQuestions();
            setQuestions(freshQuestions);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setError(err.message || "Savolni o'chirishda xatolik yuz berdi");
        }
    };

    const isHrAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "HR_ADMIN";
    const canViewTeamAnalytics = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "HR_ADMIN" || currentUser?.role === "DIRECTOR" || currentUser?.role === "DEPARTMENT_HEAD";

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-xs font-bold uppercase tracking-widest text-black animate-pulse">
                    DISC ma'lumotlari yuklanmoqda...
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIdx];
    const progressPercent = questions.length > 0 ? Math.round(((currentQuestionIdx + 1) / questions.length) * 100) : 0;
    const answeredCount = Object.keys(answers).length;

    const discTypeColors: Record<string, { bg: string; text: string; border: string; bar: string; name: string }> = {
        D: { bg: "bg-red-50", text: "text-red-700", border: "border-red-500", bar: "bg-red-600", name: "Dominance (Yetakchilik / Natija)" },
        I: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-500", bar: "bg-amber-500", name: "Influence (Muloqot / Ta'sir)" },
        S: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-500", bar: "bg-emerald-600", name: "Steadiness (Barqarorlik / Hamjihatlik)" },
        C: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-500", bar: "bg-blue-600", name: "Conscientiousness (Aniqlik / Tahlil)" },
    };

    const departmentsList = teamAnalytics ? Array.from(new Set(teamAnalytics.members.map((m) => m.department).filter(Boolean))) : [];
    const filteredMembers = teamAnalytics
        ? teamAnalytics.members.filter((m) => selectedDepartment === "ALL" || m.department === selectedDepartment)
        : [];

    return (
        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto py-8 px-4 md:px-8">
            <div className="flex flex-col gap-2 border-b border-black pb-6">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Psixometrik Tahlil va Shaxsiyat Turlari
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
                        DISC Baholash Tizimi
                    </h1>
                    <div className="flex flex-wrap items-center border border-black bg-white p-1">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                                activeTab === "profile" ? "bg-black text-white" : "text-black hover:bg-gray-100"
                            }`}
                        >
                            Mening Profilim
                        </button>
                        <button
                            onClick={() => setActiveTab("test")}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                                activeTab === "test" ? "bg-black text-white" : "text-black hover:bg-gray-100"
                            }`}
                        >
                            {profileData?.hasTakenTest ? "Testni Qayta Topshirish" : "Test Topshirish"}
                        </button>
                        {canViewTeamAnalytics && (
                            <button
                                onClick={() => setActiveTab("team")}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                                    activeTab === "team" ? "bg-black text-white" : "text-black hover:bg-gray-100"
                                }`}
                            >
                                Jamoaviy Tahlil
                            </button>
                        )}
                        {isHrAdmin && (
                            <button
                                onClick={() => setActiveTab("questions")}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                                    activeTab === "questions" ? "bg-black text-white" : "text-black hover:bg-gray-100"
                                }`}
                            >
                                Savollar Boshqaruvi
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-xs">✕</button>
                </div>
            )}

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="text-xs">✕</button>
                </div>
            )}

            {activeTab === "profile" && (
                <div className="flex flex-col gap-8">
                    {profileData?.hasTakenTest && profileData.assessment ? (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="border border-black bg-white p-6 md:p-8 flex flex-col justify-between shadow-xs">
                                    <div className="space-y-4">
                                        <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                            Asosiy Shaxsiyat Turi
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-16 h-16 border-2 ${discTypeColors[profileData.assessment.primaryType]?.border || "border-black"} ${discTypeColors[profileData.assessment.primaryType]?.bg || "bg-gray-50"} flex items-center justify-center text-3xl font-black ${discTypeColors[profileData.assessment.primaryType]?.text || "text-black"}`}>
                                                {profileData.assessment.primaryType}
                                            </div>
                                            <div>
                                                <div className="text-xl font-black uppercase tracking-tight text-black">
                                                    {discTypeColors[profileData.assessment.primaryType]?.name.split(" ")[0]}
                                                </div>
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {discTypeColors[profileData.assessment.primaryType]?.name.split(" ").slice(1).join(" ")}
                                                </div>
                                            </div>
                                        </div>

                                        {profileData.assessment.secondaryType && (
                                            <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs">
                                                <span className="font-bold text-gray-500 uppercase">Qo'shimcha tur:</span>
                                                <span className="font-black text-black bg-gray-100 px-2 py-0.5 border border-gray-200">
                                                    {profileData.assessment.secondaryType} — {discTypeColors[profileData.assessment.secondaryType]?.name.split(" ")[0]}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 mt-6 flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase text-gray-400">
                                            Sana: {new Date(profileData.assessment.createdAt).toLocaleDateString("uz-UZ")}
                                        </span>
                                        <button
                                            onClick={startRetakeTest}
                                            className="text-xs font-bold text-black uppercase hover:underline"
                                        >
                                            Qayta Topshirish →
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 border border-black bg-white p-6 md:p-8 space-y-6 shadow-xs">
                                    <div className="flex items-center justify-between border-b border-black pb-3">
                                        <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                                            DISC Ko'rsatkichlari Taqsimoti
                                        </h2>
                                        <span className="text-xs font-bold text-gray-500">
                                            100% Shaxsiyat Matritsasi
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {[
                                            { key: "D", label: "D — Dominance", desc: "Yetakchilik, qat'iyat, tezkor natija", score: profileData.assessment.dScore, color: "bg-red-600", textColor: "text-red-700", bg: "bg-red-50" },
                                            { key: "I", label: "I — Influence", desc: "Muloqotmandlik, optimizm, ilhom", score: profileData.assessment.iScore, color: "bg-amber-500", textColor: "text-amber-700", bg: "bg-amber-50" },
                                            { key: "S", label: "S — Steadiness", desc: "Barqarorlik, ishonch, hamjihatlik", score: profileData.assessment.sScore, color: "bg-emerald-600", textColor: "text-emerald-700", bg: "bg-emerald-50" },
                                            { key: "C", label: "C — Conscientiousness", desc: "Aniqlik, tahlil, sifat va qoidalar", score: profileData.assessment.cScore, color: "bg-blue-600", textColor: "text-blue-700", bg: "bg-blue-50" },
                                        ].map((item) => (
                                            <div key={item.key} className={`border border-gray-200 ${item.bg} p-4 space-y-2`}>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-black uppercase ${item.textColor}`}>
                                                        {item.label}
                                                    </span>
                                                    <span className="text-base font-black text-black">
                                                        {item.score}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-gray-200">
                                                    <div
                                                        className={`h-full ${item.color} transition-all duration-700`}
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
                                    <div className="border border-gray-200 bg-white p-6 space-y-3">
                                        <div className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-2">
                                            🎯 Asosiy Xususiyatlar
                                        </div>
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                            {profileData.description.primary.traits}
                                        </p>
                                    </div>

                                    <div className="border border-gray-200 bg-white p-6 space-y-3">
                                        <div className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-2">
                                            💬 Muloqot Uslubi
                                        </div>
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                            {profileData.description.primary.communication}
                                        </p>
                                    </div>

                                    <div className="border border-gray-200 bg-white p-6 space-y-3">
                                        <div className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-2">
                                            ⭐ Kuchli Tomonlar
                                        </div>
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                            {profileData.description.primary.strengths}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="border border-black bg-white p-12 text-center flex flex-col items-center gap-6 shadow-xs">
                            <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl font-black">
                                ?
                            </div>
                            <div className="space-y-2 max-w-lg">
                                <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                                    DISC Testidan Hali O'tmagansiz
                                </h2>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    O'z shaxsiy xarakteringiz, muloqot va yetakchilik uslubingizni aniqlash hamda jamoa bilan yanada samarali hamkorlik qilish uchun qisqa DISC testini topshiring.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab("test")}
                                className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                            >
                                Testni Boshlash ({questions.length} ta savol) →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "test" && (
                <div className="max-w-3xl mx-auto w-full border border-black bg-white p-6 md:p-10 shadow-lg space-y-8">
                    <div className="flex items-center justify-between border-b border-black pb-4">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Savol {currentQuestionIdx + 1} / {questions.length}
                            </span>
                            <h2 className="text-lg font-black uppercase text-black">
                                Shaxsiyat Testi
                            </h2>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-black">
                                {answeredCount} / {questions.length} javob berildi
                            </span>
                            <div className="w-32 bg-gray-100 h-2 rounded-full mt-1.5 overflow-hidden border border-gray-300">
                                <div
                                    className="bg-black h-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {currentQ && (
                        <div className="space-y-6">
                            <h3 className="text-base md:text-lg font-bold text-black leading-snug">
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
                                            className={`w-full text-left p-4.5 border transition-all flex items-start gap-3.5 ${
                                                isSelected
                                                    ? "border-black bg-black text-white shadow-xs font-semibold"
                                                    : "border-gray-300 bg-white hover:border-black text-black"
                                            }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                                                    isSelected ? "border-white bg-white text-black font-black" : "border-gray-400"
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

                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            disabled={currentQuestionIdx === 0}
                            onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                            className="px-5 py-2.5 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ← Oldingisi
                        </button>

                        {currentQuestionIdx < questions.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                                className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                            >
                                Keyingisi →
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={submitting || answeredCount < questions.length}
                                onClick={handleSubmitTest}
                                className="px-8 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submitting ? "Hisoblanmoqda..." : "Testni Yakunlash va Natijani Ko'rish ✓"}
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
                                <div className="border border-black bg-white p-6 space-y-2 shadow-xs">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block">
                                        Jami Xodimlar
                                    </span>
                                    <span className="text-3xl font-black text-black">
                                        {teamAnalytics.totalEmployees}
                                    </span>
                                    <span className="text-xs text-gray-500 block">
                                        Kompaniya a'zolari
                                    </span>
                                </div>

                                <div className="border border-black bg-white p-6 space-y-2 shadow-xs">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block">
                                        Test Topshirganlar
                                    </span>
                                    <span className="text-3xl font-black text-emerald-600">
                                        {teamAnalytics.totalAssessed}
                                    </span>
                                    <span className="text-xs text-gray-500 block">
                                        {Math.round((teamAnalytics.totalAssessed / (teamAnalytics.totalEmployees || 1)) * 100)}% qamrov
                                    </span>
                                </div>

                                <div className="md:col-span-2 border border-black bg-white p-6 space-y-4 shadow-xs">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block">
                                        Jamoaviy DISC Tiplari Taqsimoti
                                    </span>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-red-50 border border-red-200 p-2">
                                            <span className="text-xs font-black text-red-700 block">D</span>
                                            <span className="text-sm font-bold text-black">{teamAnalytics.distribution.D}%</span>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-200 p-2">
                                            <span className="text-xs font-black text-amber-700 block">I</span>
                                            <span className="text-sm font-bold text-black">{teamAnalytics.distribution.I}%</span>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-200 p-2">
                                            <span className="text-xs font-black text-emerald-700 block">S</span>
                                            <span className="text-sm font-bold text-black">{teamAnalytics.distribution.S}%</span>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 p-2">
                                            <span className="text-xs font-black text-blue-700 block">C</span>
                                            <span className="text-sm font-bold text-black">{teamAnalytics.distribution.C}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black pb-3">
                                    <h2 className="text-lg font-black uppercase text-black">
                                        Xodimlar Bo'yicha DISC Ko'rsatkichlari
                                    </h2>
                                    {departmentsList.length > 0 && (
                                        <select
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(e.target.value)}
                                            className="border border-gray-300 px-3 py-1.5 text-xs font-bold uppercase focus:border-black focus:outline-none bg-[#fcfcfc]"
                                        >
                                            <option value="ALL">Barcha Bo'limlar</option>
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
                                            <div key={member.employeeId} className="border border-gray-200 bg-white p-5 space-y-4 hover:border-black transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="text-sm font-bold text-black">
                                                            {member.fullName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium">
                                                            {member.department || "Bo'limsiz"} • {member.position || "Lavozimsiz"}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2.5 py-1 text-xs font-black border ${typeStyle.border} ${typeStyle.bg} ${typeStyle.text}`}>
                                                        {member.primaryType} {member.secondaryType ? `+ ${member.secondaryType}` : ""}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-4 gap-1.5 text-[10px] text-center pt-2 border-t border-gray-100 font-bold">
                                                    <div className="bg-gray-50 p-1">
                                                        <span className="text-red-700 block font-black">D</span>
                                                        <span>{member.scores.D}%</span>
                                                    </div>
                                                    <div className="bg-gray-50 p-1">
                                                        <span className="text-amber-700 block font-black">I</span>
                                                        <span>{member.scores.I}%</span>
                                                    </div>
                                                    <div className="bg-gray-50 p-1">
                                                        <span className="text-emerald-700 block font-black">S</span>
                                                        <span>{member.scores.S}%</span>
                                                    </div>
                                                    <div className="bg-gray-50 p-1">
                                                        <span className="text-blue-700 block font-black">C</span>
                                                        <span>{member.scores.C}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
                            Jamoa tahlili ma'lumotlari mavjud emas.
                        </div>
                    )}
                </div>
            )}

            {activeTab === "questions" && isHrAdmin && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black pb-4">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-black">
                                DISC Test Savollari Boshqaruvi
                            </h2>
                            <p className="text-xs text-gray-500">
                                Xodimlar test topshirganda ko'rinadigan savollar va 4 ta variantlar ro'yxati
                            </p>
                        </div>
                        <button
                            onClick={openCreateQuestionModal}
                            className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shrink-0"
                        >
                            + Yangi Savol Qo'shish
                        </button>
                    </div>

                    <div className="space-y-4">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="border border-gray-200 bg-white p-6 space-y-4 shadow-xs">
                                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-black shrink-0">
                                            {q.order || idx + 1}
                                        </span>
                                        <h3 className="text-sm font-bold text-black">
                                            {q.text}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => openEditQuestionModal(q)}
                                            className="px-3 py-1 text-xs font-bold uppercase border border-gray-300 hover:border-black transition-colors"
                                        >
                                            Tahrirlash
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            className="px-3 py-1 text-xs font-bold uppercase border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
                                        >
                                            O'chirish
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {q.options.map((opt) => {
                                        const typeStyle = discTypeColors[opt.discType] || discTypeColors.D;
                                        return (
                                            <div key={opt.id} className={`p-3 border ${typeStyle.border} ${typeStyle.bg} flex items-start gap-2.5 text-xs`}>
                                                <span className={`w-5 h-5 rounded-full ${typeStyle.bar} text-white font-black flex items-center justify-center text-[10px] shrink-0`}>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white border border-black max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
                        <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                                    {editingQuestion ? "DISC Savolini Tahrirlash" : "Yangi DISC Savoli Qo'shish"}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Savol matni va 4 ta xarakter turiga (D, I, S, C) mos javoblarni kiriting
                                </p>
                            </div>
                            <button
                                onClick={() => setIsQuestionModalOpen(false)}
                                className="text-gray-400 hover:text-black transition-colors p-1"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuestion} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                                        Savol Matni *
                                    </label>
                                    <input
                                        type="text"
                                        value={qText}
                                        onChange={(e) => setQText(e.target.value)}
                                        placeholder="Masalan: Yangi loyihaga kirishganda birinchi navbatda nima qilasiz?"
                                        className="w-full border border-gray-300 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none bg-[#fcfcfc]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                                        Tartib (№) *
                                    </label>
                                    <input
                                        type="number"
                                        value={qOrder}
                                        onChange={(e) => setQOrder(Number(e.target.value))}
                                        min={1}
                                        className="w-full border border-gray-300 px-3.5 py-2.5 text-sm font-bold focus:border-black focus:outline-none bg-[#fcfcfc]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-100 pb-1">
                                    DISC Javob Variantlari
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold uppercase text-red-700">
                                        [D] — Dominance (Yetakchilik, qat'iyat, tezkor qaror):
                                    </label>
                                    <input
                                        type="text"
                                        value={optD}
                                        onChange={(e) => setOptD(e.target.value)}
                                        placeholder="Dominance xarakteriga mos javob..."
                                        className="w-full border border-red-300 p-2.5 text-xs focus:border-red-600 focus:outline-none bg-red-50/40"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold uppercase text-amber-700">
                                        [I] — Influence (Muloqot, jamoani ilhomlantirish, optimizm):
                                    </label>
                                    <input
                                        type="text"
                                        value={optI}
                                        onChange={(e) => setOptI(e.target.value)}
                                        placeholder="Influence xarakteriga mos javob..."
                                        className="w-full border border-amber-300 p-2.5 text-xs focus:border-amber-600 focus:outline-none bg-amber-50/40"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold uppercase text-emerald-700">
                                        [S] — Steadiness (Barqarorlik, sabr, ishonch, hamjihatlik):
                                    </label>
                                    <input
                                        type="text"
                                        value={optS}
                                        onChange={(e) => setOptS(e.target.value)}
                                        placeholder="Steadiness xarakteriga mos javob..."
                                        className="w-full border border-emerald-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none bg-emerald-50/40"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold uppercase text-blue-700">
                                        [C] — Conscientiousness (Aniqlik, chuqur tahlil, sifat va qoidalar):
                                    </label>
                                    <input
                                        type="text"
                                        value={optC}
                                        onChange={(e) => setOptC(e.target.value)}
                                        placeholder="Conscientiousness xarakteriga mos javob..."
                                        className="w-full border border-blue-300 p-2.5 text-xs focus:border-blue-600 focus:outline-none bg-blue-50/40"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsQuestionModalOpen(false)}
                                    disabled={savingQuestion}
                                    className="px-5 py-2.5 border border-gray-300 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-100 transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingQuestion}
                                    className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                >
                                    {savingQuestion ? "Saqlanmoqda..." : editingQuestion ? "Yangilash" : "Qo'shish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
