import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { TaskStatus } from "@prisma/client";

export class OnboardingService {
    async createTemplate(payload: {
        title: string;
        description?: string;
        departmentId?: string;
        tasks?: { title: string; description?: string; stage: any }[];
        courses?: { title: string; videoUrl: string; description?: string }[];
    }) {
        return prisma.onboardingTemplate.create({
            data: {
                title: payload.title,
                description: payload.description,
                departmentId: payload.departmentId,
                tasks: payload.tasks ? { create: payload.tasks } : undefined,
                courses: payload.courses
                    ? { create: payload.courses }
                    : undefined,
            },
            include: { tasks: true, courses: true },
        });
    }

    async assignOnboarding(payload: {
        employeeId: string;
        templateId: string;
        mentorId?: string;
    }) {
        const template = await prisma.onboardingTemplate.findUnique({
            where: { id: payload.templateId },
            include: { tasks: true, courses: true },
        });

        if (!template) {
            throw new AppError("Template not found", 404);
        }

        const onboarding = await prisma.employeeOnboarding.create({
            data: {
                employeeId: payload.employeeId,
                mentorId: payload.mentorId,
                status: TaskStatus.IN_PROGRESS,
            },
        });

        if (template.tasks.length > 0) {
            await prisma.employeeOnboardingTask.createMany({
                data: template.tasks.map((t) => ({
                    onboardingId: onboarding.id,
                    taskId: t.id,
                })),
            });
        }

        if (template.courses.length > 0) {
            await prisma.employeeOnboardingCourse.createMany({
                data: template.courses.map((c) => ({
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
}

export const onboardingService = new OnboardingService();
