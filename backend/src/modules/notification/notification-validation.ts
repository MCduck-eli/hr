import { z } from "zod";

export const registerDeviceTokenSchema = z.object({
    body: z.object({
        fcmToken: z.string().min(10),
        deviceOs: z.enum(["iOS", "Android", "Web"]).optional(),
    }),
});

export const sendManualNotificationSchema = z.object({
    body: z.object({
        userId: z.string().uuid(),
        title: z.string().min(2),
        message: z.string().min(2),
        type: z
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
