import { z } from "zod";

export const createLeaveSchema = z.object({
    body: z.object({
        type: z.enum(["ANNUAL", "SICK", "UNPAID", "MATERNITY", "OTHER"]),
        startDate: z
            .string()
            .datetime({ offset: true })
            .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        endDate: z
            .string()
            .datetime({ offset: true })
            .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        reason: z.string().min(5),
    }),
});

export const updateLeaveStatusSchema = z.object({
    body: z.object({
        status: z.enum(["APPROVED", "REJECTED"]),
    }),
});
