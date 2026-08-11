import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class OrgChartService {
    async getOrgTree(departmentId?: string, search?: string) {
        const whereClause: any = {};

        if (departmentId) {
            whereClause.departmentId = departmentId;
        }

        if (search) {
            whereClause.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
            ];
        }

        const employees = await prisma.employee.findMany({
            where: whereClause,
            include: {
                user: { select: { email: true, role: true } },
                department: { select: { id: true, name: true } },
                position: { select: { id: true, title: true } },
                manager: {
                    select: { id: true, firstName: true, lastName: true },
                },
                subordinates: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: { select: { title: true } },
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return employees;
    }

    async getMyOrgContext(userId: string) {
        const employee = await prisma.employee.findUnique({
            where: { userId },
            include: {
                department: true,
                position: true,
                manager: {
                    include: {
                        user: { select: { email: true } },
                        position: true,
                    },
                },
                subordinates: {
                    include: {
                        position: true,
                    },
                },
            },
        });

        if (!employee) {
            throw new AppError("Employee profile not found", 404);
        }

        let teamMates: any[] = [];
        if (employee.departmentId) {
            teamMates = await prisma.employee.findMany({
                where: {
                    departmentId: employee.departmentId,
                    NOT: { id: employee.id },
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    position: { select: { title: true } },
                },
            });
        }

        return {
            me: {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                department: employee.department,
                position: employee.position,
            },
            manager: employee.manager,
            subordinates: employee.subordinates,
            teamMates,
        };
    }

    async updateEmployeeHierarchy(
        employeeId: string,
        changedByUserId: string,
        payload: {
            departmentId?: string;
            positionId?: string;
            managerId?: string | null;
            reason?: string;
        },
    ) {
        const targetEmployee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!targetEmployee) {
            throw new AppError("Target employee not found", 404);
        }

        const changerEmployee = await prisma.employee.findUnique({
            where: { userId: changedByUserId },
        });

        if (!changerEmployee) {
            throw new AppError("Changer profile not found", 404);
        }

        if (payload.managerId && payload.managerId === employeeId) {
            throw new AppError("An employee cannot be their own manager", 400);
        }

        const updatedEmployee = await prisma.employee.update({
            where: { id: employeeId },
            data: {
                departmentId:
                    payload.departmentId !== undefined
                        ? payload.departmentId
                        : targetEmployee.departmentId,
                positionId:
                    payload.positionId !== undefined
                        ? payload.positionId
                        : targetEmployee.positionId,
                managerId:
                    payload.managerId !== undefined
                        ? payload.managerId
                        : targetEmployee.managerId,
            },
            include: {
                department: true,
                position: true,
                manager: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        await prisma.orgStructureHistory.create({
            data: {
                employeeId,
                oldDepartmentId: targetEmployee.departmentId,
                newDepartmentId: updatedEmployee.departmentId,
                oldPositionId: targetEmployee.positionId,
                newPositionId: updatedEmployee.positionId,
                oldManagerId: targetEmployee.managerId,
                newManagerId: updatedEmployee.managerId,
                changedById: changerEmployee.id,
                reason: payload.reason,
            },
        });

        return updatedEmployee;
    }

    async getOrgHistory(employeeId?: string) {
        const where: any = {};
        if (employeeId) {
            where.employeeId = employeeId;
        }

        return prisma.orgStructureHistory.findMany({
            where,
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true },
                },
                changedBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
}

export const orgChartService = new OrgChartService();
