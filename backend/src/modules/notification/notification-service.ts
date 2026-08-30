import prisma from "../../config/db";
import { AppError } from "../../utils/appError";
import nodemailer from "nodemailer";

export class NotificationService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.mailtrap.io",
            port: Number(process.env.SMTP_PORT) || 2525,
            auth: {
                user: process.env.SMTP_USER || "",
                pass: process.env.SMTP_PASS || "",
            },
        });
    }

    async registerDeviceToken(
        userId: string,
        fcmToken: string,
        deviceOs?: string,
    ) {
        return prisma.userDeviceToken.upsert({
            where: { fcmToken },
            update: { userId, deviceOs },
            create: {
                userId,
                fcmToken,
                deviceOs,
            },
        });
    }

    async createAndSendNotification(payload: {
        userId: string;
        title: string;
        message: string;
        type?: any;
        metadata?: any;
        sendEmail?: boolean;
        sendPush?: boolean;
    }) {
        let resolvedUserId = payload.userId;
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: payload.userId }, { userId: payload.userId }],
            },
            select: { userId: true },
        });
        if (employee?.userId) {
            resolvedUserId = employee.userId;
        }

        const notification = await prisma.notification.create({
            data: {
                userId: resolvedUserId,
                title: payload.title,
                message: payload.message,
                type: payload.type || "GENERAL",
                metadata: payload.metadata,
            },
        });

        const user = await prisma.user.findUnique({
            where: { id: resolvedUserId },
            include: { employee: true, deviceTokens: true },
        });

        if (!user) return notification;
        if (payload.sendEmail && user.email) {
            this.sendEmail(user.email, payload.title, payload.message).catch(
                (err) => console.error("Email send error:", err),
            );
        }
        if (payload.sendPush && user.deviceTokens.length > 0) {
            const tokens = user.deviceTokens.map((t) => t.fcmToken);
            this.sendPushNotification(
                tokens,
                payload.title,
                payload.message,
                payload.metadata,
            ).catch((err) => console.error("Push send error:", err));
        }

        return notification;
    }

    async notifyAllUsers(payload: {
        title: string;
        message: string;
        type?: any;
        metadata?: any;
        excludeUserId?: string;
        excludeRoles?: string[];
        targetRoles?: string[];
        companyName?: string;
    }) {
        const users = await prisma.user.findMany({
            where: {
                ...(payload.companyName ? { companyName: payload.companyName } : {}),
                ...(payload.excludeUserId ? { id: { not: payload.excludeUserId } } : {}),
                ...(payload.excludeRoles && payload.excludeRoles.length > 0
                    ? { role: { notIn: payload.excludeRoles as any } }
                    : {}),
                ...(payload.targetRoles && payload.targetRoles.length > 0
                    ? { role: { in: payload.targetRoles as any } }
                    : {}),
            },
            select: { id: true },
        });

        if (users.length === 0) return [];

        const notificationsData = users.map((u) => ({
            userId: u.id,
            title: payload.title,
            message: payload.message,
            type: payload.type || "GENERAL",
            metadata: payload.metadata,
        }));

        await prisma.notification.createMany({
            data: notificationsData,
        });

        return notificationsData;
    }

    async getUserNotifications(rawUserId: string) {
        let resolvedUserId = rawUserId;
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: rawUserId }, { userId: rawUserId }],
            },
            select: { userId: true },
        });
        if (employee?.userId) {
            resolvedUserId = employee.userId;
        }

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId: resolvedUserId },
                orderBy: { createdAt: "desc" },
                take: 30,
            }),
            prisma.notification.count({
                where: { userId: resolvedUserId, isRead: false },
            }),
        ]);

        return {
            notifications,
            unreadCount,
        };
    }

    async markAsRead(notificationId: string, rawUserId: string) {
        let resolvedUserId = rawUserId;
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: rawUserId }, { userId: rawUserId }],
            },
            select: { userId: true },
        });
        if (employee?.userId) {
            resolvedUserId = employee.userId;
        }

        const notif = await prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notif) throw new AppError("Notification not found", 404);
        if (notif.userId !== resolvedUserId && notif.userId !== rawUserId) {
            throw new AppError("Unauthorized", 403);
        }

        return prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(rawUserId: string) {
        let resolvedUserId = rawUserId;
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: rawUserId }, { userId: rawUserId }],
            },
            select: { userId: true },
        });
        if (employee?.userId) {
            resolvedUserId = employee.userId;
        }

        return prisma.notification.updateMany({
            where: {
                OR: [{ userId: resolvedUserId }, { userId: rawUserId }],
                isRead: false,
            },
            data: { isRead: true },
        });
    }

    private async sendEmail(to: string, subject: string, text: string) {
        const mailOptions = {
            from:
                process.env.SMTP_FROM ||
                '"HR System" <no-reply@hrplatform.com>',
            to,
            subject,
            text,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>${subject}</h2>
                <p>${text}</p>
                <hr />
                <small>Bu xabar HR Platform tizimi tomonidan avtomatik yuborildi.</small>
             </div>`,
        };

        return this.transporter.sendMail(mailOptions);
    }

    private async sendPushNotification(
        tokens: string[],
        title: string,
        body: string,
        data?: any,
    ) {
        console.log(
            `[FCM MOCK PUSH] Sent to ${tokens.length} devices. Title: "${title}", Body: "${body}"`,
        );
    }
}

export const notificationService = new NotificationService();
