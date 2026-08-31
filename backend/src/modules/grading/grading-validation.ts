import { z } from "zod";

export const createGradeSchema = z.object({
    body: z.object({
        code: z.string().min(1),
        title: z.string().min(1),
        level: z.coerce.number().int().min(1),
        minSalary: z.coerce.number().min(0),
        maxSalary: z.coerce.number().min(0),
        requirements: z.string().optional().nullable(),
        responsibilities: z.string().optional().nullable(),
        companyName: z.string().optional().nullable(),
    }),
});

export const updateGradeSchema = z.object({
    body: z.object({
        code: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        level: z.coerce.number().int().min(1).optional(),
        minSalary: z.coerce.number().min(0).optional(),
        maxSalary: z.coerce.number().min(0).optional(),
        requirements: z.string().optional().nullable(),
        responsibilities: z.string().optional().nullable(),
    }),
});

export const requestPromotionSchema = z.object({
    body: z.object({
        employeeId: z.string().min(1),
        targetGradeId: z.string().min(1),
        proposedSalary: z.coerce.number().min(0),
        reason: z.string().min(1),
    }),
});

export const approvePromotionSchema = z.object({
    body: z.object({
        action: z.enum(["APPROVE", "REJECT"]),
    }),
});
