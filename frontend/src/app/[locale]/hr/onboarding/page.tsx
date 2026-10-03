"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import OnboardingForm from "../../../../components/hr/onboarding/OnboardingForm";
import OnboardingFilterTabs from "../../../../components/hr/onboarding/OnboardingFilterTabs";
import OnboardingTemplateCard from "../../../../components/hr/onboarding/OnboardingTemplateCard";
import { fetchAllStatuses } from "@/src/services/employee-status-service";
import Skeleton from "@/src/components/ui/Skeleton";
import { getQueryData, setQueryData, isQueryStale, invalidateQuery } from "@/src/utils/query-cache";

export default function HROnboardingPage() {
    const t = useTranslations("HROnboardingPage");
    const router = useRouter();

    const cachedTemplates = getQueryData<any[]>("onboarding:templates");
    const cachedStatuses = getQueryData<any[]>("onboarding:statuses");

    const [templates, setTemplates] = useState<any[]>(() => cachedTemplates || []);
    const [statuses, setStatuses] = useState<any[]>(() => cachedStatuses || []);
    const [isInitialLoading, setIsInitialLoading] = useState(() => !cachedTemplates);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [targetStatus, setTargetStatus] = useState("ALL");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isRequired, setIsRequired] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("ALL");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    const loadData = async (isBackground = false) => {
        const cachedT = getQueryData<any[]>("onboarding:templates");
        const cachedS = getQueryData<any[]>("onboarding:statuses");
        const isStale = isQueryStale("onboarding:templates") || isQueryStale("onboarding:statuses");

        if (cachedT && cachedS) {
            setTemplates(cachedT);
            setStatuses(cachedS);
        } else if (!isBackground) {
            setIsInitialLoading(true);
        }

        if (cachedT && cachedS && !isStale && !isBackground) {
            setIsInitialLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const [templatesRes, statusesData] = await Promise.all([
                fetch(`${API_URL}/onboarding/templates`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then((r) => r.json()).catch(() => []),
                fetchAllStatuses().catch(() => []),
            ]);

            const list = Array.isArray(templatesRes)
                ? templatesRes
                : templatesRes.data || templatesRes.templates || [];
            setTemplates(list || []);
            setStatuses(statusesData || []);
            setQueryData("onboarding:templates", list || []);
            setQueryData("onboarding:statuses", statusesData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsInitialLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setTargetStatus("ALL");
        setCoverFile(null);
        setVideoFile(null);
        setIsRequired(false);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;

            const url = editingId
                ? `${API_URL}/onboarding/templates/${editingId}`
                : `${API_URL}/onboarding/templates`;

            const method = editingId ? "PATCH" : "POST";

            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("isRequired", String(isRequired));
            formData.append("targetStatus", targetStatus);

            if (coverFile) {
                formData.append("cover", coverFile);
            }
            if (videoFile) {
                formData.append("video", videoFile);
            }

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || t("errorDefault"));
            }

            const isEditing = Boolean(editingId);
            invalidateQuery("onboarding:templates");
            await loadData();
            resetForm();
            showToast(isEditing ? "Onboarding shabloni muvaffaqiyatli yangilandi!" : "Onboarding shabloni muvaffaqiyatli qo'shildi!");
        } catch (err: any) {
            console.error(err);
            showToast(err.message || t("errorDefault"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (tmpl: any) => {
        setEditingId(tmpl.id);
        setTitle(tmpl.title);
        setDescription(tmpl.description || "");
        setTargetStatus(tmpl.targetStatusConfigId || tmpl.targetStatus || "ALL");
        setIsRequired(tmpl.isRequired || false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("deleteConfirm"))) return;

        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${API_URL}/onboarding/templates/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || t("errorDefault"));
            }

            invalidateQuery("onboarding:templates");
            await loadData();
            showToast(t("successDelete"));
        } catch (err: any) {
            console.error(err);
            showToast(err.message || t("errorDefault"), "error");
        }
    };

    const filteredTemplates = templates.filter((tmpl) => {
        if (activeTab === "ALL") return true;
        return (
            tmpl.targetStatusConfigId === activeTab ||
            tmpl.targetStatus === activeTab ||
            tmpl.targetStatusConfig?.code === activeTab ||
            tmpl.targetStatusConfig?.id === activeTab
        );
    });

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto p-8">
            <button
                onClick={() => router.back()}
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit"
            >
                &larr; {t("goBack")}
            </button>

            <OnboardingForm
                editingId={editingId}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                targetStatus={targetStatus}
                setTargetStatus={setTargetStatus}
                isRequired={isRequired}
                setIsRequired={setIsRequired}
                setCoverFile={setCoverFile}
                setVideoFile={setVideoFile}
                statuses={statuses}
                loading={loading}
                onSubmit={handleSubmit}
                onCancel={resetForm}
            />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">
                        {t("templatesHeading")}
                    </h2>
                </div>

                <OnboardingFilterTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    statuses={statuses}
                    templates={templates}
                />

                {isInitialLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-6 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between gap-5 shadow-sm">
                                <div className="space-y-3">
                                    <Skeleton className="w-full h-44 rounded-xl" />
                                    <div className="flex justify-between items-center pt-1">
                                        <Skeleton className="w-24 h-5 rounded-lg" />
                                        <Skeleton className="w-16 h-5 rounded-lg" />
                                    </div>
                                    <Skeleton className="w-3/4 h-6 rounded-lg" />
                                    <Skeleton className="w-full h-10 rounded-md" />
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <Skeleton className="w-24 h-4 rounded" />
                                    <div className="flex gap-2">
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        {t("noTemplates")}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredTemplates.map((template: any) => (
                            <OnboardingTemplateCard
                                key={template.id}
                                template={template}
                                statuses={statuses}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

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
