import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { Role } from "@prisma/client";

export class RoleService {
    async getAllRoles(currentUser?: any) {
        let companyFilter: string | null = null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyFilter = caller.companyName || null;
            }
        }

        const customRoles = await prisma.companyRole.findMany({
            where: companyFilter ? { companyName: companyFilter } : {},
            orderBy: { createdAt: "asc" },
        });

        const systemRoles = [
            {
                id: "EMPLOYEE",
                name: "Xodim",
                code: "EMPLOYEE",
                baseRole: "EMPLOYEE" as Role,
                description: "Kompaniya asosiy xodimi",
                color: "#64748b",
                isSystem: true,
                companyName: null,
            },
            {
                id: "DEPARTMENT_HEAD",
                name: "Bo'lim boshlig'i",
                code: "DEPARTMENT_HEAD",
                baseRole: "DEPARTMENT_HEAD" as Role,
                description: "Bo'lim va jamoa rahbari",
                color: "#6366f1",
                isSystem: true,
                companyName: null,
            },
            {
                id: "HR_ADMIN",
                name: "HR Admin",
                code: "HR_ADMIN",
                baseRole: "HR_ADMIN" as Role,
                description: "Kadrlar va xodimlar boshqaruvchisi",
                color: "#9333ea",
                isSystem: true,
                companyName: null,
            },
            {
                id: "ACCOUNTANT",
                name: "Bugalter / Hisobchi",
                code: "ACCOUNTANT",
                baseRole: "ACCOUNTANT" as Role,
                description: "Moliya, oyliklar va jarimalar hisob-kitobi",
                color: "#059669",
                isSystem: true,
                companyName: null,
            },
            {
                id: "RECRUITER",
                name: "Rekruter",
                code: "RECRUITER",
                baseRole: "RECRUITER" as Role,
                description: "Nomzodlar va vakansiyalar bilan ishlovchi",
                color: "#d97706",
                isSystem: true,
                companyName: null,
            },
            {
                id: "DIRECTOR",
                name: "Direktor",
                code: "DIRECTOR",
                baseRole: "DIRECTOR" as Role,
                description: "Kompaniya rahbari",
                color: "#e11d48",
                isSystem: true,
                companyName: null,
            },
        ];

        return [...systemRoles, ...customRoles];
    }

    async createRole(payload: any, currentUser?: any) {
        const { name, code, baseRole, description, color } = payload;
        if (!name || !name.trim()) {
            throw new AppError("Rol nomi kiritilishi shart", 400);
        }

        let companyName = payload.companyName || null;
        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN") {
                companyName = caller.companyName || null;
            }
        }

        const generatedCode = (code || name)
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9_]/g, "_")
            .slice(0, 30);

        const existingSystem = ["SUPER_ADMIN", "DIRECTOR", "HR_ADMIN", "DEPARTMENT_HEAD", "ACCOUNTANT", "EMPLOYEE", "RECRUITER", "CANDIDATE"];
        if (existingSystem.includes(generatedCode)) {
            throw new AppError("Bu tizim roli nomi band", 400);
        }

        const existingCustom = await prisma.companyRole.findFirst({
            where: {
                companyName,
                OR: [
                    { code: generatedCode },
                    { name: { equals: name.trim(), mode: "insensitive" } },
                ],
            },
        });

        if (existingCustom) {
            throw new AppError("Ushbu nomli rol kompaniyada allaqachon mavjud", 400);
        }

        const validBaseRole: Role = ["EMPLOYEE", "DEPARTMENT_HEAD", "HR_ADMIN", "ACCOUNTANT", "RECRUITER", "DIRECTOR"].includes(baseRole)
            ? baseRole
            : "EMPLOYEE";

        return prisma.companyRole.create({
            data: {
                name: name.trim(),
                code: generatedCode,
                baseRole: validBaseRole,
                description: description || null,
                color: color || "#6366f1",
                isSystem: false,
                companyName,
            },
        });
    }

    async updateRole(id: string, payload: any, currentUser?: any) {
        const role = await prisma.companyRole.findUnique({
            where: { id },
        });

        if (!role) {
            throw new AppError("Rol topilmadi", 404);
        }

        if (role.isSystem) {
            throw new AppError("Tizim rolini tahrirlash mumkin emas", 400);
        }

        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN" && caller.companyName && role.companyName !== caller.companyName) {
                throw new AppError("Boshqa kompaniya rolini tahrirlash huquqi yo'q", 403);
            }
        }

        const { name, baseRole, description, color } = payload;
        const validBaseRole: Role = baseRole && ["EMPLOYEE", "DEPARTMENT_HEAD", "HR_ADMIN", "ACCOUNTANT", "RECRUITER", "DIRECTOR"].includes(baseRole)
            ? baseRole
            : role.baseRole;

        return prisma.companyRole.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(baseRole && { baseRole: validBaseRole }),
                ...(description !== undefined && { description }),
                ...(color && { color }),
            },
        });
    }

    async deleteRole(id: string, currentUser?: any) {
        const role = await prisma.companyRole.findUnique({
            where: { id },
        });

        if (!role) {
            throw new AppError("Rol topilmadi", 404);
        }

        if (role.isSystem) {
            throw new AppError("Tizim rolini o'chirish mumkin emas", 400);
        }

        if (currentUser?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN" && caller.companyName && role.companyName !== caller.companyName) {
                throw new AppError("Boshqa kompaniya rolini o'chirish huquqi yo'q", 403);
            }
        }

        await prisma.user.updateMany({
            where: { customRoleId: id },
            data: { customRoleId: null },
        });

        return prisma.companyRole.delete({
            where: { id },
        });
    }
}

export const roleService = new RoleService();
