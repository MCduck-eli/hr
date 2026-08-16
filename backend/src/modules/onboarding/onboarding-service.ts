import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { TaskStatus } from "@prisma/client";

export class OnboardingService {
    async createTemplate(payload: {
        title: string;
        description?: string;
        coverUrl?: string;
        videoUrl?: string;
        isRequired?: boolean;
        departmentId?: string;
        tasks?: { title: string; description?: string; stage: any }[];
        courses?: { title: string; videoUrl: string; description?: string }[];
    }) {
        return prisma.onboardingTemplate.create({
            data: {
                title: payload.title,
                description: payload.description,
                coverUrl: payload.coverUrl,
                videoUrl: payload.videoUrl,
                isRequired: payload.isRequired,
                departmentId: payload.departmentId,
                tasks: payload.tasks ? { create: payload.tasks } : undefined,
                courses: payload.courses
                    ? { create: payload.courses }
                    : undefined,
            },
            include: { tasks: true, courses: true },
        });
    }

    async assignOnboarding(payload: { employeeId: string; mentorId?: string }) {
        const allTemplates = await prisma.onboardingTemplate.findMany({
            include: { tasks: true, courses: true },
        });

        const allTasks = allTemplates.flatMap((t) => t.tasks);
        const allCourses = allTemplates.flatMap((t) => t.courses);

        const onboarding = await prisma.employeeOnboarding.create({
            data: {
                employeeId: payload.employeeId,
                mentorId: payload.mentorId,
                status: TaskStatus.IN_PROGRESS,
            },
        });

        if (allTasks.length > 0) {
            await prisma.employeeOnboardingTask.createMany({
                data: allTasks.map((t) => ({
                    onboardingId: onboarding.id,
                    taskId: t.id,
                })),
            });
        }

        if (allCourses.length > 0) {
            await prisma.employeeOnboardingCourse.createMany({
                data: allCourses.map((c) => ({
                    onboardingId: onboarding.id,
                    courseId: c.id,
                })),
            });
        }

        return this.getEmployeeOnboarding(payload.employeeId);
    }

    async getEmployeeOnboarding(employeeId: string) {
        const onboarding = await prisma.employeeOnboarding.findUnique({
            where: { employeeId },
            include: {
                mentor: {
                    select: { id: true, firstName: true, lastName: true },
                },
                tasks: { include: { task: true } },
                courses: { include: { course: true } },
                employee: {
                    include: {
                        department: {
                            include: {
                                parent: true,
                            },
                        },
                        position: true,
                    },
                },
            },
        });

        if (!onboarding) {
            throw new AppError("Onboarding record not found", 404);
        }

        return onboarding;
    }

    async updateTaskStatus(employeeTaskId: string, status: TaskStatus) {
        return prisma.employeeOnboardingTask.update({
            where: { id: employeeTaskId },
            data: {
                status,
                completedAt:
                    status === TaskStatus.COMPLETED ? new Date() : null,
            },
        });
    }

    async completeCourse(employeeCourseId: string) {
        return prisma.employeeOnboardingCourse.update({
            where: { id: employeeCourseId },
            data: {
                isCompleted: true,
                completedAt: new Date(),
            },
        });
    }

    async getHRDashboardMonitoring() {
        return prisma.employeeOnboarding.findMany({
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                    },
                },
                mentor: {
                    select: { id: true, firstName: true, lastName: true },
                },
                tasks: true,
                courses: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async getAllTemplates() {
        return prisma.onboardingTemplate.findMany({
            include: { tasks: true, courses: true },
            orderBy: { createdAt: "desc" },
        });
    }

    async updateTemplate(
        templateId: string,
        payload: {
            title?: string;
            description?: string;
            coverUrl?: string;
            videoUrl?: string;
            isRequired?: boolean;
        },
    ) {
        const template = await prisma.onboardingTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new AppError("Template not found", 404);
        }

        return prisma.onboardingTemplate.update({
            where: { id: templateId },
            data: payload,
            include: { tasks: true, courses: true },
        });
    }

    async deleteTemplate(templateId: string) {
        const template = await prisma.onboardingTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new AppError("Template not found", 404);
        }

        return prisma.onboardingTemplate.delete({
            where: { id: templateId },
        });
    }
}

export const onboardingService = new OnboardingService();
