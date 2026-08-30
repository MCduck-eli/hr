import { z } from "zod";

export const createCycleSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        isCurrent: z.boolean().optional(),
        minExpectedProgress: z.coerce.number().optional(),
    }),
});

export const createObjectiveSchema = z.object({
    body: z.object({
        cycleId: z.string().uuid(),
        level: z.enum(["COMPANY", "DEPARTMENT", "INDIVIDUAL"]),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        departmentId: z.string().uuid().optional().nullable(),
        employeeId: z.string().uuid().optional().nullable(),
        parentId: z.string().uuid().optional().nullable(),
        minExpectedProgress: z.coerce.number().optional().nullable(),
        executionMode: z.string().optional().nullable(),
        keyResults: z
            .array(
                z.object({
                    id: z.string().optional().nullable(),
                    title: z.string().min(1),
                    initialValue: z.coerce.number().default(0).optional(),
                    targetValue: z.coerce.number(),
                    unit: z.string().optional().default("%"),
                }),
            )
            .optional()
            .default([]),
    }),
});

export const checkInKeyResultSchema = z.object({
    body: z.object({
        comment: z.string().optional().nullable(),
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
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        departmentId: z.string().uuid().optional().nullable(),
        employeeId: z.string().uuid().optional().nullable(),
        parentId: z.string().uuid().optional().nullable(),
        minExpectedProgress: z.coerce.number().optional().nullable(),
        executionMode: z.string().optional().nullable(),
        keyResults: z
            .array(
                z.object({
                    id: z.string().optional().nullable(),
                    title: z.string().min(1),
                    initialValue: z.coerce.number().default(0).optional(),
                    targetValue: z.coerce.number(),
                    unit: z.string().optional().default("%"),
                }),
            )
            .optional(),
    }),
});
