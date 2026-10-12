"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleService = exports.RoleService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
class RoleService {
    async getAllRoles(currentUser) {
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
        const customRoles = await db_1.default.companyRole.findMany({
            where: companyFilter ? { companyName: companyFilter } : {},
            orderBy: { createdAt: "asc" },
        });
        const systemRoles = [
            {
                id: "EMPLOYEE",
                name: "Xodim",
                code: "EMPLOYEE",
                baseRole: "EMPLOYEE",
                description: "Kompaniya asosiy xodimi",
                color: "#64748b",
                isSystem: true,
                companyName: null,
            },
            {
                id: "DEPARTMENT_HEAD",
                name: "Bo'lim boshlig'i",
                code: "DEPARTMENT_HEAD",
                baseRole: "DEPARTMENT_HEAD",
                description: "Bo'lim va jamoa rahbari",
                color: "#6366f1",
                isSystem: true,
                companyName: null,
            },
            {
                id: "HR_ADMIN",
                name: "HR Admin",
                code: "HR_ADMIN",
                baseRole: "HR_ADMIN",
                description: "Kadrlar va xodimlar boshqaruvchisi",
                color: "#9333ea",
                isSystem: true,
                companyName: null,
            },
            {
                id: "ACCOUNTANT",
                name: "Bugalter / Hisobchi",
                code: "ACCOUNTANT",
                baseRole: "ACCOUNTANT",
                description: "Moliya, oyliklar va jarimalar hisob-kitobi",
                color: "#059669",
                isSystem: true,
                companyName: null,
            },
            {
                id: "RECRUITER",
                name: "Rekruter",
                code: "RECRUITER",
                baseRole: "RECRUITER",
                description: "Nomzodlar va vakansiyalar bilan ishlovchi",
                color: "#d97706",
                isSystem: true,
                companyName: null,
            },
            {
                id: "DIRECTOR",
                name: "Direktor",
                code: "DIRECTOR",
                baseRole: "DIRECTOR",
                description: "Kompaniya rahbari",
                color: "#e11d48",
                isSystem: true,
                companyName: null,
            },
        ];
        return [...systemRoles, ...customRoles];
    }
    async createRole(payload, currentUser) {
        const { name, code, baseRole, description, color } = payload;
        if (!name || !name.trim()) {
            throw new appError_1.AppError("Rol nomi kiritilishi shart", 400);
        }
        let companyName = payload.companyName || null;
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
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
            throw new appError_1.AppError("Bu tizim roli nomi band", 400);
        }
        const existingCustom = await db_1.default.companyRole.findFirst({
            where: {
                companyName,
                OR: [
                    { code: generatedCode },
                    { name: { equals: name.trim(), mode: "insensitive" } },
                ],
            },
        });
        if (existingCustom) {
            throw new appError_1.AppError("Ushbu nomli rol kompaniyada allaqachon mavjud", 400);
        }
        const validBaseRole = ["EMPLOYEE", "DEPARTMENT_HEAD", "HR_ADMIN", "ACCOUNTANT", "RECRUITER", "DIRECTOR"].includes(baseRole)
            ? baseRole
            : "EMPLOYEE";
        return db_1.default.companyRole.create({
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
    async updateRole(id, payload, currentUser) {
        const role = await db_1.default.companyRole.findUnique({
            where: { id },
        });
        if (!role) {
            throw new appError_1.AppError("Rol topilmadi", 404);
        }
        if (role.isSystem) {
            throw new appError_1.AppError("Tizim rolini tahrirlash mumkin emas", 400);
        }
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN" && caller.companyName && role.companyName !== caller.companyName) {
                throw new appError_1.AppError("Boshqa kompaniya rolini tahrirlash huquqi yo'q", 403);
            }
        }
        const { name, baseRole, description, color } = payload;
        const validBaseRole = baseRole && ["EMPLOYEE", "DEPARTMENT_HEAD", "HR_ADMIN", "ACCOUNTANT", "RECRUITER", "DIRECTOR"].includes(baseRole)
            ? baseRole
            : role.baseRole;
        return db_1.default.companyRole.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(baseRole && { baseRole: validBaseRole }),
                ...(description !== undefined && { description }),
                ...(color && { color }),
            },
        });
    }
    async deleteRole(id, currentUser) {
        const role = await db_1.default.companyRole.findUnique({
            where: { id },
        });
        if (!role) {
            throw new appError_1.AppError("Rol topilmadi", 404);
        }
        if (role.isSystem) {
            throw new appError_1.AppError("Tizim rolini o'chirish mumkin emas", 400);
        }
        if (currentUser?.id) {
            const caller = await db_1.default.user.findUnique({
                where: { id: currentUser.id },
                select: { role: true, companyName: true },
            });
            if (caller && caller.role !== "SUPER_ADMIN" && caller.companyName && role.companyName !== caller.companyName) {
                throw new appError_1.AppError("Boshqa kompaniya rolini o'chirish huquqi yo'q", 403);
            }
        }
        await db_1.default.user.updateMany({
            where: { customRoleId: id },
            data: { customRoleId: null },
        });
        return db_1.default.companyRole.delete({
            where: { id },
        });
    }
}
exports.RoleService = RoleService;
exports.roleService = new RoleService();
