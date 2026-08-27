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
        targetStatus?: any;
        departmentId?: string;
        tasks?: { title: string; description?: string; stage: any }[];
        courses?: { title: string; videoUrl: string; description?: string }[];
    }) {
        const coursesToCreate = payload.courses ? [...payload.courses] : [];

        if (coursesToCreate.length === 0) {
            coursesToCreate.push({
                title: payload.title,
                description: payload.description,
                videoUrl: payload.videoUrl || "",
            });
        }
        let targetStatusConfigId: string | null = null;
        let targetStatus: any = null;

        if (payload.targetStatus && payload.targetStatus !== "ALL") {
            const statusConfig = await prisma.employeeStatusConfig.findFirst({
                where: {
                    OR: [
                        { id: payload.targetStatus },
                        { code: payload.targetStatus },
                        { name: payload.targetStatus },
                    ],
                },
            });
            if (statusConfig) {
                targetStatusConfigId = statusConfig.id;
                if (statusConfig.code === "NEW") targetStatus = "NEW";
                else if (statusConfig.code === "ACTIVE") targetStatus = "ACTIVE";
                else if (statusConfig.code === "INACTIVE") targetStatus = "INACTIVE";
            } else if (
                ["NEW", "ACTIVE", "INACTIVE", "TERMINATED"].includes(payload.targetStatus)
            ) {
                targetStatus = payload.targetStatus;
            }
        }

        const template = await prisma.onboardingTemplate.create({
            data: {
                title: payload.title,
                description: payload.description,
                coverUrl: payload.coverUrl,
                videoUrl: payload.videoUrl,
                isRequired: payload.isRequired,
                targetStatus: targetStatus || null,
                targetStatusConfigId: targetStatusConfigId || null,
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
            include: { tasks: true, courses: true, targetStatusConfig: true },
        });

        const targetEmployees = await prisma.employee.findMany({
            where: {
                ...(targetStatusConfigId
                    ? {
                          OR: [
                              { statusConfigId: targetStatusConfigId },
                              ...(targetStatus ? [{ status: targetStatus }] : []),
                          ],
                      }
                    : targetStatus
                    ? { status: targetStatus }
                    : {}),
                ...(payload.departmentId ? { departmentId: payload.departmentId } : {}),
            },
            select: { id: true },
        });

        for (const emp of targetEmployees) {
            const onb = await prisma.employeeOnboarding.upsert({
                where: { employeeId: emp.id },
                update: {},
                create: {
                    employeeId: emp.id,
                    status: TaskStatus.IN_PROGRESS,
                },
            });

            if (template.tasks && template.tasks.length > 0) {
                await prisma.employeeOnboardingTask.createMany({
                    data: template.tasks.map((t) => ({
                        onboardingId: onb.id,
                        taskId: t.id,
                    })),
                    skipDuplicates: true,
                });
            }
            if (template.courses && template.courses.length > 0) {
                await prisma.employeeOnboardingCourse.createMany({
                    data: template.courses.map((c) => ({
                        onboardingId: onb.id,
                        courseId: c.id,
                    })),
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
        const employee = await prisma.employee.findUnique({
            where: { id: payload.employeeId },
        });

        const templates = await prisma.onboardingTemplate.findMany({
            where: {
                OR: [
                    { targetStatus: null, targetStatusConfigId: null },
                    ...(employee?.statusConfigId
                        ? [{ targetStatusConfigId: employee.statusConfigId }]
                        : []),
                    ...(employee?.status
                        ? [{ targetStatus: employee.status }]
                        : []),
                ],
                ...(employee?.departmentId
                    ? {
                          OR: [
                              { departmentId: null },
                              { departmentId: employee.departmentId },
                          ],
                      }
                    : {}),
            },
            include: { tasks: true, courses: true },
        });

        const allTasks = templates.flatMap((t) => t.tasks);
        const allCourses = templates.flatMap((t) => t.courses);
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
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!employee) {
            throw new AppError("Onboarding record not found", 404);
        }

        const onboarding = await prisma.employeeOnboarding.findUnique({
            where: { employeeId },
            include: {
                mentor: {
                    select: { id: true, firstName: true, lastName: true },
                },
                tasks: {
                    include: {
                        task: {
                            include: {
                                template: true,
                            },
                        },
                    },
                },
                courses: {
                    include: {
                        course: {
                            include: {
                                template: true,
                            },
                        },
                    },
                },
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
            return this.assignOnboarding({ employeeId });
        }

        const matchingTasks = onboarding.tasks.filter(
            (t) =>
                !t.task?.template?.targetStatus ||
                t.task.template.targetStatus === employee.status,
        );
        const matchingCourses = onboarding.courses.filter(
            (c) =>
                !c.course?.template?.targetStatus ||
                c.course.template.targetStatus === employee.status,
        );

        return {
            ...onboarding,
            tasks: matchingTasks,
            courses: matchingCourses,
        };
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

    async completeCourse(courseIdOrRecordId: string, employeeId?: string) {
        let record = await prisma.employeeOnboardingCourse.findFirst({
            where: {
                OR: [
                    { id: courseIdOrRecordId },
                    { courseId: courseIdOrRecordId },
                    {
                        course: {
                            templateId: courseIdOrRecordId,
                        },
                    },
                ],
                ...(employeeId ? { onboarding: { employeeId } } : {}),
            },
        });

        if (!record && employeeId) {
            let onboarding = await prisma.employeeOnboarding.findUnique({
                where: { employeeId },
            });
            if (!onboarding) {
                onboarding = await prisma.employeeOnboarding.create({
                    data: { employeeId, status: "IN_PROGRESS" },
                });
            }

            let validCourseId = courseIdOrRecordId;
            const course = await prisma.onboardingCourse.findUnique({
                where: { id: courseIdOrRecordId },
            });

            if (!course) {
                const template = await prisma.onboardingTemplate.findUnique({
                    where: { id: courseIdOrRecordId },
                    include: { courses: true },
                });
                if (template) {
                    if (template.courses && template.courses.length > 0) {
                        validCourseId = template.courses[0].id;
                    } else {
                        const newCourse =
                            await prisma.onboardingCourse.create({
                                data: {
                                    templateId: template.id,
                                    title: template.title,
                                    description: template.description,
                                    videoUrl: template.videoUrl || "",
                                },
                            });
                        validCourseId = newCourse.id;
                    }
                }
            }

            record = await prisma.employeeOnboardingCourse.upsert({
                where: {
                    onboardingId_courseId: {
                        onboardingId: onboarding.id,
                        courseId: validCourseId,
                    },
                },
                update: {
                    isCompleted: true,
                    progressPercent: 100,
                    completedAt: new Date(),
                },
                create: {
                    onboardingId: onboarding.id,
                    courseId: validCourseId,
                    isCompleted: true,
                    progressPercent: 100,
                    completedAt: new Date(),
                },
            });
            return record;
        }

        if (record) {
            return prisma.employeeOnboardingCourse.update({
                where: { id: record.id },
                data: {
                    isCompleted: true,
                    progressPercent: 100,
                    completedAt: new Date(),
                },
            });
        }

        return null;
    }

    async getHRDashboardMonitoring() {
        const templates = await prisma.onboardingTemplate.findMany({
            include: {
                tasks: true,
                courses: true,
                department: true,
                targetStatusConfig: true,
            },
        });

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
                statusConfig: true,
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
                        tasks: {
                            include: {
                                task: {
                                    include: {
                                        template: true,
                                    },
                                },
                            },
                        },
                        courses: {
                            include: {
                                course: {
                                    include: {
                                        template: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return employees.map((emp) => {
            const onboarding = emp.onboarding;

            const matchingTemplates = templates.filter((t) => {
                if (
                    t.departmentId &&
                    emp.departmentId &&
                    t.departmentId !== emp.departmentId
                ) {
                    return false;
                }

                const isTemplateForAll =
                    !t.targetStatusConfigId && !t.targetStatus;
                if (isTemplateForAll) return true;

                if (t.targetStatusConfigId) {
                    return emp.statusConfigId === t.targetStatusConfigId;
                }

                if (t.targetStatus) {
                    if (emp.statusConfig?.code) {
                        return emp.statusConfig.code === t.targetStatus;
                    }
                    return emp.status === t.targetStatus;
                }

                return false;
            });

            const mappedCourses = matchingTemplates.flatMap((t) => {
                const templateEnrollments = (
                    onboarding?.courses || []
                ).filter(
                    (item: any) =>
                        item.courseId === t.id ||
                        item.course?.templateId === t.id ||
                        (t.courses &&
                            t.courses.some((c) => c.id === item.courseId)),
                );

                const latestProgress = templateEnrollments.reduce(
                    (max, item) => {
                        const p = item.isCompleted
                            ? 100
                            : item.progressPercent || 0;
                        return p > max ? p : max;
                    },
                    0,
                );

                const isTemplateCompleted =
                    templateEnrollments.some(
                        (item) =>
                            item.isCompleted ||
                            (item.progressPercent || 0) >= 95,
                    ) || latestProgress >= 95;

                if (t.courses && t.courses.length > 0) {
                    return t.courses.map((c) => {
                        const specificEnrollment = templateEnrollments.find(
                            (item: any) => item.courseId === c.id,
                        );
                        const progress = specificEnrollment
                            ? specificEnrollment.isCompleted
                                ? 100
                                : specificEnrollment.progressPercent || 0
                            : latestProgress;
                        const isDone = isTemplateCompleted || progress >= 95;
                        return {
                            id: specificEnrollment?.id || c.id,
                            courseId: c.id,
                            title: c.title || t.title,
                            progressPercent: isDone ? 100 : progress,
                            isCompleted: isDone,
                            course: c,
                        };
                    });
                } else {
                    return [
                        {
                            id: templateEnrollments[0]?.id || t.id,
                            courseId: t.id,
                            title: t.title,
                            progressPercent: isTemplateCompleted
                                ? 100
                                : latestProgress,
                            isCompleted: isTemplateCompleted,
                            course: {
                                id: t.id,
                                title: t.title,
                                videoUrl: t.videoUrl,
                            },
                        },
                    ];
                }
            });

            const mappedTasks = (onboarding?.tasks || []).filter(
                (t) =>
                    !t.task?.template?.targetStatus ||
                    t.task.template.targetStatus === emp.status,
            );

            return {
                id: onboarding?.id || emp.id,
                employeeId: emp.id,
                status: onboarding?.status || "IN_PROGRESS",
                employee: {
                    id: emp.id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    status: emp.status,
                    department: emp.department,
                    courseProgresses: emp.courseProgresses,
                },
                mentor: onboarding?.mentor || null,
                tasks: mappedTasks,
                courses: mappedCourses,
            };
        });
    }

    async getAllTemplates() {
        return prisma.onboardingTemplate.findMany({
            include: {
                tasks: true,
                courses: true,
                department: true,
                targetStatusConfig: true,
            },
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
            targetStatus?: any;
            departmentId?: string;
        },
    ) {
        const template = await prisma.onboardingTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new AppError("Template not found", 404);
        }

        let targetStatusConfigId: string | null = null;
        let targetStatus: any = null;

        if (payload.targetStatus !== undefined) {
            if (payload.targetStatus && payload.targetStatus !== "ALL") {
                const statusConfig = await prisma.employeeStatusConfig.findFirst({
                    where: {
                        OR: [
                            { id: payload.targetStatus },
                            { code: payload.targetStatus },
                            { name: payload.targetStatus },
                        ],
                    },
                });
                if (statusConfig) {
                    targetStatusConfigId = statusConfig.id;
                    if (statusConfig.code === "NEW") targetStatus = "NEW";
                    else if (statusConfig.code === "ACTIVE") targetStatus = "ACTIVE";
                    else if (statusConfig.code === "INACTIVE") targetStatus = "INACTIVE";
                } else if (
                    ["NEW", "ACTIVE", "INACTIVE", "TERMINATED"].includes(payload.targetStatus)
                ) {
                    targetStatus = payload.targetStatus;
                }
            }
        }

        return prisma.onboardingTemplate.update({
            where: { id: templateId },
            data: {
                ...(payload.title !== undefined && { title: payload.title }),
                ...(payload.description !== undefined && {
                    description: payload.description,
                }),
                ...(payload.coverUrl !== undefined && {
                    coverUrl: payload.coverUrl,
                }),
                ...(payload.videoUrl !== undefined && {
                    videoUrl: payload.videoUrl,
                }),
                ...(payload.isRequired !== undefined && {
                    isRequired: payload.isRequired,
                }),
                ...(payload.departmentId !== undefined && {
                    departmentId: payload.departmentId,
                }),
                ...(payload.targetStatus !== undefined && {
                    targetStatus,
                    targetStatusConfigId,
                }),
            },
            include: {
                tasks: true,
                courses: true,
                department: true,
                targetStatusConfig: true,
            },
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
