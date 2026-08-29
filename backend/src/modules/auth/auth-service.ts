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
        const { email, password, companyName, userId } = payload;

        let user = null;

        if (userId) {
            user = await prisma.user.findUnique({
                where: { id: userId },
                include: { employee: true },
            });
            if (!user) {
                throw new Error("Foydalanuvchi topilmadi");
            }
            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) {
                throw new Error("Noto'g'ri parol kiritildi");
            }
        } else if (companyName) {
            user = await prisma.user.findFirst({
                where: { email, companyName },
                include: { employee: true },
            });
            if (!user) {
                throw new Error("Ushbu kompaniyada bunday foydalanuvchi topilmadi");
            }
            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) {
                throw new Error("Noto'g'ri parol kiritildi");
            }
        } else {
            const users = await prisma.user.findMany({
                where: { email },
                include: { employee: true },
            });

            if (!users || users.length === 0) {
                throw new Error("Email yoki parol noto'g'ri");
            }

            const validUsers = [];
            for (const u of users) {
                const isValid = await comparePassword(password, u.password);
                if (isValid) {
                    validUsers.push(u);
                }
            }

            if (validUsers.length === 0) {
                throw new Error("Email yoki parol noto'g'ri");
            }

            if (validUsers.length > 1) {
                return {
                    requiresCompanySelection: true,
                    companies: validUsers.map((u) => ({
                        id: u.id,
                        companyName: u.companyName || "Asosiy",
                        role: u.role,
                        name: `${u.employee?.firstName || ""} ${u.employee?.lastName || ""}`.trim() || u.email,
                    })),
                };
            }

            user = validUsers[0];
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
