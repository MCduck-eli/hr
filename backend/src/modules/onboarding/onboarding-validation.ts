import { z } from "zod";

export const createTemplateSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        targetStatus: z.string().optional().nullable(),
        departmentId: z.string().optional().nullable(),
        isRequired: z.union([z.boolean(), z.string()]).optional(),
        tasks: z
            .array(
                z.object({
                    title: z.string().min(1),
                    description: z.string().optional(),
                    stage: z.enum(["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3"]).optional(),
                }),
            )
            .optional(),
        courses: z
            .array(
                z.object({
                    title: z.string().min(1),
                    videoUrl: z.string().optional(),
                    description: z.string().optional(),
                }),
            )
            .optional(),
    }),
});

export const assignOnboardingSchema = z.object({
    body: z.object({
        employeeId: z.string().uuid(),
    }),
});

export const updateTaskStatusSchema = z.object({
    body: z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
    }),
});
