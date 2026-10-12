"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const db_1 = __importDefault(require("../../config/db"));
const appError_1 = require("../../utils/appError");
class NotificationService {
    async registerDeviceToken(userId, fcmToken, deviceOs) {
        return db_1.default.userDeviceToken.upsert({
            where: { fcmToken },
            update: { userId, deviceOs },
            create: {
                userId,
                fcmToken,
                deviceOs,
            },
        });
    }
    async createAndSendNotification(payload) {
        let resolvedUserId = payload.userId;
        const employee = await db_1.default.employee.findFirst({
            where: {
                OR: [{ id: payload.userId }, { userId: payload.userId }],
            },
            select: { userId: true },
        });
        if (employee?.userId) {
            resolvedUserId = employee.userId;
        }
        const notification = await db_1.default.notification.create({
            data: {
                userId: resolvedUserId,
                title: payload.title,
                message: payload.message,
                type: payload.type || "GENERAL",
                metadata: payload.metadata,
            },
        });
        const user = await db_1.default.user.findUnique({
            where: { id: resolvedUserId },
            include: { employee: true, deviceTokens: true },
        });
        if (!user)
            return notification;
        if (payload.sendEmail && user.email) {
            this.sendEmail(user.email, payload.title, payload.message).catch((err) => console.error("Email send error:", err));
        }
        if (payload.sendPush && user.deviceTokens.length > 0) {
            const tokens = user.deviceTokens.map((t) => t.fcmToken);
            this.sendPushNotification(tokens, payload.title, payload.message, payload.metadata).catch((err) => console.error("Push send error:", err));
        }
        return notification;
    }
    async notifyAllUsers(payload) {
        const whereClause = {
            ...(payload.companyName ? { companyName: payload.companyName } : {}),
            ...(payload.excludeUserId ? { id: { not: payload.excludeUserId } } : {}),
        };
        if (payload.excludeRoles && payload.excludeRoles.length > 0) {
            whereClause.role = { notIn: payload.excludeRoles };
        }
        if (payload.targetRoles && payload.targetRoles.length > 0) {
            whereClause.OR = [
                { role: { in: payload.targetRoles } },
                {
                    customRole: {
                        baseRole: { in: payload.targetRoles },
                    },
                },
            ];
        }
        const users = await db_1.default.user.findMany({
            where: whereClause,
            select: { id: true },
        });
        if (users.length === 0)
            return [];
        const notificationsData = users.map((u) => ({
            userId: u.id,
            title: payload.title,
            message: payload.message,
            type: payload.type || "GENERAL",
            metadata: payload.metadata,
        }));
        await db_1.default.notification.createMany({
            data: notificationsData,
        });
        return notificationsData;
    }
    async getUserNotifications(rawUserId) {
        let resolvedUserId = rawUserId;
        const employee = await db_1.default.employee.findFirst({
            where: {
                OR: [{ id: rawUserId }, { userId: rawUserId }],
            },
            select: { userId: true },
        });
        if (employee?.userId) {
            resolvedUserId = employee.userId;
        }
        const [notifications, unreadCount] = await Promise.all([
            db_1.default.notification.findMany({
                where: { userId: resolvedUserId },
                orderBy: { createdAt: "desc" },
                take: 30,
            }),
            db_1.default.notification.count({
                where: { userId: resolvedUserId, isRead: false },
            }),
        ]);
        return {
            notifications,
            unreadCount,
        };
    }
    async markAsRead(notificationId, rawUserId) {
        let resolvedUserId = rawUserId;
        const employee = await db_1.default.employee.findFirst({
            where: {
                OR: [{ id: rawUserId }, { userId: rawUserId }],
            },
            select: { userId: true },
        });
        if (employee?.userId) {
            resolvedUserId = employee.userId;
        }
        const notif = await db_1.default.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notif)
            throw new appError_1.AppError("Notification not found", 404);
        if (notif.userId !== resolvedUserId && notif.userId !== rawUserId) {
            throw new appError_1.AppError("Unauthorized", 403);
        }
        return db_1.default.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }
    async markAllAsRead(rawUserId) {
        let resolvedUserId = rawUserId;
        const employee = await db_1.default.employee.findFirst({
            where: {
                OR: [{ id: rawUserId }, { userId: rawUserId }],
            },
            select: { userId: true },
        });
        if (employee?.userId) {
            resolvedUserId = employee.userId;
        }
        return db_1.default.notification.updateMany({
            where: {
                OR: [{ userId: resolvedUserId }, { userId: rawUserId }],
                isRead: false,
            },
            data: { isRead: true },
        });
    }
    async sendEmail(to, subject, text) { }
    async sendPushNotification(tokens, title, body, data) {
        console.log(`[FCM MOCK PUSH] Sent to ${tokens.length} devices. Title: "${title}", Body: "${body}"`);
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
