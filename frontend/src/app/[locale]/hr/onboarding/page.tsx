"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import OnboardingForm from "../../../../components/hr/onboarding/OnboardingForm";
import OnboardingFilterTabs from "../../../../components/hr/onboarding/OnboardingFilterTabs";
import OnboardingTemplateCard from "../../../../components/hr/onboarding/OnboardingTemplateCard";
import { fetchAllStatuses } from "@/src/services/employee-status-service";

export default function HROnboardingPage() {
    const t = useTranslations("HROnboardingPage");
    const router = useRouter();

    const [templates, setTemplates] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [targetStatus, setTargetStatus] = useState("ALL");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isRequired, setIsRequired] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("ALL");

    const loadData = async () => {
        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const [templatesRes, statusesData] = await Promise.all([
                fetch(`${API_URL}/onboarding/templates`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then((r) => r.json()),
                fetchAllStatuses().catch(() => []),
            ]);

            const list = Array.isArray(templatesRes)
                ? templatesRes
                : templatesRes.data || templatesRes.templates || [];
            setTemplates(list);
            setStatuses(statusesData || []);
        } catch (err) {
            console.error(err);
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

            loadData();
            resetForm();
            alert(editingId ? t("successUpdate") : t("successAdd"));
        } catch (err: any) {
            console.error(err);
            alert(err.message || t("errorDefault"));
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

            loadData();
            alert(t("successDelete"));
        } catch (err: any) {
            console.error(err);
            alert(err.message || t("errorDefault"));
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
                    <h2 className="text-xl font-black uppercase tracking-tight text-black">
                        {t("templatesHeading")}
                    </h2>
                </div>

                <OnboardingFilterTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    statuses={statuses}
                    templates={templates}
                />

                {filteredTemplates.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-gray-200 text-sm font-bold text-gray-400 uppercase tracking-widest">
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
        </div>
    );
}
