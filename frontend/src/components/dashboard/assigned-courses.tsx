"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function AssignedCourses({
    activeCourses,
}: {
    activeCourses: any[];
}) {
    const t = useTranslations("DashboardProfile");
    const router = useRouter();

    const handleNavigation = (path: string) => {
        const locale = window.location.pathname.split("/")[1] || "uz";
        router.push(`/${locale}/${path}`);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h2 className="text-lg font-bold uppercase tracking-wider">
                    {t("activeCourses")}
                </h2>
                <button
                    onClick={() => handleNavigation("academy")}
                    className="text-xs font-bold uppercase tracking-widest text-black hover:underline"
                >
                    {t("goToAcademy")} &rarr;
                </button>
            </div>

            {activeCourses.length === 0 ? (
                <div className="p-6 border border-gray-200 bg-white flex flex-col gap-4">
                    <p className="text-sm text-gray-500">
                        {t("noPendingCourses")}
                    </p>
                    <button
                        onClick={() => handleNavigation("academy")}
                        className="w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                    >
                        {t("viewCourses")}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCourses.map((course: any, index: number) => {
                        const isOnboarding =
                            course.type === "ONBOARDING" ||
                            course.type === "ONBOARDING_TASK";

                        return (
                            <div
                                key={index}
                                className="p-5 border border-gray-200 bg-white flex flex-col gap-4"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit ${
                                                isOnboarding
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-purple-100 text-purple-700"
                                            }`}
                                        >
                                            {isOnboarding
                                                ? "Onboarding"
                                                : "Academy"}
                                        </span>
                                        <h3 className="text-sm font-bold text-black">
                                            {course.title}
                                        </h3>
                                    </div>
                                    <span
                                        className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                                            course.isCompleted
                                                ? "bg-green-100 text-green-700"
                                                : "bg-orange-100 text-orange-700"
                                        }`}
                                    >
                                        {course.isCompleted
                                            ? t("watched") || "Ko'rildi"
                                            : t("notWatched") || "Yangi"}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-black h-full"
                                        style={{ width: `${course.progress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs font-bold text-gray-500">
                                        {course.progress}%
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleNavigation(
                                                isOnboarding
                                                    ? "onboarding"
                                                    : "academy",
                                            )
                                        }
                                        className="text-xs font-bold uppercase underline hover:no-underline"
                                    >
                                        {t("continueCourse")}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
