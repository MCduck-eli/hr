"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgChartService = exports.OrgChartService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
class OrgChartService {
    async resolveCallerCompany(currentUser) {
        if (!currentUser?.id)
            return null;
        if (currentUser.role === "SUPER_ADMIN" && !currentUser.companyName)
            return null;
        if (currentUser.companyName)
            return currentUser.companyName;
        const caller = await db_1.default.user.findUnique({
            where: { id: currentUser.id },
            select: { role: true, companyName: true },
        });
        if (caller && caller.role !== "SUPER_ADMIN") {
            return caller.companyName || null;
        }
        return currentUser.companyName || null;
    }
    async getOrgTree(departmentId, search, currentUser) {
        const callerCompany = await this.resolveCallerCompany(currentUser);
        const whereClause = {
            user: {
                ...(callerCompany ? { companyName: callerCompany } : {}),
            },
            status: { not: "TERMINATED" },
        };
        if (departmentId) {
            whereClause.departmentId = departmentId;
        }
        if (search) {
            whereClause.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { position: { title: { contains: search, mode: "insensitive" } } },
            ];
        }
        const employees = await db_1.default.employee.findMany({
            where: whereClause,
            include: {
                user: { select: { id: true, email: true, role: true, companyName: true } },
                department: { select: { id: true, name: true, companyName: true } },
                position: { select: { id: true, title: true } },
                grade: { select: { id: true, title: true, code: true, level: true } },
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: { select: { title: true } },
                        department: { select: { name: true } },
                    },
                },
                subordinates: {
                    where: {
                        status: { not: "TERMINATED" },
                        user: {
                            ...(callerCompany ? { companyName: callerCompany } : {}),
                        },
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: { select: { title: true } },
                        department: { select: { name: true } },
                    },
                },
                matrixManagers: {
                    where: {
                        manager: {
                            status: { not: "TERMINATED" },
                            user: {
                                ...(callerCompany ? { companyName: callerCompany } : {}),
                            },
                        },
                    },
                    include: {
                        manager: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                position: { select: { title: true } },
                                department: { select: { name: true } },
                            },
                        },
                    },
                },
                matrixSubordinates: {
                    where: {
                        employee: {
                            status: { not: "TERMINATED" },
                            user: {
                                ...(callerCompany ? { companyName: callerCompany } : {}),
                            },
                        },
                    },
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                position: { select: { title: true } },
                                department: { select: { name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });
        const departments = await db_1.default.department.findMany({
            where: {
                ...(callerCompany
                    ? {
                        OR: [
                            { companyName: callerCompany },
                            {
                                employees: {
                                    some: {
                                        user: { companyName: callerCompany },
                                    },
                                },
                            },
                        ],
                    }
                    : {}),
            },
            include: {
                parent: { select: { id: true, name: true } },
                children: { select: { id: true, name: true } },
                _count: { select: { employees: true } },
            },
            orderBy: { name: "asc" },
        });
        const employeeMap = new Map();
        employees.forEach((emp) => {
            employeeMap.set(emp.id, {
                ...emp,
                children: [],
                secondaryChildren: [],
            });
        });
        const roots = [];
        employees.forEach((emp) => {
            const node = employeeMap.get(emp.id);
            if (emp.managerId && employeeMap.has(emp.managerId)) {
                employeeMap.get(emp.managerId).children.push(node);
            }
            else {
                roots.push(node);
            }
            if (emp.matrixManagers && emp.matrixManagers.length > 0) {
                emp.matrixManagers.forEach((mm) => {
                    if (employeeMap.has(mm.managerId)) {
                        employeeMap.get(mm.managerId).secondaryChildren.push(node);
                    }
                });
            }
        });
        return {
            companyName: callerCompany || "Default Company",
            totalEmployees: employees.length,
            departmentsCount: departments.length,
            tree: roots,
            flatEmployees: employees,
            departments,
        };
    }
    async getMyOrgContext(userId, currentUser) {
        const callerCompany = await this.resolveCallerCompany(currentUser);
        const employee = await db_1.default.employee.findUnique({
            where: { userId },
            include: {
                department: true,
                position: true,
                grade: true,
                user: { select: { id: true, email: true, role: true, companyName: true } },
                manager: {
                    include: {
                        user: { select: { email: true } },
                        position: true,
                        department: true,
                    },
                },
                subordinates: {
                    where: {
                        status: { not: "TERMINATED" },
                        user: {
                            ...(callerCompany ? { companyName: callerCompany } : {}),
                        },
                    },
                    include: {
                        position: true,
                        department: true,
                    },
                },
                matrixManagers: {
                    include: {
                        manager: {
                            include: {
                                position: true,
                                department: true,
                            },
                        },
                    },
                },
                matrixSubordinates: {
                    include: {
                        employee: {
                            include: {
                                position: true,
                                department: true,
                            },
                        },
                    },
                },
            },
        });
        if (!employee) {
            throw new appError_1.AppError("Employee profile not found", 404);
        }
        let teamMates = [];
        if (employee.departmentId) {
            teamMates = await db_1.default.employee.findMany({
                where: {
                    departmentId: employee.departmentId,
                    status: { not: "TERMINATED" },
                    user: {
                        ...(callerCompany ? { companyName: callerCompany } : {}),
                    },
                    NOT: { id: employee.id },
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    position: { select: { title: true } },
                    department: { select: { name: true } },
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
                grade: employee.grade,
            },
            manager: employee.manager,
            matrixManagers: employee.matrixManagers?.map((mm) => mm.manager) || [],
            subordinates: employee.subordinates,
            matrixSubordinates: employee.matrixSubordinates?.map((ms) => ms.employee) || [],
            teamMates,
        };
    }
    async updateEmployeeHierarchy(employeeId, changedByUserId, payload, currentUser) {
        const callerCompany = await this.resolveCallerCompany(currentUser);
        const targetEmployee = await db_1.default.employee.findUnique({
            where: { id: employeeId },
            include: { user: true },
        });
        if (!targetEmployee) {
            throw new appError_1.AppError("Target employee not found", 404);
        }
        if (callerCompany && targetEmployee.user.companyName && targetEmployee.user.companyName !== callerCompany) {
            throw new appError_1.AppError("Unauthorized employee hierarchy modification", 403);
        }
        const changerEmployee = await db_1.default.employee.findUnique({
            where: { userId: changedByUserId },
        });
        if (!changerEmployee) {
            throw new appError_1.AppError("Changer profile not found", 404);
        }
        if (payload.managerId && payload.managerId === employeeId) {
            throw new appError_1.AppError("An employee cannot be their own manager", 400);
        }
        const updatedEmployee = await db_1.default.employee.update({
            where: { id: employeeId },
            data: {
                departmentId: payload.departmentId !== undefined
                    ? payload.departmentId
                    : targetEmployee.departmentId,
                positionId: payload.positionId !== undefined
                    ? payload.positionId
                    : targetEmployee.positionId,
                managerId: payload.managerId !== undefined
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
        if (payload.matrixManagerIds !== undefined) {
            await db_1.default.employeeMatrixManager.deleteMany({
                where: { employeeId },
            });
            const validMatrixManagerIds = payload.matrixManagerIds.filter((mId) => mId && mId !== employeeId && mId !== payload.managerId);
            if (validMatrixManagerIds.length > 0) {
                await db_1.default.employeeMatrixManager.createMany({
                    data: validMatrixManagerIds.map((mId) => ({
                        employeeId,
                        managerId: mId,
                        companyName: callerCompany || null,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        await db_1.default.orgStructureHistory.create({
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
    async getOrgHistory(employeeId, currentUser) {
        const callerCompany = await this.resolveCallerCompany(currentUser);
        const where = {
            employee: {
                user: {
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                },
            },
        };
        if (employeeId) {
            where.employeeId = employeeId;
        }
        return db_1.default.orgStructureHistory.findMany({
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
exports.OrgChartService = OrgChartService;
exports.orgChartService = new OrgChartService();
