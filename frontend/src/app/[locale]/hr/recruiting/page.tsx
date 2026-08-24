"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import RecruitingBoard from "@/src/components/hr/recruiting/recruiting-board";
import { getVacancies, updateCandidateStage, hireCandidate, createVacancy, updateVacancy, deleteVacancy } from "@/src/services/recruiting-service";
import { fetchDepartments } from "@/src/services/department-service";
import { fetchAllUsers } from "@/src/services/user-service";

export default function HRRecruitingPage() {
    const t = useTranslations("Recruiting");
    const router = useRouter();
    const [vacancies, setVacancies] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [vacancyModalOpen, setVacancyModalOpen] = useState(false);
    const [editingVacancyId, setEditingVacancyId] = useState<string | null>(null);
    const [vacancyForm, setVacancyForm] = useState({
        title: "",
        companyName: "",
        description: "",
        requirements: [""],
        departmentId: "",
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [vacsData, depsData, usersData] = await Promise.all([
                getVacancies(),
                fetchDepartments(),
                fetchAllUsers(),
            ]);
            setVacancies(vacsData);
            setDepartments(depsData);
            
            const potentialManagers = usersData
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
        } catch (error) {
            console.error("Failed to update stage", error);
            alert("Error updating candidate stage.");
        }
    };

    const handleHire = async (candidateId: string, departmentId: string, managerId: string) => {
        try {
            await hireCandidate(candidateId, departmentId, managerId);
            await loadData();
        } catch (error: any) {
            console.error("Failed to hire candidate", error);
            alert(error.message || "Error hiring candidate.");
        }
    };

    const handleCreateVacancy = async () => {
        if (!vacancyForm.title || vacancyForm.title.length < 3) {
            alert(t("vacancyTitle") + " min 3 chars");
            return;
        }
        if (!vacancyForm.description || vacancyForm.description.length < 10) {
            alert(t("description") + " min 10 chars");
            return;
        }
        if (vacancyForm.requirements.some(r => !r.trim())) {
            alert(t("requirements"));
            return;
        }
        try {
            if (editingVacancyId) {
                await updateVacancy(editingVacancyId, {
                    ...vacancyForm,
                    requirements: JSON.stringify(vacancyForm.requirements.filter((r) => r.trim() !== "")),
                });
            } else {
                await createVacancy({
                    ...vacancyForm,
                    requirements: JSON.stringify(vacancyForm.requirements.filter((r) => r.trim() !== "")),
                });
            }
            setVacancyModalOpen(false);
            setEditingVacancyId(null);
            setVacancyForm({ title: "", companyName: "", description: "", requirements: [""], departmentId: "" });
            await loadData();
        } catch (error: any) {
            console.error("Failed to save vacancy", error);
            alert(error.message || "Error");
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

    const handleDeleteVacancy = async (id: string) => {
        try {
            await deleteVacancy(id);
            await loadData();
        } catch (error: any) {
            console.error("Failed to delete vacancy", error);
            alert(error.message || "Error");
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
            <div className="flex items-start justify-between gap-4">
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
                <button
                    onClick={() => {
                        setEditingVacancyId(null);
                        setVacancyForm({ title: "", companyName: "", description: "", requirements: [""], departmentId: "" });
                        setVacancyModalOpen(true);
                    }}
                    className="px-6 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                    {t("newVacancy")}
                </button>
            </div>

            {loading ? (
                <div className="text-center p-8 font-bold text-gray-500">{t("loading")}</div>
            ) : (
                <RecruitingBoard 
                    vacancies={vacancies} 
                    departments={departments}
                    managers={managers}
                    onStageChange={handleStageChange}
                    onHire={handleHire}
                    onEdit={handleEditVacancy}
                    onDelete={handleDeleteVacancy}
                />
            )}

            {vacancyModalOpen && (
                <div className="bg-white border border-gray-200 p-8 flex flex-col gap-6 mt-8">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-2">
                            {editingVacancyId ? t("editVacancyTitle") : t("createVacancyTitle")}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                {t("vacancyTitle")} *
                            </label>
                            <input
                                type="text"
                                value={vacancyForm.title}
                                onChange={(e) => setVacancyForm({ ...vacancyForm, title: e.target.value })}
                                className="w-full p-3 border border-gray-200 text-xs focus:outline-none focus:border-black"
                                placeholder={t("vacancyTitle")}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                {t("companyName")}
                            </label>
                            <input
                                type="text"
                                value={vacancyForm.companyName}
                                onChange={(e) => setVacancyForm({ ...vacancyForm, companyName: e.target.value })}
                                className="w-full p-3 border border-gray-200 text-xs focus:outline-none focus:border-black"
                                placeholder={t("companyName")}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                {t("description")} *
                            </label>
                            <textarea
                                value={vacancyForm.description}
                                onChange={(e) => setVacancyForm({ ...vacancyForm, description: e.target.value })}
                                className="w-full p-3 border border-gray-200 text-xs focus:outline-none focus:border-black h-24 resize-none"
                                placeholder={t("description")}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
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
                                        className="w-full p-3 border border-gray-200 text-xs focus:outline-none focus:border-black"
                                        placeholder={`${t("requirements")} ${index + 1}`}
                                    />
                                    {vacancyForm.requirements.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newReqs = vacancyForm.requirements.filter((_, i) => i !== index);
                                                setVacancyForm({ ...vacancyForm, requirements: newReqs });
                                            }}
                                            className="px-3 py-3 border border-red-200 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
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
                                className="mt-2 text-[10px] font-bold uppercase tracking-widest text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                            >
                                {t("addRequirement")}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 w-fit">
                        <button
                            onClick={handleCreateVacancy}
                            className="px-8 bg-black text-white text-[12px] font-bold uppercase tracking-wider py-3 hover:bg-gray-800 transition-colors"
                        >
                            {editingVacancyId ? t("save") : t("create")}
                        </button>
                        <button
                            onClick={() => {
                                setVacancyModalOpen(false);
                                setEditingVacancyId(null);
                            }}
                            className="px-8 bg-gray-100 text-black text-[12px] font-bold uppercase tracking-wider py-3 hover:bg-gray-200 transition-colors"
                        >
                            {t("cancel")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

