"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import RecruitingBoard from "@/src/components/hr/recruiting/recruiting-board";
import CvParserModal from "@/src/components/hr/recruiting/CvParserModal";
import { getVacancies, updateCandidateStage, hireCandidate, createVacancy, updateVacancy, deleteVacancy, applyForJob } from "@/src/services/recruiting-service";
import { fetchDepartments } from "@/src/services/department-service";
import { fetchAllUsers } from "@/src/services/user-service";

export default function HRRecruitingPage() {
    const t = useTranslations("Recruiting");
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || "uz";

    const [vacancies, setVacancies] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [vacancyModalOpen, setVacancyModalOpen] = useState(false);
    const [cvParserOpen, setCvParserOpen] = useState(false);
    const [editingVacancyId, setEditingVacancyId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [vacancyForm, setVacancyForm] = useState({
        title: "",
        companyName: "",
        description: "",
        requirements: [""],
        departmentId: "",
    });

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [vacsData, depsData, usersData] = await Promise.all([
                getVacancies(),
                fetchDepartments(),
                fetchAllUsers(),
            ]);
            const vacsList = Array.isArray(vacsData) ? vacsData : (vacsData?.data || vacsData?.vacancies || []);
            setVacancies(vacsList);
            const depsList = Array.isArray(depsData) ? depsData : (depsData?.data || []);
            setDepartments(depsList);
            
            const potentialManagers = (Array.isArray(usersData) ? usersData : (usersData?.data || []))
                .filter((u: any) => u.role === "MANAGER" || u.role === "SUPER_ADMIN" || u.role === "HR_ADMIN")
                .map((u: any) => ({
                    id: u.employee?.id,
                    name: `${u.employee?.firstName} ${u.employee?.lastName}`
                }))
                .filter((m: any) => m.id);
            setManagers(potentialManagers);
        } catch (error) {
            console.error("Failed to load recruiting data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStageChange = async (candidateId: string, stage: string, testTaskDeadline?: string | null) => {
        try {
            await updateCandidateStage(candidateId, stage, testTaskDeadline);
            await loadData();
            showToast("Nomzod bosqichi muvaffaqiyatli yangilandi", "success");
        } catch (error: any) {
            console.error("Failed to update stage", error);
            showToast(error?.message || "Bosqichni o'zgartirishda xatolik yuz berdi", "error");
        }
    };

    const handleHire = async (candidateId: string, departmentId: string, managerId: string) => {
        try {
            await hireCandidate(candidateId, departmentId, managerId);
            await loadData();
            showToast("Nomzod muvaffaqiyatli ishga qabul qilindi", "success");
        } catch (error: any) {
            console.error("Failed to hire candidate", error);
            showToast(error.message || "Nomzodni ishga qabul qilishda xatolik yuz berdi", "error");
        }
    };

    const handleCreateVacancy = async () => {
        if (!vacancyForm.title || vacancyForm.title.length < 3) {
            showToast(t("vacancyTitle") + " (kamida 3 belgi)", "error");
            return;
        }
        if (!vacancyForm.description || vacancyForm.description.length < 10) {
            showToast(t("description") + " (kamida 10 belgi)", "error");
            return;
        }
        if (vacancyForm.requirements.some(r => !r.trim())) {
            showToast(t("requirements") || "Iltimos, barcha talablarni to'ldiring", "error");
            return;
        }
        try {
            if (editingVacancyId) {
                await updateVacancy(editingVacancyId, {
                    ...vacancyForm,
                    requirements: JSON.stringify(vacancyForm.requirements.filter((r) => r.trim() !== "")),
                });
                showToast("Vakansiya muvaffaqiyatli yangilandi!", "success");
            } else {
                await createVacancy({
                    ...vacancyForm,
                    requirements: JSON.stringify(vacancyForm.requirements.filter((r) => r.trim() !== "")),
                });
                showToast("Vakansiya muvaffaqiyatli yaratildi!", "success");
            }
            setVacancyModalOpen(false);
            setEditingVacancyId(null);
            setVacancyForm({ title: "", companyName: "", description: "", requirements: [""], departmentId: "" });
            await loadData();
        } catch (error: any) {
            console.error("Failed to save vacancy", error);
            showToast(error.message || "Vakansiyani saqlashda xatolik yuz berdi", "error");
        }
    };

    const handleEditVacancy = (vacancy: any) => {
        let reqs = [""];
        try {
            reqs = JSON.parse(vacancy.requirements);
            if (!Array.isArray(reqs)) throw new Error();
        } catch {
            reqs = vacancy.requirements ? [vacancy.requirements] : [""];
        }
        
        setVacancyForm({
            title: vacancy.title,
            companyName: vacancy.companyName || "",
            description: vacancy.description,
            requirements: reqs,
            departmentId: vacancy.departmentId || "",
        });
        setEditingVacancyId(vacancy.id);
        setVacancyModalOpen(true);
    };

    const openDeleteModal = (id: string) => {
        setSelectedVacancyId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedVacancyId) return;
        try {
            setDeleting(true);
            await deleteVacancy(selectedVacancyId);
            setIsDeleteModalOpen(false);
            setSelectedVacancyId(null);
            await loadData();
            showToast("Vakansiya muvaffaqiyatli o'chirildi!", "success");
        } catch (error: any) {
            console.error("Failed to delete vacancy", error);
            showToast(error.message || "Vakansiyani o'chirishda xatolik yuz berdi", "error");
        } finally {
            setDeleting(false);
        }
    };

    const handleCandidateExtracted = async (parsedData: any) => {
        if (!vacancies || vacancies.length === 0) {
            showToast("Nomzod qo'shish uchun avval bitta ochiq vakansiya yarating.", "error");
            return;
        }

        const selectedVac = vacancies[0];
        try {
            const formData = new FormData();
            formData.append("fullName", parsedData.fullName || "Nomzod");
            formData.append("email", parsedData.email || `candidate_${Date.now()}@example.com`);
            formData.append("phone", parsedData.phone || "+998900000000");
            formData.append("location", parsedData.location || "Toshkent");
            formData.append("resumeText", parsedData.rawText || JSON.stringify(parsedData.skills));
            formData.append("vacancyId", selectedVac.id);

            await applyForJob(formData);
            await loadData();
            showToast(`"${parsedData.fullName || "Nomzod"}" muvaffaqiyatli "${selectedVac.title}" vakansiyasiga qo'shildi.`, "success");
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Nomzodni qo'shishda xatolik yuz berdi", "error");
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => router.back()}
                        className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit mb-4"
                    >
                        &larr; {t("goBack")}
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight text-black uppercase">
                        {t("title")}
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setCvParserOpen(true)}
                        className="bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 px-5 py-2.5 shadow-sm transition-all text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                        <span>📄</span> Rezyumeni O'qish (CV Parser)
                    </button>

                    <button
                        onClick={() => {
                            setEditingVacancyId(null);
                            setVacancyForm({ title: "", companyName: "", description: "", requirements: [""], departmentId: "" });
                            setVacancyModalOpen(true);
                        }}
                        className="bg-[#9327FF] text-white rounded-xl shadow-sm hover:opacity-90 px-5 py-2.5 transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                        + {t("newVacancy")}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-8 font-bold text-gray-500">{t("loading")}</div>
            ) : (
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900">
                                {t("vacanciesList") || "Mavjud Vakansiyalar"} ({vacancies.length})
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                            {vacancies.length === 0 ? (
                                <div className="col-span-full bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                                    <span className="text-3xl">📋</span>
                                    <p className="font-medium text-sm">Hozircha hech qanday vakansiya mavjud emas</p>
                                </div>
                            ) : (
                                vacancies.map((vac) => (
                                    <div
                                        key={vac.id}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between gap-4 relative transition-hover hover:shadow-md"
                                    >
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="font-bold text-base text-gray-900 leading-snug">
                                                    {vac.title}
                                                </h3>
                                                <span
                                                    className={`shrink-0 text-sm font-medium rounded-lg px-3 py-1 ${
                                                        vac.status === "OPEN" || !vac.status
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}
                                                >
                                                    {vac.status === "OPEN" || !vac.status ? "Ochiq" : "Yopiq"}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">Bo'lim:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {vac.department?.name || "Umumiy"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">Yaratilgan:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {new Date(vac.createdAt).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US")}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">Nomzodlar:</span>
                                                    <span className="font-semibold text-[#9327FF]">
                                                        {vac.candidates?.length || vac._count?.candidates || 0} nafar
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => handleEditVacancy(vac)}
                                                className="px-3.5 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all cursor-pointer"
                                            >
                                                Tahrirlash
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openDeleteModal(vac.id)}
                                                className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all cursor-pointer"
                                            >
                                                O'chirish
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
                        <RecruitingBoard 
                            vacancies={vacancies} 
                            departments={departments}
                            managers={managers}
                            onStageChange={handleStageChange}
                            onHire={handleHire}
                            onEdit={handleEditVacancy}
                            onDelete={openDeleteModal}
                            showToast={showToast}
                        />
                    </div>
                </div>
            )}

            <CvParserModal
                isOpen={cvParserOpen}
                onClose={() => setCvParserOpen(false)}
                onCandidateExtracted={handleCandidateExtracted}
            />

            {vacancyModalOpen && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6 mt-8">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 mb-2">
                            {editingVacancyId ? t("editVacancyTitle") : t("createVacancyTitle")}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                {t("vacancyTitle")} *
                            </label>
                            <input
                                type="text"
                                value={vacancyForm.title}
                                onChange={(e) => setVacancyForm({ ...vacancyForm, title: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                placeholder={t("vacancyTitle")}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                {t("companyName")}
                            </label>
                            <input
                                type="text"
                                value={vacancyForm.companyName}
                                onChange={(e) => setVacancyForm({ ...vacancyForm, companyName: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                placeholder={t("companyName")}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                {t("description")} *
                            </label>
                            <textarea
                                value={vacancyForm.description}
                                onChange={(e) => setVacancyForm({ ...vacancyForm, description: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 h-24 resize-none"
                                placeholder={t("description")}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                {t("requirements")} *
                            </label>
                            {vacancyForm.requirements.map((req, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={req}
                                        onChange={(e) => {
                                            const newReqs = [...vacancyForm.requirements];
                                            newReqs[index] = e.target.value;
                                            setVacancyForm({ ...vacancyForm, requirements: newReqs });
                                        }}
                                        className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        placeholder={`${t("requirements")} ${index + 1}`}
                                    />
                                    {vacancyForm.requirements.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newReqs = vacancyForm.requirements.filter((_, i) => i !== index);
                                                setVacancyForm({ ...vacancyForm, requirements: newReqs });
                                            }}
                                            className="px-3 py-3 rounded-xl border border-red-200 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
                                        >
                                            X
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setVacancyForm({ ...vacancyForm, requirements: [...vacancyForm.requirements, ""] });
                                }}
                                className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-700 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                {t("addRequirement")}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 w-fit">
                        <button
                            onClick={handleCreateVacancy}
                            className="px-8 bg-[#9327FF] text-white text-[12px] font-semibold uppercase tracking-wider py-3 rounded-xl shadow-sm hover:opacity-90 transition-all cursor-pointer"
                        >
                            {editingVacancyId ? t("save") : t("create")}
                        </button>
                        <button
                            onClick={() => {
                                setVacancyModalOpen(false);
                                setEditingVacancyId(null);
                            }}
                            className="px-8 bg-gray-100 text-slate-700 text-[12px] font-semibold uppercase tracking-wider py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            {t("cancel")}
                        </button>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Vakansiyani o'chirish
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Haqiqatan ham bu vakansiyani o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setSelectedVacancyId(null);
                                }}
                                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleConfirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {deleting ? "O'chirilmoqda..." : "O'chirish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-center gap-3 transform transition-all duration-300 animate-in fade-in slide-in-from-top-4">
                    {toast.type === "error" ? (
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900">
                            {toast.message}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs ml-2 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
