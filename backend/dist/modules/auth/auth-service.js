"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const password_1 = require("../../utils/password");
const jwt_1 = require("../../utils/jwt");
const appError_1 = require("../../utils/appError");
const otpStore = new Map();
class AuthService {
    async onApplicationBootstrap() {
        const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@hrplatform.com";
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!";
        const hashedPassword = await (0, password_1.hashPassword)(adminPassword);
        const superAdmin = await db_1.default.user.findFirst({
            where: { email: adminEmail, role: "SUPER_ADMIN" },
        });
        if (superAdmin) {
            await db_1.default.user.update({
                where: { id: superAdmin.id },
                data: {
                    password: hashedPassword,
                    role: "SUPER_ADMIN",
                },
            });
        }
        else {
            await db_1.default.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    role: "SUPER_ADMIN",
                },
            });
        }
    }
    async login(payload) {
        const { email, password } = payload;
        const user = await db_1.default.user.findUnique({
            where: { email },
            include: { employee: true },
        });
        if (!user) {
            throw new Error("Email yoki parol noto'g'ri");
        }
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Email yoki parol noto'g'ri");
        }
        if (user.employee && user.employee.status === "TERMINATED") {
            throw new Error("Ushbu xodimning hisobi ishdan bo'shatilganligi sababli to'liq yopilgan va tizimga kirish huquqlari bekor qilingan.");
        }
        const token = (0, jwt_1.generateToken)({
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
    async sendOtp(payload) {
        const { email, checkExisting = true } = payload;
        if (!email) {
            throw new appError_1.AppError("Email kiritilishi shart", 400);
        }
        const normalizedEmail = email.toLowerCase().trim();
        if (checkExisting) {
            const existing = await db_1.default.user.findUnique({
                where: { email: normalizedEmail },
            });
            if (existing) {
                throw new appError_1.AppError("Ushbu email bilan foydalanuvchi allaqachon mavjud", 400);
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
    async verifyOtp(payload) {
        const { email, code } = payload;
        if (!email || !code) {
            throw new appError_1.AppError("Email va tasdiqlash kodi kiritilishi shart", 400);
        }
        const normalizedEmail = email.toLowerCase().trim();
        const record = otpStore.get(normalizedEmail);
        if (!record || record.expiresAt < Date.now()) {
            throw new appError_1.AppError("Tasdiqlash kodi eskirgan yoki topilmadi", 400);
        }
        if (record.code !== code.trim()) {
            throw new appError_1.AppError("Tasdiqlash kodi noto'g'ri", 400);
        }
        otpStore.delete(normalizedEmail);
        return {
            success: true,
            verified: true,
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
exports.authService.onApplicationBootstrap().catch((err) => {
    console.error("Auth bootstrap error:", err.message);
});
