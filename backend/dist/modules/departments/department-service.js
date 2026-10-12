"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentService = exports.DepartmentService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
class DepartmentService {
    async createDepartment(payload, currentUser) {
        let companyName = payload.companyName;
        if (!companyName && currentUser?.companyName) {
            companyName = currentUser.companyName;
        }
        if (payload.parentId) {
            const parentExists = await db_1.default.department.findUnique({
                where: { id: payload.parentId },
            });
            if (!parentExists) {
                throw new appError_1.AppError("Parent department not found", 404);
            }
        }
        return db_1.default.department.create({
            data: {
                name: payload.name,
                parentId: payload.parentId,
                companyName: companyName || null,
            },
        });
    }
    async getAllDepartments(currentUser) {
        const where = {};
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            where.companyName = currentUser.companyName;
        }
        return db_1.default.department.findMany({
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
    async assignEmployee(departmentId, payload, currentUser) {
        const department = await db_1.default.department.findUnique({
            where: { id: departmentId },
        });
        if (!department) {
            throw new appError_1.AppError("Department not found", 404);
        }
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (department.companyName && department.companyName !== currentUser.companyName) {
                throw new appError_1.AppError("Unauthorized - Department belongs to another company", 403);
            }
        }
        let employee = null;
        if (payload.employeeId) {
            employee = await db_1.default.employee.findUnique({
                where: { id: payload.employeeId },
            });
        }
        else if (payload.userId) {
            employee = await db_1.default.employee.findUnique({
                where: { userId: payload.userId },
            });
            if (!employee) {
                const user = await db_1.default.user.findUnique({
                    where: { id: payload.userId },
                });
                if (user) {
                    employee = await db_1.default.employee.create({
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
            throw new appError_1.AppError("Employee not found", 404);
        }
        return db_1.default.employee.update({
            where: { id: employee.id },
            data: { departmentId: departmentId },
            include: {
                user: true,
                department: true,
            },
        });
    }
    async unassignEmployee(departmentId, payload, currentUser) {
        const department = await db_1.default.department.findUnique({
            where: { id: departmentId },
        });
        if (!department) {
            throw new appError_1.AppError("Department not found", 404);
        }
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (department.companyName && department.companyName !== currentUser.companyName) {
                throw new appError_1.AppError("Unauthorized - Department belongs to another company", 403);
            }
        }
        let employee = null;
        if (payload.employeeId) {
            employee = await db_1.default.employee.findUnique({
                where: { id: payload.employeeId },
            });
        }
        else if (payload.userId) {
            employee = await db_1.default.employee.findUnique({
                where: { userId: payload.userId },
            });
        }
        if (!employee) {
            throw new appError_1.AppError("Employee not found", 404);
        }
        return db_1.default.employee.update({
            where: { id: employee.id },
            data: { departmentId: null },
            include: {
                user: true,
                department: true,
            },
        });
    }
    async getDepartmentById(id, currentUser) {
        const department = await db_1.default.department.findUnique({
            where: { id },
            include: {
                children: true,
                employees: true,
            },
        });
        if (!department) {
            throw new appError_1.AppError("Department not found", 404);
        }
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (department.companyName && department.companyName !== currentUser.companyName) {
                throw new appError_1.AppError("Unauthorized - Department belongs to another company", 403);
            }
        }
        return department;
    }
    async deleteDepartment(id, currentUser) {
        const department = await db_1.default.department.findUnique({
            where: { id },
        });
        if (!department) {
            throw new appError_1.AppError("Department not found", 404);
        }
        if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.companyName) {
            if (department.companyName && department.companyName !== currentUser.companyName) {
                throw new appError_1.AppError("Unauthorized - Department belongs to another company", 403);
            }
        }
        await db_1.default.employee.updateMany({
            where: { departmentId: id },
            data: { departmentId: null },
        });
        await db_1.default.department.updateMany({
            where: { parentId: id },
            data: { parentId: null },
        });
        return db_1.default.department.delete({
            where: { id },
        });
    }
}
exports.DepartmentService = DepartmentService;
exports.departmentService = new DepartmentService();
