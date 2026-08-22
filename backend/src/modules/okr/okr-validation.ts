import { z } from "zod";

export const createCycleSchema = z.object({
    body: z.object({
        title: z.string().min(2),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        isCurrent: z.boolean().optional(),
        minExpectedProgress: z.number().optional(),
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
        minExpectedProgress: z.number().optional(),
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
        comment: z.string().optional(),
    }),
});

export const updateOkrStatusSchema = z.object({
    body: z.object({
        status: z.enum(["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"]),
    }),
});

export const updateObjectiveSchema = z.object({
    body: z.object({
        level: z.enum(["COMPANY", "DEPARTMENT", "INDIVIDUAL"]).optional(),
        title: z.string().min(3).optional(),
        description: z.string().optional(),
        departmentId: z.string().uuid().optional().nullable(),
        employeeId: z.string().uuid().optional().nullable(),
        parentId: z.string().uuid().optional().nullable(),
        minExpectedProgress: z.number().optional().nullable(),
        keyResults: z
            .array(
                z.object({
                    id: z.string().uuid().optional(),
                    title: z.string().min(2),
                    initialValue: z.number().default(0),
                    targetValue: z.number(),
                    unit: z.string().default("%"),
                })
            )
            .optional(),
    }),
});
