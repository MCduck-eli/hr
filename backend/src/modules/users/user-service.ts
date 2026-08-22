import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { hashPassword } from "../../utils/password";

export class UserService {
    async getAllUsers() {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                employee: {
                    include: {
                        department: true,
                        position: true,
                        grade: true,
                        feedbackReviewers: {
                            where: { isCompleted: false },
                            select: { id: true }
                        }
                    },
                },
            },
        });

        const currentCycle = await prisma.okrCycle.findFirst({
            where: { isCurrent: true },
        });

        if (!currentCycle) {
            return users;
        }

        const employeeIds = users.map(u => u.employee?.id).filter(Boolean) as string[];
        const objectives = await prisma.objective.findMany({
            where: {
                cycleId: currentCycle.id,
                level: "INDIVIDUAL",
                employeeId: { in: employeeIds }
            },
            select: {
                employeeId: true,
                progress: true
            }
        });

        const okrProgressByEmployee = employeeIds.reduce((acc, id) => {
            const employeeOkrs = objectives.filter(o => o.employeeId === id);
            if (employeeOkrs.length > 0) {
                const total = employeeOkrs.reduce((sum, okr) => sum + okr.progress, 0);
                acc[id] = Math.round(total / employeeOkrs.length);
            } else {
                acc[id] = 0;
            }
            return acc;
        }, {} as Record<string, number>);

        return users.map(user => {
            if (user.employee) {
                return {
                    ...user,
                    employee: {
                        ...user.employee,
                        okrProgress: okrProgressByEmployee[user.employee.id] || 0
                    }
                };
            }
            return user;
        });
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                employee: {
                    include: {
                        department: true,
                        position: true,
                    },
                },
            },
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        return user;
    }

    async createUser(payload: any) {
        const {
            email,
            password,
            role,
            firstName,
            lastName,
            departmentId,
            positionId,
            leaveBalance,
            assignedCourseIds,
        } = payload;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new AppError("User with this email already exists", 400);
        }

        const hashedPassword = await hashPassword(password);

        return prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || "EMPLOYEE",
                employee: {
                    create: {
                        firstName: firstName || "",
                        lastName: lastName || "",
                        ...(departmentId && { departmentId }),
                        ...(positionId && { positionId }),
                        ...(leaveBalance !== undefined && { leaveBalance }),
                        ...(assignedCourseIds &&
                            assignedCourseIds.length > 0 && {
                                courseProgresses: {
                                    create: assignedCourseIds.map(
                                        (id: string) => ({
                                            courseId: id,
                                        }),
                                    ),
                                },
                            }),
                    },
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                employee: true,
            },
        });
    }
    async updateUser(id: string, payload: any) {
        const userExists = await prisma.user.findUnique({
            where: { id },
            include: { employee: true },
        });

        if (!userExists) {
            throw new AppError("User not found", 404);
        }

        const {
            email,
            role,
            firstName,
            lastName,
            departmentId,
            positionId,
            password,
            leaveBalance,
            assignedCourseIds,
        } = payload;

        let hashedPassword;
        if (password) {
            hashedPassword = await hashPassword(password);
        }

        if (assignedCourseIds && userExists.employee) {
            await prisma.courseProgress.deleteMany({
                where: { employeeId: userExists.employee.id },
            });
            await prisma.courseProgress.createMany({
                data: assignedCourseIds.map((cId: string) => ({
                    employeeId: userExists.employee!.id,
                    courseId: cId,
                })),
            });
        }

        return prisma.user.update({
            where: { id },
            data: {
                ...(email && { email }),
                ...(role && { role }),
                ...(hashedPassword && { password: hashedPassword }),
                employee: {
                    update: {
                        ...(firstName !== undefined && { firstName }),
                        ...(lastName !== undefined && { lastName }),
                        ...(departmentId !== undefined && {
                            departmentId:
                                departmentId === "" ? null : departmentId,
                        }),
                        ...(positionId !== undefined && {
                            positionId: positionId === "" ? null : positionId,
                        }),
                        ...(leaveBalance !== undefined && { leaveBalance }),
                    },
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                employee: true,
            },
        });
    }
    async deleteUser(id: string) {
        const userExists = await prisma.user.findUnique({
            where: { id },
        });

        if (!userExists) {
            throw new AppError("User not found", 404);
        }

        await prisma.employee.deleteMany({
            where: { userId: id },
        });

        return prisma.user.delete({
            where: { id },
        });
    }
}

export const userService = new UserService();
