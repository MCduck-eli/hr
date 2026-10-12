"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingService = exports.OnboardingService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
const client_1 = require("@prisma/client");
class OnboardingService {
    async createTemplate(payload, currentUser) {
        let companyName = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller?.companyName) {
                companyName = caller.companyName;
            }
        }
        const coursesToCreate = payload.courses ? [...payload.courses] : [];
        if (coursesToCreate.length === 0) {
            coursesToCreate.push({
                title: payload.title,
                description: payload.description,
                videoUrl: payload.videoUrl || "",
            });
        }
        let targetStatusConfigId = null;
        let targetStatus = null;
        if (payload.targetStatus && payload.targetStatus !== "ALL") {
            const statusConfig = await db_1.default.employeeStatusConfig.findFirst({
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
                if (statusConfig.code === "NEW")
                    targetStatus = "NEW";
                else if (statusConfig.code === "ACTIVE")
                    targetStatus = "ACTIVE";
                else if (statusConfig.code === "INACTIVE")
                    targetStatus = "INACTIVE";
            }
            else if (["NEW", "ACTIVE", "INACTIVE", "TERMINATED"].includes(payload.targetStatus)) {
                targetStatus = payload.targetStatus;
            }
        }
        const template = await db_1.default.onboardingTemplate.create({
            data: {
                title: payload.title,
                description: payload.description,
                coverUrl: payload.coverUrl,
                videoUrl: payload.videoUrl,
                isRequired: payload.isRequired,
                targetStatus: targetStatus || null,
                targetStatusConfigId: targetStatusConfigId || null,
                departmentId: payload.departmentId,
                companyName,
                tasks: payload.tasks && payload.tasks.length > 0
                    ? { create: payload.tasks }
                    : undefined,
                courses: coursesToCreate.length > 0
                    ? { create: coursesToCreate }
                    : undefined,
            },
            include: { tasks: true, courses: true, targetStatusConfig: true },
        });
        const targetEmployees = await db_1.default.employee.findMany({
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
            const onb = await db_1.default.employeeOnboarding.upsert({
                where: { employeeId: emp.id },
                update: {},
                create: {
                    employeeId: emp.id,
                    status: client_1.TaskStatus.IN_PROGRESS,
                },
            });
            if (template.tasks && template.tasks.length > 0) {
                await db_1.default.employeeOnboardingTask.createMany({
                    data: template.tasks.map((t) => ({
                        onboardingId: onb.id,
                        taskId: t.id,
                    })),
                    skipDuplicates: true,
                });
            }
            if (template.courses && template.courses.length > 0) {
                await db_1.default.employeeOnboardingCourse.createMany({
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
    async assignOnboarding(payload) {
        const employee = await db_1.default.employee.findUnique({
            where: { id: payload.employeeId },
        });
        const templates = await db_1.default.onboardingTemplate.findMany({
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
        const onboarding = await db_1.default.employeeOnboarding.upsert({
            where: { employeeId: payload.employeeId },
            update: {
                mentorId: payload.mentorId,
            },
            create: {
                employeeId: payload.employeeId,
                mentorId: payload.mentorId,
                status: client_1.TaskStatus.IN_PROGRESS,
            },
        });
        if (allTasks.length > 0) {
            await db_1.default.employeeOnboardingTask.createMany({
                data: allTasks.map((t) => ({
                    onboardingId: onboarding.id,
                    taskId: t.id,
                })),
                skipDuplicates: true,
            });
        }
        if (allCourses.length > 0) {
            await db_1.default.employeeOnboardingCourse.createMany({
                data: allCourses.map((c) => ({
                    onboardingId: onboarding.id,
                    courseId: c.id,
                })),
                skipDuplicates: true,
            });
        }
        return this.getEmployeeOnboarding(payload.employeeId);
    }
    async getEmployeeOnboarding(employeeId) {
        const employee = await db_1.default.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            throw new appError_1.AppError("Onboarding record not found", 404);
        }
        const onboarding = await db_1.default.employeeOnboarding.findUnique({
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
        const matchingTasks = onboarding.tasks.filter((t) => !t.task?.template?.targetStatus ||
            t.task.template.targetStatus === employee.status);
        const matchingCourses = onboarding.courses.filter((c) => !c.course?.template?.targetStatus ||
            c.course.template.targetStatus === employee.status);
        return {
            ...onboarding,
            tasks: matchingTasks,
            courses: matchingCourses,
        };
    }
    async updateTaskStatus(employeeTaskId, status) {
        return db_1.default.employeeOnboardingTask.update({
            where: { id: employeeTaskId },
            data: {
                status,
                completedAt: status === client_1.TaskStatus.COMPLETED ? new Date() : null,
            },
        });
    }
    async completeCourse(courseIdOrRecordId, employeeId) {
        let record = await db_1.default.employeeOnboardingCourse.findFirst({
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
            let onboarding = await db_1.default.employeeOnboarding.findUnique({
                where: { employeeId },
            });
            if (!onboarding) {
                onboarding = await db_1.default.employeeOnboarding.create({
                    data: { employeeId, status: "IN_PROGRESS" },
                });
            }
            let validCourseId = courseIdOrRecordId;
            const course = await db_1.default.onboardingCourse.findUnique({
                where: { id: courseIdOrRecordId },
            });
            if (!course) {
                const template = await db_1.default.onboardingTemplate.findUnique({
                    where: { id: courseIdOrRecordId },
                    include: { courses: true },
                });
                if (template) {
                    if (template.courses && template.courses.length > 0) {
                        validCourseId = template.courses[0].id;
                    }
                    else {
                        const newCourse = await db_1.default.onboardingCourse.create({
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
            record = await db_1.default.employeeOnboardingCourse.upsert({
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
            return db_1.default.employeeOnboardingCourse.update({
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
    async getHRDashboardMonitoring(currentUser) {
        let companyFilter = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }
        const templates = await db_1.default.onboardingTemplate.findMany({
            include: {
                tasks: true,
                courses: true,
                department: true,
                targetStatusConfig: true,
            },
        });
        const employees = await db_1.default.employee.findMany({
            where: {
                user: {
                    role: {
                        not: "DIRECTOR",
                    },
                    ...(companyFilter ? { companyName: companyFilter } : {}),
                },
            },
            include: {
                user: true,
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
                if (t.departmentId &&
                    emp.departmentId &&
                    t.departmentId !== emp.departmentId) {
                    return false;
                }
                const isTemplateForAll = !t.targetStatusConfigId && !t.targetStatus;
                if (isTemplateForAll)
                    return true;
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
                const templateEnrollments = (onboarding?.courses || []).filter((item) => item.courseId === t.id ||
                    item.course?.templateId === t.id ||
                    (t.courses &&
                        t.courses.some((c) => c.id === item.courseId)));
                const latestProgress = templateEnrollments.reduce((max, item) => {
                    const p = item.isCompleted
                        ? 100
                        : item.progressPercent || 0;
                    return p > max ? p : max;
                }, 0);
                const isTemplateCompleted = templateEnrollments.some((item) => item.isCompleted ||
                    (item.progressPercent || 0) >= 95) || latestProgress >= 95;
                if (t.courses && t.courses.length > 0) {
                    return t.courses.map((c) => {
                        const specificEnrollment = templateEnrollments.find((item) => item.courseId === c.id);
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
                }
                else {
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
            const mappedTasks = (onboarding?.tasks || []).filter((t) => !t.task?.template?.targetStatus ||
                t.task.template.targetStatus === emp.status);
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
    async getAllTemplates(currentUser) {
        let companyFilter = null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }
        return db_1.default.onboardingTemplate.findMany({
            where: companyFilter ? { companyName: companyFilter } : {},
            include: {
                tasks: true,
                courses: true,
                department: true,
                targetStatusConfig: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async updateTemplate(templateId, payload) {
        const template = await db_1.default.onboardingTemplate.findUnique({
            where: { id: templateId },
        });
        if (!template) {
            throw new appError_1.AppError("Template not found", 404);
        }
        let targetStatusConfigId = null;
        let targetStatus = null;
        if (payload.targetStatus !== undefined) {
            if (payload.targetStatus && payload.targetStatus !== "ALL") {
                const statusConfig = await db_1.default.employeeStatusConfig.findFirst({
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
                    if (statusConfig.code === "NEW")
                        targetStatus = "NEW";
                    else if (statusConfig.code === "ACTIVE")
                        targetStatus = "ACTIVE";
                    else if (statusConfig.code === "INACTIVE")
                        targetStatus = "INACTIVE";
                }
                else if (["NEW", "ACTIVE", "INACTIVE", "TERMINATED"].includes(payload.targetStatus)) {
                    targetStatus = payload.targetStatus;
                }
            }
        }
        return db_1.default.onboardingTemplate.update({
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
    async deleteTemplate(templateId) {
        const template = await db_1.default.onboardingTemplate.findUnique({
            where: { id: templateId },
        });
        if (!template) {
            throw new appError_1.AppError("Template not found", 404);
        }
        await db_1.default.employeeOnboardingCourse.deleteMany({
            where: {
                course: { templateId },
            },
        }).catch(() => { });
        await db_1.default.employeeOnboardingTask.deleteMany({
            where: {
                task: { templateId },
            },
        }).catch(() => { });
        await db_1.default.onboardingCourse.deleteMany({ where: { templateId } }).catch(() => { });
        await db_1.default.onboardingTask.deleteMany({ where: { templateId } }).catch(() => { });
        return db_1.default.onboardingTemplate.delete({
            where: { id: templateId },
        });
    }
}
exports.OnboardingService = OnboardingService;
exports.onboardingService = new OnboardingService();
