"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function HRAcademyManagementPage() {
    const t = useTranslations("HRAcademyManagement");
    const router = useRouter();

    const [courses, setCourses] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isRequired, setIsRequired] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${API_URL}/academy/courses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                const courseList = Array.isArray(data)
                    ? data
                    : data.data || data.courses || [];
                setCourses(courseList);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleSubmit = async () => {
        if (!title.trim()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;

            const url = editingId
                ? `${API_URL}/academy/courses/${editingId}`
                : `${API_URL}/academy/courses`;

            const method = editingId ? "PATCH" : "POST";

            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("isRequired", String(isRequired));

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

            if (!res.ok) {
                throw new Error(t("errorDefault"));
            }

            fetchCourses();
            setTitle("");
            setDescription("");
            setCoverFile(null);
            setVideoFile(null);
            setIsRequired(false);
            setEditingId(null);
            alert(t("successSave"));
        } catch (err) {
            console.error(err);
            alert(t("errorDefault"));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (course: any) => {
        setEditingId(course.id);
        setTitle(course.title);
        setDescription(course.description || "");
        setIsRequired(course.isRequired || false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setIsRequired(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("confirmDelete"))) return;

        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${API_URL}/academy/courses/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error(t("errorDefault"));
            }

            fetchCourses();
            alert(t("successDelete"));
        } catch (err) {
            console.error(err);
            alert(t("errorDefault"));
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto p-8">
            <button 
                onClick={() => router.back()} 
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit"
            >
                &larr; {t("goBack") || "Orqaga"}
            </button>
            <div className="p-8 bg-white border border-gray-200">
                <h2 className="text-xl font-bold uppercase mb-4">
                    {editingId ? t("editCourse") : t("addCourse")}
                </h2>
                <div className="flex flex-col gap-4 max-w-md">
                    <input
                        placeholder={t("titlePlaceholder")}
                        value={title}
                        className="p-2 border"
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                        placeholder={t("descPlaceholder")}
                        value={description}
                        className="p-2 border"
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600">
                            {t("coverLabel")}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            className="p-2 border text-sm"
                            onChange={(e) =>
                                setCoverFile(e.target.files?.[0] || null)
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-600">
                            {t("videoLabel")}
                        </label>
                        <input
                            type="file"
                            accept="video/*"
                            className="p-2 border text-sm"
                            onChange={(e) =>
                                setVideoFile(e.target.files?.[0] || null)
                            }
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isRequired}
                            onChange={(e) => setIsRequired(e.target.checked)}
                            className="w-4 h-4"
                        />
                        {t("isRequiredLabel")}
                    </label>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-black text-white p-2 font-bold uppercase disabled:opacity-50"
                        >
                            {loading
                                ? t("loading")
                                : editingId
                                  ? t("updateBtn")
                                  : t("saveBtn")}
                        </button>
                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="border border-gray-300 p-2 font-bold uppercase"
                            >
                                {t("cancelBtn")}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold uppercase">
                    {t("coursesHeading")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            {t("noCourses")}
                        </p>
                    ) : (
                        courses.map((course: any) => {
                            const API_URL =
                                process.env.NEXT_PUBLIC_API_URL || "";
                            return (
                                <div
                                    key={course.id}
                                    className="p-6 bg-white border border-gray-200 flex flex-col justify-between gap-4"
                                >
                                    <div className="flex flex-col gap-2">
                                        {course.coverUrl && (
                                            <img
                                                src={`${API_URL.replace("/api", "")}${course.coverUrl}`}
                                                alt={course.title}
                                                className="w-full h-32 object-cover rounded mb-2"
                                            />
                                        )}
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-base font-bold">
                                                {course.title}
                                            </h3>
                                            {course.isRequired && (
                                                <span className="text-[10px] bg-black text-white px-2 py-0.5 uppercase font-bold rounded">
                                                    {t("requiredBadge")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {course.description || t("noDesc")}
                                        </p>
                                        {course.videoUrl && (
                                            <video
                                                controls
                                                className="w-full h-32 rounded mt-2 bg-black"
                                                src={`${API_URL.replace("/api", "")}${course.videoUrl}`}
                                            />
                                        )}
                                    </div>
                                    <div className="flex gap-4 border-t pt-4">
                                        <button
                                            onClick={() => handleEdit(course)}
                                            className="text-xs font-bold uppercase text-blue-600 hover:underline"
                                        >
                                            {t("editBtn")}
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(course.id)
                                            }
                                            className="text-xs font-bold uppercase text-red-600 hover:underline"
                                        >
                                            {t("deleteBtn")}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
