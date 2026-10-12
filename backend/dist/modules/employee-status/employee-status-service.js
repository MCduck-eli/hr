"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeStatusService = exports.EmployeeStatusService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
class EmployeeStatusService {
    async getAllStatuses(currentUser) {
        let companyName = currentUser?.companyName || null;
        if (currentUser && currentUser.role === "SUPER_ADMIN") {
            companyName = null;
        }
        const where = {};
        if (companyName) {
            where.companyName = companyName;
        }
        let count = await db_1.default.employeeStatusConfig.count({ where });
        if (count === 0 && companyName) {
            await this.seedDefaultStatuses(companyName);
        }
        else if (count === 0 && !companyName) {
            await this.seedDefaultStatuses();
        }
        await this.checkAndTransitionEmployeeStatuses(companyName);
        return db_1.default.employeeStatusConfig.findMany({
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
    async seedDefaultStatuses(companyName) {
        const activeStatus = await db_1.default.employeeStatusConfig.upsert({
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
        const newStatus = await db_1.default.employeeStatusConfig.upsert({
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
        await db_1.default.employeeStatusConfig.upsert({
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
        const whereEmp = { statusConfigId: null };
        if (companyName) {
            whereEmp.user = { companyName };
        }
        const employees = await db_1.default.employee.findMany({
            where: whereEmp,
        });
        for (const emp of employees) {
            const config = emp.status === "NEW" ? newStatus : activeStatus;
            const statusExpiresAt = config.durationDays
                ? new Date(Date.now() + config.durationDays * 24 * 60 * 60 * 1000)
                : null;
            await db_1.default.employee.update({
                where: { id: emp.id },
                data: {
                    statusConfigId: config.id,
                    statusStartedAt: emp.createdAt || new Date(),
                    statusExpiresAt,
                },
            });
        }
    }
    async createStatus(payload, currentUser) {
        let companyName = payload.companyName;
        if (!companyName && currentUser?.companyName) {
            companyName = currentUser.companyName;
        }
        const generatedCode = payload.code ||
            payload.name
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "_")
                .slice(0, 30) + `_${Date.now().toString().slice(-4)}`;
        const existing = await db_1.default.employeeStatusConfig.findFirst({
            where: {
                code: generatedCode,
                companyName: companyName || null,
            },
        });
        if (existing) {
            throw new appError_1.AppError("Bunday kodli status mavjud", 400);
        }
        return db_1.default.employeeStatusConfig.create({
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
    async updateStatus(id, payload, currentUser) {
        const existing = await db_1.default.employeeStatusConfig.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new appError_1.AppError("Status topilmadi", 404);
        }
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (existing.companyName && existing.companyName !== currentUser.companyName) {
                throw new appError_1.AppError("Unauthorized - Status belongs to another company", 403);
            }
        }
        if (payload.nextStatusId === id) {
            throw new appError_1.AppError("Status o'ziga o'zi o'tishi mumkin emas", 400);
        }
        return db_1.default.employeeStatusConfig.update({
            where: { id },
            data: {
                ...(payload.name && { name: payload.name }),
                ...(payload.color && { color: payload.color }),
                durationDays: payload.durationDays !== undefined
                    ? payload.durationDays
                        ? Number(payload.durationDays)
                        : null
                    : undefined,
                nextStatusId: payload.nextStatusId !== undefined
                    ? payload.nextStatusId || null
                    : undefined,
            },
            include: { nextStatus: true },
        });
    }
    async deleteStatus(id, currentUser) {
        const existing = await db_1.default.employeeStatusConfig.findUnique({
            where: { id },
            include: { employees: true },
        });
        if (!existing) {
            throw new appError_1.AppError("Status topilmadi", 404);
        }
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (existing.companyName && existing.companyName !== currentUser.companyName) {
                throw new appError_1.AppError("Unauthorized - Status belongs to another company", 403);
            }
        }
        await db_1.default.employeeStatusConfig.updateMany({
            where: { nextStatusId: id },
            data: { nextStatusId: null },
        });
        const fallback = await db_1.default.employeeStatusConfig.findFirst({
            where: {
                id: { not: id },
                companyName: existing.companyName,
            },
        });
        if (existing.employees && existing.employees.length > 0) {
            await db_1.default.employee.updateMany({
                where: { statusConfigId: id },
                data: {
                    statusConfigId: fallback ? fallback.id : null,
                    statusExpiresAt: null,
                },
            });
        }
        return db_1.default.employeeStatusConfig.delete({
            where: { id },
        });
    }
    async checkAndTransitionEmployeeStatuses(companyName) {
        const now = new Date();
        const where = {
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
        const expiredEmployees = await db_1.default.employee.findMany({
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
                    ? new Date(Date.now() +
                        nextStatus.durationDays * 24 * 60 * 60 * 1000)
                    : null;
                let enumStatus = "ACTIVE";
                if (nextStatus.code === "NEW")
                    enumStatus = "NEW";
                else if (nextStatus.code === "INACTIVE")
                    enumStatus = "INACTIVE";
                await db_1.default.employee.update({
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
exports.EmployeeStatusService = EmployeeStatusService;
exports.employeeStatusService = new EmployeeStatusService();
