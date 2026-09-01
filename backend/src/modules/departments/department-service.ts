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
                _count: {
                    select: { employees: true },
                },
            },
            orderBy: { name: "asc" },
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
