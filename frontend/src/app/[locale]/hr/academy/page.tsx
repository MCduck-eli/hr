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
    const [departments, setDepartments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [targetDepartmentId, setTargetDepartmentId] = useState<string>("");
    const [targetEmployeeId, setTargetEmployeeId] = useState<string>("");

    const fetchDropdownData = async () => {
        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const headers = { Authorization: `Bearer ${token}` };

            const [deptRes, empRes] = await Promise.all([
                fetch(`${API_URL}/departments`, { headers }),
                fetch(`${API_URL}/users`, { headers }),
            ]);

            if (deptRes.ok) {
                const data = await deptRes.json();
                setDepartments(data.data || data || []);
            }
            if (empRes.ok) {
                const storedUser = localStorage.getItem("user");
                let currentUserId = "";
                let currentUserEmpId = "";
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        currentUserId = parsed.id;
                        currentUserEmpId = parsed.employee?.id;
                    } catch (err) {}
                }

                const data = await empRes.json();
                const allUsers = data.data || data || [];
                setEmployees(
                    allUsers.filter(
                        (u: any) =>
                            u.employee?.id &&
                            u.role !== "SUPER_ADMIN" &&
                            u.role !== "DIRECTOR"
                    )
                );
            }
        } catch (e) {
            console.error(e);
        }
    };

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
        fetchDropdownData();
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
            formData.append("targetDepartmentId", targetDepartmentId || "");
            formData.append("targetEmployeeId", targetEmployeeId || "");

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
            setTargetDepartmentId("");
            setTargetEmployeeId("");
            alert(editingId ? t("successUpdate") : t("successAdd"));
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
        setTargetDepartmentId(course.targetDepartmentId || "");
        setTargetEmployeeId(course.targetEmployeeId || "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setIsRequired(false);
        setTargetDepartmentId("");
        setTargetEmployeeId("");
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
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit"
            >
                &larr; {t("goBack") || "Orqaga"}
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    {editingId ? t("editCourse") : t("addCourse")}
                </h2>
                <div className="flex flex-col gap-5 max-w-xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("titlePlaceholder") || "Kurs nomi"}
                        </label>
                        <input
                            placeholder={t("titlePlaceholder")}
                            value={title}
                            className="rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 w-full text-sm"
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("descPlaceholder") || "Tavsif"}
                        </label>
                        <textarea
                            placeholder={t("descPlaceholder")}
                            value={description}
                            rows={3}
                            className="rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 w-full text-sm resize-y"
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("coverLabel")}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            className="rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 w-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                            onChange={(e) =>
                                setCoverFile(e.target.files?.[0] || null)
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t("videoLabel")}
                        </label>
                        <input
                            type="file"
                            accept="video/*"
                            className="rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 w-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                            onChange={(e) =>
                                setVideoFile(e.target.files?.[0] || null)
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Bo'lim (Department)
                        </label>
                        <select
                            className="rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 w-full text-sm bg-white"
                            value={targetDepartmentId}
                            onChange={(e) => {
                                setTargetDepartmentId(e.target.value);
                                if (e.target.value) setTargetEmployeeId("");
                            }}
                        >
                            <option value="">-- Barcha bo'limlar --</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Xodim (Employee)
                        </label>
                        <select
                            className="rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all px-4 py-2.5 w-full text-sm bg-white"
                            value={targetEmployeeId}
                            onChange={(e) => {
                                setTargetEmployeeId(e.target.value);
                                if (e.target.value) setTargetDepartmentId("");
                            }}
                        >
                            <option value="">-- Barcha xodimlar --</option>
                            {employees.map((u) => (
                                <option key={u.employee.id} value={u.employee.id}>
                                    {u.employee.firstName} {u.employee.lastName} ({u.email}){u.role === "HR_ADMIN" ? " [HR Admin]" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isRequired}
                            onChange={(e) => setIsRequired(e.target.checked)}
                            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-gray-300 cursor-pointer"
                        />
                        {t("isRequiredLabel")}
                    </label>

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-[#9327FF] text-white rounded-xl shadow-sm hover:opacity-90 px-8 py-3 font-medium transition-all disabled:opacity-50"
                        >
                            {loading
                                ? t("loading")
                                : editingId
                                  ? t("updateBtn")
                                  : t("saveBtn")}
                        </button>
                        {editingId && (
                            <button
                                onClick={handleCancelEdit}
                                className="bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 px-6 py-3 font-medium transition-all"
                            >
                                {t("cancelBtn")}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                    {t("coursesHeading")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.length === 0 ? (
                        <div className="col-span-full p-8 bg-white rounded-2xl border border-gray-100 text-center text-sm text-gray-500 shadow-sm">
                            {t("noCourses")}
                        </div>
                    ) : (
                        courses.map((course: any) => {
                            const API_URL =
                                process.env.NEXT_PUBLIC_API_URL || "";
                            return (
                                <div
                                    key={course.id}
                                    className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between gap-4"
                                >
                                    <div className="flex flex-col gap-2">
                                        {course.coverUrl && (
                                            <img
                                                src={`${API_URL.replace("/api", "")}${course.coverUrl}`}
                                                alt={course.title}
                                                className="w-full h-36 object-cover rounded-xl mb-2"
                                            />
                                        )}
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="text-base font-bold text-gray-900">
                                                {course.title}
                                            </h3>
                                            {course.isRequired && (
                                                <span className="text-[11px] bg-violet-100 text-violet-700 px-2.5 py-0.5 font-semibold rounded-full shrink-0">
                                                    {t("requiredBadge")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {course.description || t("noDesc")}
                                        </p>

                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {course.targetDepartment && (
                                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 font-medium rounded-lg">
                                                    📁 Bo'lim: {course.targetDepartment.name}
                                                </span>
                                            )}
                                            {course.targetEmployee && (
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 font-medium rounded-lg">
                                                    👤 Xodim: {course.targetEmployee.firstName} {course.targetEmployee.lastName}
                                                </span>
                                            )}
                                        </div>

                                        {course.videoUrl && (
                                            <video
                                                controls
                                                className="w-full h-36 rounded-xl mt-2 bg-black object-cover"
                                                src={`${API_URL.replace("/api", "")}${course.videoUrl}`}
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
                                        <button
                                            onClick={() => handleEdit(course)}
                                            className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                                        >
                                            {t("editBtn")}
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(course.id)
                                            }
                                            className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
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
