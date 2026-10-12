"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendManualNotificationSchema = exports.registerDeviceTokenSchema = void 0;
const zod_1 = require("zod");
exports.registerDeviceTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        fcmToken: zod_1.z.string().min(10),
        deviceOs: zod_1.z.enum(["iOS", "Android", "Web"]).optional(),
    }),
});
exports.sendManualNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().uuid(),
        title: zod_1.z.string().min(2),
        message: zod_1.z.string().min(2),
        type: zod_1.z
            .enum([
            "LEAVE_REQUEST",
            "LEAVE_APPROVED",
            "LEAVE_REJECTED",
            "OKR_ASSIGNED",
            "OKR_CHECKIN_REMINDER",
            "COURSE_ASSIGNED",
            "OFFBOARDING_TASK",
            "GENERAL",
        ])
            .default("GENERAL"),
    }),
});
