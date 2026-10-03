import prisma from "../../config/db";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";
import { AppError } from "../../utils/appError";

interface OtpRecord {
    code: string;
    expiresAt: number;
}

const otpStore = new Map<string, OtpRecord>();

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

        if (user.employee && user.employee.status === "TERMINATED") {
            throw new Error(
                "Ushbu xodimning hisobi ishdan bo'shatilganligi sababli to'liq yopilgan va tizimga kirish huquqlari bekor qilingan.",
            );
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            companyName: user.companyName,
            permissions: user.permissions || [],
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                customRoleId: user.customRoleId,
                companyName: user.companyName,
                phone: user.phone,
                avatar: user.avatar,
                permissions: user.permissions || [],
                employee: user.employee,
            },
        };
    }

    async sendOtp(payload: { email: string; checkExisting?: boolean }) {
        const { email, checkExisting = true } = payload;
        if (!email) {
            throw new AppError("Email kiritilishi shart", 400);
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (checkExisting) {
            const existing = await prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
            if (existing) {
                throw new AppError("Ushbu email bilan foydalanuvchi allaqachon mavjud", 400);
            }
        }

        const code = "123456";
        otpStore.set(normalizedEmail, {
            code,
            expiresAt: Date.now() + 10 * 60 * 1000,
        });

        return {
            success: true,
            message: "Tasdiqlash kodi yuborildi",
            debugCode: code,
        };
    }

    async verifyOtp(payload: { email: string; code: string }) {
        const { email, code } = payload;
        if (!email || !code) {
            throw new AppError("Email va tasdiqlash kodi kiritilishi shart", 400);
        }

        const normalizedEmail = email.toLowerCase().trim();
        const record = otpStore.get(normalizedEmail);

        if (!record || record.expiresAt < Date.now()) {
            throw new AppError("Tasdiqlash kodi eskirgan yoki topilmadi", 400);
        }

        if (record.code !== code.trim()) {
            throw new AppError("Tasdiqlash kodi noto'g'ri", 400);
        }

        otpStore.delete(normalizedEmail);

        return {
            success: true,
            verified: true,
        };
    }
}

export const authService = new AuthService();
authService.onApplicationBootstrap().catch((err) => {
    console.error("Auth bootstrap error:", err.message);
});
