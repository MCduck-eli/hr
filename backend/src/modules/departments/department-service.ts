import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class DepartmentService {
    async createDepartment(
        payload: { name: string; parentId?: string; companyName?: string },
        currentUser?: any,
    ) {
        let companyName = payload.companyName;
        if (!companyName && currentUser?.companyName) {
            companyName = currentUser.companyName;
        }

        if (payload.parentId) {
            const parentExists = await prisma.department.findUnique({
                where: { id: payload.parentId },
            });
            if (!parentExists) {
                throw new AppError("Parent department not found", 404);
            }
        }

        return prisma.department.create({
            data: {
                name: payload.name,
                parentId: payload.parentId,
                companyName: companyName || null,
            },
        });
    }

    async getAllDepartments(currentUser?: any) {
        const where: any = {};
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            where.companyName = currentUser.companyName;
        }

        return prisma.department.findMany({
            where,
            include: {
                children: true,
                employees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                role: true,
                                phone: true,
                                avatar: true,
                                customRole: true,
                            },
                        },
                        position: true,
                        statusConfig: true,
                    },
                },
                _count: {
                    select: { employees: true },
                },
            },
            orderBy: { name: "asc" },
        });
    }

    async assignEmployee(
        departmentId: string,
        payload: { userId?: string; employeeId?: string },
        currentUser?: any,
    ) {
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
        });

        if (!department) {
            throw new AppError("Department not found", 404);
        }

        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (department.companyName && department.companyName !== currentUser.companyName) {
                throw new AppError("Unauthorized - Department belongs to another company", 403);
            }
        }

        let employee = null;
        if (payload.employeeId) {
            employee = await prisma.employee.findUnique({
                where: { id: payload.employeeId },
            });
        } else if (payload.userId) {
            employee = await prisma.employee.findUnique({
                where: { userId: payload.userId },
            });
            if (!employee) {
                const user = await prisma.user.findUnique({
                    where: { id: payload.userId },
                });
                if (user) {
                    employee = await prisma.employee.create({
                        data: {
                            userId: user.id,
                            firstName: user.email.split("@")[0],
                            lastName: "",
                            departmentId: departmentId,
                        },
                    });
                    return employee;
                }
            }
        }

        if (!employee) {
            throw new AppError("Employee not found", 404);
        }

        return prisma.employee.update({
            where: { id: employee.id },
            data: { departmentId: departmentId },
            include: {
                user: true,
                department: true,
            },
        });
    }

    async unassignEmployee(
        departmentId: string,
        payload: { userId?: string; employeeId?: string },
        currentUser?: any,
    ) {
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
        });

        if (!department) {
            throw new AppError("Department not found", 404);
        }

        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (department.companyName && department.companyName !== currentUser.companyName) {
                throw new AppError("Unauthorized - Department belongs to another company", 403);
            }
        }

        let employee = null;
        if (payload.employeeId) {
            employee = await prisma.employee.findUnique({
                where: { id: payload.employeeId },
            });
        } else if (payload.userId) {
            employee = await prisma.employee.findUnique({
                where: { userId: payload.userId },
            });
        }

        if (!employee) {
            throw new AppError("Employee not found", 404);
        }

        return prisma.employee.update({
            where: { id: employee.id },
            data: { departmentId: null },
            include: {
                user: true,
                department: true,
            },
        });
    }

    async getDepartmentById(id: string, currentUser?: any) {
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                children: true,
                employees: true,
            },
        });

        if (!department) {
            throw new AppError("Department not found", 404);
        }

        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (department.companyName && department.companyName !== currentUser.companyName) {
                throw new AppError("Unauthorized - Department belongs to another company", 403);
            }
        }

        return department;
    }

    async deleteDepartment(id: string, currentUser?: any) {
        const department = await prisma.department.findUnique({
            where: { id },
        });

        if (!department) {
            throw new AppError("Department not found", 404);
        }

        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (department.companyName && department.companyName !== currentUser.companyName) {
                throw new AppError("Unauthorized - Department belongs to another company", 403);
            }
        }

        await prisma.employee.updateMany({
            where: { departmentId: id },
            data: { departmentId: null },
        });
        await prisma.department.updateMany({
            where: { parentId: id },
            data: { parentId: null },
        });
        return prisma.department.delete({
            where: { id },
        });
    }
}

export const departmentService = new DepartmentService();
