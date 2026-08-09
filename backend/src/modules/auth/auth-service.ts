import prisma from "../../config/db";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";

export class AuthService {
    async register(payload: any) {
        const existingUser = await prisma.user.findUnique({
            where: { email: payload.email },
        });

        if (existingUser) {
            throw new Error("User already exists");
        }

        const hashedPassword = await hashPassword(payload.password);

        const user = await prisma.user.create({
            data: {
                email: payload.email,
                password: hashedPassword,
                employee: {
                    create: {
                        firstName: payload.firstName,
                        lastName: payload.lastName,
                    },
                },
            },
            include: {
                employee: true,
            },
        });

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                employee: user.employee,
            },
        };
    }

    async login(payload: any) {
        const user = await prisma.user.findUnique({
            where: { email: payload.email },
            include: { employee: true },
        });

        if (!user) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = await comparePassword(
            payload.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                employee: user.employee,
            },
        };
    }
}

export const authService = new AuthService();
