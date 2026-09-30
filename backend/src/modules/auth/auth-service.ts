import prisma from "../../config/db";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";
import { AppError } from "../../utils/appError";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);


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

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(normalizedEmail, {
            code,
            expiresAt: Date.now() + 10 * 60 * 1000,
        });

        try {
            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #0f172a; margin-bottom: 8px;">HR Platformasi</h2>
                    <p style="color: #64748b; font-size: 14px;">Elektron pochtangizni tasdiqlash uchun maxsus kod:</p>
                    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; border: 1px dashed #cbd5e1;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #9333ea; font-family: monospace;">${code}</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px;">Ushbu kod 10 daqiqa davomida amal qiladi. Agar siz ushbu so'rovni yubormagan bo'lsangiz, xabarni e'tiborsiz qoldiring.</p>
                </div>
            `;

            await resend.emails.send({
                from: "onboarding@resend.dev",
                to: normalizedEmail,
                subject: `Tasdiqlash kodi: ${code}`,
                html: htmlContent,
            });
        } catch (err) {
            console.error("OTP send error:", err);
        }

        return {
            success: true,
            message: "Tasdiqlash kodi yuborildi",
            debugCode: process.env.NODE_ENV !== "production" ? code : undefined,
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
authService.onApplicationBootstrap();
