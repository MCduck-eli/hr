import prisma from "../../config/db";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";

export class AuthService {
    async onApplicationBootstrap() {
        const adminEmail =
            process.env.SUPER_ADMIN_EMAIL || "admin@hrplatform.com";
        const adminPassword =
            process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!";
        const hashedPassword = await hashPassword(adminPassword);

        await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                password: hashedPassword,
                role: "SUPER_ADMIN",
            },
            create: {
                email: adminEmail,
                password: hashedPassword,
                role: "SUPER_ADMIN",
            },
        });
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
authService.onApplicationBootstrap();
