import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class EmployeeStatusService {
    async getAllStatuses() {
        let count = await prisma.employeeStatusConfig.count();
        if (count === 0) {
            await this.seedDefaultStatuses();
        }

        await this.checkAndTransitionEmployeeStatuses();

        return prisma.employeeStatusConfig.findMany({
            include: {
                nextStatus: true,
                _count: {
                    select: { employees: true },
                },
            },
            orderBy: { createdAt: "asc" },
        });
    }

    async seedDefaultStatuses() {
        const activeStatus = await prisma.employeeStatusConfig.upsert({
            where: { code: "ACTIVE" },
            update: {},
            create: {
                name: "Faol",
                code: "ACTIVE",
                color: "#10b981",
                durationDays: null,
                isSystem: true,
            },
        });

        const newStatus = await prisma.employeeStatusConfig.upsert({
            where: { code: "NEW" },
            update: {},
            create: {
                name: "Yangi xodim",
                code: "NEW",
                color: "#f59e0b",
                durationDays: 30,
                nextStatusId: activeStatus.id,
                isSystem: true,
            },
        });

        await prisma.employeeStatusConfig.upsert({
            where: { code: "INACTIVE" },
            update: {},
            create: {
                name: "Nofaol",
                code: "INACTIVE",
                color: "#6b7280",
                durationDays: null,
                isSystem: true,
            },
        });

        const employees = await prisma.employee.findMany({
            where: { statusConfigId: null },
        });

        for (const emp of employees) {
            const config = emp.status === "NEW" ? newStatus : activeStatus;
            const statusExpiresAt = config.durationDays
                ? new Date(Date.now() + config.durationDays * 24 * 60 * 60 * 1000)
                : null;

            await prisma.employee.update({
                where: { id: emp.id },
                data: {
                    statusConfigId: config.id,
                    statusStartedAt: emp.createdAt || new Date(),
                    statusExpiresAt,
                },
            });
        }
    }

    async createStatus(payload: {
        name: string;
        code?: string;
        color?: string;
        durationDays?: number | null;
        nextStatusId?: string | null;
    }) {
        const generatedCode =
            payload.code ||
            payload.name
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "_")
                .slice(0, 30) + `_${Date.now().toString().slice(-4)}`;

        const existing = await prisma.employeeStatusConfig.findUnique({
            where: { code: generatedCode },
        });

        if (existing) {
            throw new AppError("Bunday kodli status mavjud", 400);
        }

        return prisma.employeeStatusConfig.create({
            data: {
                name: payload.name,
                code: generatedCode,
                color: payload.color || "#3b82f6",
                durationDays: payload.durationDays ? Number(payload.durationDays) : null,
                nextStatusId: payload.nextStatusId || null,
            },
            include: { nextStatus: true },
        });
    }

    async updateStatus(
        id: string,
        payload: {
            name?: string;
            color?: string;
            durationDays?: number | null;
            nextStatusId?: string | null;
        },
    ) {
        const existing = await prisma.employeeStatusConfig.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new AppError("Status topilmadi", 404);
        }

        if (payload.nextStatusId === id) {
            throw new AppError("Status o'ziga o'zi o'tishi mumkin emas", 400);
        }

        return prisma.employeeStatusConfig.update({
            where: { id },
            data: {
                ...(payload.name && { name: payload.name }),
                ...(payload.color && { color: payload.color }),
                durationDays:
                    payload.durationDays !== undefined
                        ? payload.durationDays
                            ? Number(payload.durationDays)
                            : null
                        : undefined,
                nextStatusId:
                    payload.nextStatusId !== undefined
                        ? payload.nextStatusId || null
                        : undefined,
            },
            include: { nextStatus: true },
        });
    }

    async deleteStatus(id: string) {
        const existing = await prisma.employeeStatusConfig.findUnique({
            where: { id },
            include: { employees: true },
        });

        if (!existing) {
            throw new AppError("Status topilmadi", 404);
        }

        await prisma.employeeStatusConfig.updateMany({
            where: { nextStatusId: id },
            data: { nextStatusId: null },
        });

        const fallback = await prisma.employeeStatusConfig.findFirst({
            where: { id: { not: id } },
        });

        if (existing.employees && existing.employees.length > 0) {
            await prisma.employee.updateMany({
                where: { statusConfigId: id },
                data: {
                    statusConfigId: fallback ? fallback.id : null,
                    statusExpiresAt: null,
                },
            });
        }

        return prisma.employeeStatusConfig.delete({
            where: { id },
        });
    }

    async checkAndTransitionEmployeeStatuses() {
        const now = new Date();

        const expiredEmployees = await prisma.employee.findMany({
            where: {
                statusExpiresAt: {
                    lte: now,
                },
                statusConfig: {
                    nextStatusId: {
                        not: null,
                    },
                },
            },
            include: {
                statusConfig: {
                    include: {
                        nextStatus: true,
                    },
                },
            },
        });

        for (const emp of expiredEmployees) {
            const nextStatus = emp.statusConfig?.nextStatus;
            if (nextStatus) {
                const newExpiresAt = nextStatus.durationDays
                    ? new Date(
                          Date.now() +
                              nextStatus.durationDays * 24 * 60 * 60 * 1000,
                      )
                    : null;

                let enumStatus: any = "ACTIVE";
                if (nextStatus.code === "NEW") enumStatus = "NEW";
                else if (nextStatus.code === "INACTIVE") enumStatus = "INACTIVE";

                await prisma.employee.update({
                    where: { id: emp.id },
                    data: {
                        statusConfigId: nextStatus.id,
                        status: enumStatus,
                        statusStartedAt: new Date(),
                        statusExpiresAt: newExpiresAt,
                    },
                });
            }
        }
    }
}

export const employeeStatusService = new EmployeeStatusService();
