import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class DepartmentService {
    async createDepartment(payload: { name: string; parentId?: string }) {
        if (payload.parentId) {
            const parentExists = await prisma.department.findUnique({
                where: { id: payload.parentId },
            });
            if (!parentExists) {
                throw new AppError("Parent department not found", 404);
            }
        }

        return prisma.department.create({
            data: payload,
        });
    }

    async getAllDepartments() {
        return prisma.department.findMany({
            include: {
                children: true,
                _count: {
                    select: { employees: true },
                },
            },
        });
    }

    async getDepartmentById(id: string) {
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

        return department;
    }
}

export const departmentService = new DepartmentService();
