import { z } from "zod";

export const createCycleSchema = z.object({
    body: z.object({
        title: z.string().min(2),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        isCurrent: z.boolean().optional(),
    }),
});

export const createObjectiveSchema = z.object({
    body: z.object({
        cycleId: z.string().uuid(),
        level: z.enum(["COMPANY", "DEPARTMENT", "INDIVIDUAL"]),
        title: z.string().min(3),
        description: z.string().optional(),
        departmentId: z.string().uuid().optional(),
        employeeId: z.string().uuid().optional(),
        parentId: z.string().uuid().optional(),
        keyResults: z
            .array(
                z.object({
                    title: z.string().min(2),
                    initialValue: z.number().default(0),
                    targetValue: z.number(),
                    unit: z.string().default("%"),
                }),
            )
            .min(1),
    }),
});

export const checkInKeyResultSchema = z.object({
    body: z.object({
        value: z.number(),
        comment: z.string().optional(),
    }),
});

export const updateOkrStatusSchema = z.object({
    body: z.object({
        status: z.enum(["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"]),
    }),
});
