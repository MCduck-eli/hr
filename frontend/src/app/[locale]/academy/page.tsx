"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function EmployeeAcademyPage() {
    const t = useTranslations("AcademyPage");
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [videoProgress, setVideoProgress] = useState(0);

    useEffect(() => {
        if (selectedCourse) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [selectedCourse]);

    useEffect(() => {
        const fetchAcademyData = async () => {
            try {
                const token = localStorage.getItem("token");
                const API_URL = process.env.NEXT_PUBLIC_API_URL;

                const res = await fetch(`${API_URL}/employee/dashboard`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (res.ok) {
                    const fetchedCourses = data.data?.activeCourses || [];
                    setCourses(fetchedCourses);
                }
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchAcademyData();
    }, []);

    const handleTimeUpdate = (e: any) => {
        const video = e.target;
        if (!video.duration) return;
        const progress = Math.round((video.currentTime / video.duration) * 100);
        setVideoProgress(progress);

        if (selectedCourse && !selectedCourse.isCompleted) {
            setCourses((prev) =>
                prev.map((c) =>
                    c.id === selectedCourse.id ? { ...c, progress } : c,
                ),
            );
        }
    };

    const handleVideoLoaded = (e: any) => {};

    const handleVideoEnded = async () => {
        setVideoProgress(100);

        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL;

            await fetch(`${API_URL}/employee/progress`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    courseId: selectedCourse.id,
                    type: selectedCourse.type,
                    progress: 100,
                }),
            });

            let endpoint = "";
            let method = "PATCH";
            let body = null;

            if (selectedCourse.type === "ONBOARDING") {
                endpoint = `${API_URL}/onboarding/courses/${selectedCourse.id}/complete`;
            } else if (selectedCourse.type === "ONBOARDING_TASK") {
                endpoint = `${API_URL}/onboarding/tasks/${selectedCourse.id}/status`;
                body = JSON.stringify({ status: "COMPLETED" });
            }

            if (endpoint) {
                await fetch(endpoint, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body,
                });
            }

            setCourses((prevCourses) =>
                prevCourses.map((c) =>
                    c.id === selectedCourse.id && c.type === selectedCourse.type
                        ? { ...c, isCompleted: true, progress: 100 }
                        : c,
                ),
            );

            setSelectedCourse((prev: any) => ({
                ...prev,
                isCompleted: true,
                progress: 100,
            }));
        } catch (error) {}
    };

    const handleCloseModal = async () => {
        if (
            selectedCourse &&
            !selectedCourse.isCompleted &&
            videoProgress > 0
        ) {
            try {
                const token = localStorage.getItem("token");
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                await fetch(`${API_URL}/employee/progress`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        courseId: selectedCourse.id,
                        type: selectedCourse.type,
                        progress: videoProgress,
                    }),
                });
            } catch (error) {}
        }
        setSelectedCourse(null);
    };

    const openCourseModal = (course: any) => {
        setSelectedCourse(course);
        setVideoProgress(course.progress || 0);
    };

    if (loading) return <div className="p-8">Loading...</div>;

    const onboardingCourses = courses.filter(
        (c) => c.type === "ONBOARDING" || c.type === "ONBOARDING_TASK",
    );
    const academyCourses = courses.filter((c) => c.type === "ACADEMY");

    return (
        <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-12 relative min-h-[80vh]">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black uppercase tracking-tight text-black">
                    {t("title")}
                </h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    {t("subtitle")}
                </p>
            </div>

            {courses.length === 0 ? (
                <div className="border border-gray-200 bg-white p-12 flex flex-col items-center justify-center gap-4">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                        {t("noCoursesAssigned")}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-12">
                    {onboardingCourses.length > 0 && (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-xl font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                                {t("onboardingProgram")}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {onboardingCourses.map(
                                    (course: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="border border-gray-200 bg-white p-6 flex flex-col gap-6 hover:border-black transition-colors"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit bg-blue-100 text-blue-700">
                                                    {t("onboardingBadge")}
                                                </span>
                                                <span
                                                    className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                                                        course.isCompleted
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-orange-100 text-orange-700"
                                                    }`}
                                                >
                                                    {course.isCompleted
                                                        ? t("completed")
                                                        : t("new")}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-black line-clamp-2">
                                                {course.title}
                                            </h3>
                                            <div className="flex flex-col gap-2 mt-auto">
                                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-black h-full transition-all duration-300"
                                                        style={{
                                                            width: `${course.progress}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-500">
                                                    {course.progress}{t("progress")}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    openCourseModal(course)
                                                }
                                                className="w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                                            >
                                                {t("view")}
                                            </button>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    {academyCourses.length > 0 && (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-xl font-bold uppercase tracking-wider border-b border-gray-200 pb-4">
                                {t("academyCourses")}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {academyCourses.map(
                                    (course: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="border border-gray-200 bg-white p-6 flex flex-col gap-6 hover:border-black transition-colors"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit bg-purple-100 text-purple-700">
                                                    {t("academyCourseBadge")}
                                                </span>
                                                <span
                                                    className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                                                        course.isCompleted
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-orange-100 text-orange-700"
                                                    }`}
                                                >
                                                    {course.isCompleted
                                                        ? t("completed")
                                                        : t("new")}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-black line-clamp-2">
                                                {course.title}
                                            </h3>
                                            <div className="flex flex-col gap-2 mt-auto">
                                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-black h-full transition-all duration-300"
                                                        style={{
                                                            width: `${course.progress}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-500">
                                                    {course.progress}{t("progress")}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    openCourseModal(course)
                                                }
                                                className="w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                                            >
                                                {t("view")}
                                            </button>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col gap-4 p-6 relative shadow-2xl rounded-sm my-auto overflow-hidden">
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-black font-black uppercase text-xl hover:text-gray-500 transition-colors z-10"
                        >
                            ✕
                        </button>

                        <div className="flex flex-col gap-1 pr-10 shrink-0">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {selectedCourse.type === "ACADEMY"
                                    ? t("academyCourseBadge")
                                    : t("onboardingBadge")}
                            </span>
                            <h2 className="text-xl font-black uppercase tracking-tight text-black line-clamp-1">
                                {selectedCourse.title}
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
                            {selectedCourse.videoUrl && (
                                <div className="flex flex-col gap-2">
                                    <video
                                        controls
                                        autoPlay
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleVideoLoaded}
                                        onEnded={handleVideoEnded}
                                        className="w-full bg-black max-h-[260px] object-contain mx-auto"
                                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${selectedCourse.videoUrl}`}
                                    />
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-black h-full transition-all duration-300"
                                                style={{
                                                    width: `${videoProgress}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 min-w-[40px] text-right">
                                            {videoProgress}%
                                        </span>
                                    </div>
                                </div>
                            )}

                            {selectedCourse.coverUrl &&
                                !selectedCourse.videoUrl && (
                                    <img
                                        className="w-full object-cover max-h-52"
                                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${selectedCourse.coverUrl}`}
                                        alt={selectedCourse.title}
                                    />
                                )}

                            <div className="bg-gray-50 p-4 border border-gray-200">
                                <p className="text-xs font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedCourse.description || t("noDescription")}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 shrink-0">
                            <div className="flex items-center gap-2">
                                {selectedCourse.isCompleted ? (
                                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-600" />
                                        {t("courseCompleted")}
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                        {t("inProgress")}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    if (
                                        !selectedCourse.videoUrl &&
                                        !selectedCourse.isCompleted
                                    ) {
                                        handleVideoEnded();
                                    } else {
                                        handleCloseModal();
                                    }
                                }}
                                className="py-2 px-6 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                            >
                                {!selectedCourse.videoUrl &&
                                !selectedCourse.isCompleted
                                    ? t("finish")
                                    : t("close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
