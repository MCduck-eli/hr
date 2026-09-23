import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

export class OrgChartService {
    private async resolveCallerCompany(currentUser?: any): Promise<string | null> {
        if (!currentUser?.id) return null;
        if (currentUser.role === "SUPER_ADMIN" && !currentUser.companyName) return null;
        if (currentUser.companyName) return currentUser.companyName;

        const caller = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { role: true, companyName: true },
        });

        if (caller && caller.role !== "SUPER_ADMIN") {
            return caller.companyName || null;
        }
        return currentUser.companyName || null;
    }

    async getOrgTree(departmentId?: string, search?: string, currentUser?: any) {
        const callerCompany = await this.resolveCallerCompany(currentUser);

        const whereClause: any = {
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

        const employees = await prisma.employee.findMany({
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

        const departments = await prisma.department.findMany({
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

        const employeeMap = new Map<string, any>();
        employees.forEach((emp) => {
            employeeMap.set(emp.id, {
                ...emp,
                children: [],
                secondaryChildren: [],
            });
        });

        const roots: any[] = [];
        employees.forEach((emp) => {
            const node = employeeMap.get(emp.id);
            if (emp.managerId && employeeMap.has(emp.managerId)) {
                employeeMap.get(emp.managerId).children.push(node);
            } else {
                roots.push(node);
            }

            if (emp.matrixManagers && emp.matrixManagers.length > 0) {
                emp.matrixManagers.forEach((mm: any) => {
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

    async getMyOrgContext(userId: string, currentUser?: any) {
        const callerCompany = await this.resolveCallerCompany(currentUser);

        const employee = await prisma.employee.findUnique({
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
            throw new AppError("Employee profile not found", 404);
        }

        let teamMates: any[] = [];
        if (employee.departmentId) {
            teamMates = await prisma.employee.findMany({
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
            matrixManagers: employee.matrixManagers?.map((mm: any) => mm.manager) || [],
            subordinates: employee.subordinates,
            matrixSubordinates: employee.matrixSubordinates?.map((ms: any) => ms.employee) || [],
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
            matrixManagerIds?: string[];
            reason?: string;
        },
        currentUser?: any,
    ) {
        const callerCompany = await this.resolveCallerCompany(currentUser);

        const targetEmployee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { user: true },
        });

        if (!targetEmployee) {
            throw new AppError("Target employee not found", 404);
        }

        if (callerCompany && targetEmployee.user.companyName && targetEmployee.user.companyName !== callerCompany) {
            throw new AppError("Unauthorized employee hierarchy modification", 403);
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

        if (payload.matrixManagerIds !== undefined) {
            await prisma.employeeMatrixManager.deleteMany({
                where: { employeeId },
            });

            const validMatrixManagerIds = payload.matrixManagerIds.filter(
                (mId) => mId && mId !== employeeId && mId !== payload.managerId,
            );

            if (validMatrixManagerIds.length > 0) {
                await prisma.employeeMatrixManager.createMany({
                    data: validMatrixManagerIds.map((mId) => ({
                        employeeId,
                        managerId: mId,
                        companyName: callerCompany || null,
                    })),
                    skipDuplicates: true,
                });
            }
        }

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

    async getOrgHistory(employeeId?: string, currentUser?: any) {
        const callerCompany = await this.resolveCallerCompany(currentUser);

        const where: any = {
            employee: {
                user: {
                    ...(callerCompany ? { companyName: callerCompany } : {}),
                },
            },
        };

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
