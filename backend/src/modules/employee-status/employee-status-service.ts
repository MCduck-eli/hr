import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class EmployeeStatusService {
    async getAllStatuses(currentUser?: any) {
        let companyName = currentUser?.companyName || null;
        if (currentUser && currentUser.role === "SUPER_ADMIN") {
            companyName = null;
        }

        const where: any = {};
        if (companyName) {
            where.companyName = companyName;
        }

        let count = await prisma.employeeStatusConfig.count({ where });
        if (count === 0 && companyName) {
            await this.seedDefaultStatuses(companyName);
        } else if (count === 0 && !companyName) {
            await this.seedDefaultStatuses();
        }

        await this.checkAndTransitionEmployeeStatuses(companyName);

        return prisma.employeeStatusConfig.findMany({
            where,
            include: {
                nextStatus: true,
                _count: {
                    select: { employees: true },
                },
            },
            orderBy: { createdAt: "asc" },
        });
    }

    async seedDefaultStatuses(companyName?: string | null) {
        const activeStatus = await prisma.employeeStatusConfig.upsert({
            where: {
                code_companyName: {
                    code: "ACTIVE",
                    companyName: companyName || null,
                },
            },
            update: {},
            create: {
                name: "Faol",
                code: "ACTIVE",
                color: "#10b981",
                durationDays: null,
                isSystem: true,
                companyName: companyName || null,
            },
        });

        const newStatus = await prisma.employeeStatusConfig.upsert({
            where: {
                code_companyName: {
                    code: "NEW",
                    companyName: companyName || null,
                },
            },
            update: {},
            create: {
                name: "Yangi xodim",
                code: "NEW",
                color: "#f59e0b",
                durationDays: 30,
                nextStatusId: activeStatus.id,
                isSystem: true,
                companyName: companyName || null,
            },
        });

        await prisma.employeeStatusConfig.upsert({
            where: {
                code_companyName: {
                    code: "INACTIVE",
                    companyName: companyName || null,
                },
            },
            update: {},
            create: {
                name: "Nofaol",
                code: "INACTIVE",
                color: "#6b7280",
                durationDays: null,
                isSystem: true,
                companyName: companyName || null,
            },
        });

        const whereEmp: any = { statusConfigId: null };
        if (companyName) {
            whereEmp.user = { companyName };
        }

        const employees = await prisma.employee.findMany({
            where: whereEmp,
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

    async createStatus(
        payload: {
            name: string;
            code?: string;
            color?: string;
            durationDays?: number | null;
            nextStatusId?: string | null;
            companyName?: string;
        },
        currentUser?: any,
    ) {
        let companyName = payload.companyName;
        if (!companyName && currentUser?.companyName) {
            companyName = currentUser.companyName;
        }

        const generatedCode =
            payload.code ||
            payload.name
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "_")
                .slice(0, 30) + `_${Date.now().toString().slice(-4)}`;

        const existing = await prisma.employeeStatusConfig.findFirst({
            where: {
                code: generatedCode,
                companyName: companyName || null,
            },
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
                companyName: companyName || null,
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
        currentUser?: any,
    ) {
        const existing = await prisma.employeeStatusConfig.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new AppError("Status topilmadi", 404);
        }

        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (existing.companyName && existing.companyName !== currentUser.companyName) {
                throw new AppError("Unauthorized - Status belongs to another company", 403);
            }
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

    async deleteStatus(id: string, currentUser?: any) {
        const existing = await prisma.employeeStatusConfig.findUnique({
            where: { id },
            include: { employees: true },
        });

        if (!existing) {
            throw new AppError("Status topilmadi", 404);
        }

        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (existing.companyName && existing.companyName !== currentUser.companyName) {
                throw new AppError("Unauthorized - Status belongs to another company", 403);
            }
        }

        await prisma.employeeStatusConfig.updateMany({
            where: { nextStatusId: id },
            data: { nextStatusId: null },
        });

        const fallback = await prisma.employeeStatusConfig.findFirst({
            where: {
                id: { not: id },
                companyName: existing.companyName,
            },
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

    async checkAndTransitionEmployeeStatuses(companyName?: string | null) {
        const now = new Date();

        const where: any = {
            statusExpiresAt: {
                lte: now,
            },
            statusConfig: {
                nextStatusId: {
                    not: null,
                },
            },
        };

        if (companyName) {
            where.user = { companyName };
        }

        const expiredEmployees = await prisma.employee.findMany({
            where,
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
