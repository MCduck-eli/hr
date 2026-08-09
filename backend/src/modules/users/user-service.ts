import prisma from "../../config/db";
import { AppError } from "../../utils/appError";

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

    async updateUser(id: string, payload: any) {
        const userExists = await prisma.user.findUnique({
            where: { id },
        });

        if (!userExists) {
            throw new AppError("User not found", 404);
        }

        const { role, firstName, lastName, departmentId, positionId } = payload;

        return prisma.user.update({
            where: { id },
            data: {
                ...(role && { role }),
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
}

export const userService = new UserService();
