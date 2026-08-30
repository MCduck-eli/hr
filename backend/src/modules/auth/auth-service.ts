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

        const superAdmin = await prisma.user.findFirst({
            where: { email: adminEmail, role: "SUPER_ADMIN" },
        });

        if (superAdmin) {
            await prisma.user.update({
                where: { id: superAdmin.id },
                data: {
                    password: hashedPassword,
                    role: "SUPER_ADMIN",
                },
            });
        } else {
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    role: "SUPER_ADMIN",
                },
            });
        }
    }

    async login(payload: any) {
        const { email, password } = payload;

        const user = await prisma.user.findUnique({
            where: { email },
            include: { employee: true },
        });

        if (!user) {
            throw new Error("Email yoki parol noto'g'ri");
        }

        const isPasswordValid = await comparePassword(
            password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new Error("Email yoki parol noto'g'ri");
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            companyName: user.companyName,
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                companyName: user.companyName,
                employee: user.employee,
            },
        };
    }
}

export const authService = new AuthService();
authService.onApplicationBootstrap();
