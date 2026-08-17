import { PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/appError";

const prisma = new PrismaClient();

export class DashboardService {
    async getEmployeeDashboardData(id: string) {
        let user = await prisma.user.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        courseProgresses: {
                            include: { course: true },
                        },
                        onboarding: {
                            include: {
                                courses: {
                                    include: { course: true },
                                },
                                tasks: {
                                    include: { task: true },
                                },
                            },
                        },
                        lifecycleEvents: {
                            orderBy: { createdAt: "desc" },
                            take: 3,
                        },
                    },
                },
            },
        });

        if (!user) {
            const employeeRecord = await prisma.employee.findUnique({
                where: { id },
                select: { userId: true },
            });
            if (employeeRecord?.userId) {
                user = await prisma.user.findUnique({
                    where: { id: employeeRecord.userId },
                    include: {
                        employee: {
                            include: {
                                courseProgresses: {
                                    include: { course: true },
                                },
                                onboarding: {
                                    include: {
                                        courses: {
                                            include: { course: true },
                                        },
                                        tasks: {
                                            include: { task: true },
                                        },
                                    },
                                },
                                lifecycleEvents: {
                                    orderBy: { createdAt: "desc" },
                                    take: 3,
                                },
                            },
                        },
                    },
                });
            }
        }

        if (!user) {
            throw new AppError("Foydalanuvchi topilmadi", 404);
        }

        if (
            !user.employee &&
            (user.role === "SUPER_ADMIN" || user.role === "HR_ADMIN")
        ) {
            return {
                okrProgress: 100,
                attendanceHours: 0,
                pendingFeedbacks: 0,
                leaveBalance: 0,
                activeCourses: [],
                recentActivities: [],
            };
        }

        const employee = user.employee;

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        const pendingFeedbacks = await prisma.feedbackAssignment.count({
            where: {
                reviewerId: employee.id,
                isCompleted: false,
            },
        });

        const academyCourses = (employee.courseProgresses || []).map((cp) => ({
            id: cp.courseId,
            title: cp.course?.title || "Academy Kursi",
            description: cp.course?.description,
            coverUrl: cp.course?.coverUrl,
            videoUrl: cp.course?.videoUrl,
            progress: cp.progressPercent || 0,
            type: "ACADEMY",
            isCompleted: cp.isCompleted,
        }));

        const onboardingCourses = (employee.onboarding?.courses || []).map(
            (oc) => ({
                id: oc.courseId,
                title: oc.course?.title || "Onboarding Kursi",
                description: oc.course?.description,
                videoUrl: oc.course?.videoUrl,
                progress: oc.progressPercent || 0,
                type: "ONBOARDING",
                isCompleted: oc.isCompleted,
            }),
        );

        const onboardingTasks = (employee.onboarding?.tasks || []).map(
            (ot) => ({
                id: ot.taskId,
                title: ot.task?.title || "Onboarding Vazifa",
                description: ot.task?.description,
                progress: ot.status === "COMPLETED" ? 100 : 0,
                type: "ONBOARDING_TASK",
                isCompleted: ot.status === "COMPLETED",
            }),
        );

        const activeCourses = [
            ...academyCourses,
            ...onboardingCourses,
            ...onboardingTasks,
        ];

        return {
            user: {
                firstName: employee.firstName,
                lastName: employee.lastName,
                role: user.role,
                email: user.email,
            },
            okrProgress: 75,
            attendanceHours: 38,
            pendingFeedbacks,
            leaveBalance: employee.leaveBalance,
            activeCourses,
            recentActivities: (employee.lifecycleEvents || []).map((event) => ({
                title: event.title,
                description: event.description,
                timeAgo: "Yaqinda",
            })),
        };
    }

    async updateVideoProgress(
        userId: string,
        payload: { courseId: string; type: string; progress: number },
    ) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            throw new AppError("Xodim topilmadi", 404);
        }

        const isFullyCompleted = payload.progress >= 95;

        if (payload.type === "ACADEMY") {
            return prisma.courseProgress.upsert({
                where: {
                    courseId_employeeId: {
                        courseId: payload.courseId,
                        employeeId: employee.id,
                    },
                },
                update: {
                    progressPercent: payload.progress,
                    isCompleted: isFullyCompleted ? true : undefined,
                    completedAt: isFullyCompleted ? new Date() : undefined,
                },
                create: {
                    courseId: payload.courseId,
                    employeeId: employee.id,
                    progressPercent: payload.progress,
                    isCompleted: isFullyCompleted,
                    completedAt: isFullyCompleted ? new Date() : undefined,
                },
            });
        }

        if (payload.type === "ONBOARDING") {
            const onboarding = await prisma.employeeOnboarding.findUnique({
                where: { employeeId: employee.id },
            });

            if (!onboarding) throw new AppError("Onboarding topilmadi", 404);

            return prisma.employeeOnboardingCourse.upsert({
                where: {
                    onboardingId_courseId: {
                        onboardingId: onboarding.id,
                        courseId: payload.courseId,
                    },
                },
                update: {
                    progressPercent: payload.progress,
                    isCompleted: isFullyCompleted ? true : undefined,
                    completedAt: isFullyCompleted ? new Date() : undefined,
                },
                create: {
                    onboardingId: onboarding.id,
                    courseId: payload.courseId,
                    progressPercent: payload.progress,
                    isCompleted: isFullyCompleted,
                    completedAt: isFullyCompleted ? new Date() : undefined,
                },
            });
        }
    }
}

export const dashboardService = new DashboardService();
