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
        const coursesToCreate = payload.courses ? [...payload.courses] : [];

        if (payload.videoUrl && coursesToCreate.length === 0) {
            coursesToCreate.push({
                title: payload.title,
                description: payload.description,
                videoUrl: payload.videoUrl,
            });
        }
        const template = await prisma.onboardingTemplate.create({
            data: {
                title: payload.title,
                description: payload.description,
                coverUrl: payload.coverUrl,
                videoUrl: payload.videoUrl,
                isRequired: payload.isRequired,
                departmentId: payload.departmentId,
                tasks:
                    payload.tasks && payload.tasks.length > 0
                        ? { create: payload.tasks }
                        : undefined,
                courses:
                    coursesToCreate.length > 0
                        ? { create: coursesToCreate }
                        : undefined,
            },
            include: { tasks: true, courses: true },
        });

        const existingOnboardings = await prisma.employeeOnboarding.findMany({
            select: { id: true },
        });
        if (existingOnboardings.length > 0) {
            if (template.tasks && template.tasks.length > 0) {
                const tasksData = existingOnboardings.flatMap((onb) =>
                    template.tasks.map((t) => ({
                        onboardingId: onb.id,
                        taskId: t.id,
                    })),
                );
                await prisma.employeeOnboardingTask.createMany({
                    data: tasksData,
                    skipDuplicates: true,
                });
            }
            if (template.courses && template.courses.length > 0) {
                const coursesData = existingOnboardings.flatMap((onb) =>
                    template.courses.map((c) => ({
                        onboardingId: onb.id,
                        courseId: c.id,
                    })),
                );
                await prisma.employeeOnboardingCourse.createMany({
                    data: coursesData,
                    skipDuplicates: true,
                });
            }
        }

        return template;
    }

    async assignOnboarding(payload: {
        employeeId: string;
        mentorId?: string;
    }): Promise<any> {
        const allTemplates = await prisma.onboardingTemplate.findMany({
            include: { tasks: true, courses: true },
        });

        const allTasks = allTemplates.flatMap((t) => t.tasks);
        const allCourses = allTemplates.flatMap((t) => t.courses);
        const onboarding = await prisma.employeeOnboarding.upsert({
            where: { employeeId: payload.employeeId },
            update: {
                mentorId: payload.mentorId,
            },
            create: {
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
                skipDuplicates: true,
            });
        }

        if (allCourses.length > 0) {
            await prisma.employeeOnboardingCourse.createMany({
                data: allCourses.map((c) => ({
                    onboardingId: onboarding.id,
                    courseId: c.id,
                })),
                skipDuplicates: true,
            });
        }

        return this.getEmployeeOnboarding(payload.employeeId);
    }
    async getEmployeeOnboarding(employeeId: string): Promise<any> {
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
            const employee = await prisma.employee.findUnique({
                where: { id: employeeId },
            });

            if (!employee) {
                throw new AppError("Onboarding record not found", 404);
            }

            return this.assignOnboarding({ employeeId });
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
        const employees = await prisma.employee.findMany({
            where: {
                user: {
                    role: {
                        not: "SUPER_ADMIN",
                    },
                },
            },
            include: {
                department: true,
                courseProgresses: {
                    include: { course: true },
                },
                onboarding: {
                    include: {
                        mentor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        tasks: { include: { task: true } },
                        courses: { include: { course: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const filteredEmployees = employees.filter((emp) => {
            const hasAcademyCourses =
                emp.courseProgresses && emp.courseProgresses.length > 0;
            const hasOnboardingTasks =
                emp.onboarding?.tasks && emp.onboarding.tasks.length > 0;
            const hasOnboardingCourses =
                emp.onboarding?.courses && emp.onboarding.courses.length > 0;

            return (
                hasAcademyCourses || hasOnboardingTasks || hasOnboardingCourses
            );
        });

        return filteredEmployees.map((emp) => {
            const onboarding = emp.onboarding;
            return {
                id: onboarding?.id || emp.id,
                employeeId: emp.id,
                status: onboarding?.status || "IN_PROGRESS",
                employee: {
                    id: emp.id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    department: emp.department,
                    courseProgresses: emp.courseProgresses,
                },
                mentor: onboarding?.mentor || null,
                tasks: onboarding?.tasks || [],
                courses: onboarding?.courses || [],
            };
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
