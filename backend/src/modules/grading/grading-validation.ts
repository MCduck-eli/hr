import { z } from "zod";

export const createGradeSchema = z.object({
    body: z.object({
        code: z.string().min(2),
        title: z.string().min(3),
        level: z.number().int().min(1),
        minSalary: z.number().positive(),
        maxSalary: z.number().positive(),
        requirements: z.string().optional(),
        responsibilities: z.string().optional(),
    }),
});

export const requestPromotionSchema = z.object({
    body: z.object({
        employeeId: z.string().uuid(),
        targetGradeId: z.string().uuid(),
        proposedSalary: z.number().positive(),
        reason: z.string().min(10),
    }),
});

export const approvePromotionSchema = z.object({
    body: z.object({
        action: z.enum(["APPROVE", "REJECT"]),
    }),
});
