import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class LifecycleService {
    async createTemplate(payload: {
        title: string;
        description?: string;
        stage: any;
        tasks: { title: string; description?: string; dueDays: number }[];
    }) {
        return prisma.lifecycleTemplate.create({
            data: {
                title: payload.title,
                description: payload.description,
                stage: payload.stage,
                tasks: {
                    create: payload.tasks,
                },
            },
            include: { tasks: true },
        });
    }

    async getTemplates() {
        return prisma.lifecycleTemplate.findMany({
            include: { tasks: true },
            orderBy: { createdAt: "desc" },
        });
    }

    async applyTemplateToEmployee(employeeId: string, templateId: string) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) throw new AppError("Employee profile not found", 404);

        const template = await prisma.lifecycleTemplate.findUnique({
            where: { id: templateId },
            include: { tasks: true },
        });
        if (!template) throw new AppError("Template not found", 404);

        const startDate = new Date();

        const checklistEntries = template.tasks.map((task) => {
            const dueDate = new Date(startDate);
            dueDate.setDate(dueDate.getDate() + task.dueDays);

            return prisma.employeeLifecycleChecklist.upsert({
                where: {
                    employeeId_taskId: {
                        employeeId,
                        taskId: task.id,
                    },
                },
                update: { dueDate },
                create: {
                    employeeId,
                    taskId: task.id,
                    dueDate,
                },
            });
        });

        return Promise.all(checklistEntries);
    }

    async updateChecklistStatus(checklistId: string, status: any) {
        return prisma.employeeLifecycleChecklist.update({
            where: { id: checklistId },
            data: {
                status,
                completedAt: status === "COMPLETED" ? new Date() : null,
            },
        });
    }

    async getEmployeeJourney(
        employeeId: string,
        filters?: { startDate?: string; endDate?: string; eventType?: string },
    ) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                user: { select: { email: true, role: true } },
                department: { select: { name: true } },
                position: { select: { title: true } },
                manager: { select: { firstName: true, lastName: true } },
                lifecycleChecklists: {
                    include: { task: true },
                },
                courseProgresses: { include: { course: true } },
                certificates: { include: { course: true } },
                performanceReviews: true,
                historyLogs: {
                    include: {
                        changedBy: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
                offboarding: true,
            },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        let timeline: any[] = [];

        timeline.push({
            stage: "HIRED",
            title: "Ishga qabul qilindi",
            date: employee.createdAt,
            details: `${employee.firstName} ${employee.lastName} tizimga qo'shildi.`,
        });

        employee.lifecycleChecklists.forEach((item) => {
            timeline.push({
                stage: "CHECKLIST_TASK",
                title: item.task.title,
                date: item.dueDate,
                details: `Holat: ${item.status}. Bajarilish muddati: ${item.dueDate.toISOString().split("T")[0]}`,
            });
        });

        employee.historyLogs.forEach((log) => {
            timeline.push({
                stage: "TRANSITION",
                title: "Lavozim yoki Bo'lim o'zgardi",
                date: log.createdAt,
                details: `O'zgartiruvchi: ${log.changedBy.firstName} ${log.changedBy.lastName}. Sabab: ${log.reason || "Keltirilmagan"}`,
            });
        });

        employee.certificates.forEach((cert) => {
            timeline.push({
                stage: "ACADEMY",
                title: `Sertifikat olindi: ${cert.course.title}`,
                date: cert.issuedAt,
                details: `Sertifikat raqami: ${cert.certificateNumber}`,
            });
        });

        employee.performanceReviews.forEach((review) => {
            timeline.push({
                stage: "PERFORMANCE",
                title: `KPI/Performance baholandi (${review.period})`,
                date: review.createdAt,
                details: `Baho: ${review.score}/5. Izoh: ${review.feedback}`,
            });
        });

        if (employee.offboarding) {
            timeline.push({
                stage: "OFFBOARDING",
                title: "Offboarding (Ishdan ketish jarayoni)",
                date: employee.offboarding.createdAt,
                details: `Oxirgi ish kuni: ${employee.offboarding.lastWorkingDay}. Sababi: ${employee.offboarding.reason}`,
            });
        }

        if (filters?.startDate) {
            const start = new Date(filters.startDate).getTime();
            timeline = timeline.filter(
                (item) => new Date(item.date).getTime() >= start,
            );
        }

        if (filters?.endDate) {
            const end = new Date(filters.endDate).getTime();
            timeline = timeline.filter(
                (item) => new Date(item.date).getTime() <= end,
            );
        }

        if (filters?.eventType) {
            timeline = timeline.filter(
                (item) => item.stage === filters.eventType,
            );
        }

        timeline.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        return {
            employee: {
                id: employee.id,
                fullName: `${employee.firstName} ${employee.lastName}`,
                department: employee.department?.name,
                position: employee.position?.title,
                manager: employee.manager
                    ? `${employee.manager.firstName} ${employee.manager.lastName}`
                    : null,
            },
            timeline,
        };
    }

    async startOffboarding(
        employeeId: string,
        payload: {
            reason: string;
            lastWorkingDay: string;
            exitInterviewNotes?: string;
        },
    ) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            throw new AppError("Employee not found", 404);
        }

        const offboarding = await prisma.offboardingRequest.upsert({
            where: { employeeId },
            update: {
                reason: payload.reason,
                lastWorkingDay: new Date(payload.lastWorkingDay),
                exitInterviewNotes: payload.exitInterviewNotes,
            },
            create: {
                employeeId,
                reason: payload.reason,
                lastWorkingDay: new Date(payload.lastWorkingDay),
                exitInterviewNotes: payload.exitInterviewNotes,
            },
        });

        const defaultTasks = [
            {
                title: "IT tizimlaridan va email'dan ruxsatni bekor qilish",
                category: "IT_ACCESS" as const,
            },
            {
                title: "Korporativ noutbuk va aksessuarlarni qaytarib olish",
                category: "ASSET_RETURN" as const,
            },
            {
                title: "ID karta va bino ruxsatnomasini topshirish",
                category: "ASSET_RETURN" as const,
            },
            {
                title: "Yakuniy hisob-kitob va oylik maoshni to'lash",
                category: "FINANCE" as const,
            },
            {
                title: "Exit interview va hujjatlarni imzolash",
                category: "HR_DOCUMENTS" as const,
            },
        ];

        for (const task of defaultTasks) {
            await prisma.offboardingTaskItem.create({
                data: {
                    offboardingId: offboarding.id,
                    title: task.title,
                    category: task.category,
                },
            });
        }

        return prisma.offboardingRequest.findUnique({
            where: { id: offboarding.id },
            include: { tasks: true },
        });
    }

    async getOffboardingDetails(employeeId: string) {
        const offboarding = await prisma.offboardingRequest.findUnique({
            where: { employeeId },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true },
                },
                tasks: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!offboarding) {
            throw new AppError(
                "Offboarding request not found for this employee",
                404,
            );
        }

        return offboarding;
    }

    async updateOffboardingTask(taskId: string, isCompleted: boolean) {
        const task = await prisma.offboardingTaskItem.update({
            where: { id: taskId },
            data: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
            },
        });

        const allTasks = await prisma.offboardingTaskItem.findMany({
            where: { offboardingId: task.offboardingId },
        });

        const allCompleted = allTasks.every((t) => t.isCompleted);

        await prisma.offboardingRequest.update({
            where: { id: task.offboardingId },
            data: {
                status: allCompleted ? "COMPLETED" : "IN_PROGRESS",
                isAssetsReturned: allCompleted,
            },
        });

        return task;
    }
    async exportEmployeeJourneyCSV(
        employeeId: string,
        filters?: { startDate?: string; endDate?: string; eventType?: string },
    ) {
        const journey = await this.getEmployeeJourney(employeeId, filters);

        const headers = [
            "Hodisa Turi (Stage)",
            "Sana",
            "Sarlavha",
            "Tafsilotlar",
        ];
        const rows = journey.timeline.map((item) => [
            `"${item.stage}"`,
            `"${new Date(item.date).toISOString().split("T")[0]}"`,
            `"${item.title.replace(/"/g, '""')}"`,
            `"${item.details.replace(/"/g, '""')}"`,
        ]);

        const csvContent = [
            `"Xodim: ${journey.employee.fullName}"`,
            `"Bo'lim: ${journey.employee.department || "Noll"}"`,
            `"Lavozim: ${journey.employee.position || "Noll"}"`,
            "",
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        return {
            filename: `lifecycle_${journey.employee.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
            csvContent,
        };
    }
}

export const lifecycleService = new LifecycleService();
