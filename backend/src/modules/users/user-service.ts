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
        });

        if (!userExists) {
            throw new AppError("User not found", 404);
        }

        const {
            role,
            firstName,
            lastName,
            departmentId,
            positionId,
            password,
        } = payload;

        let hashedPassword;
        if (password) {
            hashedPassword = await hashPassword(password);
        }

        return prisma.user.update({
            where: { id },
            data: {
                ...(role && { role }),
                ...(hashedPassword && { password: hashedPassword }),
                employee: {
                    update: {
                        ...(firstName && { firstName }),
                        ...(lastName && { lastName }),
                        ...(departmentId && { departmentId }),
                        ...(positionId && { positionId }),
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
