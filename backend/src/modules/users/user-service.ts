import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import { hashPassword } from "../../utils/password";

export class UserService {
    async getAllUsers() {
        return prisma.user.findMany({
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
